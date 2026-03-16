import * as repo from "../repositories/companyHoliday.repo.js";

export async function createHoliday(data, user) {

    return await repo.createHoliday({
        organization_id: user.organization_id,
        holiday_date: data.holiday_date,
        holiday_name: data.holiday_name
    });

}

export async function getHolidays(user) {

    return await repo.getHolidays(user.organization_id);

}

export async function deleteHoliday(id, user) {

    await repo.deleteHoliday(id, user.organization_id);

}