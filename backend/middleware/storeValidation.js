const { body, validationResult } = require('express-validator');

// Mağaza validation kuralları
const storeValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Mağaza adı gereklidir')
    .isLength({ max: 100 })
    .withMessage('Mağaza adı 100 karakterden fazla olamaz'),

  // Diğer tüm alanlar isteğe bağlı; kod (code) verilirse formatını kontrol edelim
  body('code')
    .optional()
    .trim()
    .isLength({ min: 6, max: 10 })
    .withMessage('Mağaza kodu 6-10 karakter arasında olmalıdır')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Mağaza kodu sadece büyük harf, rakam ve tire içerebilir'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation hataları', errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  storeValidation
};
