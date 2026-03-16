import { pool } from '../config/db.js';

export async function getAdminTasks(organization_id) {

    // Unassigned: leads in CLOSED status that have no task created yet.
    // These are leads that were converted (closed) but not yet assigned to an employee.
    // We JOIN customers to show the client name on the card.
    // No employee JOIN needed here — they have no employee yet by definition.
    const unassignedQuery = pool.query(
        `
        SELECT
            l.id                  AS lead_id,
            c.name                AS customer_name,
            c.phone               AS customer_phone,
            c.address             AS customer_address,
            l.notes,
            l.estimated_minutes,
            l.created_at,
            COALESCE(
                (SELECT SUM(ls.total_price)::float
                 FROM lead_services ls
                 WHERE ls.lead_id = l.id),
                0
            ) AS total_estimate
        FROM leads l
        LEFT JOIN tasks t
            ON (l.organization_id, l.id) =
               (t.organization_id, t.lead_id)
        LEFT JOIN customers c
            ON (l.organization_id, l.customer_id) =
               (c.organization_id, c.id)
        WHERE
            l.organization_id = $1
            AND l.status = 'CLOSED'
            AND t.id IS NULL
        ORDER BY l.created_at DESC
        `,
        [organization_id]
    );

    // Pending/Active/Completed: actual task records.
    // We JOIN employees (for assignee name) and then lead → customer (for client name).
    // All JOINs use (organization_id, id) composite key to stay within the tenant's data.
    const pendingQuery = pool.query(
        `
        SELECT
            t.id,
            t.lead_id,
            t.employee_id,
            t.title,
            t.description,
            t.status,
            t.due_date,
            t.estimated_minutes,
            t.organization_id,
            t.created_at,
            t.completed_at,
            e.name         AS employee_name,
            c.name         AS customer_name,
            c.phone        AS customer_phone,
            c.address      AS customer_address
        FROM tasks t
        LEFT JOIN employees e
            ON t.employee_id = e.id
           AND t.organization_id = e.organization_id
        LEFT JOIN leads l
            ON t.lead_id = l.id
           AND t.organization_id = l.organization_id
        LEFT JOIN customers c
            ON l.customer_id = c.id
           AND l.organization_id = c.organization_id
        WHERE t.organization_id = $1
          AND t.status = 'PENDING'
        ORDER BY t.created_at DESC
        `,
        [organization_id]
    );

    const activeQuery = pool.query(
        `
        SELECT
            t.id,
            t.lead_id,
            t.employee_id,
            t.title,
            t.description,
            t.status,
            t.due_date,
            t.estimated_minutes,
            t.organization_id,
            t.created_at,
            t.completed_at,
            e.name         AS employee_name,
            c.name         AS customer_name,
            c.phone        AS customer_phone,
            c.address      AS customer_address
        FROM tasks t
        LEFT JOIN employees e
            ON t.employee_id = e.id
           AND t.organization_id = e.organization_id
        LEFT JOIN leads l
            ON t.lead_id = l.id
           AND t.organization_id = l.organization_id
        LEFT JOIN customers c
            ON l.customer_id = c.id
           AND l.organization_id = c.organization_id
        WHERE t.organization_id = $1
          AND t.status = 'ACTIVE'
        ORDER BY t.created_at DESC
        `,
        [organization_id]
    );

    // Completed: filtered by completed_at (when the task was actually finished),
    // not by due_date (which is only the deadline and is unrelated to completion time).
    // Shows tasks completed within the last 3 days so the board doesn't grow unbounded.
    const completedQuery = pool.query(
        `
        SELECT
            t.id,
            t.lead_id,
            t.employee_id,
            t.title,
            t.description,
            t.status,
            t.due_date,
            t.estimated_minutes,
            t.organization_id,
            t.created_at,
            t.completed_at,
            e.name         AS employee_name,
            c.name         AS customer_name,
            c.phone        AS customer_phone,
            c.address      AS customer_address
        FROM tasks t
        LEFT JOIN employees e
            ON t.employee_id = e.id
           AND t.organization_id = e.organization_id
        LEFT JOIN leads l
            ON t.lead_id = l.id
           AND t.organization_id = l.organization_id
        LEFT JOIN customers c
            ON l.customer_id = c.id
           AND l.organization_id = c.organization_id
        WHERE t.organization_id = $1
          AND t.status = 'COMPLETED'
          AND t.completed_at >= NOW() - INTERVAL '3 days'
        ORDER BY t.completed_at DESC
        `,
        [organization_id]
    );

    const [
        unassigned,
        pending,
        active,
        completed
    ] = await Promise.all([
        unassignedQuery,
        pendingQuery,
        activeQuery,
        completedQuery
    ]);

    return {
        unassigned_tasks: unassigned.rows,
        pending_tasks: pending.rows,
        active_tasks: active.rows,
        completed_tasks: completed.rows
    };
}

// ============================================================
// getScheduleViewData
// ============================================================
// Fetches everything the Assign & Schedule timeline needs for one day.
// Runs 4 independent queries in parallel via Promise.all for performance.
//
// Returns:
//   employees      — active employees with their working hours for the date's weekday
//   holiday        — company_holidays row if this date is a holiday, else null
//   leave_ids      — Set of employee UUIDs who are on approved leave this day
//   scheduled_slots — employee_schedule rows overlapping this date, joined with
//                     task title + customer name + total estimate from lead_services
//
// "overlap" check: scheduled_start < (date + 1 day) AND scheduled_end > date
// This catches multi-day tasks that started on a previous day.
export async function getScheduleViewData(organization_id, date) {

    // Query 1 — Active employees + working hours for this weekday.
    // EXTRACT(DOW FROM ...) returns 0=Sunday, 1=Monday, ..., 6=Saturday.
    // LEFT JOIN ensures employees with no entry for this weekday are still returned
    // (their work_start/work_end will be NULL, meaning no scheduled hours today).
    const employeesQ = pool.query(
        `
        SELECT
            e.id,
            e.name,
            e.employment_type,
            e.role,
            ewh.start_time::text AS work_start,
            ewh.end_time::text   AS work_end
        FROM employees e
        LEFT JOIN employee_working_hours ewh
            ON  ewh.employee_id     = e.id
            AND ewh.organization_id = e.organization_id
            AND ewh.weekday         = EXTRACT(DOW FROM $2::date)::int
        WHERE e.organization_id = $1
          AND e.is_active = true
        ORDER BY e.name
        `,
        [organization_id, date]
    );

    // Query 2 — Is this date a company holiday?
    const holidayQ = pool.query(
        `
        SELECT holiday_name
        FROM company_holidays
        WHERE organization_id = $1
          AND holiday_date = $2::date
        LIMIT 1
        `,
        [organization_id, date]
    );

    // Query 3 — Which employees have an APPROVED leave that covers this date?
    // DISTINCT because an employee could have multiple overlapping leave records.
    const leavesQ = pool.query(
        `
        SELECT DISTINCT employee_id
        FROM employee_leaves
        WHERE organization_id = $1
          AND status     = 'APPROVED'
          AND start_date <= $2::date
          AND end_date   >= $2::date
        `,
        [organization_id, date]
    );

    // Query 4 — All scheduled slots overlapping this date.
    // Overlap condition (standard interval check):
    //   slot starts before end-of-day AND slot ends after start-of-day
    // We JOIN tasks via lead_id (each lead has at most one task) to get the title.
    // Correlated subquery for total_estimate — lead_services has no organization_id.
    const slotsQ = pool.query(
        `
        SELECT
            es.id               AS schedule_id,
            es.employee_id,
            es.lead_id,
            es.scheduled_start,
            es.scheduled_end,
            t.id                AS task_id,
            t.title             AS task_title,
            t.estimated_minutes,
            c.name              AS customer_name,
            COALESCE(
                (SELECT SUM(ls.total_price)::float
                 FROM lead_services ls
                 WHERE ls.lead_id = es.lead_id),
                0
            )                   AS total_estimate
        FROM employee_schedule es
        LEFT JOIN tasks t
            ON  t.lead_id        = es.lead_id
            AND t.organization_id = es.organization_id
        LEFT JOIN leads l
            ON  l.id             = es.lead_id
            AND l.organization_id = es.organization_id
        LEFT JOIN customers c
            ON  c.id             = l.customer_id
            AND c.organization_id = l.organization_id
        WHERE es.organization_id = $1
          AND es.scheduled_start < ($2::date + INTERVAL '1 day')
          AND es.scheduled_end   > $2::date
        ORDER BY es.employee_id, es.scheduled_start
        `,
        [organization_id, date]
    );

    const [employees, holiday, leaves, slots] = await Promise.all([
        employeesQ, holidayQ, leavesQ, slotsQ
    ]);

    return {
        employees:    employees.rows,
        holiday:      holiday.rows[0] ?? null,
        // Set allows O(1) lookup when building the per-employee on_leave flag
        leave_ids:    new Set(leaves.rows.map(r => r.employee_id)),
        scheduled_slots: slots.rows,
    };
}

// ============================================================
// getTaskById
// ============================================================
// Returns a single task enriched with: employee name, customer info,
// and the employee_schedule entry (for scheduled_start / scheduled_end).
// Used by the ScheduledTaskModal on the frontend.
export async function getTaskById(id, organization_id) {

    const { rows } = await pool.query(
        `
        SELECT
            t.id,
            t.lead_id,
            t.employee_id,
            t.title,
            t.description,
            t.status,
            t.due_date,
            t.estimated_minutes,
            t.organization_id,
            t.created_at,
            t.completed_at,
            e.name              AS employee_name,
            c.name              AS customer_name,
            c.phone             AS customer_phone,
            c.address           AS customer_address,
            es.id               AS schedule_id,
            es.scheduled_start,
            es.scheduled_end
        FROM tasks t
        LEFT JOIN employees e
            ON t.employee_id    = e.id
           AND t.organization_id = e.organization_id
        LEFT JOIN leads l
            ON t.lead_id        = l.id
           AND t.organization_id = l.organization_id
        LEFT JOIN customers c
            ON l.customer_id    = c.id
           AND l.organization_id = c.organization_id
        LEFT JOIN employee_schedule es
            ON es.lead_id       = t.lead_id
           AND es.organization_id = t.organization_id
        WHERE t.id              = $1
          AND t.organization_id = $2
        LIMIT 1
        `,
        [id, organization_id]
    );

    return rows[0] ?? null;
}

// ============================================================
// updateTask
// ============================================================
// Updates the mutable fields of a task AND reschedules the
// employee_schedule entry to match the new start + duration.
// Returns the updated task row.
export async function updateTask(id, organization_id, data) {

    const newStart = new Date(data.scheduled_start);
    const newEnd   = new Date(newStart.getTime() + data.estimated_minutes * 60000);

    const { rows } = await pool.query(
        `
        UPDATE tasks
        SET title             = $1,
            description       = $2,
            estimated_minutes = $3,
            due_date          = $4,
            updated_at        = NOW()
        WHERE id              = $5
          AND organization_id = $6
        RETURNING *
        `,
        [data.title, data.description, data.estimated_minutes, newStart, id, organization_id]
    );

    if (!rows[0]) return null;

    // Also update the employee_schedule row for this lead so the timeline stays accurate
    await pool.query(
        `
        UPDATE employee_schedule
        SET scheduled_start = $1,
            scheduled_end   = $2
        WHERE lead_id        = $3
          AND organization_id = $4
        `,
        [newStart, newEnd, rows[0].lead_id, organization_id]
    );

    return rows[0];
}

// ============================================================
// reassignTask
// ============================================================
// Changes the employee assigned to a task, updating both the
// tasks table and the employee_schedule entry.
export async function reassignTask(id, organization_id, new_employee_id) {

    const { rows } = await pool.query(
        `
        UPDATE tasks
        SET employee_id       = $1,
            updated_at        = NOW()
        WHERE id              = $2
          AND organization_id = $3
        RETURNING *
        `,
        [new_employee_id, id, organization_id]
    );

    if (!rows[0]) return null;

    await pool.query(
        `
        UPDATE employee_schedule
        SET employee_id       = $1
        WHERE lead_id         = $2
          AND organization_id = $3
        `,
        [new_employee_id, rows[0].lead_id, organization_id]
    );

    return rows[0];
}

// ============================================================
// deleteTask
// ============================================================
// Deletes the task AND its employee_schedule entry.
// After deletion the lead's status remains CLOSED — so it will
// reappear in the "Unassigned" kanban column automatically
// (admin_tasks query filters: CLOSED leads with no task row).
export async function deleteTask(id, organization_id) {

    // Step 1: get the lead_id so we can clean up the schedule entry
    const { rows: taskRows } = await pool.query(
        `SELECT lead_id FROM tasks WHERE id = $1 AND organization_id = $2`,
        [id, organization_id]
    );

    if (!taskRows[0]) return null;

    const lead_id = taskRows[0].lead_id;

    // Step 2: delete schedule entry first (FK may reference task)
    await pool.query(
        `DELETE FROM employee_schedule WHERE lead_id = $1 AND organization_id = $2`,
        [lead_id, organization_id]
    );

    // Step 3: delete the task
    const { rows } = await pool.query(
        `DELETE FROM tasks WHERE id = $1 AND organization_id = $2 RETURNING *`,
        [id, organization_id]
    );

    return rows[0] ?? null;
}
