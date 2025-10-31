const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Zorunlu Temel Bilgiler
  name: {
    type: String,
    required: [true, 'Ürün adı gereklidir'],
    trim: true,
    maxlength: [100, 'Ürün adı 100 karakterden fazla olamaz']
  },
  description: {
    type: String,
    required: [true, 'Ürün açıklaması gereklidir'],
    trim: true,
    maxlength: [500, 'Açıklama 500 karakterden fazla olamaz']
  },
  sku: {
    type: String,
    required: [true, 'SKU gereklidir'],
    unique: true,
    trim: true,
    uppercase: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true, // Boş değerlere izin ver ama benzersiz olsun
    trim: true
  },

  // Kategori ve Marka
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: false // Kategori artık zorunlu değil
  },
  brand: {
    type: String,
    required: [true, 'Marka gereklidir'],
    trim: true
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
  wholesalePrice: {
    type: Number,
    min: [0, 'Toptan fiyat negatif olamaz']
  },
  discountPrice: {
    type: Number,
    min: [0, 'İndirim fiyatı negatif olamaz']
  },

  // Stok Bilgileri
  stockQuantity: {
    type: Number,
    required: [true, 'Stok miktarı gereklidir'],
    min: [0, 'Stok miktarı negatif olamaz'],
    default: 0
  },
  minStockLevel: {
    type: Number,
    min: [0, 'Minimum stok seviyesi negatif olamaz'],
    default: 5
  },
  maxStockLevel: {
    type: Number,
    min: [0, 'Maksimum stok seviyesi negatif olamaz'],
    default: 1000
  },

  // Birim Bilgileri
  unit: {
    type: String,
    required: [true, 'Birim gereklidir'],
    enum: ['adet', 'kg', 'metre', 'litre', 'kutu', 'paket'],
    default: 'adet'
  },
  weight: {
    type: Number,
    min: [0, 'Ağırlık negatif olamaz']
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },

  // Durum ve Özellikler
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  tags: [String],

  // Meta Bilgiler
  metaTitle: String,
  metaDescription: String,
  seoKeywords: [String],

  // Resimler
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index'ler
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ createdAt: -1 });

// Middleware - güncelleme tarihini otomatik güncelle
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);
