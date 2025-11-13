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
    required: false,
    maxlength: [20, 'Cari kodu 20 karakterden fazla olamaz']
  },
  type: {
    type: String,
    enum: ['customer', 'supplier', 'other'],
    default: 'customer'
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

// Otomatik benzersiz cari kodu üret (mağazadaki mantıkla benzer)
// 6 haneli rakam, 10 denemeye kadar benzersizlik kontrolü yapılır
accountSchema.pre('save', async function(next) {
  if (this.code) return next();
  try {
    for (let i = 0; i < 10; i++) {
      const candidate = String(Math.floor(100000 + Math.random() * 900000));
      const existing = await this.constructor.findOne({ code: candidate }).lean();
      if (!existing) {
        this.code = candidate;
        break;
      }
    }
    if (!this.code) {
      this.code = String(Math.floor(100000 + Math.random() * 900000));
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Account', accountSchema);


