import express from 'express';
import * as controller from '../controllers/workerTask.controller.js';

const router = express.Router();

// POST /workertaskui
router.post('/', controller.createWorkerTask);
router.get('/:empId/:date/:status', controller.getWorkerTasksByEmpDateStatus);
router.get('/history/:empId', controller.getWorkerTaskHistory);
router.put('/:taskId', controller.updateWorkerTask);

export default router;