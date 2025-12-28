import express from 'express';
import * as controller from '../controllers/employee-schedule.controller.js';

const router = express.Router();

router.post('/', controller.create);
router.get('/', controller.getAll);                          // admin
router.get('/employee/:employeeId', controller.getByEmployee);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;