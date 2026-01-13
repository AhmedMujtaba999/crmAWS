// src/repositories/lead.repo.js
import { pool } from '../config/db.js';

export async function createLead(data) {
    const { customer_id, status, status_detail, source, notes } = data;

    const result = await pool.query(
        `
    INSERT INTO leads (customer_id, status, status_detail, source, notes)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
        [customer_id, status, status_detail, source, notes]
    );

    return result.rows[0];
}

export async function getAllLeads() {
    const result = await pool.query(
        `SELECT * FROM leads ORDER BY created_at DESC`
    );
    return result.rows;
}

export async function getLeadById(id) {
    const result = await pool.query(
        `SELECT * FROM leads WHERE id = $1`,
        [id]
    );
    return result.rows[0];
}

export async function updateLead(id, data) {
    const { status, status_detail, source, notes } = data;

    const result = await pool.query(
        `
    UPDATE leads
    SET
      status = $1,
      status_detail = $2,
      source = $3,
      notes = $4,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING *
    `,
        [status, status_detail, source, notes, id]
    );

    return result.rows[0];
}

export async function deleteLead(id) {
    const result = await pool.query(
        `DELETE FROM leads WHERE id = $1 RETURNING *`,
        [id]
    );

    return result.rows[0];
}


/**
 * using client
 */


/**
 * create
 */

export async function createClient(client, data) {
    const { rows } = await client.query(
        `INSERT INTO leads (customer_id, status, source)
         VALUES ($1,$2,$3)
         RETURNING *`,
        [data.customer_id, data.status, data.source]
    );
    return rows[0];
}

export async function getLeadByIdClient(client, id) {
    const { rows } = await client.query(
        `SELECT * FROM leads WHERE id = $1`,
        [id]
    );
    return rows[0];
}