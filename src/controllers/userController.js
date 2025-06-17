const { getDatabase } = require('../config/database');

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const db = getDatabase();

    // 查找用戶資料
    const findUser = new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email, phone, is_verified, is_active, created_at, updated_at FROM users WHERE id = ?',
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

    res.json({
      message: '成功取得用戶資料',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          isVerified: user.is_verified,
          isActive: user.is_active,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { username, phone } = req.body;
    const db = getDatabase();

    // 驗證輸入
    if (username && (username.length < 3 || username.length > 20)) {
      return res.status(400).json({
        error_code: 'INVALID_USERNAME',
        message: '用戶名稱長度需在3-20個字元之間',
        data: {}
      });
    }

    if (phone && !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({
        error_code: 'INVALID_PHONE',
        message: '請輸入有效的手機號碼（10位數字）',
        data: {}
      });
    }

    // 檢查用戶名稱是否已被使用
    if (username) {
      const checkUsername = new Promise((resolve, reject) => {
        db.get(
          'SELECT id FROM users WHERE username = ? AND id != ?',
          [username, userId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      const existingUser = await checkUsername;
      if (existingUser) {
        return res.status(409).json({
          error_code: 'USERNAME_EXISTS',
          message: '用戶名稱已被使用',
          data: {}
        });
      }
    }

    // 構建更新語句
    const updateFields = [];
    const updateValues = [];

    if (username) {
      updateFields.push('username = ?');
      updateValues.push(username);
    }

    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone || null);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error_code: 'NO_FIELDS_TO_UPDATE',
        message: '沒有提供要更新的欄位',
        data: {}
      });
    }

    updateFields.push('updated_at = datetime("now")');
    updateValues.push(userId);

    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

    // 更新用戶資料
    const updateUser = new Promise((resolve, reject) => {
      db.run(updateQuery, updateValues, function(err) {
        if (err) reject(err);
        else resolve();
      });
    });

    await updateUser;

    // 取得更新後的用戶資料
    const getUpdatedUser = new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email, phone, is_verified, is_active, created_at, updated_at FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    const updatedUser = await getUpdatedUser;

    res.json({
      message: '用戶資料更新成功',
      data: {
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          phone: updatedUser.phone,
          isVerified: updatedUser.is_verified,
          isActive: updatedUser.is_active,
          createdAt: updatedUser.created_at,
          updatedAt: updatedUser.updated_at
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile
};