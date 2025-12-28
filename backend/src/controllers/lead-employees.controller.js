import * as service from '../services/lead-employees.service.js';

export async function addEmployee(req, res, next) {
    try {
        const record = await service.addEmployeeToLead(req.body);
        res.status(201).json(record);
    } catch (err) {
        next(err);
    }
}

export async function getAll(req, res, next) {
    try {
        res.json(await service.getAllLeadEmployees());
    } catch (err) {
        next(err);
    }
}

export async function getByLead(req, res, next) {
    try {
        res.json(await service.getEmployeesByLead(req.params.leadId));
    } catch (err) {
        next(err);
    }
}

export async function updateEmployee(req, res, next) {
    try {
        const updated = await service.updateLeadEmployee(
            req.params.leadId,
            req.params.employeeId,
            req.body.hours_worked,
            req.body.role_on_job
        );
        res.json(updated);
    } catch (err) {
        next(err);
    }
}

export async function removeEmployee(req, res, next) {
    try {
        await service.removeEmployeeFromLead(
            req.params.leadId,
            req.params.employeeId
        );
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}