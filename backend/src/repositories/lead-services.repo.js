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

export async function getServicesByLead(lead_id) {
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
    WHERE ls.lead_id = $1
    `,
        [lead_id]
    );
    return result.rows;
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