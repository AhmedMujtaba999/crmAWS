import express from 'express';
import * as adminLeadsController from '../controllers/adminLeads.controller.js';

const router = express.Router();

// ============================================================
// LEADS ROUTES — merged from lead.routes.js + adminLeads.routes.js
// ============================================================
// This router is mounted at TWO prefixes in app.js:
//   app.use('/leads', ...)   → write operations and legacy reads
//   app.use('/admin', ...)   → admin read operations
//
// When mounted at /leads, Express strips '/leads' before passing to this
// router, so router.post('/') handles POST /leads, router.patch('/:id/estimate')
// handles PATCH /leads/:id/estimate, etc.
//
// When mounted at /admin, Express strips '/admin', so router.get('/leads')
// handles GET /admin/leads, router.get('/leads/:leadId') handles
// GET /admin/leads/:leadId, etc.
//
// ORDER MATTERS — more specific paths must come before generic ones.
// ============================================================


// ── Write operations (reachable via the /leads mount) ────────

// POST /leads — create a new lead with customer + optional services
router.post('/', adminLeadsController.createLead);

// PATCH /leads/:id/estimate — update only estimated_minutes on a lead
router.patch('/:id/estimate', adminLeadsController.updateLeadEstimate);


// ── Admin read operations (reachable via the /admin mount) ───

// GET /admin/leads/:leadId/history — full customer lead history
// Must come before /leads/:leadId to prevent the :leadId param
// from consuming "history" as a leadId value.
router.get('/leads/:leadId/history', adminLeadsController.getAdminCustomerLeadHistory);

// GET /admin/leads/:leadId — single lead full details
router.get('/leads/:leadId', adminLeadsController.getAdminLeadFullDetails);

// GET /admin/leads — all leads list (table view)
router.get('/leads', adminLeadsController.getAdminLeadsList);


// ── Legacy read operations (reachable via the /leads mount) ──
// These were in the original lead.routes.js. Kept for backwards
// compatibility — not called by the admin frontend.

// GET /leads/:id — get single lead by id (legacy)
router.get('/:id', adminLeadsController.getLeadById);

// GET /leads — get all leads (legacy)
router.get('/', adminLeadsController.getAllLeads);


export default router;
