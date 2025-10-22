const Shipment = require('../models/Shipment');
const Product = require('../models/Product');
const Store = require('../models/Store');
const StockMovement = require('../models/StockMovement');
const { validationResult } = require('express-validator');

// @desc    Tüm sevkiyatları getir
// @route   GET /api/shipments
// @access  Public
const getShipments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtreleme
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.fromStore) filter.fromStore = req.query.fromStore;
    if (req.query.toStore) filter.toStore = req.query.toStore;
    if (req.query.search) {
      filter.$or = [
        { shipmentNumber: new RegExp(req.query.search, 'i') },
        { orderNumber: new RegExp(req.query.search, 'i') }
      ];
    }

    // Sıralama
    const sort = {};
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
      sort[sortField] = sortOrder;
    } else {
      sort.createdAt = -1; // Varsayılan: en yeni önce
    }

    const shipments = await Shipment.find(filter)
      .populate('items.product', 'name sku')
      .populate('fromStore', 'name code')
      .populate('toStore', 'name code')
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Shipment.countDocuments(filter);

    res.json({
      success: true,
      count: shipments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: shipments
    });
  } catch (error) {
    console.error('Get shipments error:', error);
    res.status(500).json({
      success: false,
      message: 'Sevkiyatlar getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Tek sevkiyat getir
// @route   GET /api/shipments/:id
// @access  Public
const getShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('items.product', 'name sku description')
      .populate('fromStore', 'name code address')
      .populate('toStore', 'name code address')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Sevkiyat bulunamadı'
      });
    }

    res.json({
      success: true,
      data: shipment
    });
  } catch (error) {
    console.error('Get shipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Sevkiyat getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Yeni sevkiyat oluştur
// @route   POST /api/shipments
// @access  Private
const createShipment = async (req, res) => {
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

    // Mağazaları kontrol et
    const fromStore = await Store.findById(req.body.fromStore);
    const toStore = await Store.findById(req.body.toStore);
    
    if (!fromStore) {
      return res.status(400).json({ success: false, message: 'Gönderen mağaza bulunamadı' });
    }
    if (!toStore) {
      return res.status(400).json({ success: false, message: 'Alıcı mağaza bulunamadı' });
    }
    if (fromStore._id.toString() === toStore._id.toString()) {
      return res.status(400).json({ success: false, message: 'Gönderen ve alıcı mağaza aynı olamaz' });
    }

    // Ürünlerin varlığını kontrol et (stok kontrolü yapma, sadece mevcudiyet)
    for (const item of req.body.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ success: false, message: `Ürün bulunamadı: ${item.product}` });
      }
    }

    // Sevkiyat numarası oluştur (opsiyonel otomatik)
    let shipmentNumber = req.body.shipmentNumber;
    if (!shipmentNumber) {
      const lastShipment = await Shipment.findOne({ shipmentNumber: /SH\d+/ }).sort({ shipmentNumber: -1 });
      if (lastShipment?.shipmentNumber) {
        const lastNumber = lastShipment.shipmentNumber.replace('SH', '');
        const nextNumber = parseInt(lastNumber) + 1;
        shipmentNumber = `SH${nextNumber.toString().padStart(8, '0')}`;
      } else {
        shipmentNumber = 'SH00000001';
      }
    }

    // Toplamları hesapla (gönderilmezse)
    const subtotal = req.body.items.reduce((sum, it) => sum + Number(it.totalPrice || 0), 0);
    const shippingCost = Number(req.body.shippingCost || 0);
    const taxAmount = Number(req.body.taxAmount || 0);
    const totalAmount = subtotal + shippingCost + taxAmount;

    const shipmentData = {
      ...req.body,
      shipmentNumber,
      subtotal,
      shippingCost,
      taxAmount,
      totalAmount,
      createdBy: req.user?.id || null
    };

    const shipment = await Shipment.create(shipmentData);

    // Stok hareketleri kaydet (ürün miktarlarını mağaza bazlı deftere işle)
    for (const item of shipment.items) {
      await StockMovement.create({
        product: item.product,
        store: fromStore._id,
        direction: 'out',
        quantity: item.quantity,
        referenceType: 'shipment',
        referenceId: shipment._id,
        notes: `Sevkiyat ${shipment.shipmentNumber} ile çıkış`
      });
      await StockMovement.create({
        product: item.product,
        store: toStore._id,
        direction: 'in',
        quantity: item.quantity,
        referenceType: 'shipment',
        referenceId: shipment._id,
        notes: `Sevkiyat ${shipment.shipmentNumber} ile giriş`
      });
    }

    // Populate
    await shipment.populate('items.product', 'name sku');
    await shipment.populate('fromStore', 'name code');
    await shipment.populate('toStore', 'name code');
    await shipment.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Sevkiyat başarıyla oluşturuldu',
      data: shipment
    });
  } catch (error) {
    console.error('Create shipment error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ success: false, message: `${field} zaten kullanımda` });
    }
    res.status(500).json({ success: false, message: 'Sevkiyat oluşturulurken hata oluştu', error: error.message });
  }
};

// @desc    Sevkiyat güncelle
// @route   PUT /api/shipments/:id
// @access  Private
const updateShipment = async (req, res) => {
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

    const shipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user?.id || 'system' },
      { new: true, runValidators: true }
    )
      .populate('items.product', 'name sku sellingPrice purchasePrice')
      .populate('fromStore', 'name code')
      .populate('toStore', 'name code')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Sevkiyat bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Sevkiyat başarıyla güncellendi',
      data: shipment
    });
  } catch (error) {
    console.error('Update shipment error:', error);
    
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
      message: 'Sevkiyat güncellenirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Sevkiyat sil
// @route   DELETE /api/shipments/:id
// @access  Private
const deleteShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Sevkiyat bulunamadı'
      });
    }

    // Stokları geri yükle
    for (const item of shipment.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stockQuantity: item.quantity } }
      );
    }

    await Shipment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Sevkiyat başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete shipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Sevkiyat silinirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Sevkiyat durumu güncelle
// @route   PATCH /api/shipments/:id/status
// @access  Private
const updateShipmentStatus = async (req, res) => {
  try {
    const { status, location, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Durum gereklidir'
      });
    }

    const validStatuses = ['pending', 'preparing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz durum'
      });
    }

    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Sevkiyat bulunamadı'
      });
    }

    // Durum geçmişine ekle
    shipment.trackingHistory.push({
      status,
      location: location || '',
      notes: notes || '',
      timestamp: new Date()
    });

    // Durumu güncelle
    shipment.status = status;
    
    // Teslim tarihini güncelle
    if (status === 'delivered') {
      shipment.deliveryDate = new Date();
    } else if (status === 'shipped') {
      shipment.shipDate = new Date();
    }

    await shipment.save();

    res.json({
      success: true,
      message: 'Sevkiyat durumu başarıyla güncellendi',
      data: shipment
    });
  } catch (error) {
    console.error('Update shipment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Sevkiyat durumu güncellenirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Geciken sevkiyatları getir
// @route   GET /api/shipments/overdue
// @access  Private
const getOverdueShipments = async (req, res) => {
  try {
    const overdueShipments = await Shipment.find({
      status: { $nin: ['delivered', 'cancelled'] },
      expectedDeliveryDate: { $lt: new Date() }
    })
      .populate('items.product', 'name sku sellingPrice purchasePrice')
      .populate('fromStore', 'name code')
      .populate('toStore', 'name code')
      .populate('createdBy', 'name email')
      .sort({ expectedDeliveryDate: 1 });

    res.json({
      success: true,
      count: overdueShipments.length,
      data: overdueShipments
    });
  } catch (error) {
    console.error('Get overdue shipments error:', error);
    res.status(500).json({
      success: false,
      message: 'Geciken sevkiyatlar getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Sevkiyat istatistikleri
// @route   GET /api/shipments/stats
// @access  Private
const getShipmentStats = async (req, res) => {
  try {
    const stats = await Shipment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalShipments = await Shipment.countDocuments();
    const totalRevenue = await Shipment.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      success: true,
      data: {
        statusBreakdown: stats,
        totalShipments,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get shipment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Sevkiyat istatistikleri getirilirken hata oluştu',
      error: error.message
    });
  }
};

module.exports = {
  getShipments,
  getShipment,
  createShipment,
  updateShipment,
  deleteShipment,
  updateShipmentStatus,
  getOverdueShipments,
  getShipmentStats
};
