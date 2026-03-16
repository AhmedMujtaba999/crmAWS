import * as service from "../services/employeeWorkingHours.service.js";

export async function createWorkingHours(req, res, next) {

    try {

        const hours = await service.createWorkingHours(
            req.body,
            req.user
        );

        res.json({
            success: true,
            hours
        });

    } catch (err) {
        next(err);
    }
}

export async function getWorkingHours(req, res, next) {

    try {

        const hours = await service.getWorkingHours(
            req.params.employee_id,
            req.user
        );

        res.json({
            success: true,
            hours
        });

    } catch (err) {
        next(err);
    }
}

export async function updateWorkingHours(req, res, next) {

    try {

        const hours = await service.updateWorkingHours(req.params.id, req.body);

        if (!hours) {
            return res.status(404).json({ success: false, error: 'Working hours entry not found' });
        }

        res.json({ success: true, hours });

    } catch (err) {
        next(err);
    }
}

export async function deleteWorkingHours(req, res, next) {

    try {

        await service.deleteWorkingHours(req.params.id);

        res.json({
            success: true
        });

    } catch (err) {
        next(err);
    }
}