const { body } = require('express-validator');

// Ürün validation kuralları
const productValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Ürün adı gereklidir')
    .isLength({ max: 100 })
    .withMessage('Ürün adı 100 karakterden fazla olamaz'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Ürün açıklaması gereklidir')
    .isLength({ max: 500 })
    .withMessage('Açıklama 500 karakterden fazla olamaz'),

  body('sku')
    .trim()
    .notEmpty()
    .withMessage('SKU gereklidir')
    .isLength({ min: 3, max: 50 })
    .withMessage('SKU 3-50 karakter arasında olmalıdır'),

  body('brand')
    .trim()
    .notEmpty()
    .withMessage('Marka gereklidir')
    .isLength({ max: 100 })
    .withMessage('Marka 100 karakterden fazla olamaz'),

  body('category')
    .optional()
    .isMongoId()
    .withMessage('Geçerli bir kategori ID\'si giriniz'),

  body('purchasePrice')
    .notEmpty()
    .withMessage('Alış fiyatı gereklidir')
    .isFloat({ min: 0 })
    .withMessage('Alış fiyatı geçerli bir sayı olmalıdır'),

  body('sellingPrice')
    .notEmpty()
    .withMessage('Satış fiyatı gereklidir')
    .isFloat({ min: 0 })
    .withMessage('Satış fiyatı geçerli bir sayı olmalıdır'),

  body('stockQuantity')
    .notEmpty()
    .withMessage('Stok miktarı gereklidir')
    .isInt({ min: 0 })
    .withMessage('Stok miktarı negatif olamaz'),

  body('unit')
    .optional()
    .isIn(['adet', 'kg', 'metre', 'litre', 'kutu', 'paket'])
    .withMessage('Geçerli bir birim seçiniz'),

  body('discountPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('İndirim fiyatı geçerli bir sayı olmalıdır'),

  body('status')
    .optional()
    .isIn(['active', 'inactive', 'discontinued'])
    .withMessage('Durum active, inactive veya discontinued olmalıdır')
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

// Kategori validation kuralları
const categoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Kategori adı gereklidir')
    .isLength({ max: 50 })
    .withMessage('Kategori adı 50 karakterden fazla olamaz'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Açıklama 200 karakterden fazla olamaz'),
  
  body('slug')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Slug 2-50 karakter arasında olmalıdır')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug sadece küçük harf, rakam ve tire içerebilir'),
  
  body('parent')
    .optional()
    .isMongoId()
    .withMessage('Geçerli bir ana kategori ID\'si giriniz'),
  
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('İkon adı 100 karakterden fazla olamaz'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Durum active veya inactive olmalıdır'),
  
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('Öne çıkan alanı true/false olmalıdır'),
  
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sıralama numarası negatif olamaz'),
  
  body('metaTitle')
    .optional()
    .trim()
    .isLength({ max: 60 })
    .withMessage('Meta başlık 60 karakterden fazla olamaz'),
  
  body('metaDescription')
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage('Meta açıklama 160 karakterden fazla olamaz'),
  
  body('keywords')
    .optional()
    .isArray()
    .withMessage('Anahtar kelimeler dizi formatında olmalıdır'),
  
  body('keywords.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Her anahtar kelime 30 karakterden fazla olamaz')
];

module.exports = {
  productValidation,
  stockUpdateValidation,
  categoryValidation,
  storeValidation
};
