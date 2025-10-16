const express = require('express');
const { getStockMovements } = require('../controllers/stockMovementController');

const router = express.Router();

// @route   GET /api/stock-movements
// @desc    Stok hareketlerini listele
// @access  Private
router.get('/', getStockMovements);

module.exports = router;


