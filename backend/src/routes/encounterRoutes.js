const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  validate,
  encounterSchema,
  encounterUpdateSchema,
} = require('../validators/schemas');
const encounterController = require('../controllers/encounterController');

const router = express.Router();

router.use(authenticate);

// Create: nurses + doctors (nurses enter data; doctors can also enter)
router.post(
  '/',
  authorize('NURSE', 'DOCTOR'),
  validate(encounterSchema),
  encounterController.createEncounter
);

// Read: all clinical roles
router.get('/', authorize('NURSE', 'DOCTOR', 'ADMIN'), encounterController.listEncounters);
router.get('/:id', authorize('NURSE', 'DOCTOR', 'ADMIN'), encounterController.getEncounter);

// Update: doctors only (nurses enter; doctors view & edit)
router.put(
  '/:id',
  authorize('DOCTOR'),
  validate(encounterUpdateSchema),
  encounterController.updateEncounter
);

// Delete: doctors + admins
router.delete('/:id', authorize('DOCTOR', 'ADMIN'), encounterController.deleteEncounter);

module.exports = router;
