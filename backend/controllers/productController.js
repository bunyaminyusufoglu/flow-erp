const Product = require('../models/Product');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtreleme
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { name: new RegExp(req.query.search, 'i') },
        { sku: new RegExp(req.query.search, 'i') },
        { barcode: new RegExp(req.query.search, 'i') }
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

    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      count: products.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: products
    });
  } catch (error) {
    logger.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Ürünler getirilirken hata oluştu',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Sunucu hatası'
    });
  }
};
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    // Sade: görüntüleme artışı kaldırıldı

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün getirilirken hata oluştu',
      error: error.message
    });
  }
};
const createProduct = async (req, res) => {
  try {
    // Validation hatalarını kontrol et
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation hataları: ${errorMessages}`,
        errors: errors.array()
      });
    }

    // Slug field'ını temizle (eğer varsa)
    const payload = { ...req.body };
    delete payload.slug;

    const product = await Product.create(payload);

    res.status(201).json({
      success: true,
      message: 'Ürün başarıyla oluşturuldu',
      data: product
    });
  } catch (error) {
    logger.error('Create product error:', error);
    
    // Duplicate key hatası
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      // Field adına göre Türkçe mesaj
      let message = '';
      if (field === 'sku') {
        message = 'Bu SKU zaten kullanılıyor';
      } else if (field === 'barcode') {
        message = 'Bu barkod zaten kullanılıyor';
      } else if (field === 'slug') {
        message = 'Bu ürün adı zaten kullanılıyor. (Not: Veritabanında eski slug index\'i kalmış olabilir, lütfen sunucuyu yeniden başlatın)';
      } else {
        message = `${field} zaten kullanımda`;
      }
      return res.status(400).json({
        success: false,
        message: message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Ürün oluşturulurken hata oluştu',
      error: error.message
    });
  }
};
const updateProduct = async (req, res) => {
  try {
    // Validation hatalarını kontrol et
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation hataları: ${errorMessages}`,
        errors: errors.array()
      });
    }

    // Slug field'ını temizle (eğer varsa)
    const payload = { ...req.body };
    delete payload.slug;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Ürün başarıyla güncellendi',
      data: product
    });
  } catch (error) {
    logger.error('Update product error:', error);
    
    // Duplicate key hatası
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      // Field adına göre Türkçe mesaj
      let message = '';
      if (field === 'sku') {
        message = 'Bu SKU zaten kullanılıyor';
      } else if (field === 'barcode') {
        message = 'Bu barkod zaten kullanılıyor';
      } else if (field === 'slug') {
        message = 'Bu ürün adı zaten kullanılıyor. (Not: Veritabanında eski slug index\'i kalmış olabilir, lütfen sunucuyu yeniden başlatın)';
      } else {
        message = `${field} zaten kullanımda`;
      }
      return res.status(400).json({
        success: false,
        message: message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Ürün güncellenirken hata oluştu',
      error: error.message
    });
  }
};
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Ürün başarıyla silindi'
    });
  } catch (error) {
    logger.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün silinirken hata oluştu',
      error: error.message
    });
  }
};
// Stok ve düşük stok fonksiyonları kaldırıldı

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
};
