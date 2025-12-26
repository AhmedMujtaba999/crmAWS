import * as employeeService from '../services/employee.service.js';

export async function createEmployee(req, res, next) {
    try {
        const employee = await employeeService.createEmployee(req.body);
        res.status(201).json(employee);
    } catch (err) {
        next(err);
    }
}

export async function getAllEmployees(req, res, next) {
    try {
        const employees = await employeeService.getAllEmployees();
        res.json(employees);
    } catch (err) {
        next(err);
    }
}

export async function getEmployeeById(req, res, next) {
    try {
        const employee = await employeeService.getEmployeeById(req.params.id);
        res.json(employee);
    } catch (err) {
        next(err);
    }
}

export async function updateEmployee(req, res, next) {
    try {
        const employee = await employeeService.updateEmployee(
            req.params.id,
            req.body
        );
        res.json(employee);
    } catch (err) {
        next(err);
    }
}

export async function deleteEmployee(req, res, next) {
    try {
        await employeeService.deleteEmployee(req.params.id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}