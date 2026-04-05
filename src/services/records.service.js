const db       = require('../config/database');
const AppError = require('../utils/AppError');

function buildFilters({ type, category, date_from, date_to, search }) {
  const conditions = ['deleted_at IS NULL'];
  const params     = [];

  if (type)      { conditions.push('type = ?');     params.push(type); }
  if (category)  { conditions.push('category = LOWER(?)'); params.push(category.toLowerCase()); }
  if (date_from) { conditions.push('date >= ?');    params.push(date_from); }
  if (date_to)   { conditions.push('date <= ?');    params.push(date_to); }
  if (search)    { conditions.push('(notes LIKE ? OR category LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }

  return { where: `WHERE ${conditions.join(' AND ')}`, params };
}

function listRecords({ page = 1, limit = 20, type, category, date_from, date_to, search, sort = 'date', order = 'desc' } = {}) {
  const offset = (page - 1) * limit;
  const { where, params } = buildFilters({ type, category, date_from, date_to, search });

  const allowedSort  = ['date', 'amount', 'created_at', 'category', 'type'];
  const allowedOrder = ['asc', 'desc'];
  const sortCol  = allowedSort.includes(sort)   ? sort  : 'date';
  const sortDir  = allowedOrder.includes(order) ? order : 'desc';

  const total = db.prepare(
    `SELECT COUNT(*) as n FROM financial_records ${where}`
  ).get(...params).n;

  const rows = db.prepare(`
    SELECT r.*, u.name AS created_by_name
    FROM financial_records r
    JOIN users u ON u.id = r.created_by
    ${where}
    ORDER BY ${sortCol} ${sortDir}
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  return {
    data: rows,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  };
}

function getRecordById(id) {
  const record = db.prepare(`
    SELECT r.*, u.name AS created_by_name
    FROM financial_records r
    JOIN users u ON u.id = r.created_by
    WHERE r.id = ? AND r.deleted_at IS NULL
  `).get(id);

  if (!record) throw new AppError('Record not found.', 404);
  return record;
}

function createRecord({ amount, type, category, date, notes }, userId) {
  const result = db.prepare(`
    INSERT INTO financial_records (amount, type, category, date, notes, created_by)
    VALUES (?, ?, LOWER(?), ?, ?, ?)
  `).run(amount, type, category.toLowerCase(), date, notes ?? null, userId);

  return getRecordById(result.lastInsertRowid);
}

function updateRecord(id, { amount, type, category, date, notes }) {
  const record = db.prepare('SELECT id FROM financial_records WHERE id = ? AND deleted_at IS NULL').get(id);
  if (!record) throw new AppError('Record not found.', 404);

  db.prepare(`
    UPDATE financial_records
    SET amount     = COALESCE(?, amount),
        type       = COALESCE(?, type),
        category   = COALESCE(LOWER(?), category),
        date       = COALESCE(?, date),
        notes      = COALESCE(?, notes),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    amount   ?? null,
    type     ?? null,
    category ? category.toLowerCase() : null,
    date     ?? null,
    notes    ?? null,
    id
  );

  return getRecordById(id);
}

function deleteRecord(id) {
  const record = db.prepare('SELECT id FROM financial_records WHERE id = ? AND deleted_at IS NULL').get(id);
  if (!record) throw new AppError('Record not found.', 404);

  // Soft delete — preserves history and satisfies referential integrity
  db.prepare(`UPDATE financial_records SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run(id);
  return { message: 'Record deleted.' };
}

module.exports = { listRecords, getRecordById, createRecord, updateRecord, deleteRecord };
