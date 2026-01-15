import { pool } from '../config/db.js';

export async function createEmployee(data) {
    const {
        name,
        phone,
        email,
        role = null,
        employment_type = null,
        hourly_rate = null,
        password_hash,
        organization_id
    } = data;

    const { rows } = await pool.query(
        `
        INSERT INTO employees (
            name,
            phone,
            email,
            role,
            employment_type,
            hourly_rate,
            password_hash,
            is_active,
            organization_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
        RETURNING
            id,
            name,
            phone,
            email,
            role,
            employment_type,
            hourly_rate,
            is_active,
            organization_id,
            created_at
        `,
        [
            name,
            phone,
            email.toLowerCase(),
            role,
            employment_type,
            hourly_rate,
            password_hash,
            organization_id
        ]
    );

    return rows[0];
}

export async function getAllEmployees() {
    const result = await pool.query(
        `SELECT * FROM employees ORDER BY created_at DESC`
    );
    return result.rows;
}

export async function getEmployeeById(id) {
    const result = await pool.query(
        `SELECT * FROM employees WHERE id = $1`,
        [id]
    );
    return result.rows[0];
}

export async function findEmployeeForLogin(email, organization_id) {
    const { rows } = await pool.query(
        `
        SELECT
            id,
            name,
            email,
            password_hash,
            role,
            is_active,
            organization_id
        FROM employees
        WHERE email = $1
          AND organization_id = $2
        LIMIT 1
        `,
        [email.toLowerCase(), organization_id]
    );

    return rows[0];
}


export async function updateEmployee(id, data) {
    const {
        name,
        phone,
        email,
        role,
        employment_type,
        hourly_rate,
        is_active
    } = data;

    const result = await pool.query(
        `
    UPDATE employees
    SET
      name = $1,
      phone = $2,
      email = $3,
      role = $4,
      employment_type = $5,
      hourly_rate = $6,
      is_active = $7
    WHERE id = $8
    RETURNING *
    `,
        [
            name,
            phone,
            email,
            role,
            employment_type,
            hourly_rate,
            is_active,
            id
        ]
    );

    return result.rows[0];
}

export async function deleteEmployee(id) {
    const result = await pool.query(
        `DELETE FROM employees WHERE id = $1 RETURNING *`,
        [id]
    );

    return result.rows[0];
}