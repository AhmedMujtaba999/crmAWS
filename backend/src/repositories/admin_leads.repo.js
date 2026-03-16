import { pool } from '../config/db.js';

export async function getAdminLeadsList(organization_id) {
    if (!organization_id) {
        throw new Error('organization_id is required');
    }

    const { rows } = await pool.query(
        `
    SELECT
      l.id AS lead_id,
      c.name,
      c.phone,
      c.email,
      c.address,
      l.source,
      l.status,
      l.status_detail,
      l.estimated_minutes,
      l.created_at,
      (SELECT COUNT(*)::integer FROM lead_services WHERE lead_id = l.id) AS services_count

    FROM leads l
    LEFT JOIN customers c
      ON (l.organization_id, l.customer_id)
      = (c.organization_id, c.id)

    WHERE l.organization_id = $1

    ORDER BY l.created_at DESC
    `,
        [organization_id]
    );

    return rows;
}

export async function getAdminCustomerFullLeadHistory(
    lead_id,
    organization_id
) {
    if (!lead_id) throw new Error("lead_id is required");
    if (!organization_id) throw new Error("organization_id is required");

    const { rows } = await pool.query(
        `
    WITH base AS (
      SELECT customer_id
      FROM leads
      WHERE id = $1
        AND organization_id = $2
      LIMIT 1
    )

    SELECT
      l.id AS lead_id,
      l.status,
      l.status_detail,
      l.source,
      l.notes,
      l.created_at AS lead_created_at,

      -- Services per lead
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'service_id', ls.service_id,
            'service_name', s.name,
            'quantity', ls.quantity,
            'unit_price', ls.unit_price,
            'total_price', ls.total_price,
            'type', ls.type
          )
        ) FILTER (WHERE ls.service_id IS NOT NULL),
        '[]'
      ) AS services,

      COALESCE(SUM(ls.total_price), 0) AS total_estimate,

      -- Task info (if converted)
      t.id AS task_id,
      t.title AS task_title,
      t.description AS task_description,
      t.status AS task_status,
      t.due_date,

      -- Invoice info (if exists)
      i.id AS invoice_id,
      i.invoice_number,
      i.total_amount,
      i.status AS invoice_status,
      i.issued_at AS invoice_issued_at,
      i.paid_at

    FROM base b

    JOIN leads l
      ON l.customer_id = b.customer_id
     AND l.organization_id = $2

    LEFT JOIN lead_services ls
      ON l.id = ls.lead_id

    -- join services table to get service name
    LEFT JOIN services s
      ON (l.organization_id, ls.service_id)
      = (s.organization_id, s.id)

    LEFT JOIN tasks t
      ON (l.organization_id, l.id)
      = (t.organization_id, t.lead_id)

    LEFT JOIN invoices i
      ON (l.organization_id, l.id)
      = (i.organization_id, i.lead_id)

    GROUP BY
      l.id,
      t.id,
      i.id

    ORDER BY l.created_at DESC
    `,
        [lead_id, organization_id]
    );

    return rows;
}


// src/repositories/adminLeads.repo.js
export async function getAdminCustomerLeadHistoryByLeadId(lead_id, organization_id) {
    if (!lead_id) throw new Error("lead_id is required");
    if (!organization_id) throw new Error("organization_id is required");

    const { rows } = await pool.query(
        `
    WITH base AS (
      SELECT customer_id
      FROM leads
      WHERE id = $1 AND organization_id = $2
      LIMIT 1
    )
    SELECT
      l.id           AS lead_id,
      l.source,
      l.status,
      l.status_detail,
      l.notes        AS lead_notes,
      l.created_at   AS lead_created_at,

      -- Task may not exist (lead not converted)
      t.id           AS task_id,
      t.title        AS task_title,
      t.description  AS task_description,
      t.status       AS task_status,
      t.due_date     AS task_due_date,
      t.created_at   AS task_created_at,

      -- Invoice may not exist
      i.id           AS invoice_id,
      i.invoice_number,
      i.total_amount,
      i.status       AS invoice_status,
      i.pdf_url,
      i.upload_status AS invoice_upload_status,
      i.issued_at,

      -- Services for this lead (may be empty)
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'service_id', ls.service_id,
            'quantity', ls.quantity,
            'unit_price', ls.unit_price,
            'total_price', ls.total_price,
            'type', ls.type
          )
        ) FILTER (WHERE ls.service_id IS NOT NULL),
        '[]'::json
      ) AS services

    FROM base b
    JOIN leads l
      ON l.organization_id = $2
     AND l.customer_id = b.customer_id

    LEFT JOIN tasks t
      ON (t.organization_id, t.lead_id) = (l.organization_id, l.id)

    LEFT JOIN invoices i
      ON (i.organization_id, i.lead_id) = (l.organization_id, l.id)

    LEFT JOIN lead_services ls
      ON ls.lead_id = l.id

    GROUP BY
      l.id,
      t.id,
      i.id

    ORDER BY
      l.created_at DESC,
      t.created_at DESC NULLS LAST,
      i.issued_at DESC NULLS LAST
    `,
        [lead_id, organization_id]
    );

    return rows;
}