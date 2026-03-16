import * as repo from "../repositories/employeeWorkingHours.repo.js";

export async function createWorkingHours(data, user) {

    return await repo.createWorkingHours({
        employee_id: data.employee_id,
        weekday: data.weekday,
        start_time: data.start_time,
        end_time: data.end_time,
        organization_id: user.organization_id
    });

}

export async function getWorkingHours(employee_id, user) {

    return await repo.getWorkingHours(
        employee_id,
        user.organization_id
    );

}

export async function updateWorkingHours(id, data) {

    return await repo.updateWorkingHours(id, {
        weekday:    data.weekday,
        start_time: data.start_time,
        end_time:   data.end_time,
    });

}

export async function deleteWorkingHours(id) {

    await repo.deleteWorkingHours(id);

}