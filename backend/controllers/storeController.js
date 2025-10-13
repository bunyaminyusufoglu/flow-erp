const Store = require('../models/Store');
const { validationResult } = require('express-validator');

// Tüm mağazalar
const getStores = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) filter.$text = { $search: req.query.search };

    const sort = { createdAt: -1 };

    const stores = await Store.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    const total = await Store.countDocuments(filter);

    res.json({
      success: true,
      count: stores.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: stores
    });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ success: false, message: 'Mağazalar getirilirken hata oluştu', error: error.message });
  }
};

// Tek mağaza
const getStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ success: false, message: 'Mağaza bulunamadı' });
    res.json({ success: true, data: store });
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ success: false, message: 'Mağaza getirilirken hata oluştu', error: error.message });
  }
};

// Oluştur
const createStore = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation hataları', errors: errors.array() });
    }
    const store = await Store.create(req.body);
    res.status(201).json({ success: true, message: 'Mağaza oluşturuldu', data: store });
  } catch (error) {
    console.error('Create store error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ success: false, message: `${field} zaten kullanımda` });
    }
    res.status(500).json({ success: false, message: 'Mağaza oluşturulurken hata oluştu', error: error.message });
  }
};

// Güncelle
const updateStore = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation hataları', errors: errors.array() });
    }
    const store = await Store.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!store) return res.status(404).json({ success: false, message: 'Mağaza bulunamadı' });
    res.json({ success: true, message: 'Mağaza güncellendi', data: store });
  } catch (error) {
    console.error('Update store error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ success: false, message: `${field} zaten kullanımda` });
    }
    res.status(500).json({ success: false, message: 'Mağaza güncellenirken hata oluştu', error: error.message });
  }
};

// Sil
const deleteStore = async (req, res) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id);
    if (!store) return res.status(404).json({ success: false, message: 'Mağaza bulunamadı' });
    res.json({ success: true, message: 'Mağaza silindi' });
  } catch (error) {
    console.error('Delete store error:', error);
    res.status(500).json({ success: false, message: 'Mağaza silinirken hata oluştu', error: error.message });
  }
};

module.exports = {
  getStores,
  getStore,
  createStore,
  updateStore,
  deleteStore
};


