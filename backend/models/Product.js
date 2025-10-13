const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Zorunlu Temel Bilgiler
  name: {
    type: String,
    required: [true, 'Ürün adı gereklidir'],
    trim: true,
    maxlength: [100, 'Ürün adı 100 karakterden fazla olamaz']
  },
  sku: {
    type: String,
    required: [true, 'SKU gereklidir'],
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },

  // İlişkiler
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: false
  },

  // Fiyatlar
  purchasePrice: {
    type: Number,
    required: [true, 'Alış fiyatı gereklidir'],
    min: [0, 'Alış fiyatı negatif olamaz']
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Satış fiyatı gereklidir'],
    min: [0, 'Satış fiyatı negatif olamaz']
  },
  // Toptan satış fiyatı bu alanda tutulur
  discountPrice: {
    type: Number,
    min: [0, 'İndirim fiyatı negatif olamaz']
  },

  // Durum
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index'ler
productSchema.index({ name: 'text', sku: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });

module.exports = mongoose.model('Product', productSchema);
