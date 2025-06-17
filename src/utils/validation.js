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

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema
};