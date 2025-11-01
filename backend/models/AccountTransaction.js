const mongoose = require('mongoose');

const accountTransactionSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Tutar 0.01 TL ve üzeri olmalıdır']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [300, 'Açıklama 300 karakteri aşamaz']
  },
  category: {
    type: String,
    trim: true,
    maxlength: [60, 'Kategori adı 60 karakteri aşamaz']
  }
}, {
  timestamps: true
});

accountTransactionSchema.index({ account: 1, date: -1 });
accountTransactionSchema.index({ type: 1 });

module.exports = mongoose.model('AccountTransaction', accountTransactionSchema);


