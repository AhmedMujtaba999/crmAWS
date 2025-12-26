import { pool } from '../config/db.js';

export async function createService({ name, description }) {
    const result = await pool.query(
        `
    INSERT INTO services (name, description)
    VALUES ($1, $2)
    RETURNING *
    `,
        [name, description]
    );

    return result.rows[0];
}

export async function getAllServices() {
    const result = await pool.query(
        `SELECT * FROM services ORDER BY name`
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

export async function deleteService(id) {
    const result = await pool.query(
        `DELETE FROM services WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
}