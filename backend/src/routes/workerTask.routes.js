import express from 'express';
import * as controller from '../controllers/workerTask.controller.js';
import { getWorkerTasksByEmpDateStatus } from '../controllers/workerTask.controller.js';
import { updateWorkerTask } from '../controllers/workerTask.controller.js';

const router = express.Router();

// POST /workertaskui
router.post('/', controller.createWorkerTask);
router.get('/:empId/:date/:status', controller.getWorkerTasksByEmpDateStatus);
router.get('/history/:empId', controller.getWorkerTaskHistory);
router.put('/:taskId', updateWorkerTask);

export default router;