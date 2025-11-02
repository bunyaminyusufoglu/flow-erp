const { validationResult } = require('express-validator');
const Account = require('../models/Account');
const AccountTransaction = require('../models/AccountTransaction');

// @desc    Bir cari hesabın işlemlerini listele
// @route   GET /api/accounts/:accountId/transactions
// @access  Private
const getAccountTransactions = async (req, res) => {
  try {
    const { accountId } = req.params;
    const account = await Account.findById(accountId).select('_id');
    if (!account) return res.status(404).json({ success: false, message: 'Cari hesap bulunamadı' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { account: account._id };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.minAmount || req.query.maxAmount) {
      filter.amount = {};
      if (req.query.minAmount) filter.amount.$gte = Number(req.query.minAmount);
      if (req.query.maxAmount) filter.amount.$lte = Number(req.query.maxAmount);
    }
    if (req.query.search) {
      filter.description = { $regex: new RegExp(req.query.search, 'i') };
    }
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }

    const [items, total] = await Promise.all([
      AccountTransaction.find(filter)
        .populate('category', 'name')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AccountTransaction.countDocuments(filter)
    ]);

    // Özet
    const agg = await AccountTransaction.aggregate([
      { $match: filter },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);
    const income = agg.find(a => a._id === 'income')?.total || 0;
    const expense = agg.find(a => a._id === 'expense')?.total || 0;

    res.json({
      success: true,
      count: items.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: items,
      summary: { income, expense, balance: income - expense }
    });
  } catch (error) {
    console.error('Get account transactions error:', error);
    res.status(500).json({ success: false, message: 'İşlemler getirilirken hata oluştu', error: error.message });
  }
};

// @desc    İşlem ekle
// @route   POST /api/accounts/:accountId/transactions
// @access  Private
const createAccountTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation hataları', errors: errors.array() });
    }

    const { accountId } = req.params;
    const account = await Account.findById(accountId).select('_id');
    if (!account) return res.status(404).json({ success: false, message: 'Cari hesap bulunamadı' });

    // Kategori doğrulaması (varsa)
    if (req.body.category) {
      const Category = require('../models/Category');
      const exists = await Category.exists({ _id: req.body.category });
      if (!exists) {
        return res.status(400).json({ success: false, message: 'Kategori bulunamadı' });
      }
    }

    const payload = { ...req.body, account: account._id };
    const tx = await AccountTransaction.create(payload);
    const populated = await tx.populate('category', 'name');
    res.status(201).json({ success: true, message: 'İşlem eklendi', data: populated });
  } catch (error) {
    console.error('Create account transaction error:', error);
    res.status(500).json({ success: false, message: 'İşlem eklenirken hata oluştu', error: error.message });
  }
};

// @desc    İşlem sil
// @route   DELETE /api/accounts/:accountId/transactions/:transactionId
// @access  Private
const deleteAccountTransaction = async (req, res) => {
  try {
    const { accountId, transactionId } = req.params;
    const account = await Account.findById(accountId).select('_id');
    if (!account) return res.status(404).json({ success: false, message: 'Cari hesap bulunamadı' });

    const tx = await AccountTransaction.findOne({ _id: transactionId, account: account._id });
    if (!tx) return res.status(404).json({ success: false, message: 'İşlem bulunamadı' });

    await AccountTransaction.deleteOne({ _id: tx._id });
    res.json({ success: true, message: 'İşlem silindi' });
  } catch (error) {
    console.error('Delete account transaction error:', error);
    res.status(500).json({ success: false, message: 'İşlem silinirken hata oluştu', error: error.message });
  }
};

module.exports = {
  getAccountTransactions,
  createAccountTransaction,
  deleteAccountTransaction
};


