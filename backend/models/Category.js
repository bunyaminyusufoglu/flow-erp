const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Kategori adı gereklidir'],
    trim: true,
    unique: true,
    maxlength: [50, 'Kategori adı 50 karakterden fazla olamaz']
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ status: 1 });

module.exports = mongoose.model('Category', categorySchema);
