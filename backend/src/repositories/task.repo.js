import { pool } from '../config/db.js';

export async function createTask(data) {
    const {
        lead_id,
        employee_id,
        title,
        description,
        estimated_minutes,
        due_date,
        status
    } = data;

    const result = await pool.query(
        `
    INSERT INTO tasks
      (lead_id, employee_id, title, description, estimated_minutes, due_date, status)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
        [
            lead_id,
            employee_id || null,
            title,
            description,
            estimated_minutes,
            due_date,
            status || 'PENDING'
        ]
    );

    return result.rows[0];
}

export async function getAllTasks() {
    const result = await pool.query(
        `SELECT * FROM tasks ORDER BY created_at DESC`
    );
    return result.rows;
}

export async function getTaskById(id) {
    const result = await pool.query(
        `SELECT * FROM tasks WHERE id = $1`,
        [id]
    );
    return result.rows[0];
}

export async function getTasksByEmpStatusAndDateRange(
    empId,
    status,
    startDate,
    endDate,
    organization_id
) {
    const { rows } = await pool.query(
        `
        SELECT *
        FROM tasks
        WHERE employee_id = $1
          AND status = $2
          AND organization_id = $3
          AND due_date BETWEEN $4 AND $5
        ORDER BY due_date DESC
        `,
        [empId, status, organization_id, startDate, endDate]
    );

    return rows;
}

export async function updateTask(id, data) {
    const {
        employee_id,
        title,
        description,
        estimated_minutes,
        due_date,
        status
    } = data;

    const result = await pool.query(
        `
    UPDATE tasks
    SET
      employee_id = $1,
      title = $2,
      description = $3,
      estimated_minutes = $4,
      due_date = $5,
      status = $6
    WHERE id = $7
    RETURNING *
    `,
        [
            employee_id || null,
            title,
            description,
            estimated_minutes,
            due_date,
            status,
            id
        ]
    );

    return result.rows[0];
}
// Update task status only
export async function updateTaskStatus(id, status) {
    const { rows } = await pool.query(
        `
        UPDATE tasks
        SET status = $1
        WHERE id = $2
        RETURNING *;
        `,
        [status, id]
    );

    return rows[0];
}

export async function saveTaskImage({ task_id, image_type, image_url }) {
    const result = await pool.query(
        `
    INSERT INTO task_images (task_id, image_type, image_url)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
        [task_id, image_type, image_url]
    );

    return result.rows[0];
}


export async function deleteTask(id) {
    const result = await pool.query(
        `DELETE FROM tasks WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
}

/**
 * Client
 */

/**
 * create
 */

export async function createClient(client, data) {

    const { rows } = await client.query(
        `
        INSERT INTO tasks (
            lead_id,
            employee_id,
            title,
            description,
            due_date,
            estimated_minutes,
            status,
            organization_id
        )
        VALUES ($1,$2,$3,$4,$5,$6,'PENDING',$7)
        RETURNING *
        `,
        [
            data.lead_id,
            data.employee_id,
            data.title,
            data.description,
            data.due_date,
            data.estimated_minutes ?? null,
            data.organization_id
        ]
    );

    return rows[0];
}

export async function findByIdAndEmpClient(
    client,
    task_id,
    emp_id,
    organization_id
) {
    const { rows } = await client.query(
        `
    SELECT *
    FROM tasks
    WHERE id = $1
      AND employee_id = $2
      AND organization_id = $3
    `,
        [task_id, emp_id, organization_id]
    );

    return rows[0];
}

/**
 * READ task by ID (transaction-safe)
 */
export async function getTaskByIdClient(client, id) {
    const { rows } = await client.query(
        `SELECT * FROM tasks WHERE id = $1`,
        [id]
    );
    return rows[0];
}

export async function getTaskByLeadIdClient(
    client,
    lead_id,
    organization_id
) {
    const { rows } = await client.query(
        `
        SELECT id
        FROM tasks
        WHERE lead_id = $1
        AND organization_id = $2
        `,
        [lead_id, organization_id]
    );

    return rows[0] ?? null;
}

export async function updateTaskStatusAndFlags(client, taskId, data) {
    const { status, send_invoice, send_pictures } = data;

    // CASE expression sets completed_at to the current timestamp only when the
    // new status is 'COMPLETED'. For any other status change (e.g. ACTIVE → PENDING),
    // it keeps the existing completed_at value unchanged.
    // This way completed_at is always an accurate record of when the task was finished,
    // and the admin kanban can filter by it instead of the unrelated due_date column.
    const { rows } = await client.query(
        `
        UPDATE tasks
        SET status = $1,
            send_invoice = $2,
            send_pictures = $3,
            completed_at = CASE
                WHEN $1 = 'COMPLETED' THEN NOW()
                ELSE completed_at
            END
        WHERE id = $4
        RETURNING *
        `,
        [status, send_invoice, send_pictures, taskId]
    );

    return rows[0];
}

// Admin-side status update — uses pool directly (no transaction needed).
// Also stamps completed_at when status becomes COMPLETED, matching the same
// logic used by the worker-side updateTaskStatusAndFlags above.
export async function updateTaskStatusAdmin(id, status, organization_id) {
    const { rows } = await pool.query(
        `
        UPDATE tasks
        SET status = $1,
            completed_at = CASE
                WHEN $1 = 'COMPLETED' THEN NOW()
                ELSE completed_at
            END
        WHERE id = $2
          AND organization_id = $3
        RETURNING *
        `,
        [status, id, organization_id]
    );
    return rows[0] ?? null;
}

export async function updateClient(
    client,
    task_id,
    organization_id,
    { title, description, due_date, status }
) {
    const { rows } = await client.query(
        `
        UPDATE tasks
        SET
            title = $1,
            description = $2,
            due_date = $3,
            status = $4
        WHERE id = $5
          AND organization_id = $6
        RETURNING *
        `,
        [title, description, due_date, status, task_id, organization_id]
    );

    return rows[0];
}

