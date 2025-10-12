const express = require('express');
const {
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
} = require('../controllers/categoryController');
const { categoryValidation } = require('../middleware/validation');

const router = express.Router();

// GET /api/categories - Tüm kategorileri getir (sayfalama ve filtreleme ile)
router.get('/', getCategories);

// GET /api/categories/tree - Kategori ağacını getir
router.get('/tree', getCategoryTree);

// GET /api/categories/slug/:slug - Slug ile kategori getir
router.get('/slug/:slug', getCategoryBySlug);

// GET /api/categories/:id - Tek kategori getir
router.get('/:id', getCategory);

// POST /api/categories - Yeni kategori oluştur
router.post('/', categoryValidation, createCategory);

// PUT /api/categories/:id - Kategori güncelle
router.put('/:id', categoryValidation, updateCategory);

// DELETE /api/categories/:id - Kategori sil
router.delete('/:id', deleteCategory);

// PATCH /api/categories/:id/product-count - Kategori ürün sayısını güncelle
router.patch('/:id/product-count', updateCategoryProductCount);

// PATCH /api/categories/update-all-product-counts - Tüm kategorilerin ürün sayısını güncelle
router.patch('/update-all-product-counts', updateAllCategoryProductCounts);

// PATCH /api/categories/:id/toggle-status - Kategori durumunu değiştir
router.patch('/:id/toggle-status', toggleCategoryStatus);

module.exports = router;
