import * as service from '../services/employee-leaves.service.js';

export async function create(req, res, next) {
    try {
        const leave = await service.createLeave(req.body);
        res.status(201).json(leave);
    } catch (err) {
        next(err);
    }
}

export async function getAll(req, res, next) {
    try {
        res.json(await service.getAllLeaves());
    } catch (err) {
        next(err);
    }
}

export async function getByEmployee(req, res, next) {
    try {
        res.json(await service.getLeavesByEmployee(req.params.employeeId));
    } catch (err) {
        next(err);
    }
}

export async function update(req, res, next) {
    try {
        const updated = await service.updateLeave(req.params.id, req.body);
        res.json(updated);
    } catch (err) {
        next(err);
    }
}

export async function remove(req, res, next) {
    try {
        await service.deleteLeave(req.params.id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}