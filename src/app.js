const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
dotenv.config();
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const todoRoutes = require('./routes/todos');
const { initDatabase } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// 安全中間件
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error_code: 'RATE_LIMIT_EXCEEDED',
    message: '請求過於頻繁，請稍後再試',
    data: {}
  }
});

app.use('/api/auth/login', limiter);
app.use('/api/auth/register', limiter);

// 解析請求body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/todos', todoRoutes);

// 錯誤處理中間件
app.use(errorHandler);

// 初始化資料庫
initDatabase();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;