import express from 'express';
import * as controller from '../controllers/lead-employees.controller.js';

const router = express.Router();

/**
 * Order matters
 */
router.post('/', controller.addEmployee);
router.get('/', controller.getAll);                       // admin/debug
router.get('/:leadId', controller.getByLead);
router.put('/:leadId/:employeeId', controller.updateEmployee);
router.delete('/:leadId/:employeeId', controller.removeEmployee);

export default router;