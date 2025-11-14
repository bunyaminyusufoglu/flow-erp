const { body } = require('express-validator');

// Ürün validation kuralları (model'e göre güncellenmiş)
const productValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Ürün adı gereklidir')
    .isLength({ max: 100 })
    .withMessage('Ürün adı 100 karakterden fazla olamaz'),

  body('sku')
    .trim()
    .notEmpty()
    .withMessage('SKU gereklidir')
    .isLength({ min: 3, max: 50 })
    .withMessage('SKU 3-50 karakter arasında olmalıdır'),

  body('barcode')
    .optional()
    .trim()
    .isString()
    .withMessage('Barkod geçerli bir metin olmalıdır'),

  body('category')
    .optional()
    .isMongoId()
    .withMessage('Geçerli bir kategori ID\'si giriniz'),

  body('sellingPrice')
    .notEmpty()
    .withMessage('Satış fiyatı gereklidir')
    .isFloat({ min: 0 })
    .withMessage('Satış fiyatı geçerli bir sayı olmalıdır'),

  body('wholesalePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Toptan fiyatı geçerli bir sayı olmalıdır'),

  body('discountPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('İndirim fiyatı geçerli bir sayı olmalıdır'),

  body('stockQuantity')
    .notEmpty()
    .withMessage('Stok miktarı gereklidir')
    .isInt({ min: 0 })
    .withMessage('Stok miktarı negatif olamaz'),

  body('minStockLevel')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stok seviyesi negatif olamaz'),

  body('maxStockLevel')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maksimum stok seviyesi negatif olamaz'),

  body('unit')
    .optional()
    .isIn(['adet', 'kg', 'metre', 'litre', 'kutu', 'paket'])
    .withMessage('Geçerli bir birim seçiniz'),

  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Ağırlık negatif olamaz'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'discontinued'])
    .withMessage('Durum active, inactive veya discontinued olmalıdır'),

  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('Öne çıkarılmış durumu geçerli bir boolean değer olmalıdır')
];

// Stok validation artık kullanılmıyor (endpoint kaldırıldı)
const stockUpdateValidation = [];
// Mağaza validation kuralları (sade)
const storeValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Mağaza adı gereklidir')
    .isLength({ max: 100 })
    .withMessage('Mağaza adı 100 karakterden fazla olamaz'),

  body('storeId')
    .trim()
    .notEmpty()
    .withMessage('Mağaza ID gereklidir')
    .isLength({ min: 3, max: 32 })
    .withMessage('Mağaza ID 3-32 karakter arasında olmalıdır')
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage('Mağaza ID sadece harf, rakam, _ ve - içerebilir')
];

// Kategori validation kuralları (sade: sadece ad ve durum)
const categoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Kategori adı gereklidir')
    .isLength({ max: 50 })
    .withMessage('Kategori adı 50 karakterden fazla olamaz'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Durum active veya inactive olmalıdır')
];

module.exports = {
  productValidation,
  stockUpdateValidation,
  categoryValidation,
  storeValidation
};
