import * as service from "../services/companyHoliday.service.js";

export async function createHoliday(req, res, next) {

    try {

        const holiday = await service.createHoliday(
            req.body,
            req.user
        );

        res.json({
            success: true,
            holiday
        });

    } catch (err) {
        next(err);
    }
}

export async function getHolidays(req, res, next) {

    try {

        const holidays = await service.getHolidays(req.user);

        res.json({
            success: true,
            holidays
        });

    } catch (err) {
        next(err);
    }
}

export async function deleteHoliday(req, res, next) {

    try {

        await service.deleteHoliday(
            req.params.id,
            req.user
        );

        res.json({
            success: true
        });

    } catch (err) {
        next(err);
    }
}