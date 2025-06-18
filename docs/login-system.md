# Login System 規格文件

## 1. 系統概述

### 1.1 目的

提供安全、可靠的用戶身份驗證系統，支援用戶註冊、登入、登出及密碼管理功能。

### 1.2 範圍

本規格涵蓋前端使用者介面、後端API、資料庫設計及安全機制。

## 2. 功能需求

### 2.1 用戶註冊

**功能描述**：新用戶可以建立帳戶

**輸入欄位**：

- 電子郵件地址（必填）
- 密碼（必填）
- 確認密碼（必填）
- 用戶名稱（必填）
- 手機號碼（選填）

**驗證規則**：

- 電子郵件格式驗證
- 密碼強度要求：至少8字元，包含大小寫字母、數字及特殊符號
- 確認密碼需與密碼相符
- 用戶名稱長度3-20字元，不可重複
- 手機號碼格式驗證（如提供）

**流程**：

1. 用戶填寫註冊表單
2. 前端驗證輸入格式
3. 後端驗證資料唯一性
4. 帳戶啟用

### 2.2 用戶登入

**功能描述**：已註冊用戶透過表單輸入存取權限系統

**登入方式**：

- 用戶名稱 + 密碼

**流程**：

- 登入流程
  1. 用戶輸入登入表單
  2. 後端驗證表單
  3. 檢查帳戶狀態（是否鎖定/停用）
  4. 生成 JWT Token
  5. 返回登入成功響應
- 如果 token 無效強制登出，路由跳轉到 Login Page。
- 如果驗證登入成功，則從 Login Page 跳轉到 Home Page。
- 如果被強制登出過，則要返回被剛剛登出的頁面。
- 如果 token 過期則執行 refresh token。(這很困難，先跳過)

### 2.3 密碼管理

**忘記密碼**：

1. 用戶輸入註冊電子郵件
2. 系統發送重設密碼連結
3. 用戶點擊連結進入重設頁面
4. 設定新密碼
5. 密碼重設完成

**修改密碼**：

1. 用戶登入後進入設定頁面
2. 輸入當前密碼
3. 輸入新密碼及確認
4. 驗證後更新密碼

### 2.4 會話管理

- JWT Token 有效期：24小時
- Refresh Token 有效期：30天
- 自動登出：Token過期或用戶主動登出
- 記住我功能：延長Token有效期至30天

## 3. 非功能需求

### 3.1 安全性

- 密碼使用bcrypt加密存儲
- HTTPS強制傳輸
- SQL注入防護
- XSS攻擊防護
- CSRF Token驗證

## 4. 技術規格

### 4.1 前端技術

- Framework: Next.js
- Auth: NextAuth

### 4.2 後端技術

- Framework: Node.js (Express)
- 資料庫: SQL lite
- 快取: Memory
- 身份驗證: JSON Web Token (JWT)

### 4.3 資料庫設計

```sql
-- 用戶表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用戶會話表
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 密碼重設表
CREATE TABLE password_resets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 5. API設計

### 5.1 認證相關API

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh-token
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### 5.2 用戶管理API

```http
GET  /api/user/profile
PUT  /api/user/profile
POST /api/user/change-password
```

## 6. 錯誤處理

### 6.1 錯誤代碼

- 400: 請求參數錯誤
- 401: 未授權
- 403: 權限不足
- 404: 資源不存在
- 409: 資源衝突（如用戶已存在）
- 429: 請求過於頻繁
- 500: 伺服器內部錯誤

### 6.2 錯誤訊息格式

```json
{
  "error_code": "INVALID_CREDENTIALS",
  "message": "帳號或密碼錯誤",
  "data": {}
}
```
