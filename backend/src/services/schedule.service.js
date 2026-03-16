import { pool } from "../config/db.js";
import * as scheduleRepo from "../repositories/schedule.repo.js";

export async function createSchedule(data, user) {

    const organization_id = user.organization_id;

    const start = new Date(data.scheduled_start);

    const end = new Date(
        start.getTime() + data.estimated_minutes * 60000
    );

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        const schedule = await scheduleRepo.createScheduleClient(
            client,
            {
                employee_id: data.employee_id,
                lead_id: data.lead_id,
                scheduled_start: start,
                scheduled_end: end,
                organization_id
            }
        );

        await client.query("COMMIT");

        return schedule;

    } catch (err) {

        await client.query("ROLLBACK");
        throw err;

    } finally {

        client.release();

    }

}


export async function getSchedules(date, user) {

    return await scheduleRepo.getSchedulesByDate(
        user.organization_id,
        date
    );

}


export async function updateSchedule(id, data) {

    const start = new Date(data.scheduled_start);

    const end = new Date(
        start.getTime() + data.estimated_minutes * 60000
    );

    return await scheduleRepo.updateSchedule(
        id,
        {
            employee_id: data.employee_id,
            scheduled_start: start,
            scheduled_end: end
        }
    );

}


export async function deleteSchedule(id) {

    await scheduleRepo.deleteSchedule(id);

}