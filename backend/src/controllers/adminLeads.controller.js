// controllers/adminLeads.controller.js
// ============================================================
// Merged from lead.controller.js + adminLeads.controller.js.
// All leads-related controller functions live here now.
//
// Controller responsibility: parse the HTTP request (params, body,
// user from JWT), call the service, send the HTTP response.
// No business logic or SQL here.
// ============================================================

import * as adminLeadsService from '../services/adminLeads.service.js';


// ── Write operations (called via POST/PATCH /leads) ──────────

// POST /leads — create a new lead with customer + optional services
export async function createLead(req, res, next) {
    try {
        const data = req.body;
        const result = await adminLeadsService.createLead(data, req.user);

        res.status(201).json({
            success: true,
            lead: result
        });
    } catch (err) {
        next(err);
    }
}

// PATCH /leads/:id/estimate — update only estimated_minutes on a lead
export async function updateLeadEstimate(req, res, next) {
    try {
        const { id } = req.params;
        const { estimated_minutes } = req.body;
        const { organization_id } = req.user;

        const lead = await adminLeadsService.updateLeadEstimate(
            id,
            estimated_minutes,
            organization_id
        );

        if (!lead) return res.status(404).json({ error: 'Lead not found' });

        res.json({ success: true, lead });
    } catch (err) {
        next(err);
    }
}


// ── Admin read operations (called via GET /admin/leads) ───────

// GET /admin/leads — all leads for this organisation (table view)
export async function getAdminLeadsList(req, res, next) {
    try {
        const organization_id = req.user.organization_id;

        const leads = await adminLeadsService.getAdminLeadsList(organization_id);

        res.json({
            success: true,
            count: leads.length,
            data: leads
        });
    } catch (err) {
        next(err);
    }
}

// GET /admin/leads/:leadId — full details for a single lead
export async function getAdminLeadFullDetails(req, res, next) {
    try {
        const { leadId } = req.params;
        const organization_id = req.user.organization_id;

        const lead = await adminLeadsService.getAdminLeadFullDetails(
            leadId,
            organization_id
        );

        res.json({
            success: true,
            data: lead
        });
    } catch (err) {
        next(err);
    }
}

// GET /admin/leads/:leadId/history — full customer lead history
export async function getAdminCustomerLeadHistory(req, res, next) {
    try {
        const { leadId } = req.params;
        const organization_id = req.user.organization_id;

        const history = await adminLeadsService.getAdminCustomerLeadHistory(
            leadId,
            organization_id
        );

        res.json({
            success: true,
            count: history.length,
            data: history
        });
    } catch (err) {
        next(err);
    }
}


// ── Legacy read operations (called via GET /leads) ────────────
// These were in the original lead.controller.js. Kept for backwards
// compatibility — not called by the admin frontend.

// GET /leads — get all leads (legacy, no org filter)
export async function getAllLeads(req, res, next) {
    try {
        const leads = await adminLeadsService.getAllLeads();
        res.json(leads);
    } catch (err) {
        next(err);
    }
}

// GET /leads/:id — get single lead by id (legacy)
export async function getLeadById(req, res, next) {
    try {
        const lead = await adminLeadsService.getLeadById(req.params.id);
        res.json(lead);
    } catch (err) {
        next(err);
    }
}
