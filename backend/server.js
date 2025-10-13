const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Database connection
const connectDB = require('./config/database');

// Routes
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const storeRoutes = require('./routes/storeRoutes');

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

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stores', storeRoutes);

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
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API URL: http://localhost:${PORT}`);
      console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
      console.log(`📁 Categories API: http://localhost:${PORT}/api/categories`);
      console.log(`🏬 Stores API: http://localhost:${PORT}/api/stores`);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
