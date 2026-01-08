import * as repo from '../repositories/lead-services.repo.js';

export async function addServiceToLead(data) {
    return repo.addServiceToLead(data);
}

export async function getServicesByLead(lead_id) {
    return repo.getServicesByLead(lead_id);
}

export async function getAllLeadServices() {
    return repo.getAllLeadServices();
}

export async function updateLeadService(
    lead_id,
    service_id,
    quantity,
    unit_price
) {
    const updated = await repo.updateLeadService(
        lead_id,
        service_id,
        quantity,
        unit_price
    );
    if (!updated) {
        throw new Error('Service not found for this lead');
    }
    return updated;
}

export async function removeServiceFromLead(lead_id, service_id) {
    const removed = await repo.removeServiceFromLead(lead_id, service_id);
    if (!removed) {
        throw new Error('Service not found for this lead');
    }
    return removed;
}



/**
 * =========================
 * CREATE (with transaction) client
 * =========================
 */
export async function createClient(client, {
    lead_id,
    service_id,
    quantity = 1,
    unit_price = 0
}) {
    const { rows } = await client.query(
        `
        INSERT INTO lead_services (
            lead_id,
            service_id,
            quantity,
            unit_price
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *;
        `,
        [lead_id, service_id, quantity, unit_price]
    );

    return rows[0];
}
