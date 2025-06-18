const bcrypt = require('bcryptjs');
const { getDatabase } = require('../config/database');
const { registerSchema, loginSchema } = require('../utils/validation');
const { generateToken, generateRefreshToken, verifyToken } = require('../utils/jwt');

const register = async (req, res, next) => {
  try {
    // 驗證輸入
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      error.isJoi = true;
      return next(error);
    }

    const { username, email, password, phone } = value;
    const db = getDatabase();

    // 檢查用戶是否已存在
    const checkUser = new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE email = ? OR username = ?',
        [email, username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    const existingUser = await checkUser;
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({
          error_code: 'EMAIL_EXISTS',
          message: '電子郵件已被使用',
          data: {}
        });
      }
      if (existingUser.username === username) {
        return res.status(409).json({
          error_code: 'USERNAME_EXISTS',
          message: '用戶名稱已被使用',
          data: {}
        });
      }
    }

    // 加密密碼
    const passwordHash = await bcrypt.hash(password, 12);

    // 創建用戶
    const createUser = new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, email, password_hash, phone) VALUES (?, ?, ?, ?)',
        [username, email, passwordHash, phone || null],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    const userId = await createUser;

    res.status(201).json({
      message: '註冊成功',
      data: {
        user: {
          id: userId,
          username,
          email,
          phone
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    // 驗證輸入
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      error.isJoi = true;
      return next(error);
    }

    const { username, password } = value;
    const db = getDatabase();
    // 查找用戶
    const findUser = new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    const user = await findUser;
    if (!user) {
      return res.status(401).json({
        error_code: 'INVALID_CREDENTIALS',
        message: '帳號或密碼錯誤',
        data: {}
      });
    }

    // 檢查帳戶狀態
    if (!user.is_active) {
      return res.status(403).json({
        error_code: 'ACCOUNT_DISABLED',
        message: '帳戶已被停用',
        data: {}
      });
    }

    // 驗證密碼
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error_code: 'INVALID_CREDENTIALS',
        message: '帳號或密碼錯誤',
        data: {}
      });
    }

    // 生成 JWT Token
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // 儲存會話記錄
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小時後

    const saveSession = new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
        [user.id, tokenHash, expiresAt.toISOString()],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    await saveSession;

    res.json({
      message: '登入成功',
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          isVerified: user.is_verified
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const db = getDatabase();

    // 刪除所有該用戶的會話記錄
    const clearSessions = new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM user_sessions WHERE user_id = ?',
        [userId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    await clearSessions;

    res.json({
      message: '登出成功',
      data: {}
    });

  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        error_code: 'REFRESH_TOKEN_REQUIRED',
        message: 'Refresh token 必填',
        data: {}
      });
    }

    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        error_code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token 無效或已過期',
        data: {}
      });
    }

    const db = getDatabase();
    
    // 驗證用戶是否存在且狀態正常
    const findUser = new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE id = ?',
        [decoded.userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    const user = await findUser;
    if (!user) {
      return res.status(401).json({
        error_code: 'USER_NOT_FOUND',
        message: '用戶不存在',
        data: {}
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        error_code: 'ACCOUNT_DISABLED',
        message: '帳戶已被停用',
        data: {}
      });
    }

    // 生成新的 access token
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email
    };

    const newToken = generateToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    res.json({
      message: 'Token 刷新成功',
      data: {
        accessToken: newToken,
        refreshToken: newRefreshToken,
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken
};