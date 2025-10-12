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
  
  body('barcode')
    .optional()
    .trim()
    .isLength({ min: 8, max: 20 })
    .withMessage('Barkod 8-20 karakter arasında olmalıdır'),
  
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Geçerli bir kategori ID\'si giriniz'),
  
  body('brand')
    .trim()
    .notEmpty()
    .withMessage('Marka gereklidir')
    .isLength({ max: 50 })
    .withMessage('Marka adı 50 karakterden fazla olamaz'),
  
  body('purchasePrice')
    .notEmpty()
    .withMessage('Alış fiyatı gereklidir')
    .isNumeric()
    .withMessage('Alış fiyatı sayısal olmalıdır')
    .isFloat({ min: 0 })
    .withMessage('Alış fiyatı negatif olamaz'),
  
  body('sellingPrice')
    .notEmpty()
    .withMessage('Satış fiyatı gereklidir')
    .isNumeric()
    .withMessage('Satış fiyatı sayısal olmalıdır')
    .isFloat({ min: 0 })
    .withMessage('Satış fiyatı negatif olamaz'),
  
  body('discountPrice')
    .optional()
    .isNumeric()
    .withMessage('İndirim fiyatı sayısal olmalıdır')
    .isFloat({ min: 0 })
    .withMessage('İndirim fiyatı negatif olamaz'),
  
  body('stockQuantity')
    .optional()
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
  
  body('weight')
    .optional()
    .isNumeric()
    .withMessage('Ağırlık sayısal olmalıdır')
    .isFloat({ min: 0 })
    .withMessage('Ağırlık negatif olamaz'),
  
  body('color')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Renk adı 30 karakterden fazla olamaz'),
  
  body('size')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Beden 20 karakterden fazla olamaz'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'discontinued'])
    .withMessage('Durum active, inactive veya discontinued olmalıdır'),
  
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('Öne çıkan alanı true/false olmalıdır'),
  
  body('isDigital')
    .optional()
    .isBoolean()
    .withMessage('Dijital ürün alanı true/false olmalıdır'),
  
  body('taxRate')
    .optional()
    .isNumeric()
    .withMessage('Vergi oranı sayısal olmalıdır')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Vergi oranı 0-100 arasında olmalıdır'),
  
  body('taxIncluded')
    .optional()
    .isBoolean()
    .withMessage('Vergi dahil alanı true/false olmalıdır'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Etiketler dizi formatında olmalıdır'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Her etiket 30 karakterden fazla olamaz')
];

// Stok güncelleme validation kuralları
const stockUpdateValidation = [
  body('quantity')
    .notEmpty()
    .withMessage('Miktar gereklidir')
    .isNumeric()
    .withMessage('Miktar sayısal olmalıdır')
    .isFloat({ min: 0 })
    .withMessage('Miktar negatif olamaz'),
  
  body('operation')
    .notEmpty()
    .withMessage('Operasyon gereklidir')
    .isIn(['add', 'subtract', 'set'])
    .withMessage('Operasyon add, subtract veya set olmalıdır')
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
  categoryValidation
};
