import { pool } from '../config/db.js';

export async function addServiceToLead({
    lead_id,
    service_id,
    quantity,
    unit_price
}) {
    const result = await pool.query(
        `
    INSERT INTO lead_services
      (lead_id, service_id, quantity, unit_price)
    VALUES
      ($1, $2, $3, $4)
    RETURNING *
    `,
        [lead_id, service_id, quantity ?? 1, unit_price]
    );
    return result.rows[0];
}

// lead_services has no organization_id column — tenant scoping is done via
// the services table (s.organization_id) and the lead_id UUID itself
// (lead_id is a FK to leads which already belongs to one org).
export async function getServicesByLeadId(leadId, organization_id) {
    const { rows } = await pool.query(
        `
        SELECT
            ls.service_id,
            s.name AS service_name,
            ls.quantity,
            ls.unit_price,
            ls.total_price,
            ls.type
        FROM lead_services ls
        JOIN services s ON ls.service_id = s.id
        WHERE ls.lead_id = $1
          AND s.organization_id = $2
        `,
        [leadId, organization_id]
    );

    return rows;
}

export async function getAllLeadServices() {
    const result = await pool.query(
        `
    SELECT
      ls.lead_id,
      ls.service_id,
      s.name AS service_name,
      ls.quantity,
      ls.unit_price,
      ls.total_price
    FROM lead_services ls
    JOIN services s ON s.id = ls.service_id
    ORDER BY ls.lead_id
    `
    );
    return result.rows;
}

/**
 * UPDATE quantity / unit_price
 */
export async function updateLeadService(
    lead_id,
    service_id,
    quantity,
    unit_price
) {
    const result = await pool.query(
        `
    UPDATE lead_services
    SET quantity = $1,
        unit_price = $2
    WHERE lead_id = $3
      AND service_id = $4
    RETURNING *
    `,
        [quantity, unit_price, lead_id, service_id]
    );

    return result.rows[0];
}

export async function removeServiceFromLead(lead_id, service_id) {
    const result = await pool.query(
        `
    DELETE FROM lead_services
    WHERE lead_id = $1
      AND service_id = $2
    RETURNING *
    `,
        [lead_id, service_id]
    );
    return result.rows[0];
}



/**
 * client
 */

/**
 * Create lead service record (default type = PLANNED)
 * Used when manager or worker mentions services
 */
export async function createClient(
    client,
    { lead_id,
        service_id,
        quantity = 1,
        unit_price }

) {
    if (!lead_id) throw new Error('lead_id is required');
    if (!service_id) throw new Error('service_id is required');
    if (unit_price == null) throw new Error('unit_price is required');

    const { rows } = await client.query(
        `
    INSERT INTO lead_services (
      lead_id,
      service_id,
      quantity,
      unit_price
    )
    VALUES ($1, $2, $3, $4)
    RETURNING
      lead_id,
      service_id,
      quantity,
      unit_price,
      total_price,
      type
    `,
        [
            lead_id,
            service_id,
            quantity,
            unit_price
        ]
    );

    return rows[0];
}

/**
 * Promote services from PLANNED → ASSIGNED
 * Called when worker task is created
 */
export async function markServicesAssigned(
    client,
    lead_id,
    serviceIds,
    status,
    organization_id
) {
    await client.query(
        `
        UPDATE lead_services
        SET type = $1
        WHERE lead_id = $2
          AND service_id = ANY($3)
        `,
        [status, lead_id, serviceIds]
    );
}


// src/repositories/lead-services.repo.js

// Count how many services are linked to a lead.
// COUNT(*)::int — PostgreSQL's COUNT returns bigint by default; the ::int cast
// converts it so the pg driver gives back a plain JS number, not the string "3".
// Used by closeLead in the service layer to block closing leads with no services.
// Filters by lead_id only — the lead_services table has no organization_id column.
// This is safe: lead_id is a UUID uniquely tied to one org, and closeLeadAdmin
// independently checks organization_id before updating the lead.
export async function countByLeadId(lead_id) {
    const { rows } = await pool.query(
        `SELECT COUNT(*)::int AS count FROM lead_services WHERE lead_id = $1`,
        [lead_id]
    );
    return rows[0].count;
}

export async function deleteByLeadIdClient(
    client,
    lead_id
) {
    if (!lead_id) {
        throw new Error('lead_id is required');
    }
    const { rowCount } = await client.query(
        `
    DELETE FROM lead_services
    WHERE lead_id = $1
    `,
        [lead_id]
    );

    return rowCount; // number of deleted rows
}