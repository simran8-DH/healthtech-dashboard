const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, patientSchema } = require('../validators/schemas');
const patientController = require('../controllers/patientController');

const router = express.Router();

router.use(authenticate);

// Nurses, doctors, admins can create/list patients
router.post('/', authorize('NURSE', 'DOCTOR', 'ADMIN'), validate(patientSchema), patientController.createPatient);
router.get('/', authorize('NURSE', 'DOCTOR', 'ADMIN'), patientController.listPatients);
router.get('/:id', authorize('NURSE', 'DOCTOR', 'ADMIN'), patientController.getPatient);

module.exports = router;
