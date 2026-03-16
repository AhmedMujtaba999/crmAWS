import { pool } from "../config/db.js";

export async function createWorkingHours(data) {

    const { rows } = await pool.query(
        `
        INSERT INTO employee_working_hours (
            employee_id,
            weekday,
            start_time,
            end_time,
            organization_id
        )
        VALUES ($1,$2,$3,$4,$5)
        RETURNING *
        `,
        [
            data.employee_id,
            data.weekday,
            data.start_time,
            data.end_time,
            data.organization_id
        ]
    );

    return rows[0];
}

export async function getWorkingHours(employee_id, organization_id) {

    const { rows } = await pool.query(
        `
        SELECT *
        FROM employee_working_hours
        WHERE employee_id = $1
        AND organization_id = $2
        ORDER BY weekday
        `,
        [employee_id, organization_id]
    );

    return rows;
}

export async function updateWorkingHours(id, data) {

    const { rows } = await pool.query(
        `
        UPDATE employee_working_hours
        SET weekday    = $1,
            start_time = $2,
            end_time   = $3
        WHERE id = $4
        RETURNING *
        `,
        [data.weekday, data.start_time, data.end_time, id]
    );

    return rows[0] ?? null;
}

export async function deleteWorkingHours(id) {

    await pool.query(
        `
        DELETE FROM employee_working_hours
        WHERE id = $1
        `,
        [id]
    );

}