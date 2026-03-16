import * as service from "../services/employeeLeave.service.js";

export async function createLeave(req, res, next) {

    try {

        const leave = await service.createLeave(req.body);

        res.json({
            success: true,
            leave
        });

    } catch (err) {
        next(err);
    }
}

export async function getLeaves(req, res, next) {

    try {

        const leaves = await service.getLeaves(req.user);

        res.json({
            success: true,
            leaves
        });

    } catch (err) {
        next(err);
    }
}

export async function deleteLeave(req, res, next) {

    try {

        await service.deleteLeave(req.params.id);

        res.json({
            success: true
        });

    } catch (err) {
        next(err);
    }
}