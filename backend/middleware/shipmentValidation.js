const { body } = require('express-validator');

// Sevkiyat validation kuralları
const shipmentValidation = [
  body('orderNumber')
    .trim()
    .notEmpty()
    .withMessage('Sipariş numarası gereklidir')
    .isLength({ max: 50 })
    .withMessage('Sipariş numarası 50 karakterden fazla olamaz'),
  
  body('fromStore')
    .isMongoId()
    .withMessage('Geçerli bir gönderen mağaza ID\'si giriniz'),
  
  body('toStore')
    .isMongoId()
    .withMessage('Geçerli bir alıcı mağaza ID\'si giriniz'),
  
  body('shippingMethod')
    .isIn(['internal', 'external', 'pickup'])
    .withMessage('Geçersiz kargo yöntemi'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('En az bir ürün gereklidir'),
  
  body('items.*.product')
    .isMongoId()
    .withMessage('Geçerli bir ürün ID\'si giriniz'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Miktar en az 1 olmalıdır'),
  
  body('items.*.unitPrice')
    .isNumeric()
    .withMessage('Birim fiyat sayısal olmalıdır')
    .isFloat({ min: 0 })
    .withMessage('Birim fiyat negatif olamaz'),
  
  body('items.*.totalPrice')
    .isNumeric()
    .withMessage('Toplam fiyat sayısal olmalıdır')
    .isFloat({ min: 0 })
    .withMessage('Toplam fiyat negatif olamaz'),
  
  body('expectedDeliveryDate')
    .isISO8601()
    .withMessage('Geçerli bir teslimat tarihi giriniz')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Teslimat tarihi bugünden sonra olmalıdır');
      }
      return true;
    }),
  
  body('subtotal')
    .isNumeric()
    .withMessage('Ara toplam sayısal olmalıdır')
    .isFloat({ min: 0 })
    .withMessage('Ara toplam negatif olamaz'),
  
  body('shippingCost')
    .optional()
    .isNumeric()
    .withMessage('Kargo ücreti sayısal olmalıdır')
    .isFloat({ min: 0 })
    .withMessage('Kargo ücreti negatif olamaz'),
  
  body('taxAmount')
    .optional()
    .isNumeric()
    .withMessage('Vergi tutarı sayısal olmalıdır')
    .isFloat({ min: 0 })
    .withMessage('Vergi tutarı negatif olamaz'),
  
  body('totalAmount')
    .isNumeric()
    .withMessage('Toplam tutar sayısal olmalıdır')
    .isFloat({ min: 0 })
    .withMessage('Toplam tutar negatif olamaz'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notlar 500 karakterden fazla olamaz')
];

// Sevkiyat durumu güncelleme validation kuralları
const shipmentStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Durum gereklidir')
    .isIn(['pending', 'preparing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Geçersiz durum'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Konum 100 karakterden fazla olamaz'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Notlar 200 karakterden fazla olamaz')
];

module.exports = {
  shipmentValidation,
  shipmentStatusValidation
};
