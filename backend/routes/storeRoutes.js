const express = require('express');
const {
  getStores,
  getStore,
  createStore,
  updateStore,
  deleteStore
} = require('../controllers/storeController');
const { storeValidation } = require('../middleware/storeValidation');

const router = express.Router();

// @route   GET /api/stores
// @desc    Tüm mağazaları getir
// @access  Public
router.get('/', getStores);

// @route   GET /api/stores/:id
// @desc    Tek mağaza getir
// @access  Public
router.get('/:id', getStore);

// @route   POST /api/stores
// @desc    Yeni mağaza oluştur
// @access  Private
router.post('/', storeValidation, createStore);

// @route   PUT /api/stores/:id
// @desc    Mağaza güncelle
// @access  Private
router.put('/:id', storeValidation, updateStore);

// @route   DELETE /api/stores/:id
// @desc    Mağaza sil
// @access  Private
router.delete('/:id', deleteStore);

module.exports = router;