const { verifyToken } = require('../utils/jwt');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error_code: 'MISSING_TOKEN',
        message: '缺少授權標頭',
        data: {}
      });
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        error_code: 'INVALID_TOKEN_FORMAT',
        message: 'Token格式錯誤',
        data: {}
      });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
    
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;