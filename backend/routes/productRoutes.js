const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts
} = require('../controllers/productController');
const { productValidation, stockUpdateValidation } = require('../middleware/validation');

const router = express.Router();

router.get('/', getProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/:id', getProduct);
router.post('/', productValidation, createProduct);
router.put('/:id', productValidation, updateProduct);
router.patch('/:id/stock', stockUpdateValidation, updateStock);
router.delete('/:id', deleteProduct);

module.exports = router;
