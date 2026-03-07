import * as leadRepo from '../repositories/lead.repo.js';
import * as customerRepo from '../repositories/customer.repo.js';
import * as leadServices from '../repositories/lead-services.repo.js';
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

        // 2️⃣ create lead
        const lead = await leadRepo.createClient(
            client,
            {
                customer_id: customer.id,
                source: data.lead.source,
                status: data.lead.status,
                status_detail: data.lead.status_detail,
                notes: data.lead.notes,
                organization_id: organization_id
            }
        );

        // 3️⃣ optional quotation services
        if (data.services && data.services.length > 0) {
            for (const s of data.services) {
                await leadServices.createClient(client, {
                    lead_id: lead.id,
                    service_id: s.service_id,
                    quantity: s.quantity,
                    unit_price: s.unit_price
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

export async function deleteLead(id) {
    const deleted = await leadRepo.deleteLead(id);
    if (!deleted) throw new Error('Lead not found');
    return deleted;
}