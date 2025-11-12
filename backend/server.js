const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Database connection
const connectDB = require('./config/database');

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
app.use(morgan('combined')); // Logging
app.use(express.json()); // JSON parsing
app.use(express.urlencoded({ extended: true })); // URL encoded parsing

// Static files serving
app.use(express.static(__dirname));

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
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
      const indexes = await Store.collection.indexes();
      // Drop legacy unique index on storeId if present (causes duplicate key on null)
      const legacyIdx = indexes.find(ix => ix.name === 'storeId_1');
      if (legacyIdx) {
        await Store.collection.dropIndex('storeId_1');
        console.log('🧹 Dropped legacy index storeId_1 on stores');
      }
      // Ensure unique index on code exists
      await Store.collection.createIndex({ code: 1 }, { unique: true });
      console.log('✅ Ensured unique index on stores.code');
    } catch (idxErr) {
      console.warn('Index sync warning:', idxErr.message);
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API URL: http://localhost:${PORT}`);
      console.log(`📦 Categories API: http://localhost:${PORT}/api/categories`);
      console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
      console.log(`📦 Shipments API: http://localhost:${PORT}/api/shipments`);
      console.log(`🏪 Stores API: http://localhost:${PORT}/api/stores`);
      console.log(`📊 Stock Movements API: http://localhost:${PORT}/api/stock-movements`);
      console.log(`📒 Accounts API: http://localhost:${PORT}/api/accounts`);
      console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
      console.log(`🧪 Shipment View: http://localhost:${PORT}/shipment-view`);
      console.log(`📝 Shipment Add: http://localhost:${PORT}/shipment-add`);
      console.log(`📦 Product Add: http://localhost:${PORT}/product-add`);
      console.log(`📘 API Docs: http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
