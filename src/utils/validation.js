const Joi = require('joi');

const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(20)
    .required()
    .messages({
      'string.alphanum': '用戶名稱只能包含字母和數字',
      'string.min': '用戶名稱至少需要3個字元',
      'string.max': '用戶名稱不能超過20個字元',
      'any.required': '用戶名稱為必填欄位'
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '請輸入有效的電子郵件地址',
      'any.required': '電子郵件為必填欄位'
    }),
  
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': '密碼至少需要8個字元',
      'string.pattern.base': '密碼必須包含大小寫字母、數字及特殊符號',
      'any.required': '密碼為必填欄位'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': '確認密碼與密碼不符',
      'any.required': '確認密碼為必填欄位'
    }),
  
  phone: Joi.string()
    .pattern(new RegExp('^[0-9]{10}$'))
    .optional()
    .messages({
      'string.pattern.base': '請輸入有效的手機號碼（10位數字）'
    })
});

const loginSchema = Joi.object({
  username: Joi.string()
    .required()
    .messages({
      'any.required': '請輸入電子郵件或用戶名稱'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': '請輸入密碼'
    })
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': '請輸入當前密碼'
    }),
  
  newPassword: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': '新密碼至少需要8個字元',
      'string.pattern.base': '新密碼必須包含大小寫字母、數字及特殊符號',
      'any.required': '新密碼為必填欄位'
    }),
  
  confirmNewPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': '確認新密碼與新密碼不符',
      'any.required': '確認新密碼為必填欄位'
    })
});

const todoSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': '標題不能為空',
      'string.min': '標題至少需要1個字元',
      'string.max': '標題不能超過100個字元',
      'any.required': '標題為必填欄位'
    }),
  
  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': '描述不能超過500個字元'
    }),
  
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .optional()
    .messages({
      'any.only': '優先級必須是 low、medium 或 high'
    }),
  
  category: Joi.string()
    .trim()
    .min(1)
    .max(20)
    .optional()
    .allow('')
    .messages({
      'string.min': '分類至少需要1個字元',
      'string.max': '分類不能超過20個字元'
    }),
  
  dueDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': '截止日期格式必須是 ISO 8601 格式'
    })
});

const todoUpdateSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.empty': '標題不能為空',
      'string.min': '標題至少需要1個字元',
      'string.max': '標題不能超過100個字元'
    }),
  
  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': '描述不能超過500個字元'
    }),
  
  completed: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': '完成狀態必須是布林值'
    }),
  
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .optional()
    .messages({
      'any.only': '優先級必須是 low、medium 或 high'
    }),
  
  category: Joi.string()
    .trim()
    .min(1)
    .max(20)
    .optional()
    .allow('')
    .messages({
      'string.min': '分類至少需要1個字元',
      'string.max': '分類不能超過20個字元'
    }),
  
  dueDate: Joi.date()
    .iso()
    .optional()
    .allow(null)
    .messages({
      'date.format': '截止日期格式必須是 ISO 8601 格式'
    })
}).min(1).messages({
  'object.min': '至少需要提供一個要更新的欄位'
});

const todoQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      'number.base': '頁碼必須是數字',
      'number.integer': '頁碼必須是整數',
      'number.min': '頁碼必須大於0'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'number.base': '每頁筆數必須是數字',
      'number.integer': '每頁筆數必須是整數',
      'number.min': '每頁筆數必須大於0',
      'number.max': '每頁筆數不能超過100'
    }),
  
  completed: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': '完成狀態篩選必須是布林值'
    }),
  
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .optional()
    .messages({
      'any.only': '優先級篩選必須是 low、medium 或 high'
    }),
  
  category: Joi.string()
    .trim()
    .optional()
    .messages({
      'string.base': '分類篩選必須是字串'
    }),
  
  sortBy: Joi.string()
    .valid('created_at', 'updated_at', 'due_date', 'priority', 'title')
    .optional()
    .messages({
      'any.only': '排序欄位必須是 created_at、updated_at、due_date、priority 或 title'
    }),
  
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .messages({
      'any.only': '排序方向必須是 asc 或 desc'
    }),
  
  search: Joi.string()
    .trim()
    .optional()
    .messages({
      'string.base': '搜尋關鍵字必須是字串'
    })
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  todoSchema,
  todoUpdateSchema,
  todoQuerySchema
};