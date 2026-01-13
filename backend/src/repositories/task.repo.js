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
        INSERT INTO tasks 
        (lead_id, employee_id, title, description, due_date, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [
            data.lead_id,
            data.employee_id,
            data.title,
            data.description,
            data.due_date,
            data.status
        ]
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

