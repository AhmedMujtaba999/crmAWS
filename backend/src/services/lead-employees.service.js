import * as repo from '../repositories/lead-employees.repo.js';

export async function addEmployeeToLead(data) {
    return repo.addEmployeeToLead(data);
}

export async function getEmployeesByLead(lead_id) {
    return repo.getEmployeesByLead(lead_id);
}

export async function getAllLeadEmployees() {
    return repo.getAllLeadEmployees();
}

export async function updateLeadEmployee(
    lead_id,
    employee_id,
    hours_worked,
    role_on_job
) {
    const updated = await repo.updateLeadEmployee(
        lead_id,
        employee_id,
        hours_worked,
        role_on_job
    );

    if (!updated) {
        throw new Error('Employee not assigned to this lead');
    }

    return updated;
}

export async function removeEmployeeFromLead(lead_id, employee_id) {
    const removed = await repo.removeEmployeeFromLead(lead_id, employee_id);
    if (!removed) {
        throw new Error('Employee not assigned to this lead');
    }
    return removed;
}