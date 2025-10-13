const express = require('express');
const { getStores, getStore, createStore, updateStore, deleteStore } = require('../controllers/storeController');
const { storeValidation } = require('../middleware/validation');

const router = express.Router();

router.get('/', getStores);
router.get('/:id', getStore);
router.post('/', storeValidation, createStore);
router.put('/:id', storeValidation, updateStore);
router.delete('/:id', deleteStore);

module.exports = router;


