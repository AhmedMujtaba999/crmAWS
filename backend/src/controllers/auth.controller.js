import * as service from '../services/employeeAuth.service.js';

export async function registerEmployee(req, res, next) {
    try {
        const data = await service.registerEmployee(req.body);
        res.status(201).json(data);
    } catch (err) {
        next(err);
    }
}

export async function loginEmployee(req, res, next) {
    try {
        const data = await service.loginEmployee(req.body);
        res.json(data);
    } catch (err) {
        next(err);
    }
}