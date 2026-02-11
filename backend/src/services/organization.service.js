import { pool } from "../config/db.js";
import * as organizationRepo from "../repositories/organization.repo.js";

export async function createOrganization(payload) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const org = await organizationRepo.createOrganizationClient(
            client,
            payload
        );

        await client.query("COMMIT");

        return org;
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

export async function getAllOrganizations() {
    const client = await pool.connect();

    try {
        return await organizationRepo.getAllOrganizationsClient(client);
    } finally {
        client.release();
    }
}

export async function getOrganizationById(organization_id) {
    if (!organization_id) {
        throw new Error("organization_id is required");
    }

    const client = await pool.connect();

    try {
        const org = await organizationRepo.getOrganizationByIdClient(
            client,
            organization_id
        );

        if (!org) {
            throw new Error("Organization not found");
        }

        return org;

    } finally {
        client.release();
    }
}

export async function updateOrganization(organization_id, payload) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const org = await organizationRepo.updateOrganizationClient(
            client,
            organization_id,
            payload
        );

        if (!org) throw new Error("Organization not found");

        await client.query("COMMIT");

        return org;
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}