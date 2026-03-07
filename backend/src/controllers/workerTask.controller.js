import * as workerTaskService from '../services/workerTask.service.js';

/**
 * POST /workertaskui
 */
export async function createWorkerTask(req, res) {
    try {
        const organization_id = req.user.organization_id;
        const emp_id = req.user.employee_id;
        const result = await workerTaskService.createWorkerTask({
            ...req.body,
            emp_id,
            organization_id
        });

        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
}

/**
 * GET /workertaskui/:empId/:date/:status
 */
export async function getWorkerTasksByEmpDateStatus(req, res, next) {
    try {
        const empId = req.user.employee_id
        const { date, status } = req.params;
        const organization_id = req.user.organization_id;

        const data = await workerTaskService.getWorkerTasksByEmpDateStatus({
            empId,
            date,
            status,
            organization_id
        });

        res.json(data);
    } catch (err) {
        next(err);
    }
}

/**
 * GET /workertaskui/history/:empId
 */
export async function getWorkerTaskHistory(req, res, next) {
    try {
        const empId = req.user.employee_id;
        const organization_id = req.user.organization_id;

        const { start, end } = req.query;

        const data = await workerTaskService.getWorkerTaskHistory({
            empId,
            organization_id,
            start,
            end
        });

        res.json({
            success: true,
            count: data.length,
            tasks: data
        });

    } catch (err) {
        next(err);
    }
}
/**
 * PATCH /workertaskui/:taskId
 */
export async function updateWorkerTask(req, res, next) {
    try {
        const { taskId } = req.params;
        const organization_id = req.user.organization_id;

        const {
            status,
            send_invoice,
            send_pictures
        } = req.body;

        const result = await workerTaskService.updateWorkerTaskCompleted({
            taskId,
            status,
            send_invoice,
            send_pictures,
            organization_id
        });

        res.json({
            success: true,
            task: result
        });

    } catch (err) {
        next(err);
    }
}

// PUT /workertaskui/:taskId
export async function updateFullWorkerTask(req, res, next) {
    try {
        const emp_id = req.user.employee_id;
        const organization_id = req.user.organization_id;

        const result = await workerTaskService.updateFullWorkerTask(
            req.params.taskId,
            {
                ...req.body,
                emp_id,
                organization_id
            }
        );

        res.json(result);
    } catch (err) {
        next(err);
    }
}