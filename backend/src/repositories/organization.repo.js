
// src/repositories/organization.repo.js

export async function createOrganizationClient(client, data) {
    const {
        name,
        type,
        status = "ACTIVE",
        contact_emails = {},
        phones = {},
    } = data;

    if (!name) throw new Error("Organization name is required");
    if (!type) throw new Error("Organization type is required");

    const { rows } = await client.query(
        `
        INSERT INTO organizations
        (name, type, status, contact_emails, phones)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        `,
        [name, type, status, contact_emails, phones]
    );

    return rows[0];
}

export async function getAllOrganizationsClient(client) {
    const { rows } = await client.query(
        `
        SELECT id, name, type, status, contact_emails, phones, created_at
        FROM organizations
        ORDER BY created_at DESC
        `
    );

    return rows;
}

export async function getOrganizationByIdClient(
    client,
    organization_id
) {
    if (!organization_id) {
        throw new Error('organization_id is required');
    }

    const { rows } = await client.query(
        `
    SELECT
      id,
      name,
      type,
      status,
      contact_emails,
      phones
    FROM organizations
    WHERE id = $1
    `,
        [organization_id]
    );

    return rows[0] ?? null;
}

export async function updateOrganizationClient(
    client,
    organization_id,
    data
) {
    if (!organization_id)
        throw new Error("organization_id is required");

    const {
        name,
        type,
        status,
        contact_emails,
        phones,
    } = data;

    const { rows } = await client.query(
        `
        UPDATE organizations
        SET
            name = $1,
            type = $2,
            status = $3,
            contact_emails = $4,
            phones = $5
        WHERE id = $6
        RETURNING *
        `,
        [name, type, status, contact_emails, phones, organization_id]
    );

    return rows[0];
}