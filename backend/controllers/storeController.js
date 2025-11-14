const Store = require('../models/Store');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// @desc    Tüm mağazaları getir
// @route   GET /api/stores
// @access  Public
const getStores = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtreleme
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.search) {
      filter.$or = [
        { name: new RegExp(req.query.search, 'i') },
        { code: new RegExp(req.query.search, 'i') }
      ];
    }

    // Sıralama
    const sort = {};
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
      sort[sortField] = sortOrder;
    } else {
      sort.createdAt = -1;
    }

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
    logger.error('Get stores error:', error);
    res.status(500).json({
      success: false,
      message: 'Mağazalar getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Tek mağaza getir
// @route   GET /api/stores/:id
// @access  Public
const getStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Mağaza bulunamadı'
      });
    }

    res.json({
      success: true,
      data: store
    });
  } catch (error) {
    logger.error('Get store error:', error);
    res.status(500).json({
      success: false,
      message: 'Mağaza getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Yeni mağaza oluştur
// @route   POST /api/stores
// @access  Private
const createStore = async (req, res) => {
  try {
    // Validation hatalarını kontrol et
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation hataları',
        errors: errors.array()
      });
    }

    const store = await Store.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Mağaza başarıyla oluşturuldu',
      data: store
    });
  } catch (error) {
    logger.error('Create store error:', error);
    
    // Duplicate key hatası
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} zaten kullanımda`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Mağaza oluşturulurken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Mağaza güncelle
// @route   PUT /api/stores/:id
// @access  Private
const updateStore = async (req, res) => {
  try {
    // Validation hatalarını kontrol et
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation hataları',
        errors: errors.array()
      });
    }

    const store = await Store.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Mağaza bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Mağaza başarıyla güncellendi',
      data: store
    });
  } catch (error) {
    logger.error('Update store error:', error);
    
    // Duplicate key hatası
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} zaten kullanımda`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Mağaza güncellenirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Mağaza sil
// @route   DELETE /api/stores/:id
// @access  Private
const deleteStore = async (req, res) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Mağaza bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Mağaza başarıyla silindi'
    });
  } catch (error) {
    logger.error('Delete store error:', error);
    res.status(500).json({
      success: false,
      message: 'Mağaza silinirken hata oluştu',
      error: error.message
    });
  }
};

module.exports = {
  getStores,
  getStore,
  createStore,
  updateStore,
  deleteStore
};