const { validationResult } = require('express-validator');
const Account = require('../models/Account');
const AccountTransaction = require('../models/AccountTransaction');

// @desc    Cari hesapları listele
// @route   GET /api/accounts
// @access  Public
const getAccounts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { name: new RegExp(req.query.search, 'i') },
        { code: new RegExp(req.query.search, 'i') }
      ];
    }

    const sort = {};
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      sort[sortField] = sortOrder;
    } else {
      sort.createdAt = -1;
    }

    const [accounts, total] = await Promise.all([
      Account.find(filter).sort(sort).skip(skip).limit(limit),
      Account.countDocuments(filter)
    ]);

    res.json({
      success: true,
      count: accounts.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: accounts
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ success: false, message: 'Cari hesaplar getirilirken hata oluştu', error: error.message });
  }
};

// @desc    Tek cari hesabı getir + özet
// @route   GET /api/accounts/:id
// @access  Public
const getAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Cari hesap bulunamadı' });
    }

    // Özet (gelir, gider, bakiye)
    const agg = await AccountTransaction.aggregate([
      { $match: { account: account._id } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);
    const income = agg.find(a => a._id === 'income')?.total || 0;
    const expense = agg.find(a => a._id === 'expense')?.total || 0;
    const balance = account.openingBalance + income - expense;

    res.json({ success: true, data: { account, summary: { income, expense, balance } } });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ success: false, message: 'Cari hesap getirilirken hata oluştu', error: error.message });
  }
};

// @desc    Yeni cari hesap oluştur
// @route   POST /api/accounts
// @access  Private
const createAccount = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation hataları', errors: errors.array() });
    }

    const account = await Account.create(req.body);
    res.status(201).json({ success: true, message: 'Cari hesap oluşturuldu', data: account });
  } catch (error) {
    console.error('Create account error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ success: false, message: `${field} zaten kullanımda` });
    }
    res.status(500).json({ success: false, message: 'Cari hesap oluşturulurken hata oluştu', error: error.message });
  }
};

// @desc    Cari hesap güncelle
// @route   PUT /api/accounts/:id
// @access  Private
const updateAccount = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation hataları', errors: errors.array() });
    }

    const account = await Account.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({ success: false, message: 'Cari hesap bulunamadı' });
    }

    res.json({ success: true, message: 'Cari hesap güncellendi', data: account });
  } catch (error) {
    console.error('Update account error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ success: false, message: `${field} zaten kullanımda` });
    }
    res.status(500).json({ success: false, message: 'Cari hesap güncellenirken hata oluştu', error: error.message });
  }
};

// @desc    Cari hesap sil (işlem varsa engelle)
// @route   DELETE /api/accounts/:id
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Cari hesap bulunamadı' });
    }

    const txCount = await AccountTransaction.countDocuments({ account: account._id });
    if (txCount > 0) {
      return res.status(400).json({ success: false, message: 'Hesabın işlemleri mevcut. Önce işlemleri silin.' });
    }

    await Account.findByIdAndDelete(account._id);
    res.json({ success: true, message: 'Cari hesap silindi' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, message: 'Cari hesap silinirken hata oluştu', error: error.message });
  }
};

module.exports = {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount
};


