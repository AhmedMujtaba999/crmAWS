import express from 'express';
import * as adminLeadsController from '../controllers/adminLeads.controller.js';

const router = express.Router();



/**
 * IMPORTANT:
 * Order matters.
 * More specific routes should come before generic ones.
 */

// 1️⃣ Get full customer history
router.get(
    '/leads/:leadId/history',
    adminLeadsController.getAdminCustomerLeadHistory
);

// 2️⃣ Get single lead full details
router.get(
    '/leads/:leadId',
    adminLeadsController.getAdminLeadFullDetails
);

// 3️⃣ Get all leads (table view)
router.get(
    '/leads',
    adminLeadsController.getAdminLeadsList
);

export default router;