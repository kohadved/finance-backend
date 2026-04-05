require('dotenv').config();

const express      = require('express');
const swaggerUi    = require('swagger-ui-express');
const swaggerSpec  = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');
const AppError     = require('./utils/AppError');

const app = express();

app.use(express.json());

// ── API Docs ──────────────────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Finance API Docs',
}));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth.routes'));
app.use('/api/users',     require('./routes/users.routes'));
app.use('/api/records',   require('./routes/records.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));

// Root health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Finance Backend API is running',
    docs: '/api/docs',
  });
});

// 404 for unmatched routes
app.use((req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.path} not found.`, 404));
});

// Global error handler
app.use(errorHandler);

module.exports = app;
