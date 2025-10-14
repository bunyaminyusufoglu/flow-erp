const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  // Temel Bilgiler
  name: {
    type: String,
    required: [true, 'Mağaza adı gereklidir'],
    trim: true,
    maxlength: [100, 'Mağaza adı 100 karakterden fazla olamaz']
  },
  code: {
    type: String,
    required: [true, 'Mağaza kodu gereklidir'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [10, 'Mağaza kodu 10 karakterden fazla olamaz']
  },
  
  // İletişim Bilgileri
  contact: {
    phone: {
      type: String,
      required: [true, 'Telefon numarası gereklidir'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email adresi gereklidir'],
      trim: true,
      lowercase: true
    },
    manager: {
      type: String,
      required: [true, 'Müdür adı gereklidir'],
      trim: true
    }
  },
  
  // Adres Bilgileri
  address: {
    street: {
      type: String,
      required: [true, 'Adres gereklidir'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'Şehir gereklidir'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'İl gereklidir'],
      trim: true
    },
    zipCode: {
      type: String,
      required: [true, 'Posta kodu gereklidir'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Ülke gereklidir'],
      trim: true,
      default: 'Türkiye'
    }
  },
  
  // Mağaza Bilgileri
  type: {
    type: String,
    enum: ['warehouse', 'store', 'branch'],
    default: 'store'
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  
  // Çalışma Saatleri
  workingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  
  // Kapasite Bilgileri
  capacity: {
    maxProducts: {
      type: Number,
      default: 10000
    },
    maxWeight: {
      type: Number,
      default: 1000 // kg
    }
  },
  
  // Mali Bilgiler
  budget: {
    monthlyLimit: {
      type: Number,
      default: 0
    },
    currentSpent: {
      type: Number,
      default: 0
    }
  },
  
  // Notlar
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notlar 500 karakterden fazla olamaz']
  },
  
  // Sistem Bilgileri
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
storeSchema.virtual('isOpen').get(function() {
  const now = new Date();
  const day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  const hours = this.workingHours[day];
  
  if (!hours || !hours.open || !hours.close) return false;
  
  const currentTime = now.getHours() * 100 + now.getMinutes();
  const openTime = parseInt(hours.open.replace(':', ''));
  const closeTime = parseInt(hours.close.replace(':', ''));
  
  return currentTime >= openTime && currentTime <= closeTime;
});

storeSchema.virtual('budgetRemaining').get(function() {
  return this.budget.monthlyLimit - this.budget.currentSpent;
});

// Index'ler
storeSchema.index({ code: 1 });
storeSchema.index({ name: 'text' });
storeSchema.index({ status: 1 });
storeSchema.index({ type: 1 });
storeSchema.index({ 'address.city': 1 });

// Middleware - güncelleme tarihini otomatik güncelle
storeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Store', storeSchema);