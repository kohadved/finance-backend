const db = require('../config/database');

/**
 * Returns high-level totals: income, expenses, and net balance.
 * Optionally scoped to a date range.
 */
function getSummary({ date_from, date_to } = {}) {
  const conditions = ['deleted_at IS NULL'];
  const params     = [];

  if (date_from) { conditions.push('date >= ?'); params.push(date_from); }
  if (date_to)   { conditions.push('date <= ?'); params.push(date_to); }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const row = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses,
      COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE -amount END), 0) AS net_balance,
      COUNT(*) AS record_count
    FROM financial_records
    ${where}
  `).get(...params);

  return row;
}

/**
 * Returns income and expense totals grouped by category.
 */
function getByCategory({ date_from, date_to, type } = {}) {
  const conditions = ['deleted_at IS NULL'];
  const params     = [];

  if (date_from) { conditions.push('date >= ?'); params.push(date_from); }
  if (date_to)   { conditions.push('date <= ?'); params.push(date_to); }
  if (type)      { conditions.push('type = ?'); params.push(type); }

  const where = `WHERE ${conditions.join(' AND ')}`;

  return db.prepare(`
    SELECT
      category,
      type,
      COUNT(*)        AS count,
      SUM(amount)     AS total,
      AVG(amount)     AS average,
      MIN(amount)     AS min,
      MAX(amount)     AS max
    FROM financial_records
    ${where}
    GROUP BY category, type
    ORDER BY total DESC
  `).all(...params);
}

/**
 * Returns monthly aggregates for the given year (defaults to current year).
 */
function getMonthlyTrends({ year } = {}) {
  const targetYear = year || new Date().getFullYear();

  return db.prepare(`
    SELECT
      strftime('%Y-%m', date)   AS month,
      COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses,
      COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE -amount END), 0) AS net
    FROM financial_records
    WHERE deleted_at IS NULL
      AND strftime('%Y', date) = ?
    GROUP BY month
    ORDER BY month ASC
  `).all(String(targetYear));
}

/**
 * Returns the N most recent non-deleted records.
 */
function getRecentActivity({ limit = 10 } = {}) {
  return db.prepare(`
    SELECT r.id, r.amount, r.type, r.category, r.date, r.notes,
           u.name AS created_by_name
    FROM financial_records r
    JOIN users u ON u.id = r.created_by
    WHERE r.deleted_at IS NULL
    ORDER BY r.date DESC, r.created_at DESC
    LIMIT ?
  `).all(limit);
}

module.exports = { getSummary, getByCategory, getMonthlyTrends, getRecentActivity };
