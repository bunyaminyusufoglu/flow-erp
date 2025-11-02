const { body, validationResult } = require('express-validator');

const accountValidation = [
  body('name').trim().notEmpty().withMessage('Cari adı gereklidir').isLength({ max: 120 }).withMessage('Cari adı 120 karakteri aşamaz'),
  body('code').trim().notEmpty().withMessage('Cari kodu gereklidir').isLength({ max: 20 }).withMessage('Cari kodu 20 karakteri aşamaz').matches(/^[A-Z0-9-]+$/).withMessage('Kod sadece BÜYÜK HARF, RAKAM ve - içerebilir'),
  body('type').optional().isIn(['customer', 'supplier', 'other']).withMessage('Geçersiz cari türü'),
  body('openingBalance').optional().isFloat({ min: 0 }).withMessage('Açılış bakiyesi negatif olamaz'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Geçersiz durum'),
  body('contact.email').optional().isEmail().withMessage('Geçerli e-posta giriniz'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notlar 500 karakteri aşamaz'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation hataları', errors: errors.array() });
    }
    next();
  }
];

const accountTransactionValidation = [
  body('date').optional().isISO8601().withMessage('Geçerli tarih giriniz'),
  body('type').notEmpty().isIn(['income', 'expense']).withMessage('Tür income veya expense olmalıdır'),
  body('amount').notEmpty().isFloat({ min: 0.01 }).withMessage('Tutar 0.01 TL ve üzeri olmalıdır'),
  body('description').optional().isLength({ max: 300 }).withMessage('Açıklama 300 karakteri aşamaz'),
  body('category').notEmpty().withMessage('Kategori zorunludur').bail().isMongoId().withMessage('Kategori ID geçersiz'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation hataları', errors: errors.array() });
    }
    next();
  }
];

module.exports = { accountValidation, accountTransactionValidation };


