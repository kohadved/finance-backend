const { Router } = require('express');
const { query }  = require('express-validator');
const authenticate    = require('../middleware/authenticate');
const { authorizeMin } = require('../middleware/authorize');
const validate        = require('../middleware/validate');
const dashboardService = require('../services/dashboard.service');

const router = Router();

router.use(authenticate);

const dateRangeRules = [
  query('date_from').optional().isDate().withMessage('date_from must be YYYY-MM-DD'),
  query('date_to').optional().isDate().withMessage('date_to must be YYYY-MM-DD'),
];

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Aggregated analytics for the finance dashboard
 */

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     summary: Total income, total expenses, and net balance (viewer+)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: date_from, schema: { type: string, format: date } }
 *       - { in: query, name: date_to,   schema: { type: string, format: date } }
 *     responses:
 *       200:
 *         description: Summary totals
 *         content:
 *           application/json:
 *             example:
 *               total_income: 46700
 *               total_expenses: 5550
 *               net_balance: 41150
 *               record_count: 15
 */
router.get(
  '/summary',
  authorizeMin('viewer'),
  dateRangeRules,
  validate,
  (req, res, next) => {
    try {
      res.json(dashboardService.getSummary(req.query));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /dashboard/recent:
 *   get:
 *     summary: Most recent financial activity (viewer+)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 50 }
 *     responses:
 *       200: { description: Recent records }
 */
router.get(
  '/recent',
  authorizeMin('viewer'),
  [query('limit').optional().isInt({ min: 1, max: 50 }).toInt()],
  validate,
  (req, res, next) => {
    try {
      res.json(dashboardService.getRecentActivity(req.query));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /dashboard/by-category:
 *   get:
 *     summary: Income and expense totals grouped by category (analyst+)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: date_from, schema: { type: string, format: date } }
 *       - { in: query, name: date_to,   schema: { type: string, format: date } }
 *       - { in: query, name: type,      schema: { type: string, enum: [income, expense] } }
 *     responses:
 *       200: { description: Category breakdown }
 */
router.get(
  '/by-category',
  authorizeMin('analyst'),
  [
    ...dateRangeRules,
    query('type').optional().isIn(['income', 'expense']),
  ],
  validate,
  (req, res, next) => {
    try {
      res.json(dashboardService.getByCategory(req.query));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /dashboard/trends:
 *   get:
 *     summary: Monthly income vs expense trends for a given year (analyst+)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer, example: 2026 }
 *     responses:
 *       200: { description: Monthly trend data }
 */
router.get(
  '/trends',
  authorizeMin('analyst'),
  [query('year').optional().isInt({ min: 2000, max: 2100 }).toInt()],
  validate,
  (req, res, next) => {
    try {
      res.json(dashboardService.getMonthlyTrends(req.query));
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
