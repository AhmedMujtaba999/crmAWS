import * as taskService from '../services/task.service.js';

export async function createTask(req, res, next) {
    try {
        const task = await taskService.createTask(req.body);
        res.status(201).json(task);
    } catch (err) {
        next(err);
    }
}

export async function getAllTasks(req, res, next) {
    try {
        const tasks = await taskService.getAllTasks();
        res.json(tasks);
    } catch (err) {
        next(err);
    }
}

export async function getTaskById(req, res, next) {
    try {
        const task = await taskService.getTaskById(req.params.id);
        res.json(task);
    } catch (err) {
        next(err);
    }
}

export async function updateTask(req, res, next) {
    try {
        const task = await taskService.updateTask(req.params.id, req.body);
        res.json(task);
    } catch (err) {
        next(err);
    }
}

export async function deleteTask(req, res, next) {
    try {
        await taskService.deleteTask(req.params.id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}