import { pool } from '../config/db.js';

export async function createUser({ name, email, password_hash }) {
    const result = await pool.query(
        `
    INSERT INTO users (name, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, name, email, is_active, created_at
    `,
        [name, email.toLowerCase(), password_hash]
    );
    return result.rows[0];
}

export async function findUserByEmail(email) {
    const result = await pool.query(
        `SELECT * FROM users WHERE email = $1 LIMIT 1`,
        [email.toLowerCase()]
    );
    return result.rows[0];
}

export async function getUserRoles(user_id) {
    const result = await pool.query(
        `
    SELECT r.name
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = $1
    `,
        [user_id]
    );
    return result.rows.map(r => r.name);
}

export async function assignRoleToUser(user_id, roleName) {
    const roleRes = await pool.query(`SELECT id FROM roles WHERE name = $1`, [roleName]);
    if (!roleRes.rows[0]) throw new Error(`Role not found: ${roleName}`);

    await pool.query(
        `
    INSERT INTO user_roles (user_id, role_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
    `,
        [user_id, roleRes.rows[0].id]
    );
}