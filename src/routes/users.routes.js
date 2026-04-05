const { Router } = require('express');
const { body, query, param } = require('express-validator');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const validate     = require('../middleware/validate');
const usersService = require('../services/users.service');

const router = Router();

// All user-management routes require authentication and admin role
router.use(authenticate, authorize('admin'));

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (admin only)
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List all users with optional filters and pagination
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [viewer, analyst, admin] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive] }
 *     responses:
 *       200: { description: Paginated list of users }
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('role').optional().isIn(['viewer', 'analyst', 'admin']),
    query('status').optional().isIn(['active', 'inactive']),
  ],
  validate,
  (req, res, next) => {
    try {
      res.json(usersService.listUsers(req.query));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a single user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: User object }
 *       404: { description: User not found }
 */
router.get(
  '/:id',
  [param('id').isInt({ min: 1 }).toInt()],
  validate,
  (req, res, next) => {
    try {
      res.json(usersService.getUserById(req.params.id));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:     { type: string }
 *               email:    { type: string }
 *               password: { type: string }
 *               role:     { type: string, enum: [viewer, analyst, admin] }
 *     responses:
 *       201: { description: User created }
 *       409: { description: Email already registered }
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
      .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
      .matches(/[0-9]/).withMessage('Password must contain a number.'),
    body('role').optional().isIn(['viewer', 'analyst', 'admin']).withMessage('Invalid role.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const user = await usersService.createUser(req.body);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update user name, role, or status
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:   { type: string }
 *               role:   { type: string, enum: [viewer, analyst, admin] }
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200: { description: Updated user }
 *       404: { description: User not found }
 */
router.patch(
  '/:id',
  [
    param('id').isInt({ min: 1 }).toInt(),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
    body('role').optional().isIn(['viewer', 'analyst', 'admin']).withMessage('Invalid role.'),
    body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status.'),
  ],
  validate,
  (req, res, next) => {
    try {
      res.json(usersService.updateUser(req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Deactivate a user (sets status to inactive)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: User deactivated }
 *       400: { description: Cannot deactivate own account }
 *       404: { description: User not found }
 */
router.delete(
  '/:id',
  [param('id').isInt({ min: 1 }).toInt()],
  validate,
  (req, res, next) => {
    try {
      res.json(usersService.deactivateUser(req.params.id, req.user.id));
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
