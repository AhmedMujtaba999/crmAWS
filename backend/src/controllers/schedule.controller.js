import * as scheduleService from "../services/schedule.service.js";

export async function createSchedule(req, res, next) {

    try {

        const schedule = await scheduleService.createSchedule(
            req.body,
            req.user
        );

        res.json({
            success: true,
            schedule
        });

    } catch (err) {
        next(err);
    }
}


export async function getSchedules(req, res, next) {

    try {

        const date = req.query.date;

        const schedules =
            await scheduleService.getSchedules(
                date,
                req.user
            );

        res.json({
            success: true,
            schedules
        });

    } catch (err) {
        next(err);
    }
}


export async function updateSchedule(req, res, next) {

    try {

        const schedule =
            await scheduleService.updateSchedule(
                req.params.id,
                req.body
            );

        res.json({
            success: true,
            schedule
        });

    } catch (err) {
        next(err);
    }
}


export async function deleteSchedule(req, res, next) {

    try {

        await scheduleService.deleteSchedule(req.params.id);

        res.json({
            success: true
        });

    } catch (err) {
        next(err);
    }
}