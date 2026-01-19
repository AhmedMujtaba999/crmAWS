import { pool } from '../config/db.js';

export async function createService({ name, description, organization_id }) {
    const result = await pool.query(
        `
        INSERT INTO services (name, description, organization_id)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [name, description, organization_id]
    );
    return result.rows[0];
}

export async function getAllServices({ organization_id }) {
    const result = await pool.query(
        `
        SELECT *
        FROM services
        WHERE organization_id = $1
        ORDER BY name
        `,
        [organization_id]
    );
    return result.rows;
}

export async function getServiceById(id) {
    const result = await pool.query(
        `SELECT * FROM services WHERE id = $1`,
        [id]
    );
    return result.rows[0];
}

export async function updateService(id, { name, description }) {
    const result = await pool.query(
        `
    UPDATE services
    SET name = $1,
        description = $2
    WHERE id = $3
    RETURNING *
    `,
        [name, description, id]
    );

    return result.rows[0];
}

export async function deleteService({ id, organization_id }) {
    const result = await pool.query(
        `
        DELETE FROM services
        WHERE id = $1
          AND organization_id = $2
        RETURNING *
        `,
        [id, organization_id]
    );
    return result.rows[0];
}


/**
 * client
 */


/**
 * read
 */
export async function findByNameClient(client, name) {
    const { rows } = await client.query(
        `SELECT * FROM services WHERE name = $1 AND in_use = true`,
        [name]
    );
    return rows[0];
}