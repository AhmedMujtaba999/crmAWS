import { pool } from '../config/db.js';

export async function getWorkerTasksByEmpDateStatus(
  empId,
  date,
  status,
  organization_id
) {
  const { rows } = await pool.query(
    `
    SELECT
        t.id,
        t.title,
        t.description,
        t.status,
        t.due_date,
        t.created_at,

        l.id AS lead_id,

        c.name AS customer_name,
        c.phone,
        c.email,

        -- ✅ services aggregated per task
        COALESCE(
          json_agg(
            json_build_object(
              'service_id', ls.service_id,
              'quantity', ls.quantity,
              'unit_price', ls.unit_price,
              'total_price', ls.total_price,
              'type', ls.type
            )
          ) FILTER (WHERE ls.service_id IS NOT NULL),
          '[]'::json
        ) AS services

    FROM tasks t
    JOIN leads l
      ON (t.organization_id, t.lead_id) = (l.organization_id, l.id)

    LEFT JOIN customers c
      ON (l.organization_id, l.customer_id) = (c.organization_id, c.id)

    LEFT JOIN lead_services ls
      ON ls.lead_id = l.id   -- ✅ FIXED HERE

    WHERE t.employee_id = $1
      AND t.organization_id = $4
      AND t.due_date = $2
      AND t.status = $3

    GROUP BY
        t.id,
        l.id,
        c.id

    ORDER BY t.created_at DESC
    `,
    [empId, date, status, organization_id]
  );

  return rows;
}

export async function getTasksByEmpAndStatus(empId, status) {
  const { rows } = await pool.query(
    `
        SELECT *
        FROM tasks
        WHERE employee_id = $1
          AND status = $2
        ORDER BY created_at DESC
        `,
    [empId, status]
  );

  return rows;
}