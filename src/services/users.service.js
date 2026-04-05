const bcrypt  = require('bcryptjs');
const db       = require('../config/database');
const AppError = require('../utils/AppError');

const SALT_ROUNDS = 10;

function sanitize(user) {
  const { password, ...safe } = user;
  return safe;
}

function listUsers({ page = 1, limit = 20, role, status } = {}) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params     = [];

  if (role)   { conditions.push('role = ?');   params.push(role); }
  if (status) { conditions.push('status = ?'); params.push(status); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = db.prepare(`SELECT COUNT(*) as n FROM users ${where}`).get(...params).n;
  const rows  = db.prepare(
    `SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset);

  return {
    data: rows.map(sanitize),
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  };
}

function getUserById(id) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) throw new AppError('User not found.', 404);
  return sanitize(user);
}

async function createUser({ name, email, password, role = 'viewer' }) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) throw new AppError('Email already registered.', 409);

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const result = db.prepare(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
  ).run(name, email, hashed, role);

  return sanitize(db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid));
}

function updateUser(id, { name, role, status }) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) throw new AppError('User not found.', 404);

  db.prepare(`
    UPDATE users
    SET name       = COALESCE(?, name),
        role       = COALESCE(?, role),
        status     = COALESCE(?, status),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(name ?? null, role ?? null, status ?? null, id);

  return sanitize(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
}

function deactivateUser(id, requestingUserId) {
  if (id === requestingUserId) {
    throw new AppError('You cannot deactivate your own account.', 400);
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) throw new AppError('User not found.', 404);

  db.prepare(`UPDATE users SET status = 'inactive', updated_at = datetime('now') WHERE id = ?`).run(id);
  return { message: 'User deactivated.' };
}

module.exports = { listUsers, getUserById, createUser, updateUser, deactivateUser };
