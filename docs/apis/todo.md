# Todo List API 文件

## 概述

Todo List API 提供完整的待辦事項管理功能，包括建立、查詢、更新、刪除、排序和分類管理。所有 API 都需要用戶認證。

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

所有 Todo API 端點都需要認證，需要在 HTTP Header 中包含 JWT Token：

```
Authorization: Bearer <your_jwt_token>
```

---

## 數據結構

### Todo 對象

```json
{
  "id": 1,
  "title": "完成專案報告",
  "description": "撰寫 Q4 專案總結報告，包含成果分析和建議",
  "completed": false,
  "priority": "high",
  "category": "work",
  "dueDate": "2024-12-31T23:59:59.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "userId": 1
}
```

### 欄位說明

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| id | number | - | 系統生成的唯一識別碼 |
| title | string | ✓ | 待辦事項標題（1-100字元） |
| description | string | ✗ | 詳細描述（最多500字元） |
| completed | boolean | - | 完成狀態，預設為 false |
| priority | string | ✗ | 優先級：`low`, `medium`, `high`，預設為 `medium` |
| category | string | ✗ | 分類標籤（1-20字元） |
| dueDate | string | ✗ | 截止日期（ISO 8601 格式） |
| createdAt | string | - | 建立時間（系統自動設置） |
| updatedAt | string | - | 最後更新時間（系統自動更新） |
| userId | number | - | 所屬用戶 ID（系統自動設置） |

---

## API 端點

### 1. 獲取待辦事項列表

**GET** `/api/todos`

獲取當前用戶的所有待辦事項，支持篩選、排序和分頁。

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### 查詢參數

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| page | number | ✗ | 頁碼，預設為 1 |
| limit | number | ✗ | 每頁筆數，預設為 20，最大 100 |
| completed | boolean | ✗ | 篩選完成狀態 |
| priority | string | ✗ | 篩選優先級：`low`, `medium`, `high` |
| category | string | ✗ | 篩選分類 |
| sortBy | string | ✗ | 排序欄位：`created_at`, `updated_at`, `due_date`, `priority`, `title` |
| sortOrder | string | ✗ | 排序方向：`asc`, `desc`，預設為 `desc` |
| search | string | ✗ | 搜尋標題或描述內容 |

#### 請求範例

```
GET /api/todos?page=1&limit=10&completed=false&priority=high&sortBy=due_date&sortOrder=asc
```

#### 成功響應 (200)

```json
{
  "message": "成功獲取待辦事項",
  "data": {
    "todos": [
      {
        "id": 1,
        "title": "完成專案報告",
        "description": "撰寫 Q4 專案總結報告",
        "completed": false,
        "priority": "high",
        "category": "work",
        "dueDate": "2024-12-31T23:59:59.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "userId": 1
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 48,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

#### 錯誤響應

| 狀態碼 | 錯誤代碼 | 說明 |
|--------|----------|------|
| 401 | UNAUTHORIZED | 未提供有效的認證令牌 |
| 400 | INVALID_QUERY_PARAMS | 查詢參數格式錯誤 |

---

### 2. 獲取單一待辦事項

**GET** `/api/todos/:id`

獲取指定 ID 的待辦事項詳細資訊。

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### 路由參數

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| id | number | ✓ | 待辦事項 ID |

#### 成功響應 (200)

```json
{
  "message": "成功獲取待辦事項",
  "data": {
    "todo": {
      "id": 1,
      "title": "完成專案報告",
      "description": "撰寫 Q4 專案總結報告，包含成果分析和建議",
      "completed": false,
      "priority": "high",
      "category": "work",
      "dueDate": "2024-12-31T23:59:59.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "userId": 1
    }
  }
}
```

#### 錯誤響應

| 狀態碼 | 錯誤代碼 | 說明 |
|--------|----------|------|
| 401 | UNAUTHORIZED | 未提供有效的認證令牌 |
| 404 | TODO_NOT_FOUND | 待辦事項不存在或無權限訪問 |
| 400 | INVALID_TODO_ID | 待辦事項 ID 格式錯誤 |

---

### 3. 建立待辦事項

**POST** `/api/todos`

建立新的待辦事項。

#### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### 請求參數

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| title | string | ✓ | 待辦事項標題（1-100字元） |
| description | string | ✗ | 詳細描述（最多500字元） |
| priority | string | ✗ | 優先級：`low`, `medium`, `high` |
| category | string | ✗ | 分類標籤（1-20字元） |
| dueDate | string | ✗ | 截止日期（ISO 8601 格式） |

#### 請求範例

```json
{
  "title": "完成專案報告",
  "description": "撰寫 Q4 專案總結報告，包含成果分析和建議",
  "priority": "high",
  "category": "work",
  "dueDate": "2024-12-31T23:59:59.000Z"
}
```

#### 成功響應 (201)

```json
{
  "message": "待辦事項建立成功",
  "data": {
    "todo": {
      "id": 1,
      "title": "完成專案報告",
      "description": "撰寫 Q4 專案總結報告，包含成果分析和建議",
      "completed": false,
      "priority": "high",
      "category": "work",
      "dueDate": "2024-12-31T23:59:59.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "userId": 1
    }
  }
}
```

#### 錯誤響應

| 狀態碼 | 錯誤代碼 | 說明 |
|--------|----------|------|
| 401 | UNAUTHORIZED | 未提供有效的認證令牌 |
| 400 | VALIDATION_ERROR | 輸入資料驗證失敗 |

---

### 4. 更新待辦事項

**PUT** `/api/todos/:id`

更新指定待辦事項的資訊。

#### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### 路由參數

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| id | number | ✓ | 待辦事項 ID |

#### 請求參數

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| title | string | ✗ | 待辦事項標題（1-100字元） |
| description | string | ✗ | 詳細描述（最多500字元） |
| completed | boolean | ✗ | 完成狀態 |
| priority | string | ✗ | 優先級：`low`, `medium`, `high` |
| category | string | ✗ | 分類標籤（1-20字元） |
| dueDate | string | ✗ | 截止日期（ISO 8601 格式） |

#### 請求範例

```json
{
  "title": "完成專案報告（已修訂）",
  "completed": true,
  "priority": "medium"
}
```

#### 成功響應 (200)

```json
{
  "message": "待辦事項更新成功",
  "data": {
    "todo": {
      "id": 1,
      "title": "完成專案報告（已修訂）",
      "description": "撰寫 Q4 專案總結報告，包含成果分析和建議",
      "completed": true,
      "priority": "medium",
      "category": "work",
      "dueDate": "2024-12-31T23:59:59.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-02T10:30:00.000Z",
      "userId": 1
    }
  }
}
```

#### 錯誤響應

| 狀態碼 | 錯誤代碼 | 說明 |
|--------|----------|------|
| 401 | UNAUTHORIZED | 未提供有效的認證令牌 |
| 404 | TODO_NOT_FOUND | 待辦事項不存在或無權限訪問 |
| 400 | INVALID_TODO_ID | 待辦事項 ID 格式錯誤 |
| 400 | VALIDATION_ERROR | 輸入資料驗證失敗 |

---

### 5. 刪除待辦事項

**DELETE** `/api/todos/:id`

刪除指定的待辦事項。

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### 路由參數

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| id | number | ✓ | 待辦事項 ID |

#### 成功響應 (200)

```json
{
  "message": "待辦事項刪除成功",
  "data": {}
}
```

#### 錯誤響應

| 狀態碼 | 錯誤代碼 | 說明 |
|--------|----------|------|
| 401 | UNAUTHORIZED | 未提供有效的認證令牌 |
| 404 | TODO_NOT_FOUND | 待辦事項不存在或無權限訪問 |
| 400 | INVALID_TODO_ID | 待辦事項 ID 格式錯誤 |

---

### 6. 批量操作待辦事項

**PATCH** `/api/todos/batch`

批量更新多個待辦事項的狀態。

#### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### 請求參數

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| ids | array | ✓ | 待更新的待辦事項 ID 陣列 |
| action | string | ✓ | 操作類型：`complete`, `incomplete`, `delete`, `update` |
| priority | string | ✗ | 統一設置優先級（僅當 action 為 update 時） |
| category | string | ✗ | 統一設置分類（僅當 action 為 update 時） |

#### 請求範例

```json
{
  "ids": [1, 2, 3, 4],
  "action": "complete"
}
```

#### 成功響應 (200)

```json
{
  "message": "批量操作完成",
  "data": {
    "successCount": 4,
    "failedCount": 0,
    "totalCount": 4
  }
}
```

#### 錯誤響應

| 狀態碼 | 錯誤代碼 | 說明 |
|--------|----------|------|
| 401 | UNAUTHORIZED | 未提供有效的認證令牌 |
| 400 | VALIDATION_ERROR | 輸入資料驗證失敗 |
| 400 | INVALID_ACTION | 操作類型無效 |
| 400 | EMPTY_IDS_ARRAY | ID 陣列不能為空 |

---

### 7. 獲取統計資訊

**GET** `/api/todos/stats`

獲取當前用戶的待辦事項統計資訊。

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### 成功響應 (200)

```json
{
  "message": "成功獲取統計資訊",
  "data": {
    "stats": {
      "total": 50,
      "completed": 30,
      "pending": 20,
      "overdue": 5,
      "completionRate": 60,
      "byPriority": {
        "high": 15,
        "medium": 20,
        "low": 15
      },
      "byCategory": {
        "work": 25,
        "personal": 15,
        "study": 10
      },
      "recentActivity": {
        "completedToday": 3,
        "createdToday": 2,
        "dueToday": 4
      }
    }
  }
}
```

#### 錯誤響應

| 狀態碼 | 錯誤代碼 | 說明 |
|--------|----------|------|
| 401 | UNAUTHORIZED | 未提供有效的認證令牌 |

---

### 8. 獲取分類列表

**GET** `/api/todos/categories`

獲取當前用戶使用過的所有分類標籤。

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### 成功響應 (200)

```json
{
  "message": "成功獲取分類列表",
  "data": {
    "categories": [
      {
        "name": "work",
        "count": 25
      },
      {
        "name": "personal",
        "count": 15
      },
      {
        "name": "study",
        "count": 10
      }
    ]
  }
}
```

#### 錯誤響應

| 狀態碼 | 錯誤代碼 | 說明 |
|--------|----------|------|
| 401 | UNAUTHORIZED | 未提供有效的認證令牌 |

---

## 錯誤代碼說明

### Todo 相關錯誤

| 錯誤代碼 | HTTP狀態碼 | 說明 |
|----------|------------|------|
| TODO_NOT_FOUND | 404 | 待辦事項不存在或無權限訪問 |
| INVALID_TODO_ID | 400 | 待辦事項 ID 格式錯誤 |
| INVALID_QUERY_PARAMS | 400 | 查詢參數格式錯誤 |
| INVALID_ACTION | 400 | 批量操作類型無效 |
| EMPTY_IDS_ARRAY | 400 | ID 陣列不能為空 |

### 通用錯誤

| 錯誤代碼 | HTTP狀態碼 | 說明 |
|----------|------------|------|
| UNAUTHORIZED | 401 | 未提供有效的認證令牌 |
| VALIDATION_ERROR | 400 | 輸入資料驗證失敗 |
| INTERNAL_ERROR | 500 | 伺服器內部錯誤 |

---

## 驗證規則

### 標題 (title)

- 長度：1-100個字元
- 格式：不可只包含空白字元
- 必填：是

### 描述 (description)

- 長度：最多500個字元
- 格式：允許多行文字
- 必填：否

### 優先級 (priority)

- 允許值：`low`, `medium`, `high`
- 預設值：`medium`
- 必填：否

### 分類 (category)

- 長度：1-20個字元
- 格式：英數字、中文、底線、連字號
- 必填：否

### 截止日期 (dueDate)

- 格式：ISO 8601 字串格式
- 範例：`2024-12-31T23:59:59.000Z`
- 必填：否

---

## 使用場景範例

### 1. 建立每日待辦清單

```javascript
// 1. 建立新的待辦事項
const response = await fetch('/api/todos', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: '準備會議簡報',
    description: '為明天的季度檢討會議準備簡報內容',
    priority: 'high',
    category: 'work',
    dueDate: '2024-01-15T09:00:00.000Z'
  })
});

// 2. 獲取今日待辦清單
const todayTodos = await fetch('/api/todos?sortBy=due_date&sortOrder=asc', {
  headers: { 'Authorization': 'Bearer ' + token }
});
```

### 2. 完成待辦事項

```javascript
// 標記為完成
await fetch('/api/todos/1', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    completed: true
  })
});
```

### 3. 批量管理

```javascript
// 批量完成多個待辦事項
await fetch('/api/todos/batch', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ids: [1, 2, 3],
    action: 'complete'
  })
});
```

### 4. 統計分析

```javascript
// 獲取完成率統計
const stats = await fetch('/api/todos/stats', {
  headers: { 'Authorization': 'Bearer ' + token }
});
```

---

## 開發注意事項

1. **權限控制**: 每個用戶只能訪問自己的待辦事項
2. **資料驗證**: 所有輸入都需要進行嚴格的格式驗證
3. **分頁處理**: 大量資料需要使用分頁機制
4. **索引優化**: 對經常查詢的欄位建立資料庫索引
5. **快取策略**: 統計資訊可以考慮使用快取提升效能
6. **軟刪除**: 建議實作軟刪除機制，避免誤刪資料
7. **日誌記錄**: 重要操作需要記錄操作日誌
8. **效能監控**: 監控 API 回應時間和錯誤率

---

## 測試

建議實作以下測試場景：

### 單元測試

- 資料驗證邏輯
- 業務邏輯函數
- 資料庫操作

### 整合測試

- API 端點測試
- 認證機制測試
- 錯誤處理測試

### E2E 測試

- 完整的待辦事項生命週期
- 批量操作流程
- 統計功能驗證