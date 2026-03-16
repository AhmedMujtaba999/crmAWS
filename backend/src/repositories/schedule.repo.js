import { pool } from "../config/db.js";

export async function createScheduleClient(
    client,
    data
) {

    const { rows } = await client.query(
        `
        INSERT INTO employee_schedule (
            employee_id,
            lead_id,
            scheduled_start,
            scheduled_end,
            organization_id
        )
        VALUES ($1,$2,$3,$4,$5)
        RETURNING *
        `,
        [
            data.employee_id,
            data.lead_id,
            data.scheduled_start,
            data.scheduled_end,
            data.organization_id
        ]
    );

    return rows[0];
}



export async function checkEmployeeConflictClient(
    client,
    employee_id,
    start,
    end,
    organization_id
) {

    const { rows } = await client.query(
        `
        SELECT id
        FROM employee_schedule
        WHERE employee_id = $1
        AND organization_id = $2
        AND scheduled_start < $4
        AND scheduled_end > $3
        LIMIT 1
        `,
        [
            employee_id,
            organization_id,
            start,
            end
        ]
    );

    return rows[0] ?? null;
}


export async function getSchedulesByDate(organization_id, date) {

    const { rows } = await pool.query(
        `
        SELECT
            es.id,
            es.scheduled_start,
            es.scheduled_end,

            e.id AS employee_id,
            e.name AS employee_name,

            l.id AS lead_id,
            l.status,
            l.source,

            c.name AS customer_name,
            c.phone,
            c.address

        FROM employee_schedule es

        JOIN employees e
            ON (e.organization_id, e.id)
            = (es.organization_id, es.employee_id)

        LEFT JOIN leads l
            ON (l.organization_id, l.id)
            = (es.organization_id, es.lead_id)

        LEFT JOIN customers c
            ON (c.organization_id, c.id)
            = (l.organization_id, l.customer_id)

        WHERE
            es.organization_id = $1
            AND DATE(es.scheduled_start) = $2

        ORDER BY es.scheduled_start
        `,
        [organization_id, date]
    );

    return rows;
}


export async function updateSchedule(id, data) {

    const { rows } = await pool.query(
        `
        UPDATE employee_schedule
        SET
            employee_id = $1,
            scheduled_start = $2,
            scheduled_end = $3
        WHERE id = $4
        RETURNING *
        `,
        [
            data.employee_id,
            data.scheduled_start,
            data.scheduled_end,
            id
        ]
    );

    return rows[0];
}


export async function deleteSchedule(id) {

    await pool.query(
        `
        DELETE FROM employee_schedule
        WHERE id = $1
        `,
        [id]
    );

}