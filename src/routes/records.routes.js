const { Router } = require('express');
const { body, query, param } = require('express-validator');
const authenticate    = require('../middleware/authenticate');
const { authorize, authorizeMin } = require('../middleware/authorize');
const validate        = require('../middleware/validate');
const recordsService  = require('../services/records.service');

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Records
 *   description: Financial record CRUD and filtering
 */

/**
 * @swagger
 * /records:
 *   get:
 *     summary: List financial records (viewer+)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: page,      schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,     schema: { type: integer, default: 20 } }
 *       - { in: query, name: type,      schema: { type: string, enum: [income, expense] } }
 *       - { in: query, name: category,  schema: { type: string } }
 *       - { in: query, name: date_from, schema: { type: string, format: date, example: "2026-01-01" } }
 *       - { in: query, name: date_to,   schema: { type: string, format: date, example: "2026-12-31" } }
 *       - { in: query, name: search,    schema: { type: string } }
 *       - { in: query, name: sort,      schema: { type: string, enum: [date, amount, category, type, created_at] } }
 *       - { in: query, name: order,     schema: { type: string, enum: [asc, desc] } }
 *     responses:
 *       200: { description: Paginated list of records }
 */
router.get(
  '/',
  authorizeMin('viewer'),
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('type').optional().isIn(['income', 'expense']),
    query('date_from').optional().isDate().withMessage('date_from must be YYYY-MM-DD'),
    query('date_to').optional().isDate().withMessage('date_to must be YYYY-MM-DD'),
    query('sort').optional().isIn(['date', 'amount', 'category', 'type', 'created_at']),
    query('order').optional().isIn(['asc', 'desc']),
  ],
  validate,
  (req, res, next) => {
    try {
      res.json(recordsService.listRecords(req.query));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /records/{id}:
 *   get:
 *     summary: Get a single financial record (viewer+)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Record object }
 *       404: { description: Not found }
 */
router.get(
  '/:id',
  authorizeMin('viewer'),
  [param('id').isInt({ min: 1 }).toInt()],
  validate,
  (req, res, next) => {
    try {
      res.json(recordsService.getRecordById(req.params.id));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /records:
 *   post:
 *     summary: Create a financial record (admin only)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount:   { type: number, example: 1500 }
 *               type:     { type: string, enum: [income, expense] }
 *               category: { type: string, example: "salary" }
 *               date:     { type: string, format: date, example: "2026-04-01" }
 *               notes:    { type: string }
 *     responses:
 *       201: { description: Created record }
 *       422: { description: Validation error }
 */
router.post(
  '/',
  authorize('admin'),
  [
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number.').toFloat(),
    body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense.'),
    body('category').trim().notEmpty().withMessage('Category is required.'),
    body('date').isDate().withMessage('Date must be YYYY-MM-DD.'),
    body('notes').optional().trim(),
  ],
  validate,
  (req, res, next) => {
    try {
      const record = recordsService.createRecord(req.body, req.user.id);
      res.status(201).json(record);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /records/{id}:
 *   patch:
 *     summary: Update a financial record (admin only)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:   { type: number }
 *               type:     { type: string, enum: [income, expense] }
 *               category: { type: string }
 *               date:     { type: string, format: date }
 *               notes:    { type: string }
 *     responses:
 *       200: { description: Updated record }
 *       404: { description: Not found }
 */
router.patch(
  '/:id',
  authorize('admin'),
  [
    param('id').isInt({ min: 1 }).toInt(),
    body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be a positive number.').toFloat(),
    body('type').optional().isIn(['income', 'expense']),
    body('category').optional().trim().notEmpty().withMessage('Category cannot be empty.'),
    body('date').optional().isDate().withMessage('Date must be YYYY-MM-DD.'),
    body('notes').optional().trim(),
  ],
  validate,
  (req, res, next) => {
    try {
      res.json(recordsService.updateRecord(req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /records/{id}:
 *   delete:
 *     summary: Soft-delete a financial record (admin only)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Record deleted }
 *       404: { description: Not found }
 */
router.delete(
  '/:id',
  authorize('admin'),
  [param('id').isInt({ min: 1 }).toInt()],
  validate,
  (req, res, next) => {
    try {
      res.json(recordsService.deleteRecord(req.params.id));
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
