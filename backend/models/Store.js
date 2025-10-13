const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Mağaza adı gereklidir'],
    trim: true,
    maxlength: [100, 'Mağaza adı 100 karakterden fazla olamaz']
  },
  storeId: {
    type: String,
    required: [true, 'Mağaza ID gereklidir'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9_-]{3,32}$/, 'Mağaza ID 3-32 karakter, A-Z 0-9 _ - içerebilir']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

storeSchema.index({ name: 'text', storeId: 'text' });
storeSchema.index({ storeId: 1 }, { unique: true });

module.exports = mongoose.model('Store', storeSchema);


