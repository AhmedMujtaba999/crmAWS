import * as employeeRepo from '../repositories/employee.repo.js';

export async function createEmployee(data) {
    return employeeRepo.createEmployee(data);
}

export async function getAllEmployees() {
    return employeeRepo.getAllEmployees();
}

export async function getEmployeeById(id) {
    const employee = await employeeRepo.getEmployeeById(id);
    if (!employee) throw new Error('Employee not found');
    return employee;
}

export async function updateEmployee(id, data) {
    const updated = await employeeRepo.updateEmployee(id, data);
    if (!updated) throw new Error('Employee not found');
    return updated;
}

export async function deleteEmployee(id) {
    const deleted = await employeeRepo.deleteEmployee(id);
    if (!deleted) throw new Error('Employee not found');
    return deleted;
}