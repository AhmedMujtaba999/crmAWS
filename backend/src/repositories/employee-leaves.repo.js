import { pool } from '../config/db.js';

export async function createLeave({
    employee_id,
    leave_type,
    start_date,
    end_date,
    status,
    reason
}) {
    const result = await pool.query(
        `
    INSERT INTO employee_leaves
      (employee_id, leave_type, start_date, end_date, status, reason)
    VALUES
      ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
        [employee_id, leave_type, start_date, end_date, status ?? 'REQUESTED', reason]
    );

    return result.rows[0];
}

export async function getAllLeaves() {
    const result = await pool.query(
        `
    SELECT
      el.*,
      e.name AS employee_name
    FROM employee_leaves el
    JOIN employees e ON e.id = el.employee_id
    ORDER BY el.start_date DESC
    `
    );

    return result.rows;
}

export async function getLeavesByEmployee(employee_id) {
    const result = await pool.query(
        `
    SELECT *
    FROM employee_leaves
    WHERE employee_id = $1
    ORDER BY start_date DESC
    `,
        [employee_id]
    );

    return result.rows;
}

export async function updateLeave(
    id,
    leave_type,
    start_date,
    end_date,
    status,
    reason
) {
    const result = await pool.query(
        `
    UPDATE employee_leaves
    SET
      leave_type = $1,
      start_date = $2,
      end_date = $3,
      status = $4,
      reason = $5
    WHERE id = $6
    RETURNING *
    `,
        [leave_type, start_date, end_date, status, reason, id]
    );

    return result.rows[0];
}

export async function deleteLeave(id) {
    const result = await pool.query(
        `
    DELETE FROM employee_leaves
    WHERE id = $1
    RETURNING *
    `,
        [id]
    );

    return result.rows[0];
}