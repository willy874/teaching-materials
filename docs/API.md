# 登入系統 API 文件

## 概述

本 API 提供完整的用戶認證和管理功能，包括註冊、登入、登出、密碼管理和用戶資料管理。

**Base URL**: `http://localhost:3000/api`

## 通用響應格式

### 成功響應
```json
{
  "message": "操作成功訊息",
  "data": {
    // 響應數據
  }
}
```

### 錯誤響應
```json
{
  "error_code": "ERROR_CODE",
  "message": "錯誤訊息",
  "data": {}
}
```

## 認證機制

需要認證的端點需要在 HTTP Header 中包含 JWT Token：

```
Authorization: Bearer <your_jwt_token>
```

## Rate Limiting

以下端點有流量限制（每分鐘 10 次請求）：
- `POST /api/auth/login`
- `POST /api/auth/register`

---

## 認證相關 API

### 1. 用戶註冊

**POST** `/api/auth/register`

註冊新用戶帳號。

#### 請求參數

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| username | string | ✓ | 用戶名稱（3-20字元，僅英數字） |
| email | string | ✓ | 電子郵件地址 |
| password | string | ✓ | 密碼（至少8字元，需含大小寫、數字、特殊符號） |
| confirmPassword | string | ✓ | 確認密碼（需與password相同） |
| phone | string | ✗ | 手機號碼（10位數字） |

#### 請求範例

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "MyPassword123!",
  "confirmPassword": "MyPassword123!",
  "phone": "0912345678"
}
```

#### 成功響應 (201)

```json
{
  "message": "註冊成功",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "phone": "0912345678"
    }
  }
}
```

#### 錯誤響應

| 狀態碼 | 錯誤代碼 | 說明 |
|--------|----------|------|
| 400 | VALIDATION_ERROR | 輸入資料驗證失敗 |
| 409 | EMAIL_EXISTS | 電子郵件已被使用 |
| 409 | USERNAME_EXISTS | 用戶名稱已被使用 |

---

### 2. 用戶登入

**POST** `/api/auth/login`

使用電子郵件或用戶名稱登入。

#### 請求參數

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| emailOrUsername | string | ✓ | 電子郵件或用戶名稱 |
| password | string | ✓ | 密碼 |

#### 請求範例

```json
{
  "username": "johndoe",
  "password": "MyPassword123!"
}
```

#### 成功響應 (200)

```json
{
  "message": "登入成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "phone": "0912345678",
      "isVerified": false
    }
  }
}
```

#### 錯誤響應

| 狀態碼 | 錯誤代碼 | 說明 |
|--------|----------|------|
| 400 | VALIDATION_ERROR | 輸入資料驗證失敗 |
| 401 | INVALID_CREDENTIALS | 帳號或密碼錯誤 |
| 403 | ACCOUNT_DISABLED | 帳戶已被停用 |

---

### 3. 用戶登出

**POST** `/api/auth/logout`

登出當前用戶（需要認證）。

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### 成功響應 (200)

```json
{
  "message": "登出成功",
  "data": {}
}
```

#### 錯誤響應

| 狀態碼 | 錯誤代碼 | 說明 |
|--------|----------|------|
| 401 | UNAUTHORIZED | 未提供有效的認證令牌 |

---

### 4. 刷新令牌

**POST** `/api/auth/refresh-token`

使用 refresh token 獲取新的 access token。

#### 請求參數

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| refreshToken | string | ✓ | 登入時獲得的 refresh token |

#### 請求範例

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 成功響應 (200)

```json
{
  "message": "Token 刷新成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 錯誤響應

| 狀態碼 | 錯誤代碼 | 說明 |
|--------|----------|------|
| 401 | REFRESH_TOKEN_REQUIRED | 未提供 refresh token |
| 401 | INVALID_REFRESH_TOKEN | refresh token 無效或已過期 |
| 401 | USER_NOT_FOUND | 用戶不存在 |
| 403 | ACCOUNT_DISABLED | 帳戶已被停用 |

---

### 5. 忘記密碼

**POST** `/api/auth/forgot-password`

發送密碼重設連結到用戶電子郵件。

#### 請求參數

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| email | string | ✓ | 註冊時使用的電子郵件地址 |

#### 請求範例

```json
{
  "email": "john@example.com"
}
```

#### 成功響應 (200)

```json
{
  "message": "如果該電子郵件地址存在於我們的系統中，重設密碼連結已發送",
  "data": {}
}
```

#### 錯誤響應

| 狀態碼 | 錯誤代碼 | 說明 |
|--------|----------|------|
| 400 | MISSING_EMAIL | 未提供電子郵件地址 |

> **注意**: 為了安全考量，即使電子郵件不存在，也會返回成功訊息。

---

### 6. 重設密碼

**POST** `/api/auth/reset-password`

使用重設密碼令牌設定新密碼。

#### 請求參數

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| token | string | ✓ | 從重設密碼連結獲得的令牌 |
| newPassword | string | ✓ | 新密碼（至少8字元，需含大小寫、數字、特殊符號） |
| confirmNewPassword | string | ✓ | 確認新密碼 |

#### 請求範例

```json
{
  "token": "abc123def456ghi789",
  "newPassword": "NewPassword123!",
  "confirmNewPassword": "NewPassword123!"
}
```

#### 成功響應 (200)

```json
{
  "message": "密碼重設成功",
  "data": {}
}
```

#### 錯誤響應

| 狀態碼 | 錯誤代碼 | 說明 |
|--------|----------|------|
| 400 | MISSING_FIELDS | 缺少必要欄位 |
| 400 | PASSWORD_MISMATCH | 新密碼與確認密碼不符 |
| 400 | WEAK_PASSWORD | 密碼強度不足 |
| 400 | INVALID_TOKEN | 重設密碼連結無效或已過期 |

---

### 7. 修改密碼

**POST** `/api/auth/change-password`

修改當前用戶的密碼（需要認證）。

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### 請求參數

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| currentPassword | string | ✓ | 當前密碼 |
| newPassword | string | ✓ | 新密碼（至少8字元，需含大小寫、數字、特殊符號） |
| confirmNewPassword | string | ✓ | 確認新密碼 |

#### 請求範例

```json
{
  "currentPassword": "MyPassword123!",
  "newPassword": "NewPassword456!",
  "confirmNewPassword": "NewPassword456!"
}
```

#### 成功響應 (200)

```json
{
  "message": "密碼修改成功",
  "data": {}
}
```

#### 錯誤響應

| 狀態碼 | 錯誤代碼 | 說明 |
|--------|----------|------|
| 400 | VALIDATION_ERROR | 輸入資料驗證失敗 |
| 400 | INVALID_CURRENT_PASSWORD | 當前密碼錯誤 |
| 400 | SAME_PASSWORD | 新密碼不能與當前密碼相同 |
| 401 | UNAUTHORIZED | 未提供有效的認證令牌 |
| 404 | USER_NOT_FOUND | 用戶不存在 |

---

## 用戶管理 API

### 1. 獲取用戶資料

**GET** `/api/user/profile`

獲取當前用戶的詳細資料（需要認證）。

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### 成功響應 (200)

```json
{
  "message": "成功取得用戶資料",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "phone": "0912345678",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### 錯誤響應

| 狀態碼 | 錯誤代碼 | 說明 |
|--------|----------|------|
| 401 | UNAUTHORIZED | 未提供有效的認證令牌 |
| 404 | USER_NOT_FOUND | 用戶不存在 |

---

### 2. 更新用戶資料

**PUT** `/api/user/profile`

更新當前用戶的資料（需要認證）。

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### 請求參數

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| username | string | ✗ | 新的用戶名稱（3-20字元） |
| phone | string | ✗ | 新的手機號碼（10位數字，可為空） |

> **注意**: 電子郵件地址無法通過此端點修改，密碼請使用專用的修改密碼端點。

#### 請求範例

```json
{
  "username": "newusername",
  "phone": "0987654321"
}
```

#### 成功響應 (200)

```json
{
  "message": "用戶資料更新成功",
  "data": {
    "user": {
      "id": 1,
      "username": "newusername",
      "email": "john@example.com",
      "phone": "0987654321",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

#### 錯誤響應

| 狀態碼 | 錯誤代碼 | 說明 |
|--------|----------|------|
| 400 | INVALID_USERNAME | 用戶名稱格式錯誤 |
| 400 | INVALID_PHONE | 手機號碼格式錯誤 |
| 400 | NO_FIELDS_TO_UPDATE | 沒有提供要更新的欄位 |
| 401 | UNAUTHORIZED | 未提供有效的認證令牌 |
| 409 | USERNAME_EXISTS | 用戶名稱已被使用 |

---

## 錯誤代碼說明

### 認證相關錯誤

| 錯誤代碼 | HTTP狀態碼 | 說明 |
|----------|------------|------|
| VALIDATION_ERROR | 400 | 輸入資料驗證失敗 |
| UNAUTHORIZED | 401 | 未提供有效的認證令牌 |
| INVALID_CREDENTIALS | 401 | 帳號或密碼錯誤 |
| REFRESH_TOKEN_REQUIRED | 401 | 未提供 refresh token |
| INVALID_REFRESH_TOKEN | 401 | refresh token 無效或已過期 |
| ACCOUNT_DISABLED | 403 | 帳戶已被停用 |
| EMAIL_EXISTS | 409 | 電子郵件已被使用 |
| USERNAME_EXISTS | 409 | 用戶名稱已被使用 |
| RATE_LIMIT_EXCEEDED | 429 | 請求過於頻繁 |

### 密碼相關錯誤

| 錯誤代碼 | HTTP狀態碼 | 說明 |
|----------|------------|------|
| MISSING_EMAIL | 400 | 未提供電子郵件地址 |
| MISSING_FIELDS | 400 | 缺少必要欄位 |
| PASSWORD_MISMATCH | 400 | 密碼與確認密碼不符 |
| WEAK_PASSWORD | 400 | 密碼強度不足 |
| INVALID_TOKEN | 400 | 重設密碼連結無效或已過期 |
| INVALID_CURRENT_PASSWORD | 400 | 當前密碼錯誤 |
| SAME_PASSWORD | 400 | 新密碼不能與當前密碼相同 |

### 用戶相關錯誤

| 錯誤代碼 | HTTP狀態碼 | 說明 |
|----------|------------|------|
| USER_NOT_FOUND | 404 | 用戶不存在 |
| INVALID_USERNAME | 400 | 用戶名稱格式錯誤 |
| INVALID_PHONE | 400 | 手機號碼格式錯誤 |
| NO_FIELDS_TO_UPDATE | 400 | 沒有提供要更新的欄位 |

---

## 驗證規則

### 用戶名稱 (username)
- 長度：3-20個字元
- 格式：僅允許英文字母和數字
- 唯一性：不可重複

### 電子郵件 (email)
- 格式：符合標準電子郵件格式
- 唯一性：不可重複

### 密碼 (password)
- 長度：至少8個字元
- 複雜度：必須包含以下四種字元類型：
  - 小寫英文字母 (a-z)
  - 大寫英文字母 (A-Z)
  - 數字 (0-9)
  - 特殊符號 (@$!%*?&)

### 手機號碼 (phone)
- 格式：10位數字
- 範例：0912345678

---

## 安全功能

### JWT Token
- **Access Token**: 有效期 24小時，用於 API 請求認證
- **Refresh Token**: 有效期 30天，用於獲取新的 access token
- 包含用戶基本資訊（userId, username, email）
- Access token 需要在 Authorization Header 中以 Bearer Token 形式提供

### 密碼安全
- 使用 bcrypt 加密，salt rounds = 12
- 密碼重設令牌有效期：1小時
- 重設密碼後自動清除所有用戶會話

### 流量限制
- 登入和註冊端點：每分鐘最多10次請求
- 超出限制返回 429 狀態碼

### 會話管理
- 登入時創建會話記錄
- 登出時清除所有該用戶的會話
- 密碼修改後清除所有會話

---

## 開發注意事項

1. **環境變數**: 確保設置正確的 JWT 密鑰和資料庫配置
2. **HTTPS**: 生產環境中務必使用 HTTPS 協議
3. **CORS**: 根據前端域名配置適當的 CORS 設定
4. **日誌**: 重要操作（登入、註冊、密碼修改）建議記錄日誌
5. **監控**: 建議監控失敗的登入嘗試和異常行為

---

## 測試

API 包含完整的 E2E 測試套件，使用 Jest 和 SuperTest。

### 執行測試
```bash
npm test              # 執行所有測試
npm run test:e2e      # 只執行 E2E 測試
```

### 測試覆蓋
- 所有 API 端點的正常流程
- 各種錯誤情況的處理
- 認證和授權驗證
- 輸入驗證測試