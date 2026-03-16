import { pool } from "../config/db.js";

export async function createHoliday(data) {

    const { rows } = await pool.query(
        `
        INSERT INTO company_holidays (
            organization_id,
            holiday_date,
            holiday_name
        )
        VALUES ($1,$2,$3)
        RETURNING *
        `,
        [
            data.organization_id,
            data.holiday_date,
            data.holiday_name
        ]
    );

    return rows[0];
}

export async function getHolidays(organization_id) {

    const { rows } = await pool.query(
        `
        SELECT *
        FROM company_holidays
        WHERE organization_id = $1
        ORDER BY holiday_date
        `,
        [organization_id]
    );

    return rows;
}

export async function deleteHoliday(id, organization_id) {

    await pool.query(
        `
        DELETE FROM company_holidays
        WHERE id = $1
        AND organization_id = $2
        `,
        [id, organization_id]
    );

}