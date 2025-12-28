import * as service from '../services/employee-schedule.service.js';

export async function create(req, res, next) {
    try {
        const schedule = await service.createSchedule(req.body);
        res.status(201).json(schedule);
    } catch (err) {
        next(err);
    }
}

export async function getAll(req, res, next) {
    try {
        res.json(await service.getAllSchedules());
    } catch (err) {
        next(err);
    }
}

export async function getByEmployee(req, res, next) {
    try {
        res.json(await service.getScheduleByEmployee(req.params.employeeId));
    } catch (err) {
        next(err);
    }
}

export async function update(req, res, next) {
    try {
        const updated = await service.updateSchedule(req.params.id, req.body);
        res.json(updated);
    } catch (err) {
        next(err);
    }
}

export async function remove(req, res, next) {
    try {
        await service.deleteSchedule(req.params.id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}