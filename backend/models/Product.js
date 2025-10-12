const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Temel Bilgiler
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
    uppercase: true,
    index: true
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
    required: false
  },
  brand: {
    type: String,
    required: [true, 'Marka gereklidir'],
    trim: true
  },

  // Fiyat Bilgileri
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
    default: 0
  },
  maxStockLevel: {
    type: Number,
    min: [0, 'Maksimum stok seviyesi negatif olamaz']
  },

  // Fiziksel Özellikler
  weight: {
    type: Number,
    min: [0, 'Ağırlık negatif olamaz']
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'm', 'inch'],
      default: 'cm'
    }
  },
  color: {
    type: String,
    trim: true
  },
  size: {
    type: String,
    trim: true
  },

  // Medya
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],

  // Durum ve Ayarlar
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isDigital: {
    type: Boolean,
    default: false
  },

  // Vergi Bilgileri
  taxRate: {
    type: Number,
    min: [0, 'Vergi oranı negatif olamaz'],
    max: [100, 'Vergi oranı %100\'den fazla olamaz'],
    default: 18 // KDV %18
  },
  taxIncluded: {
    type: Boolean,
    default: true
  },

  // SEO ve Meta
  metaTitle: String,
  metaDescription: String,
  tags: [String],

  // Takip Bilgileri
  views: {
    type: Number,
    default: 0
  },
  salesCount: {
    type: Number,
    default: 0
  },

  // Tarihler
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

// Virtual alanlar
productSchema.virtual('profitMargin').get(function() {
  return this.sellingPrice - this.purchasePrice;
});

productSchema.virtual('profitPercentage').get(function() {
  if (this.purchasePrice === 0) return 0;
  return ((this.sellingPrice - this.purchasePrice) / this.purchasePrice) * 100;
});

productSchema.virtual('isLowStock').get(function() {
  return this.stockQuantity <= this.minStockLevel;
});

productSchema.virtual('isOutOfStock').get(function() {
  return this.stockQuantity === 0;
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
