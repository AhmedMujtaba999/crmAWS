import * as leadRepo from '../repositories/lead.repo.js';
import * as customerRepo from '../repositories/customer.repo.js';
import * as leadServices from '../repositories/lead-services.repo.js';
import * as servicesRepo from '../repositories/services.repo.js';
import * as leadActivity from '../repositories/lead-Activity.repo.js';
import { pool } from "../config/db.js";

export async function createLead(data, user) {

    const organization_id = user.organization_id;
    const performed_by = user.employee_id;

    const client = await pool.connect();

    try {

        await client.query("BEGIN");
        // 1️⃣ create customer
        const customer = await customerRepo.createClient(
            client,
            {
                name: data.customer.name,
                phone: data.customer.phone,
                email: data.customer.email,
                address: data.customer.address,
                organization_id
            }
        )

        // 2️⃣ create lead (estimated_minutes stored on the lead so the
        // Assign & Schedule panel can pre-fill it when creating the task)
        const lead = await leadRepo.createClient(
            client,
            {
                customer_id: customer.id,
                source: data.lead.source,
                status: data.lead.status,
                status_detail: data.lead.status_detail,
                notes: data.lead.notes,
                estimated_minutes: data.lead.estimated_minutes ?? null,
                organization_id: organization_id
            }
        );

        // 3️⃣ optional quotation services
        // Each item in data.services can be one of two shapes:
        //   { service_id, quantity, unit_price }  — existing service from the catalog
        //   { service_name, quantity, unit_price } — custom (new) service typed by the admin
        //
        // For custom services: we INSERT into the services table first (inside this
        // same transaction so it rolls back if anything else fails), then use the
        // returned id as the service_id for the lead_services record.
        if (data.services && data.services.length > 0) {
            for (const s of data.services) {
                let serviceId = s.service_id;

                // No existing service_id — admin typed a custom service name
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

                await leadServices.createClient(client, {
                    lead_id: lead.id,
                    service_id: serviceId,
                    quantity: s.quantity ?? 1,
                    unit_price: s.unit_price ?? 0
                });
            }
        }

        // 4️⃣ timeline entry
        await leadActivity.createClient(
            client,
            lead.id,
            organization_id,
            data.lead.notes,
            performed_by
        );

        await client.query("COMMIT");

        return lead;

    } catch (err) {

        await client.query("ROLLBACK");
        throw err;

    } finally {

        client.release();

    }
}




// export async function createLead(data) {
//     return leadRepo.createLead(data);
// }

export async function getAllLeads() {
    return leadRepo.getAllLeads();
}

export async function getLeadById(id) {
    const lead = await leadRepo.getLeadById(id);
    if (!lead) throw new Error('Lead not found');
    return lead;
}

export async function updateLead(id, data) {
    const updated = await leadRepo.updateLead(id, data);
    if (!updated) throw new Error('Lead not found');
    return updated;
}

export async function updateLeadEstimate(id, estimated_minutes, organization_id) {
    return await leadRepo.updateLeadEstimate(id, estimated_minutes, organization_id);
}

export async function deleteLead(id) {
    const deleted = await leadRepo.deleteLead(id);
    if (!deleted) throw new Error('Lead not found');
    return deleted;
}