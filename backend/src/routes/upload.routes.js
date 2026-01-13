import express from 'express';
import { postWorkerTaskInvoicePicture } from '../controllers/workerTaskUpload.controller.js';
import { fetchWorkerTaskUploads } from '../controllers/workerTaskUpload.controller.js';

const router = express.Router();

/**
 * POST /workertaskinoivoicepicture
 */
router.post('/', postWorkerTaskInvoicePicture);

// GET → fetch uploaded data
router.get('/:task_id', fetchWorkerTaskUploads);

export default router;