import * as repo from "../repositories/employeeLeave.repo.js";

export async function createLeave(data) {

    return await repo.createLeave(data);

}

export async function getLeaves(user) {

    return await repo.getLeaves(user.organization_id);

}

export async function deleteLeave(id) {

    await repo.deleteLeave(id);

}