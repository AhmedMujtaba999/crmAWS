import express from 'express';
import * as controller from '../controllers/workerTask.controller.js';

const router = express.Router();

// POST /workertaskui
router.post('/', controller.createWorkerTask);
router.get('/:date/:status', controller.getWorkerTasksByEmpDateStatus);
router.get('/history', controller.getWorkerTaskHistory);
router.put('/:taskId', controller.updateWorkerTask);
router.put('/full/:taskId', controller.updateFullWorkerTask);

export default router;