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

export async function createTaskImagePlaceholder(
    client,
    {
        task_id,
        image_type,
        image_url,
        organization_id,
        upload_status
    }
) {
    const { rows } = await client.query(
        `
    INSERT INTO task_images
      (task_id, image_type, image_url, organization_id, upload_status, uploaded_at)
    VALUES
      ($1, $2, $3, $4, $5, NULL)
    RETURNING *
    `,
        [
            task_id,
            image_type,
            image_url,
            organization_id,
            upload_status
        ]
    );

    return rows[0];
}

export async function getTaskImagesByType(
    client,
    task_id,
    image_type,
    organization_id
) {
    const { rows } = await client.query(
        `
    SELECT
      id,
      task_id,
      image_type,
      image_url,
      upload_status,
      uploaded_at,
      organization_id
    FROM task_images
    WHERE task_id = $1
      AND image_type = $2
      AND organization_id = $3
    ORDER BY uploaded_at ASC
    `,
        [task_id, image_type, organization_id]
    );

    return rows;
}

export async function getTaskImagesByTaskIdClient(client, task_id) {
    const { rows } = await client.query(
        `
        SELECT *
        FROM task_images
        WHERE task_id = $1
        ORDER BY uploaded_at ASC
        `,
        [task_id]
    );

    return rows;
}




export async function updateImageToCompleted({
    organization_id,
    task_id,
    image_type,
    image_url,
    upload_status
}) {
    const { rowCount } = await pool.query(
        `
    UPDATE task_images
    SET upload_status = $1,
        uploaded_at = NOW()
    WHERE task_id = $2
      AND organization_id = $3
      AND image_type = $4
      AND image_url = $5
    `,
        [
            upload_status,
            task_id,
            organization_id,
            image_type,
            image_url
        ]
    );

    if (rowCount === 0) {
        throw new Error(
            `Image placeholder not found for ${image_type} → ${image_url}`
        );
    }
}




export async function updateImageUploadStatus({
    upload_status,
    organization_id,
    task_id,
    image_type,
    image_url,
}) {
    const { rows } = await pool.query(
        `
    UPDATE task_images
    SET
      upload_status = $1,
      uploaded_at = CASE
        WHEN $2 = 'COMPLETED' THEN NOW()
        ELSE uploaded_at
      END
    WHERE organization_id = $3
      AND task_id = $4
      AND image_type = $5
      AND image_url = $6
    RETURNING id, task_id, image_type, image_url, upload_status
    `,
        [
            upload_status,   // $1 → assignment
            upload_status,   // $2 → comparison
            organization_id, // $3
            task_id,         // $4
            image_type,      // $5
            image_url,       // $6
        ]
    );

    return rows[0] ?? null;
}