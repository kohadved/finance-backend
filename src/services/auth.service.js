const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/database');
const AppError = require('../utils/AppError');

const SALT_ROUNDS = 10;

function issueToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

async function register({ name, email, password, role = 'viewer' }) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) throw new AppError('Email already registered.', 409);

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const result = db.prepare(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
  ).run(name, email, hashed, role);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = issueToken(user.id);
  return { user: sanitizeUser(user), token };
}

async function login({ email, password }) {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) throw new AppError('Invalid email or password.', 401);
  if (user.status === 'inactive') throw new AppError('Account is inactive. Contact an administrator.', 403);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError('Invalid email or password.', 401);

  const token = issueToken(user.id);
  return { user: sanitizeUser(user), token };
}

function getProfile(userId) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) throw new AppError('User not found.', 404);
  return sanitizeUser(user);
}

module.exports = { register, login, getProfile };
