const express = require('express');
const { 
  getTodos, 
  getTodoById, 
  createTodo, 
  updateTodo, 
  deleteTodo, 
  batchUpdateTodos, 
  getTodoStats, 
  getTodoCategories 
} = require('../controllers/todoController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要認證
router.use(authMiddleware);

// 特殊功能路由（必須在 :id 路由之前）
router.get('/stats', getTodoStats);
router.get('/categories', getTodoCategories);
router.patch('/batch', batchUpdateTodos);

// 基本 CRUD 路由
router.get('/', getTodos);
router.get('/:id', getTodoById);
router.post('/', createTodo);
router.put('/:id', updateTodo);
router.delete('/:id', deleteTodo);

module.exports = router;