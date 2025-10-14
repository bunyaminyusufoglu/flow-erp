const express = require('express');
const {
  getShipments,
  getShipment,
  createShipment,
  updateShipment,
  deleteShipment,
  updateShipmentStatus,
  getOverdueShipments,
  getShipmentStats
} = require('../controllers/shipmentController');
const { shipmentValidation, shipmentStatusValidation } = require('../middleware/shipmentValidation');

const router = express.Router();

// @route   GET /api/shipments
// @desc    Tüm sevkiyatları getir
// @access  Public
router.get('/', getShipments);

// @route   GET /api/shipments/stats
// @desc    Sevkiyat istatistikleri
// @access  Private
router.get('/stats', getShipmentStats);

// @route   GET /api/shipments/overdue
// @desc    Geciken sevkiyatları getir
// @access  Private
router.get('/overdue', getOverdueShipments);

// @route   GET /api/shipments/:id
// @desc    Tek sevkiyat getir
// @access  Public
router.get('/:id', getShipment);

// @route   POST /api/shipments
// @desc    Yeni sevkiyat oluştur
// @access  Private
router.post('/', shipmentValidation, createShipment);

// @route   PUT /api/shipments/:id
// @desc    Sevkiyat güncelle
// @access  Private
router.put('/:id', shipmentValidation, updateShipment);

// @route   PATCH /api/shipments/:id/status
// @desc    Sevkiyat durumu güncelle
// @access  Private
router.patch('/:id/status', shipmentStatusValidation, updateShipmentStatus);

// @route   DELETE /api/shipments/:id
// @desc    Sevkiyat sil
// @access  Private
router.delete('/:id', deleteShipment);

module.exports = router;
