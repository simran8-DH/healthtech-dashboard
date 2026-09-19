const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { validateQuery, dashboardQuerySchema } = require('../validators/schemas');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.use(authenticate);

// Metrics: doctors + admins (admin analyzes trends; doctors view for decisions)
router.get(
  '/metrics',
  authorize('DOCTOR', 'ADMIN'),
  validateQuery(dashboardQuerySchema),
  dashboardController.getMetrics
);

router.get('/audit-logs', authorize('ADMIN'), dashboardController.listAuditLogs);

module.exports = router;
