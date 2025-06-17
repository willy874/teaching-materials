const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Joi 驗證錯誤
  if (err.isJoi) {
    return res.status(400).json({
      error_code: 'VALIDATION_ERROR',
      message: err.details[0].message,
      data: {}
    });
  }

  // JWT 錯誤
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error_code: 'INVALID_TOKEN',
      message: 'Token無效',
      data: {}
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error_code: 'TOKEN_EXPIRED',
      message: 'Token已過期',
      data: {}
    });
  }

  // SQLite 錯誤
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({
      error_code: 'RESOURCE_CONFLICT',
      message: '資源已存在',
      data: {}
    });
  }

  // 預設錯誤
  res.status(err.status || 500).json({
    error_code: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || '伺服器內部錯誤',
    data: {}
  });
};

module.exports = errorHandler;