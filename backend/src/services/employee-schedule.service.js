import * as repo from '../repositories/employee-schedule.repo.js';

export async function createSchedule(data) {
    return repo.createSchedule(data);
}

export async function getAllSchedules() {
    return repo.getAllSchedules();
}

export async function getScheduleByEmployee(employee_id) {
    return repo.getScheduleByEmployee(employee_id);
}

export async function updateSchedule(id, data) {
    const updated = await repo.updateSchedule(
        id,
        data.schedule_date,
        data.start_time,
        data.end_time,
        data.lead_id
    );

    if (!updated) {
        throw new Error('Schedule not found');
    }

    return updated;
}

export async function deleteSchedule(id) {
    const deleted = await repo.deleteSchedule(id);
    if (!deleted) {
        throw new Error('Schedule not found');
    }
    return deleted;
}