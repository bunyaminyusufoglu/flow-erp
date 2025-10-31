const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  // Temel Bilgiler
  shipmentNumber: {
    type: String,
    unique: true,
    trim: true,
    uppercase: true
  },
  orderNumber: {
    type: String,
    trim: true
  },
  
  // Mağaza Bilgileri
  fromStore: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Gönderen mağaza gereklidir']
  },
  toStore: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Alıcı mağaza gereklidir']
  },
  
  // Sevkiyat Bilgileri
  shippingMethod: {
    type: String,
    enum: ['internal', 'external', 'pickup'],
    default: undefined
  },
  
  trackingNumber: {
    type: String,
    trim: true,
    sparse: true // Boş değerlere izin ver ama benzersiz olsun
  },
  
  // Ürünler
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: [true, 'Miktar gereklidir'],
      min: [1, 'Miktar en az 1 olmalıdır']
    },
    unitPrice: {
      type: Number,
      min: [0, 'Birim fiyat negatif olamaz']
    },
    totalPrice: {
      type: Number,
      min: [0, 'Toplam fiyat negatif olamaz']
    }
  }],
  
  // Sevkiyat Durumu
  status: {
    type: String,
    enum: ['pending', 'preparing', 'shipped', 'delivered', 'cancelled'],
    default: undefined
  },
  
  // Tarihler
  orderDate: {
    type: Date,
    default: Date.now
  },
  shipDate: {
    type: Date
  },
  deliveryDate: {
    type: Date
  },
  expectedDeliveryDate: {
    type: Date,
    required: [true, 'Beklenen teslimat tarihi gereklidir']
  },
  
  // Mali Bilgiler
  subtotal: {
    type: Number,
    min: [0, 'Ara toplam negatif olamaz']
  },
  shippingCost: {
    type: Number,
    min: [0, 'Kargo ücreti negatif olamaz']
  },
  taxAmount: {
    type: Number,
    min: [0, 'Vergi tutarı negatif olamaz']
  },
  totalAmount: {
    type: Number,
    min: [0, 'Toplam tutar negatif olamaz']
  },
  
  // Notlar
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notlar 500 karakterden fazla olamaz']
  },
  
  // Takip Bilgileri
  trackingHistory: [{
    status: {
      type: String,
      required: true
    },
    location: {
      type: String,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  
  // Sistem Bilgileri
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Auth yokken null bırak
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
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
shipmentSchema.virtual('isOverdue').get(function() {
  return this.status !== 'delivered' && this.expectedDeliveryDate < new Date();
});

shipmentSchema.virtual('daysUntilDelivery').get(function() {
  if (this.status === 'delivered') return 0;
  const now = new Date();
  const delivery = new Date(this.expectedDeliveryDate);
  const diffTime = delivery - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

shipmentSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Index'ler
shipmentSchema.index({ shipmentNumber: 1 });
shipmentSchema.index({ orderNumber: 1 });
shipmentSchema.index({ status: 1 });
shipmentSchema.index({ fromStore: 1 });
shipmentSchema.index({ toStore: 1 });
shipmentSchema.index({ createdAt: -1 });
shipmentSchema.index({ expectedDeliveryDate: 1 });

// Middleware - güncelleme tarihini otomatik güncelle
shipmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Shipment', shipmentSchema);
