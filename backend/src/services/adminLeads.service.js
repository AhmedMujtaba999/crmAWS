// services/adminLeads.service.js
// ============================================================
// Merged from lead.service.js + adminLeads.service.js.
// All leads-related business logic lives here now.
//
// Service responsibility: orchestrate repositories, run transactions,
// enforce business rules. No HTTP request/response handling here.
// ============================================================

import * as adminLeadsRepo from '../repositories/admin_leads.repo.js';
import * as leadRepo from '../repositories/lead.repo.js';
import * as customerRepo from '../repositories/customer.repo.js';
import * as leadServicesRepo from '../repositories/lead-services.repo.js';
import * as servicesRepo from '../repositories/services.repo.js';
import * as leadActivity from '../repositories/lead-Activity.repo.js';
import { pool } from '../config/db.js';


// ── Write operations ──────────────────────────────────────────

// createLead — POST /leads
// Creates customer + lead + optional service lines in a single transaction.
// If anything fails, the entire transaction rolls back so no partial data
// is left in the database.
export async function createLead(data, user) {
    const organization_id = user.organization_id;
    const performed_by = user.employee_id;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Create the customer record
        const customer = await customerRepo.createClient(client, {
            name: data.customer.name,
            phone: data.customer.phone,
            email: data.customer.email,
            address: data.customer.address,
            organization_id
        });

        // 2. Create the lead (estimated_minutes stored on the lead so the
        // Assign & Schedule panel can pre-fill it when creating the task)
        const lead = await leadRepo.createClient(client, {
            customer_id: customer.id,
            source: data.lead.source,
            status: data.lead.status,
            status_detail: data.lead.status_detail,
            notes: data.lead.notes,
            estimated_minutes: data.lead.estimated_minutes ?? null,
            organization_id
        });

        // 3. Optional service lines
        // Each item can be:
        //   { service_id, quantity, unit_price }  — existing catalog service
        //   { service_name, quantity, unit_price } — custom service (created here)
        if (data.services && data.services.length > 0) {
            for (const s of data.services) {
                let serviceId = s.service_id;

                // No existing service_id — create a new catalog entry inside this transaction
                if (!serviceId && s.service_name) {
                    const newService = await servicesRepo.createServiceClient(client, {
                        name: s.service_name,
                        description: null,
                        organization_id
                    });
                    serviceId = newService.id;
                }

                // Skip if neither a valid service_id nor a service_name was provided
                if (!serviceId) continue;

                await leadServicesRepo.createClient(client, {
                    lead_id: lead.id,
                    service_id: serviceId,
                    quantity: s.quantity ?? 1,
                    unit_price: s.unit_price ?? 0
                });
            }
        }

        // 4. Timeline activity entry
        await leadActivity.createClient(
            client,
            lead.id,
            organization_id,
            data.lead.notes,
            performed_by
        );

        await client.query('COMMIT');

        return lead;

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

// updateLeadEstimate — PATCH /leads/:id/estimate
// Updates only the estimated_minutes field. Scoped to organization_id
// so one org cannot update another org's lead.
export async function updateLeadEstimate(id, estimated_minutes, organization_id) {
    return await leadRepo.updateLeadEstimate(id, estimated_minutes, organization_id);
}


// ── Admin read operations ─────────────────────────────────────

// getAdminLeadsList — GET /admin/leads
// Returns all leads for the organisation (table view).
export async function getAdminLeadsList(organization_id) {
    if (!organization_id) throw new Error('organization_id is required');

    return await adminLeadsRepo.getAdminLeadsList(organization_id);
}

// getAdminLeadFullDetails — GET /admin/leads/:leadId
// Returns full details for a single lead including services, task, invoice.
export async function getAdminLeadFullDetails(lead_id, organization_id) {
    if (!lead_id) throw new Error('lead_id is required');
    if (!organization_id) throw new Error('organization_id is required');

    const lead = await adminLeadsRepo.getAdminCustomerFullLeadHistory(
        lead_id,
        organization_id
    );

    if (!lead) throw new Error('Lead not found');

    return lead;
}

// getAdminCustomerLeadHistory — GET /admin/leads/:leadId/history
// Returns the full lead history for the customer that owns this lead.
export async function getAdminCustomerLeadHistory(lead_id, organization_id) {
    if (!lead_id) throw new Error('lead_id is required');
    if (!organization_id) throw new Error('organization_id is required');

    return await adminLeadsRepo.getAdminCustomerLeadHistoryByLeadId(
        lead_id,
        organization_id
    );
}


// ── Legacy read operations ────────────────────────────────────
// These were in the original lead.service.js. Kept for backwards
// compatibility — not called by the admin frontend.

export async function getAllLeads() {
    return leadRepo.getAllLeads();
}

export async function getLeadById(id) {
    const lead = await leadRepo.getLeadById(id);
    if (!lead) throw new Error('Lead not found');
    return lead;
}
