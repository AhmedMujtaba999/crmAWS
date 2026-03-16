import { pool } from "../config/db.js";

export async function createLeave(data) {

    const { rows } = await pool.query(
        `
        INSERT INTO employee_leaves (
            employee_id,
            leave_type,
            start_date,
            end_date,
            reason
        )
        VALUES ($1,$2,$3,$4,$5)
        RETURNING *
        `,
        [
            data.employee_id,
            data.leave_type,
            data.start_date,
            data.end_date,
            data.reason
        ]
    );

    return rows[0];
}

export async function getLeaves(organization_id) {

    const { rows } = await pool.query(
        `
        SELECT el.*, e.name
        FROM employee_leaves el
        JOIN employees e
        ON e.id = el.employee_id
        WHERE e.organization_id = $1
        ORDER BY el.start_date DESC
        `,
        [organization_id]
    );

    return rows;
}

export async function deleteLeave(id) {

    await pool.query(
        `
        DELETE FROM employee_leaves
        WHERE id = $1
        `,
        [id]
    );

}