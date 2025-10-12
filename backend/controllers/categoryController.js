const Category = require('../models/Category');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// Tüm kategorileri getir
const getCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtreleme
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.parent) filter.parent = req.query.parent;
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
      sort.sortOrder = 1;
      sort.name = 1;
    }

    const categories = await Category.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('parent', 'name slug');

    const total = await Category.countDocuments(filter);

    res.json({
      success: true,
      count: categories.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Kategoriler getirilirken hata oluştu',
      error: error.message
    });
  }
};

// Kategori ağacını getir
const getCategoryTree = async (req, res) => {
  try {
    const tree = await Category.getCategoryTree();
    
    res.json({
      success: true,
      count: tree.length,
      data: tree
    });
  } catch (error) {
    console.error('Get category tree error:', error);
    res.status(500).json({
      success: false,
      message: 'Kategori ağacı getirilirken hata oluştu',
      error: error.message
    });
  }
};

// Tek kategori getir
const getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent', 'name slug')
      .populate('children', 'name slug status');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Kategori getirilirken hata oluştu',
      error: error.message
    });
  }
};

// Slug ile kategori getir
const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug })
      .populate('parent', 'name slug')
      .populate('children', 'name slug status');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Kategori getirilirken hata oluştu',
      error: error.message
    });
  }
};

// Kategori oluştur
const createCategory = async (req, res) => {
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

    // Parent kategori kontrolü
    if (req.body.parent) {
      const parentCategory = await Category.findById(req.body.parent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Ana kategori bulunamadı'
        });
      }
    }

    const category = await Category.create(req.body);

    // Oluşturulan kategoriyi populate ile getir
    const populatedCategory = await Category.findById(category._id)
      .populate('parent', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Kategori başarıyla oluşturuldu',
      data: populatedCategory
    });
  } catch (error) {
    console.error('Create category error:', error);
    
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
      message: 'Kategori oluşturulurken hata oluştu',
      error: error.message
    });
  }
};

// Kategori güncelle
const updateCategory = async (req, res) => {
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

    // Parent kategori kontrolü (kendi kendini parent yapmaya çalışıyorsa)
    if (req.body.parent && req.body.parent === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Kategori kendi alt kategorisi olamaz'
      });
    }

    // Parent kategori kontrolü
    if (req.body.parent) {
      const parentCategory = await Category.findById(req.body.parent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Ana kategori bulunamadı'
        });
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('parent', 'name slug');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Kategori başarıyla güncellendi',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    
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
      message: 'Kategori güncellenirken hata oluştu',
      error: error.message
    });
  }
};

// Kategori sil
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
    }

    // Alt kategorileri kontrol et
    const childrenCount = await Category.countDocuments({ parent: req.params.id });
    if (childrenCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu kategorinin alt kategorileri var. Önce alt kategorileri siliniz.'
      });
    }

    // Bu kategoriye ait ürünleri kontrol et
    const productsCount = await Product.countDocuments({ category: req.params.id });
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu kategoriye ait ürünler var. Önce ürünleri başka kategoriye taşıyınız veya siliniz.'
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Kategori başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Kategori silinirken hata oluştu',
      error: error.message
    });
  }
};

// Kategori ürün sayısını güncelle
const updateCategoryProductCount = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
    }

    const count = await category.getProductCount();

    res.json({
      success: true,
      message: 'Kategori ürün sayısı güncellendi',
      data: {
        categoryId: category._id,
        categoryName: category.name,
        productCount: count
      }
    });
  } catch (error) {
    console.error('Update category product count error:', error);
    res.status(500).json({
      success: false,
      message: 'Kategori ürün sayısı güncellenirken hata oluştu',
      error: error.message
    });
  }
};

// Tüm kategorilerin ürün sayısını güncelle
const updateAllCategoryProductCounts = async (req, res) => {
  try {
    const categories = await Category.find();
    const results = [];

    for (const category of categories) {
      const count = await category.getProductCount();
      results.push({
        categoryId: category._id,
        categoryName: category.name,
        productCount: count
      });
    }

    res.json({
      success: true,
      message: 'Tüm kategorilerin ürün sayısı güncellendi',
      data: results
    });
  } catch (error) {
    console.error('Update all category product counts error:', error);
    res.status(500).json({
      success: false,
      message: 'Kategori ürün sayıları güncellenirken hata oluştu',
      error: error.message
    });
  }
};

// Kategori durumunu değiştir
const toggleCategoryStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
    }

    category.status = category.status === 'active' ? 'inactive' : 'active';
    await category.save();

    res.json({
      success: true,
      message: `Kategori durumu ${category.status === 'active' ? 'aktif' : 'pasif'} olarak değiştirildi`,
      data: category
    });
  } catch (error) {
    console.error('Toggle category status error:', error);
    res.status(500).json({
      success: false,
      message: 'Kategori durumu değiştirilirken hata oluştu',
      error: error.message
    });
  }
};

module.exports = {
  getCategories,
  getCategoryTree,
  getCategory,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryProductCount,
  updateAllCategoryProductCounts,
  toggleCategoryStatus
};
