# Teaching Materials

一個基於 Node.js 和 Express 的後端實作，主要是用來教學，大部分都是使用 Vibe Coding 製作。

## 功能特色

- ✅ 用戶註冊與登入
- ✅ JWT Token 身份驗證
- ✅ 密碼加密存儲 (bcrypt)
- ✅ 密碼重設功能
- ✅ 用戶資料管理
- ✅ SQLite 資料庫
- ✅ 輸入驗證 (Joi)
- ✅ 錯誤處理中間件
- ✅ Rate Limiting 防護
- ✅ 安全性中間件 (Helmet, CORS)

## API 端點

### 認證相關
- `POST /api/auth/register` - 用戶註冊
- `POST /api/auth/login` - 用戶登入
- `POST /api/auth/logout` - 用戶登出
- `POST /api/auth/forgot-password` - 忘記密碼
- `POST /api/auth/reset-password` - 重設密碼
- `POST /api/auth/change-password` - 修改密碼

### 用戶管理
- `GET /api/user/profile` - 取得用戶資料
- `PUT /api/user/profile` - 更新用戶資料

## 快速開始

1. 安裝依賴套件：
```bash
npm install
```

2. 設定環境變數：
```bash
cp .env.example .env
```

3. 啟動伺服器：
```bash
# 開發模式
npm run dev

# 生產模式
npm start
```

## API 使用範例

### 用戶註冊
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!",
    "confirmPassword": "TestPass123!",
    "phone": "0912345678"
  }'
```

### 用戶登入
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "test@example.com",
    "password": "TestPass123!"
  }'
```

### 取得用戶資料
```bash
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 專案結構

```
src/
├── app.js                 # 應用程式入口
├── config/
│   └── database.js        # 資料庫設定
├── controllers/
│   ├── authController.js  # 認證控制器
│   ├── passwordController.js # 密碼管理控制器
│   └── userController.js  # 用戶管理控制器
├── middleware/
│   ├── auth.js            # JWT 驗證中間件
│   └── errorHandler.js    # 錯誤處理中間件
├── routes/
│   ├── auth.js            # 認證路由
│   └── user.js            # 用戶路由
└── utils/
    ├── jwt.js             # JWT 工具函數
    └── validation.js      # 輸入驗證規則
```

## 技術規格

- **Framework**: Node.js + Express
- **資料庫**: SQLite
- **身份驗證**: JWT (JSON Web Token)
- **密碼加密**: bcrypt
- **輸入驗證**: Joi
- **安全性**: Helmet, CORS, Rate Limiting

## 安全特性

- 密碼使用 bcrypt 加密存儲
- JWT Token 有效期管理
- 輸入驗證與過濾
- Rate Limiting 防止暴力攻擊
- CORS 跨域請求控制
- Helmet 安全標頭設定