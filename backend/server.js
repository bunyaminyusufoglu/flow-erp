const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const path = require('path');

// Database connection
const connectDB = require('./config/database');
const logger = require('./utils/logger');

// Routes
const productRoutes = require('./routes/productRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const storeRoutes = require('./routes/storeRoutes');
const stockMovementRoutes = require('./routes/stockMovementRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const accountRoutes = require('./routes/accountRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 2000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Test için CSP'yi devre dışı bırak
})); // Güvenlik için
app.use(cors()); // CORS desteği
// Morgan logging - production'da sadece hatalar
app.use(morgan(process.env.NODE_ENV === 'production' ? 'short' : 'combined')); 
app.use(express.json()); // JSON parsing
app.use(express.urlencoded({ extended: true })); // URL encoded parsing

// Static files serving
app.use(express.static(__dirname));

// Serve frontend build (if exists)
const FRONTEND_BUILD_PATH = path.join(__dirname, '../frontend/build');
app.use(express.static(FRONTEND_BUILD_PATH));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Flow ERP Backend API',
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test sayfaları
app.get('/shipment-view', (req, res) => {
  res.sendFile(__dirname + '/shipment-view.html');
});

app.get('/shipment-add', (req, res) => {
  res.sendFile(__dirname + '/shipment-add.html');
});

app.get('/product-add', (req, res) => {
  res.sendFile(__dirname + '/product-add.html');
});

// API Docs (Swagger UI via static HTML)
app.get('/api/docs', (req, res) => {
  res.sendFile(__dirname + '/api-docs.html');
});

// Serve OpenAPI spec
app.get('/api/openapi.json', (req, res) => {
  res.sendFile(__dirname + '/openapi.json');
});

// API Routes
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/stock-movements', stockMovementRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/auth', authRoutes);

// SPA fallback for client-side routing (avoid 404 on refresh)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(FRONTEND_BUILD_PATH, 'index.html'), (err) => {
    if (err) next();
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Server error:', err);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();

    // Ensure obsolete indexes are removed and required ones exist
    try {
      const Store = require('./models/Store');
      const Category = require('./models/Category');
      const Product = require('./models/Product');
      const indexes = await Store.collection.indexes();
      // Drop legacy unique index on storeId if present (causes duplicate key on null)
      const legacyIdx = indexes.find(ix => ix.name === 'storeId_1');
      if (legacyIdx) {
        await Store.collection.dropIndex('storeId_1');
        logger.log('Dropped legacy index storeId_1 on stores');
      }
      // Ensure unique index on code exists
      await Store.collection.createIndex({ code: 1 }, { unique: true });
      logger.log('Ensured unique index on stores.code');

      // Drop legacy slug index on categories if exists
      try {
        const catIndexes = await Category.collection.indexes();
        if (catIndexes.find(ix => ix.name === 'slug_1')) {
          await Category.collection.dropIndex('slug_1');
          logger.log('Dropped legacy index slug_1 on categories');
        }
      } catch (e) {
        logger.warn('Category index sync warning:', e.message);
      }

      // Drop legacy slug index on products if exists
      try {
        const prodIndexes = await Product.collection.indexes();
        if (prodIndexes.find(ix => ix.name === 'slug_1')) {
          await Product.collection.dropIndex('slug_1');
          logger.log('Dropped legacy index slug_1 on products');
        }
      } catch (e) {
        logger.warn('Product index sync warning:', e.message);
      }
    } catch (idxErr) {
      logger.warn('Index sync warning:', idxErr.message);
    }
    
    app.listen(PORT, () => {
      logger.log(`Server running on port ${PORT}`);
      logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      // API endpoint'lerini sadece development'ta göster
      if (process.env.NODE_ENV !== 'production') {
        logger.log(`API URL: http://localhost:${PORT}`);
        logger.log(`Categories API: http://localhost:${PORT}/api/categories`);
        logger.log(`Products API: http://localhost:${PORT}/api/products`);
        logger.log(`Shipments API: http://localhost:${PORT}/api/shipments`);
        logger.log(`Stores API: http://localhost:${PORT}/api/stores`);
        logger.log(`Stock Movements API: http://localhost:${PORT}/api/stock-movements`);
        logger.log(`Accounts API: http://localhost:${PORT}/api/accounts`);
        logger.log(`Auth API: http://localhost:${PORT}/api/auth`);
      }
    });
  } catch (error) {
    logger.error('Server startup error:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
