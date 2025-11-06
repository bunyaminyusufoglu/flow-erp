const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

exports.validateRegister = [
  body('username').isString().trim().isLength({ min: 3 }).withMessage('Kullanıcı adı en az 3 karakter olmalı'),
  body('password').isString().isLength({ min: 6 }).withMessage('Parola en az 6 karakter olmalı')
];

exports.validateLogin = [
  body('username').isString().trim().notEmpty().withMessage('Kullanıcı adı gereklidir'),
  body('password').isString().notEmpty().withMessage('Parola gereklidir')
];

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { username, password, role, email } = req.body;
  try {
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Kullanıcı adı zaten kullanılıyor' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      passwordHash,
      role: role === 'admin' ? 'admin' : 'user'
    });

    const token = jwt.sign(
      { sub: user._id.toString(), username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      success: true,
      token,
      user: { id: user._id, username: user.username, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Kayıt sırasında hata oluştu', error: err.message });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, isActive: true });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Kullanıcı adı veya parola hatalı' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Kullanıcı adı veya parola hatalı' });
    }

    const token = jwt.sign(
      { sub: user._id.toString(), username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      token,
      user: { id: user._id, username: user.username, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Giriş sırasında hata oluştu', error: err.message });
  }
};


