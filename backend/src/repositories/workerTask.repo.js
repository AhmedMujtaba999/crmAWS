import { pool } from '../config/db.js';

export async function getWorkerTasksByEmpDateStatus(empId, date, status) {
    const query = `
    SELECT
      t.id              AS task_id,
      t.title           AS task_title,
      t.description     AS task_description,
      t.status          AS task_status,
      t.due_date        AS task_date,
      t.created_at      AS task_created_at,

      l.id              AS lead_id,
      l.status          AS lead_status,
      l.source          AS lead_source,

      c.id              AS customer_id,
      c.name            AS customer_name,
      c.phone           AS customer_phone,
      c.email           AS customer_email,
      c.address         AS customer_address,

      COALESCE(
        json_agg(
          json_build_object(
            'service_id', s.id,
            'service_name', s.name,
            'quantity', ls.quantity,
            'unit_price', ls.unit_price,
            'total_price', ls.total_price
          )
        ) FILTER (WHERE s.id IS NOT NULL),
        '[]'::json
      ) AS services
    FROM tasks t
    JOIN leads l ON l.id = t.lead_id
    LEFT JOIN customers c ON c.id = l.customer_id
    LEFT JOIN lead_services ls ON ls.lead_id = l.id
    LEFT JOIN services s ON s.id = ls.service_id
    WHERE
      t.employee_id = $1
      AND t.due_date = $2::date
      AND t.status = $3
    GROUP BY
      t.id, l.id, c.id
    ORDER BY t.due_date ASC, t.created_at DESC;
  `;

    const { rows } = await pool.query(query, [empId, date, status]);
    return rows;
}


export async function getTasksByEmpAndStatus(empId, status) {
    const query = `
        SELECT
            t.id              AS task_id,
            t.title           AS task_title,
            t.description     AS task_description,
            t.status          AS task_status,
            t.due_date        AS task_date,
            t.created_at      AS task_created_at,

            l.id              AS lead_id,
            l.status          AS lead_status,
            l.source          AS lead_source,

            c.id              AS customer_id,
            c.name            AS customer_name,
            c.phone           AS customer_phone,
            c.email           AS customer_email,
            c.address         AS customer_address,

            COALESCE(
                json_agg(
                    json_build_object(
                        'service_id', s.id,
                        'service_name', s.name,
                        'quantity', ls.quantity,
                        'unit_price', ls.unit_price,
                        'total_price', ls.total_price
                    )
                ) FILTER (WHERE s.id IS NOT NULL),
                '[]'::json
            ) AS services

        FROM tasks t
        JOIN leads l ON l.id = t.lead_id
        LEFT JOIN customers c ON c.id = l.customer_id
        LEFT JOIN lead_services ls ON ls.lead_id = l.id
        LEFT JOIN services s ON s.id = ls.service_id

        WHERE
            t.employee_id = $1
            AND t.status = $2

        GROUP BY
            t.id, l.id, c.id

        ORDER BY
            t.due_date DESC,
            t.created_at DESC;
    `;

    const { rows } = await pool.query(query, [empId, status]);
    return rows;
}