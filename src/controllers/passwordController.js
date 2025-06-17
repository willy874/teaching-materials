const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getDatabase } = require('../config/database');
const { changePasswordSchema } = require('../utils/validation');

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        error_code: 'MISSING_EMAIL',
        message: '請提供電子郵件地址',
        data: {}
      });
    }

    const db = getDatabase();

    // 查找用戶
    const findUser = new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    const user = await findUser;
    if (!user) {
      // 即使用戶不存在，也回傳成功訊息以避免資訊洩露
      return res.json({
        message: '如果該電子郵件地址存在於我們的系統中，重設密碼連結已發送',
        data: {}
      });
    }

    // 生成重設密碼token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1小時後過期

    // 儲存重設密碼記錄
    const saveResetToken = new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.id, resetToken, expiresAt.toISOString()],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    await saveResetToken;

    // 在實際應用中，這裡應該發送電子郵件
    console.log(`重設密碼連結: http://localhost:3000/reset-password?token=${resetToken}`);

    res.json({
      message: '如果該電子郵件地址存在於我們的系統中，重設密碼連結已發送',
      data: {}
    });

  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword, confirmNewPassword } = req.body;

    if (!token || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        error_code: 'MISSING_FIELDS',
        message: '缺少必要欄位',
        data: {}
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        error_code: 'PASSWORD_MISMATCH',
        message: '新密碼與確認密碼不符',
        data: {}
      });
    }

    const db = getDatabase();

    // 查找重設密碼記錄
    const findResetRecord = new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > datetime("now")',
        [token],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    const resetRecord = await findResetRecord;
    if (!resetRecord) {
      return res.status(400).json({
        error_code: 'INVALID_TOKEN',
        message: '重設密碼連結無效或已過期',
        data: {}
      });
    }

    // 驗證新密碼強度
    if (newPassword.length < 8 || 
        !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(newPassword)) {
      return res.status(400).json({
        error_code: 'WEAK_PASSWORD',
        message: '密碼必須至少8個字元，包含大小寫字母、數字及特殊符號',
        data: {}
      });
    }

    // 加密新密碼
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // 更新密碼
    const updatePassword = new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?',
        [passwordHash, resetRecord.user_id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    await updatePassword;

    // 標記重設記錄為已使用
    const markTokenUsed = new Promise((resolve, reject) => {
      db.run(
        'UPDATE password_resets SET used = 1 WHERE id = ?',
        [resetRecord.id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    await markTokenUsed;

    // 清除該用戶的所有會話
    const clearSessions = new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM user_sessions WHERE user_id = ?',
        [resetRecord.user_id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    await clearSessions;

    res.json({
      message: '密碼重設成功',
      data: {}
    });

  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    // 驗證輸入
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      error.isJoi = true;
      return next(error);
    }

    const { currentPassword, newPassword } = value;
    const userId = req.user.userId;
    const db = getDatabase();

    // 查找當前用戶
    const findUser = new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    const user = await findUser;
    if (!user) {
      return res.status(404).json({
        error_code: 'USER_NOT_FOUND',
        message: '用戶不存在',
        data: {}
      });
    }

    // 驗證當前密碼
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error_code: 'INVALID_CURRENT_PASSWORD',
        message: '當前密碼錯誤',
        data: {}
      });
    }

    // 檢查新密碼是否與當前密碼相同
    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
    if (isSamePassword) {
      return res.status(400).json({
        error_code: 'SAME_PASSWORD',
        message: '新密碼不能與當前密碼相同',
        data: {}
      });
    }

    // 加密新密碼
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // 更新密碼
    const updatePassword = new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?',
        [passwordHash, userId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    await updatePassword;

    res.json({
      message: '密碼修改成功',
      data: {}
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  forgotPassword,
  resetPassword,
  changePassword
};