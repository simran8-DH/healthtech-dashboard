const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, loginSchema, registerSchema } = require('../validators/schemas');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.me);
router.post(
  '/register',
  authenticate,
  authorize('ADMIN'),
  validate(registerSchema),
  authController.register
);
router.get('/users', authenticate, authorize('ADMIN'), authController.listUsers);

module.exports = router;
