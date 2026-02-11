
// src/repositories/organization.repo.js

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