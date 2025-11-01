const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  // Temel Bilgiler
  name: {
    type: String,
    required: [true, 'Cari adı gereklidir'],
    trim: true,
    maxlength: [120, 'Cari adı 120 karakterden fazla olamaz']
  },
  code: {
    type: String,
    trim: true,
    uppercase: true,
    unique: true,
    required: [true, 'Cari kodu gereklidir'],
    maxlength: [20, 'Cari kodu 20 karakterden fazla olamaz']
  },
  type: {
    type: String,
    enum: ['customer', 'supplier', 'other'],
    default: 'customer'
  },

  // İletişim Bilgileri
  contact: {
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    taxNo: { type: String, trim: true },
    responsible: { type: String, trim: true }
  },

  // Adres
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'Türkiye' }
  },

  // Finansal
  openingBalance: {
    type: Number,
    default: 0,
    min: [0, 'Açılış bakiyesi negatif olamaz']
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notlar 500 karakteri aşamaz']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Toplam bakiye için virtual (transaction'lar üzerinden hesaplar)
accountSchema.virtual('balance').get(function() {
  // Not computed here; controller tarafında aggregate ile hesaplanacak
  return undefined;
});

// Index'ler
accountSchema.index({ code: 1 });
accountSchema.index({ name: 'text' });
accountSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('Account', accountSchema);


