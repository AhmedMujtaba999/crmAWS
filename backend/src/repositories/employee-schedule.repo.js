import { pool } from '../config/db.js';

/**
 * Create a schedule slot
 */
export async function createSchedule({
    employee_id,
    schedule_date,
    start_time,
    end_time,
    lead_id
}) {
    const result = await pool.query(
        `
    INSERT INTO employee_schedule
      (employee_id, schedule_date, start_time, end_time, lead_id)
    VALUES
      ($1, $2, $3, $4, $5)
    RETURNING *
    `,
        [employee_id, schedule_date, start_time, end_time, lead_id ?? null]
    );

    return result.rows[0];
}

/**
 * Get all schedules (admin / debug)
 */
export async function getAllSchedules() {
    const result = await pool.query(
        `
    SELECT
      es.*,
      e.name AS employee_name
    FROM employee_schedule es
    JOIN employees e ON e.id = es.employee_id
    ORDER BY es.schedule_date, es.start_time
    `
    );

    return result.rows;
}

/**
 * Get schedule for a specific employee
 */
export async function getScheduleByEmployee(employee_id) {
    const result = await pool.query(
        `
    SELECT *
    FROM employee_schedule
    WHERE employee_id = $1
    ORDER BY schedule_date, start_time
    `,
        [employee_id]
    );

    return result.rows;
}

/**
 * Update schedule slot
 */
export async function updateSchedule(
    id,
    schedule_date,
    start_time,
    end_time,
    lead_id
) {
    const result = await pool.query(
        `
    UPDATE employee_schedule
    SET
      schedule_date = $1,
      start_time = $2,
      end_time = $3,
      lead_id = $4
    WHERE id = $5
    RETURNING *
    `,
        [schedule_date, start_time, end_time, lead_id ?? null, id]
    );

    return result.rows[0];
}

/**
 * Delete schedule slot
 */
export async function deleteSchedule(id) {
    const result = await pool.query(
        `
    DELETE FROM employee_schedule
    WHERE id = $1
    RETURNING *
    `,
        [id]
    );

    return result.rows[0];
}