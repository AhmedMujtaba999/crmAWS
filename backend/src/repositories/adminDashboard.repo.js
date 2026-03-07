// ============================================================
// adminDashboard.repo.js — Repository Layer
// ============================================================
// This file is part of the REPOSITORY layer in our architecture:
//   Routes → Controllers → Services → [REPOSITORIES] → PostgreSQL
//
// The repository layer has ONE job: talk to the database.
// No business logic, no HTTP, no decision-making — just SQL queries.
//
// We import the shared PostgreSQL connection pool from config/db.js.
// The pool manages multiple simultaneous database connections so the
// server can handle many requests at once without bottlenecking.
// ============================================================

import { pool } from '../config/db.js'; // 'pool' is the shared PostgreSQL connection manager


// ============================================================
// FUNCTION 1: getDashboardStats
// ============================================================
// Purpose: Returns a single row of aggregate counts for the dashboard
// stats cards — total employees, customers, leads, and task breakdowns
// for today. All scoped to the current organization.
//
// Why one query instead of multiple?
// We use PostgreSQL subqueries inside a SELECT so the database does
// all the counting in one round trip. Making 5 separate queries would
// be 5 round trips to AWS RDS — slower and wasteful.
//
// SQL concept — subquery: a SELECT inside another SELECT.
// Example: (SELECT COUNT(*) FROM employees WHERE ...) AS total_employees
// PostgreSQL runs that inner SELECT and puts its result as a column value.
//
// The ::int at the end of each subquery is PostgreSQL type casting —
// COUNT() returns a "bigint" type by default, which Node.js receives
// as a string. Casting to int makes it arrive as a proper JS number.
// ============================================================

export async function getDashboardStats(organization_id) {

  // pool.query() sends SQL to PostgreSQL and waits for the result.
  // We destructure { rows } from the result — rows is always an array.
  // For this query, rows will have exactly ONE item: rows[0].
  const { rows } = await pool.query(
    `
    SELECT
      (SELECT COUNT(*) FROM employees WHERE organization_id = $1 AND is_active = true)::int AS total_employees,
      (SELECT COUNT(*) FROM customers WHERE organization_id = $1)::int                      AS total_customers,
      (SELECT COUNT(*) FROM leads WHERE organization_id = $1)::int                          AS total_leads,
      (SELECT COUNT(*) FROM tasks WHERE organization_id = $1 AND due_date = CURRENT_DATE)::int AS tasks_today_total,
      (SELECT COUNT(*) FROM tasks WHERE organization_id = $1 AND due_date = CURRENT_DATE AND status = 'COMPLETED')::int AS tasks_today_completed,
      (SELECT COUNT(*) FROM tasks WHERE organization_id = $1 AND due_date = CURRENT_DATE AND status = 'ACTIVE')::int    AS tasks_today_active,
      (SELECT COUNT(*) FROM tasks WHERE organization_id = $1 AND due_date = CURRENT_DATE AND status = 'PENDING')::int   AS tasks_today_pending
    `,
    [organization_id]
  );

  // rows[0] is the single result row. It will look like:
  // { total_employees: 5, total_customers: 12, tasks_today_total: 8, ... }
  return rows[0];
}


// ============================================================
// FUNCTION 2: getRecentTasks
// ============================================================
// Purpose: Returns the most recent tasks across ALL employees in the org.
// Used in the dashboard's "Recent Tasks" table widget.
//
// SQL concept — JOIN:
// Our data is split across multiple tables (tasks, leads, customers, employees).
// A JOIN combines rows from different tables where a condition matches.
// Example: JOIN leads l ON l.id = t.lead_id
// This says: "for each task row, find the lead row whose id matches
// the task's lead_id, and merge their columns together."
//
// We use LEFT JOIN for employees because a task might not have an assigned
// employee yet (employee_id could be null). LEFT JOIN still returns the task
// row even if no employee matches — employee_name just comes back as null.
// A regular JOIN would drop that task row entirely.
//
// Parameters:
//   organization_id — scopes everything to one org (multi-tenancy)
//   limit — how many tasks to return (default 10, for the dashboard widget)
// ============================================================

export async function getRecentTasks(organization_id, limit = 10) {

  const { rows } = await pool.query(
    `
    SELECT
      t.id,
      t.title,
      t.status,
      t.due_date,
      t.created_at,
      c.name AS customer_name,
      e.name AS employee_name
    FROM tasks t
    JOIN leads l ON l.id = t.lead_id AND l.organization_id = t.organization_id
    JOIN customers c ON c.id = l.customer_id AND c.organization_id = t.organization_id
    LEFT JOIN employees e ON e.id = t.employee_id AND e.organization_id = t.organization_id
    WHERE t.organization_id = $1
    ORDER BY t.created_at DESC
    LIMIT $2
    `,
    [organization_id, limit]
  );

  return rows; // Array of task objects with customer_name and employee_name merged in
}


// ============================================================
// FUNCTION 3: getAdminTasks
// ============================================================
// Purpose: Returns a PAGINATED, FILTERABLE list of all tasks for the org.
// This powers the main Tasks management page in the admin UI.
//
// Why pagination?
// An org could have thousands of tasks. Returning all of them at once
// would be slow and waste bandwidth. Pagination means we return e.g.
// 20 tasks at a time, and the frontend requests the next 20 when needed.
//
// How pagination works in SQL:
//   LIMIT 20         → return maximum 20 rows
//   OFFSET 40        → skip the first 40 rows (so we get rows 41-60, i.e. page 3)
//   Formula: OFFSET = (page - 1) * limit
//
// How dynamic filters work:
// We build the WHERE clause dynamically based on which filters are provided.
// We push SQL condition strings into a 'conditions' array, and push the
// corresponding values into a 'params' array. Then we join conditions with AND.
//
// Why a separate count query?
// The frontend needs to know TOTAL matching tasks to show "Page 2 of 14".
// The main query has LIMIT/OFFSET so it only returns one page.
// We run a second COUNT query (without LIMIT/OFFSET) to get the total.
//
// Parameters (all optional except organization_id):
//   organization_id — required, scopes to org
//   status          — e.g. 'ACTIVE', 'COMPLETED', 'PENDING'
//   employee_id     — filter by assigned employee
//   date_from       — tasks with due_date >= this date
//   date_to         — tasks with due_date <= this date
//   page            — which page (default 1)
//   limit           — how many per page (default 20)
// ============================================================

export async function getAdminTasks({
  organization_id,
  status,
  employee_id,
  date_from,
  date_to,
  page = 1,    // default to page 1 if not provided
  limit = 20   // default to 20 per page if not provided
}) {

  // Calculate how many rows to skip.
  // Page 1: skip 0.  Page 2: skip 20.  Page 3: skip 40. etc.
  const offset = (page - 1) * limit;

  // We always filter by organization — non-negotiable for multi-tenancy.
  // $1 is always organization_id. $2 and $3 are reserved for LIMIT and OFFSET.
  // Optional filters start at $4.
  const conditions = ['t.organization_id = $1'];

  // dataParams holds values for the main paginated query ($1=org, $2=limit, $3=offset)
  const dataParams = [organization_id, limit, offset];

  // countParams holds values for the COUNT query (no limit/offset, starts at $1=org)
  const countParams = [organization_id];

  // These track the next available $N index for each query separately
  let dataIdx = 4;  // data query next param index (1,2,3 are taken)
  let countIdx = 2; // count query next param index (1 is taken)

  // Dynamically add each optional filter only if a value was provided.
  // Each block adds a condition string + pushes the value into both param arrays.

  if (status) {
    conditions.push(`t.status = $${dataIdx++}`);
    dataParams.push(status);
    countParams.push(status);
    countIdx++;
  }

  if (employee_id) {
    conditions.push(`t.employee_id = $${dataIdx++}`);
    dataParams.push(employee_id);
    countParams.push(employee_id);
    countIdx++;
  }

  if (date_from) {
    conditions.push(`t.due_date >= $${dataIdx++}`);
    dataParams.push(date_from);
    countParams.push(date_from);
    countIdx++;
  }

  if (date_to) {
    conditions.push(`t.due_date <= $${dataIdx++}`);
    dataParams.push(date_to);
    countParams.push(date_to);
    countIdx++;
  }

  // Join all condition strings with AND to form the complete WHERE clause.
  // Example: "t.organization_id = $1 AND t.status = $4 AND t.due_date >= $5"
  const whereClause = conditions.join(' AND ');

  // Main paginated data query
  const { rows } = await pool.query(
    `
    SELECT
      t.id,
      t.title,
      t.description,
      t.status,
      t.due_date,
      t.estimated_minutes,
      t.send_invoice,
      t.send_pictures,
      t.created_at,
      c.name  AS customer_name,
      e.id    AS employee_id,
      e.name  AS employee_name
    FROM tasks t
    JOIN leads l ON l.id = t.lead_id AND l.organization_id = t.organization_id
    JOIN customers c ON c.id = l.customer_id AND c.organization_id = t.organization_id
    LEFT JOIN employees e ON e.id = t.employee_id AND e.organization_id = t.organization_id
    WHERE ${whereClause}
    ORDER BY t.created_at DESC
    LIMIT $2
    OFFSET $3
    `,
    dataParams
  );

  // Rebuild count conditions using countParams index positions.
  // We can't reuse the same condition strings because the $N numbers differ
  // between dataParams and countParams (dataParams has $2/$3 for limit/offset).
  const countConditions = ['t.organization_id = $1'];
  let cIdx = 2;
  if (status)      { countConditions.push(`t.status = $${cIdx++}`); }
  if (employee_id) { countConditions.push(`t.employee_id = $${cIdx++}`); }
  if (date_from)   { countConditions.push(`t.due_date >= $${cIdx++}`); }
  if (date_to)     { countConditions.push(`t.due_date <= $${cIdx++}`); }

  const { rows: countRows } = await pool.query(
    `
    SELECT COUNT(*)::int AS total
    FROM tasks t
    JOIN leads l ON l.id = t.lead_id AND l.organization_id = t.organization_id
    JOIN customers c ON c.id = l.customer_id AND c.organization_id = t.organization_id
    LEFT JOIN employees e ON e.id = t.employee_id AND e.organization_id = t.organization_id
    WHERE ${countConditions.join(' AND ')}
    `,
    countParams
  );

  // Return the page of tasks AND the total count.
  // The frontend uses 'total' to calculate how many pages exist.
  return {
    tasks: rows,
    total: countRows[0].total
  };
}


// ============================================================
// FUNCTION 4: getAdminTaskFull
// ============================================================
// Purpose: Returns a COMPLETE picture of one task — the task itself,
// the customer info, the assigned employee info, AND all uploaded images.
// Used on the Task Detail page when an admin clicks into a specific task.
//
// Why two separate queries?
// A task can have MULTIPLE images (before photos, after photos, invoice).
// If we tried to JOIN images in the main query, PostgreSQL would return
// multiple rows for one task (one per image), and we'd have to de-duplicate.
// Two clean queries is simpler and easier to understand.
//
// Parameters:
//   task_id         — the specific task to fetch
//   organization_id — security check: ensures the task belongs to this org
//                     (an admin from org A cannot view org B's tasks)
// ============================================================

export async function getAdminTaskFull(task_id, organization_id) {

  // Query 1: The task with full customer and employee details joined in
  const taskResult = await pool.query(
    `
    SELECT
      t.id,
      t.title,
      t.description,
      t.status,
      t.due_date,
      t.estimated_minutes,
      t.send_invoice,
      t.send_pictures,
      t.created_at,
      c.name    AS customer_name,
      c.phone   AS customer_phone,
      c.email   AS customer_email,
      c.address AS customer_address,
      e.id      AS employee_id,
      e.name    AS employee_name,
      e.email   AS employee_email,
      e.phone   AS employee_phone,
      e.role    AS employee_role
    FROM tasks t
    JOIN leads l ON l.id = t.lead_id AND l.organization_id = t.organization_id
    JOIN customers c ON c.id = l.customer_id AND c.organization_id = t.organization_id
    LEFT JOIN employees e ON e.id = t.employee_id AND e.organization_id = t.organization_id
    WHERE t.id = $1 AND t.organization_id = $2
    `,
    [task_id, organization_id]
  );

  // Query 2: All images uploaded for this task.
  // image_url stores the S3 key (file path), NOT the full URL.
  // The service layer will convert these keys to presigned download URLs.
  const imagesResult = await pool.query(
    `
    SELECT
      id,
      image_type,
      image_url,
      upload_status,
      uploaded_at
    FROM task_images
    WHERE task_id = $1 AND organization_id = $2
    ORDER BY uploaded_at ASC
    `,
    [task_id, organization_id]
  );

  // ?? null means: if taskResult.rows[0] is undefined (task not found), return null
  return {
    task: taskResult.rows[0] ?? null,
    images: imagesResult.rows  // empty array [] if no images uploaded yet
  };
}


// ============================================================
// FUNCTION 5: getTasksByEmployee
// ============================================================
// Purpose: Returns all tasks assigned to ONE specific employee.
// Used when an admin opens an employee's profile to see their workload.
//
// Parameters:
//   employee_id     — which employee to look up
//   organization_id — security: ensures employee belongs to this org
// ============================================================

export async function getTasksByEmployee(employee_id, organization_id) {

  const { rows } = await pool.query(
    `
    SELECT
      t.id,
      t.title,
      t.status,
      t.due_date,
      t.created_at,
      c.name AS customer_name
    FROM tasks t
    JOIN leads l ON l.id = t.lead_id AND l.organization_id = t.organization_id
    JOIN customers c ON c.id = l.customer_id AND c.organization_id = t.organization_id
    WHERE t.employee_id = $1 AND t.organization_id = $2
    ORDER BY t.due_date DESC
    `,
    [employee_id, organization_id]
  );

  return rows;
}
