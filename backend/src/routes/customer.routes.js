// src/routes/customer.routes.js
import express from 'express';
import * as customerController from '../controllers/customer.controller.js';

const router = express.Router();

router.post('/', customerController.createCustomer);
router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomerById);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

export default router;