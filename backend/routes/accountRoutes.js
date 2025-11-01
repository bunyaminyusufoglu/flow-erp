const express = require('express');
const {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount
} = require('../controllers/accountController');
const {
  getAccountTransactions,
  createAccountTransaction,
  deleteAccountTransaction
} = require('../controllers/accountTransactionController');
const { accountValidation, accountTransactionValidation } = require('../middleware/accountValidation');

const router = express.Router();

// Cari hesaplar
router.get('/', getAccounts);
router.get('/:id', getAccount);
router.post('/', accountValidation, createAccount);
router.put('/:id', accountValidation, updateAccount);
router.delete('/:id', deleteAccount);

// İşlemler (gelir/gider)
router.get('/:accountId/transactions', getAccountTransactions);
router.post('/:accountId/transactions', accountTransactionValidation, createAccountTransaction);
router.delete('/:accountId/transactions/:transactionId', deleteAccountTransaction);

module.exports = router;


