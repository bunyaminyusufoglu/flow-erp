const { body } = require('express-validator');

// Mağaza validation kuralları
const storeValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Mağaza adı gereklidir')
    .isLength({ max: 100 })
    .withMessage('Mağaza adı 100 karakterden fazla olamaz'),
  
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Mağaza kodu gereklidir')
    .isLength({ max: 10 })
    .withMessage('Mağaza kodu 10 karakterden fazla olamaz')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Mağaza kodu sadece büyük harf, rakam ve tire içerebilir'),
  
  body('contact.phone')
    .trim()
    .notEmpty()
    .withMessage('Telefon numarası gereklidir')
    .isLength({ min: 10, max: 15 })
    .withMessage('Telefon numarası 10-15 karakter arasında olmalıdır'),
  
  body('contact.email')
    .trim()
    .notEmpty()
    .withMessage('Email adresi gereklidir')
    .isEmail()
    .withMessage('Geçerli bir email adresi giriniz'),
  
  body('contact.manager')
    .trim()
    .notEmpty()
    .withMessage('Müdür adı gereklidir')
    .isLength({ max: 100 })
    .withMessage('Müdür adı 100 karakterden fazla olamaz'),
  
  body('address.street')
    .trim()
    .notEmpty()
    .withMessage('Adres gereklidir')
    .isLength({ max: 200 })
    .withMessage('Adres 200 karakterden fazla olamaz'),
  
  body('address.city')
    .trim()
    .notEmpty()
    .withMessage('Şehir gereklidir')
    .isLength({ max: 50 })
    .withMessage('Şehir 50 karakterden fazla olamaz'),
  
  body('address.state')
    .trim()
    .notEmpty()
    .withMessage('İl gereklidir')
    .isLength({ max: 50 })
    .withMessage('İl 50 karakterden fazla olamaz'),
  
  body('address.zipCode')
    .trim()
    .notEmpty()
    .withMessage('Posta kodu gereklidir')
    .isLength({ min: 5, max: 10 })
    .withMessage('Posta kodu 5-10 karakter arasında olmalıdır'),
  
  body('address.country')
    .trim()
    .notEmpty()
    .withMessage('Ülke gereklidir')
    .isLength({ max: 50 })
    .withMessage('Ülke 50 karakterden fazla olamaz'),
  
  body('type')
    .optional()
    .isIn(['warehouse', 'store', 'branch'])
    .withMessage('Geçersiz mağaza türü'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'maintenance'])
    .withMessage('Geçersiz durum'),
  
  body('capacity.maxProducts')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maksimum ürün sayısı pozitif bir sayı olmalıdır'),
  
  body('capacity.maxWeight')
    .optional()
    .isNumeric()
    .withMessage('Maksimum ağırlık sayısal olmalıdır')
    .isFloat({ min: 0 })
    .withMessage('Maksimum ağırlık negatif olamaz'),
  
  body('budget.monthlyLimit')
    .optional()
    .isNumeric()
    .withMessage('Aylık limit sayısal olmalıdır')
    .isFloat({ min: 0 })
    .withMessage('Aylık limit negatif olamaz'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notlar 500 karakterden fazla olamaz'),
  
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
