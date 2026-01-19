import express from 'express';
import * as controller from '../controllers/services.controller.js';

const router = express.Router();

router.post('/', controller.createService);
router.get('/', controller.getAllServices);
//router.get('/:id', controller.getServiceById);
//router.put('/:id', controller.updateService);
router.delete('/:id', controller.deleteService);

export default router;