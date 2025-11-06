const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = require('../config/database');
const User = require('../models/User');

(async () => {
  try {
    await connectDB();

    // Tüm kullanıcıları sil
    const del = await User.deleteMany({});
    console.log(`Silinen kullanıcı sayısı: ${del.deletedCount}`);

    // Varsayılan admin oluştur
    const passwordHash = await bcrypt.hash('12345678', 10);
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      passwordHash,
      role: 'admin',
      isActive: true
    });

    console.log('Oluşturulan kullanıcı:', {
      username: admin.username,
      role: admin.role
    });
  } catch (err) {
    console.error('Hata:', err.message || err);
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.connection.close();
      console.log('MongoDB bağlantısı kapatıldı.');
    } catch {}
    process.exit();
  }
})();


