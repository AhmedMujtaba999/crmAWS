// src/repositories/leadActivity.repo.js

// src/repositories/leadActivity.repo.js


//from service layer do this ->
// await leadActivityRepo.createClient(client, {
//     lead_id: lead.id,
//     organization_id,
//     action_type: "STATUS_CHANGED",
//     old_value: oldStatus,
//     new_value: newStatus,
//     notes: "Customer is price sensitive",
//     performed_by: emp_id,
//     action_metadata: {
//         objection_type: "PRICE",
//         urgency: "LOW",
//         follow_up_days: 3
//     }
// });

// src/repositories/leadActivity.repo.js

export async function createClient(
    client,
    lead_id,
    organization_id,
    action_type,
    old_value = null,
    new_value = null,
    notes = null,
    performed_by = null,
    action_metadata = {}   // 👈 NEW

) {
    if (!lead_id) throw new Error("lead_id is required");
    if (!organization_id) throw new Error("organization_id is required");
    if (!action_type) throw new Error("action_type is required");

    const { rows } = await client.query(
        `
    INSERT INTO lead_activity (
      lead_id,
      organization_id,
      action_type,
      old_value,
      new_value,
      notes,
      performed_by,
      action_metadata
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *
    `,
        [
            lead_id,
            organization_id,
            action_type,
            old_value,
            new_value,
            notes,
            performed_by,
            action_metadata  // 👈 JSON object passed directly
        ]
    );

    return rows[0];
}

export async function getByLeadIdClient(
    client,
    lead_id,
    organization_id
) {
    if (!lead_id) throw new Error("lead_id is required");
    if (!organization_id) throw new Error("organization_id is required");

    const { rows } = await client.query(
        `
    SELECT
      la.id,
      la.action_type,
      la.old_value,
      la.new_value,
      la.notes,
      la.performed_by,
      la.performed_at,
      la.action_metadata  -- 👈 include metadata
    FROM lead_activity la
    WHERE la.lead_id = $1
      AND la.organization_id = $2
    ORDER BY la.performed_at DESC
    `,
        [lead_id, organization_id]
    );

    return rows;
}

export async function deleteByLeadIdClient(
    client,
    lead_id,
    organization_id
) {
    if (!lead_id) throw new Error("lead_id is required");
    if (!organization_id) throw new Error("organization_id is required");

    const { rowCount } = await client.query(
        `
    DELETE FROM lead_activity
    WHERE lead_id = $1
      AND organization_id = $2
    `,
        [lead_id, organization_id]
    );

    return rowCount;
}