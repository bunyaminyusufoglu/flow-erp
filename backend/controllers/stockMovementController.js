const StockMovement = require('../models/StockMovement');

// @desc    Stok hareketlerini listele
// @route   GET /api/stock-movements
// @access  Private
const getStockMovements = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.product) filter.product = req.query.product;
    if (req.query.store) filter.store = req.query.store;
    if (req.query.direction) filter.direction = req.query.direction;
    if (req.query.referenceType) filter.referenceType = req.query.referenceType;

    const movements = await StockMovement.find(filter)
      .populate('product', 'name sku')
      .populate('store', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await StockMovement.countDocuments(filter);

    res.json({
      success: true,
      count: movements.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: movements
    });
  } catch (error) {
    console.error('Get stock movements error:', error);
    res.status(500).json({ success: false, message: 'Stok hareketleri getirilirken hata oluştu', error: error.message });
  }
};

module.exports = { getStockMovements };


