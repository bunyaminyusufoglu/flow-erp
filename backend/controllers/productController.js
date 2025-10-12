const Product = require('../models/Product');
const { validationResult } = require('express-validator');

const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtreleme
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.brand) filter.brand = new RegExp(req.query.brand, 'i');
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
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
      .limit(limit)
      .populate('category', 'name slug');

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
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Ürünler getirilirken hata oluştu',
      error: error.message
    });
  }
};
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug description');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    // Görüntüleme sayısını artır
    product.views += 1;
    await product.save();

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
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
      return res.status(400).json({
        success: false,
        message: 'Validation hataları',
        errors: errors.array()
      });
    }

    const product = await Product.create(req.body);
    
    // Oluşturulan ürünü kategori bilgisi ile populate et
    await product.populate('category', 'name slug description');

    res.status(201).json({
      success: true,
      message: 'Ürün başarıyla oluşturuldu',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    
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
      return res.status(400).json({
        success: false,
        message: 'Validation hataları',
        errors: errors.array()
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'name slug description');

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
    console.error('Update product error:', error);
    
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
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün silinirken hata oluştu',
      error: error.message
    });
  }
};
const updateStock = async (req, res) => {
  try {
    const { quantity, operation } = req.body; // operation: 'add', 'subtract', 'set'

    if (!quantity || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir miktar giriniz'
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    let newQuantity = product.stockQuantity;
    
    switch (operation) {
      case 'add':
        newQuantity += quantity;
        break;
      case 'subtract':
        newQuantity -= quantity;
        if (newQuantity < 0) newQuantity = 0;
        break;
      case 'set':
        newQuantity = quantity;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Geçersiz operasyon. add, subtract veya set kullanın'
        });
    }

    product.stockQuantity = newQuantity;
    await product.save();

    res.json({
      success: true,
      message: 'Stok başarıyla güncellendi',
      data: {
        id: product._id,
        name: product.name,
        stockQuantity: product.stockQuantity,
        operation: operation,
        quantity: quantity
      }
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Stok güncellenirken hata oluştu',
      error: error.message
    });
  }
};
const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$stockQuantity', '$minStockLevel'] }
    }).populate('category', 'name slug');

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({
      success: false,
      message: 'Düşük stoklu ürünler getirilirken hata oluştu',
      error: error.message
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts
};
