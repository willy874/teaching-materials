const { getDatabase } = require('../config/database');
const { todoSchema, todoUpdateSchema, todoQuerySchema } = require('../utils/validation');

const getTodos = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const db = getDatabase();
    
    // 驗證查詢參數
    const { error, value } = todoQuerySchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error_code: 'INVALID_QUERY_PARAMS',
        message: error.details[0].message,
        data: {}
      });
    }
    
    // 解析查詢參數
    const {
      page = 1,
      limit = 20,
      completed,
      priority,
      category,
      sortBy = 'created_at',
      sortOrder = 'desc',
      search
    } = value;
    
    // 驗證參數
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;
    
    // 建構查詢條件
    let whereClause = 'WHERE user_id = ?';
    let queryParams = [userId];
    
    if (completed !== undefined) {
      whereClause += ' AND completed = ?';
      queryParams.push(completed === 'true' ? 1 : 0);
    }
    
    if (priority) {
      whereClause += ' AND priority = ?';
      queryParams.push(priority);
    }
    
    if (category) {
      whereClause += ' AND category = ?';
      queryParams.push(category);
    }
    
    if (search) {
      whereClause += ' AND (title LIKE ? OR description LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    // 驗證排序欄位
    const allowedSortFields = ['created_at', 'updated_at', 'due_date', 'priority', 'title'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    
    // 優先級排序邏輯
    let orderClause;
    if (sortField === 'priority') {
      orderClause = `ORDER BY CASE priority 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 3 
        ELSE 4 END ${sortDirection}`;
    } else {
      orderClause = `ORDER BY ${sortField} ${sortDirection}`;
    }
    
    // 查詢總數
    const countQuery = `SELECT COUNT(*) as total FROM todos ${whereClause}`;
    const countResult = await new Promise((resolve, reject) => {
      db.get(countQuery, queryParams, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // 查詢數據
    const dataQuery = `
      SELECT * FROM todos 
      ${whereClause} 
      ${orderClause}
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...queryParams, limitNum, offset];
    
    const todos = await new Promise((resolve, reject) => {
      db.all(dataQuery, dataParams, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // 計算分頁資訊
    const totalItems = countResult.total;
    const totalPages = Math.ceil(totalItems / limitNum);
    
    // 格式化回應資料
    const formattedTodos = todos.map(todo => ({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: Boolean(todo.completed),
      priority: todo.priority,
      category: todo.category,
      dueDate: todo.due_date,
      createdAt: todo.created_at,
      updatedAt: todo.updated_at,
      userId: todo.user_id
    }));
    
    res.json({
      message: '成功獲取待辦事項',
      data: {
        todos: formattedTodos,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });
    
  } catch (error) {
    next(error);
  }
};

const getTodoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const db = getDatabase();
    
    // 驗證 ID 格式
    const todoId = parseInt(id);
    if (isNaN(todoId)) {
      return res.status(400).json({
        error_code: 'INVALID_TODO_ID',
        message: '待辦事項 ID 格式錯誤',
        data: {}
      });
    }
    
    const query = 'SELECT * FROM todos WHERE id = ? AND user_id = ?';
    const todo = await new Promise((resolve, reject) => {
      db.get(query, [todoId, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!todo) {
      return res.status(404).json({
        error_code: 'TODO_NOT_FOUND',
        message: '待辦事項不存在或無權限訪問',
        data: {}
      });
    }
    
    // 格式化回應資料
    const formattedTodo = {
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: Boolean(todo.completed),
      priority: todo.priority,
      category: todo.category,
      dueDate: todo.due_date,
      createdAt: todo.created_at,
      updatedAt: todo.updated_at,
      userId: todo.user_id
    };
    
    res.json({
      message: '成功獲取待辦事項',
      data: {
        todo: formattedTodo
      }
    });
    
  } catch (error) {
    next(error);
  }
};

const createTodo = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const db = getDatabase();
    
    // 驗證輸入資料
    const { error, value } = todoSchema.validate(req.body);
    if (error) {
      error.isJoi = true;
      return next(error);
    }
    
    const { title, description, priority = 'medium', category, dueDate } = value;
    
    // 建立待辦事項
    const query = `
      INSERT INTO todos (title, description, priority, category, due_date, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      title,
      description || null,
      priority,
      category || null,
      dueDate ? new Date(dueDate).toISOString() : null,
      userId
    ];
    
    const result = await new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
    
    // 獲取剛建立的待辦事項
    const newTodo = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM todos WHERE id = ?', [result.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // 格式化回應資料
    const formattedTodo = {
      id: newTodo.id,
      title: newTodo.title,
      description: newTodo.description,
      completed: Boolean(newTodo.completed),
      priority: newTodo.priority,
      category: newTodo.category,
      dueDate: newTodo.due_date,
      createdAt: newTodo.created_at,
      updatedAt: newTodo.updated_at,
      userId: newTodo.user_id
    };
    
    res.status(201).json({
      message: '待辦事項建立成功',
      data: {
        todo: formattedTodo
      }
    });
    
  } catch (error) {
    next(error);
  }
};

const updateTodo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const db = getDatabase();
    
    // 驗證 ID 格式
    const todoId = parseInt(id);
    if (isNaN(todoId)) {
      return res.status(400).json({
        error_code: 'INVALID_TODO_ID',
        message: '待辦事項 ID 格式錯誤',
        data: {}
      });
    }
    
    // 驗證輸入資料
    const { error, value } = todoUpdateSchema.validate(req.body);
    if (error) {
      error.isJoi = true;
      return next(error);
    }
    
    // 檢查待辦事項是否存在
    const existingTodo = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM todos WHERE id = ? AND user_id = ?', [todoId, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!existingTodo) {
      return res.status(404).json({
        error_code: 'TODO_NOT_FOUND',
        message: '待辦事項不存在或無權限訪問',
        data: {}
      });
    }
    
    const { title, description, completed, priority, category, dueDate } = value;
    
    // 建構更新欄位
    const updateFields = [];
    const updateParams = [];
    
    if (title !== undefined) {
      updateFields.push('title = ?');
      updateParams.push(title);
    }
    
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateParams.push(description || null);
    }
    
    if (completed !== undefined) {
      updateFields.push('completed = ?');
      updateParams.push(completed ? 1 : 0);
    }
    
    if (priority !== undefined) {
      updateFields.push('priority = ?');
      updateParams.push(priority);
    }
    
    if (category !== undefined) {
      updateFields.push('category = ?');
      updateParams.push(category || null);
    }
    
    if (dueDate !== undefined) {
      updateFields.push('due_date = ?');
      updateParams.push(dueDate ? new Date(dueDate).toISOString() : null);
    }
    
    // 加入 updated_at 欄位
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    // 執行更新
    const updateQuery = `
      UPDATE todos 
      SET ${updateFields.join(', ')} 
      WHERE id = ? AND user_id = ?
    `;
    updateParams.push(todoId, userId);
    
    await new Promise((resolve, reject) => {
      db.run(updateQuery, updateParams, function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // 獲取更新後的待辦事項
    const updatedTodo = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM todos WHERE id = ?', [todoId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // 格式化回應資料
    const formattedTodo = {
      id: updatedTodo.id,
      title: updatedTodo.title,
      description: updatedTodo.description,
      completed: Boolean(updatedTodo.completed),
      priority: updatedTodo.priority,
      category: updatedTodo.category,
      dueDate: updatedTodo.due_date,
      createdAt: updatedTodo.created_at,
      updatedAt: updatedTodo.updated_at,
      userId: updatedTodo.user_id
    };
    
    res.json({
      message: '待辦事項更新成功',
      data: {
        todo: formattedTodo
      }
    });
    
  } catch (error) {
    next(error);
  }
};

const deleteTodo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const db = getDatabase();
    
    // 驗證 ID 格式
    const todoId = parseInt(id);
    if (isNaN(todoId)) {
      return res.status(400).json({
        error_code: 'INVALID_TODO_ID',
        message: '待辦事項 ID 格式錯誤',
        data: {}
      });
    }
    
    // 檢查待辦事項是否存在
    const existingTodo = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM todos WHERE id = ? AND user_id = ?', [todoId, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!existingTodo) {
      return res.status(404).json({
        error_code: 'TODO_NOT_FOUND',
        message: '待辦事項不存在或無權限訪問',
        data: {}
      });
    }
    
    // 刪除待辦事項
    const deleteQuery = 'DELETE FROM todos WHERE id = ? AND user_id = ?';
    await new Promise((resolve, reject) => {
      db.run(deleteQuery, [todoId, userId], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    
    res.json({
      message: '待辦事項刪除成功',
      data: {}
    });
    
  } catch (error) {
    next(error);
  }
};

const batchUpdateTodos = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { ids, action, priority, category } = req.body;
    const db = getDatabase();
    
    // 驗證輸入
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error_code: 'EMPTY_IDS_ARRAY',
        message: 'ID 陣列不能為空',
        data: {}
      });
    }
    
    const validActions = ['complete', 'incomplete', 'delete', 'update'];
    if (!action || !validActions.includes(action)) {
      return res.status(400).json({
        error_code: 'INVALID_ACTION',
        message: '操作類型無效',
        data: {}
      });
    }
    
    // 驗證優先級（如果有提供）
    if (priority) {
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          error_code: 'INVALID_PRIORITY',
          message: '優先級值無效',
          data: {}
        });
      }
    }
    
    let successCount = 0;
    let failedCount = 0;
    
    // 建立 placeholders 用於 IN 查詢
    const placeholders = ids.map(() => '?').join(',');
    
    if (action === 'delete') {
      // 批量刪除
      const deleteQuery = `DELETE FROM todos WHERE id IN (${placeholders}) AND user_id = ?`;
      const deleteParams = [...ids, userId];
      
      const result = await new Promise((resolve, reject) => {
        db.run(deleteQuery, deleteParams, function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        });
      });
      
      successCount = result.changes;
      failedCount = ids.length - successCount;
      
    } else {
      // 批量更新
      let updateFields = [];
      let updateParams = [];
      
      if (action === 'complete') {
        updateFields.push('completed = 1');
      } else if (action === 'incomplete') {
        updateFields.push('completed = 0');
      }
      
      if (action === 'update') {
        if (priority) {
          updateFields.push('priority = ?');
          updateParams.push(priority);
        }
        if (category) {
          updateFields.push('category = ?');
          updateParams.push(category);
        }
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({
          error_code: 'NO_FIELDS_TO_UPDATE',
          message: '沒有提供要更新的欄位',
          data: {}
        });
      }
      
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      
      const updateQuery = `
        UPDATE todos 
        SET ${updateFields.join(', ')} 
        WHERE id IN (${placeholders}) AND user_id = ?
      `;
      const finalParams = [...updateParams, ...ids, userId];
      
      const result = await new Promise((resolve, reject) => {
        db.run(updateQuery, finalParams, function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        });
      });
      
      successCount = result.changes;
      failedCount = ids.length - successCount;
    }
    
    res.json({
      message: '批量操作完成',
      data: {
        successCount,
        failedCount,
        totalCount: ids.length
      }
    });
    
  } catch (error) {
    next(error);
  }
};

const getTodoStats = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const db = getDatabase();
    
    // 基本統計
    const basicStats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN completed = 0 AND due_date < datetime('now') THEN 1 ELSE 0 END) as overdue
        FROM todos 
        WHERE user_id = ?
      `, [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // 按優先級統計
    const priorityStats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT priority, COUNT(*) as count 
        FROM todos 
        WHERE user_id = ? AND completed = 0 
        GROUP BY priority
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // 按分類統計
    const categoryStats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT category, COUNT(*) as count 
        FROM todos 
        WHERE user_id = ? AND category IS NOT NULL AND category != '' 
        GROUP BY category
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // 今日活動統計
    const today = new Date().toISOString().split('T')[0];
    const activityStats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          SUM(CASE WHEN completed = 1 AND date(updated_at) = ? THEN 1 ELSE 0 END) as completedToday,
          SUM(CASE WHEN date(created_at) = ? THEN 1 ELSE 0 END) as createdToday,
          SUM(CASE WHEN date(due_date) = ? AND completed = 0 THEN 1 ELSE 0 END) as dueToday
        FROM todos 
        WHERE user_id = ?
      `, [today, today, today, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // 格式化統計資料
    const byPriority = {};
    priorityStats.forEach(stat => {
      byPriority[stat.priority] = stat.count;
    });
    
    const byCategory = {};
    categoryStats.forEach(stat => {
      byCategory[stat.category] = stat.count;
    });
    
    const completionRate = basicStats.total > 0 
      ? Math.round((basicStats.completed / basicStats.total) * 100) 
      : 0;
    
    res.json({
      message: '成功獲取統計資訊',
      data: {
        stats: {
          total: basicStats.total,
          completed: basicStats.completed,
          pending: basicStats.pending,
          overdue: basicStats.overdue,
          completionRate,
          byPriority,
          byCategory,
          recentActivity: {
            completedToday: activityStats.completedToday || 0,
            createdToday: activityStats.createdToday || 0,
            dueToday: activityStats.dueToday || 0
          }
        }
      }
    });
    
  } catch (error) {
    next(error);
  }
};

const getTodoCategories = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const db = getDatabase();
    
    const categories = await new Promise((resolve, reject) => {
      db.all(`
        SELECT category as name, COUNT(*) as count 
        FROM todos 
        WHERE user_id = ? AND category IS NOT NULL AND category != '' 
        GROUP BY category 
        ORDER BY count DESC
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      message: '成功獲取分類列表',
      data: {
        categories
      }
    });
    
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  batchUpdateTodos,
  getTodoStats,
  getTodoCategories
};