import { pool } from "../config/db.js";

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

export async function getTaskImagesByType(client, task_id, image_type) {
    const { rows } = await client.query(
        `
    SELECT id, image_type, image_url, uploaded_at
    FROM task_images
    WHERE task_id = $1 AND image_type = $2
    ORDER BY uploaded_at ASC
    `,
        [task_id, image_type]
    );

    return rows;
}