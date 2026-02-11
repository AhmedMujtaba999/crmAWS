import express from 'express';
import { getWorkerTaskUploadsController, postWorkerTaskInvoicePicture } from '../controllers/workerTaskUpload.controller.js';

const router = express.Router();

/**
 * POST /workertaskinoivoicepicture
 */
router.post('/', postWorkerTaskInvoicePicture);

// GET → fetch uploaded data
router.get('/:task_id', getWorkerTaskUploadsController);

export default router;