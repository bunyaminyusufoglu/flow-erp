const { body } = require('express-validator');

// Sevkiyat validation kuralları
const shipmentValidation = [
  // orderNumber kaldırıldı (opsiyonel)

  body('fromStore')
    .isMongoId()
    .withMessage('Geçerli bir gönderen mağaza ID\'si giriniz'),
  
  body('toStore')
    .isMongoId()
    .withMessage('Geçerli bir alıcı mağaza ID\'si giriniz'),
  
  // shippingMethod kaldırıldı (opsiyonel)
  body('shippingMethod')
    .optional()
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
    .toInt()
    .withMessage('Miktar en az 1 olmalıdır'),
  
  // Fiyat alanları kaldırıldı (unitPrice/totalPrice zorunlu değil)
  body('items.*.unitPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Birim fiyat negatif olamaz'),
  body('items.*.totalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Toplam fiyat negatif olamaz'),
  
  body('expectedDeliveryDate')
    .isISO8601()
    .withMessage('Geçerli bir teslimat tarihi giriniz')
    .custom((value) => {
      const candidate = new Date(value);
      if (isNaN(candidate.getTime())) {
        throw new Error('Geçerli bir teslimat tarihi giriniz');
      }
      const today = new Date();
      candidate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (candidate < today) {
        throw new Error('Teslimat tarihi bugünden önce olamaz');
      }
      return true;
    }),
  
  // Toplam alanlar opsiyonel
  body('subtotal')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Ara toplam negatif olamaz'),
  body('shippingCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Kargo ücreti negatif olamaz'),
  body('taxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Vergi tutarı negatif olamaz'),
  body('totalAmount')
    .optional()
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
