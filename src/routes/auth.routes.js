const { Router } = require('express');
const { body }   = require('express-validator');
const authenticate   = require('../middleware/authenticate');
const validate       = require('../middleware/validate');
const authService    = require('../services/auth.service');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and current-user endpoints
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user (open endpoint for initial setup; in production restrict to admins)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:     { type: string, example: "Jane Doe" }
 *               email:    { type: string, example: "jane@example.com" }
 *               password: { type: string, example: "Secret123!" }
 *               role:     { type: string, enum: [viewer, analyst, admin], default: viewer }
 *     responses:
 *       201: { description: User created, returns token }
 *       409: { description: Email already registered }
 *       422: { description: Validation error }
 */
router.post(
  '/register',
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
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and receive a JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, example: "admin@finance.com" }
 *               password: { type: string, example: "Admin123!" }
 *     responses:
 *       200: { description: Login successful, returns user and token }
 *       401: { description: Invalid credentials }
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Current user profile }
 *       401: { description: Not authenticated }
 */
router.get('/me', authenticate, (req, res) => {
  const { password, ...safe } = req.user;
  res.json(safe);
});

module.exports = router;
