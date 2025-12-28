import express from 'express';
import * as controller from '../controllers/lead-services.controller.js';

const router = express.Router();

/**
 * Order matters
 */
router.post('/', controller.addService);
router.get('/', controller.getAll);
router.get('/:leadId', controller.getServices);
router.put('/:leadId/:serviceId', controller.updateService); // 👈 ADD THIS
router.delete('/:leadId/:serviceId', controller.removeService);

export default router;