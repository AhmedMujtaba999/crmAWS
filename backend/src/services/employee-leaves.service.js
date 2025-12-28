import * as repo from '../repositories/employee-leaves.repo.js';

export async function createLeave(data) {
    return repo.createLeave(data);
}

export async function getAllLeaves() {
    return repo.getAllLeaves();
}

export async function getLeavesByEmployee(employee_id) {
    return repo.getLeavesByEmployee(employee_id);
}

export async function updateLeave(id, data) {
    const updated = await repo.updateLeave(
        id,
        data.leave_type,
        data.start_date,
        data.end_date,
        data.status,
        data.reason
    );

    if (!updated) {
        throw new Error('Leave not found');
    }

    return updated;
}

export async function deleteLeave(id) {
    const deleted = await repo.deleteLeave(id);
    if (!deleted) {
        throw new Error('Leave not found');
    }
    return deleted;
}