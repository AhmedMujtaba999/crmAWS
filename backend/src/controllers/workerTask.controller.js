import * as service from '../services/workerTask.service.js';
import * as workerTaskService from '../services/workerTask.service.js';
import { updateWorkerTaskStatus } from '../services/workerTask.service.js';

export async function createWorkerTask(req, res) {
    try {
        const result = await service.createWorkerTask(req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
}

export async function getWorkerTasksByEmpDateStatus(req, res, next) {
    try {
        const { empId, date, status } = req.params;

        const data = await workerTaskService.getWorkerTasksByEmpDateStatus({
            empId,
            date,
            status
        });

        res.json(data);
    } catch (err) {
        next(err);
    }
}

export async function getWorkerTaskHistory(req, res, next) {
    try {
        const { empId } = req.params;

        const data = await workerTaskService.getWorkerTaskHistory(empId);

        res.json({
            success: true,
            count: data.length,
            tasks: data
        });
    } catch (err) {
        next(err);
    }
}

export async function updateWorkerTask(req, res, next) {
    try {
        const { taskId } = req.params;

        const {
            status,
            send_invoice,
            send_pictures
        } = req.body;

        const result = await updateWorkerTaskStatus({
            taskId,
            status,
            send_invoice,
            send_pictures
        });

        res.json({
            success: true,
            task: result
        });

    } catch (err) {
        next(err);
    }
}