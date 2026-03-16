import express from 'express';
import * as leadController from '../controllers/lead.controller.js';

const router = express.Router()


router.post("/", leadController.createLead);
router.get('/', leadController.getAllLeads);
router.get('/:id', leadController.getLeadById);
router.patch('/:id/estimate', leadController.updateLeadEstimate);
// router.put('/:id', leadController.updateLead);
// router.delete('/:id', leadController.deleteLead);

export default router;