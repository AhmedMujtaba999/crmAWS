import { pool } from '../config/db.js';

/**
 * Create invoice (snapshot)
 */
export async function createInvoice({
    customer_id,
    lead_id,
    invoice_number,
    total_amount,
    status,
    pdf_url
}) {
    const result = await pool.query(
        `
    INSERT INTO invoices
      (customer_id, lead_id, invoice_number, total_amount, status, pdf_url)
    VALUES
      ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
        [
            customer_id,
            lead_id,
            invoice_number,
            total_amount,
            status ?? 'DRAFT',
            pdf_url ?? null
        ]
    );

    return result.rows[0];
}


/**
 * Get all invoices
 */
export async function getAllInvoices() {
    const result = await pool.query(
        `
    SELECT
      i.*,
      c.name AS customer_name
    FROM invoices i
    JOIN customers c ON c.id = i.customer_id
    ORDER BY i.issued_at DESC
    `
    );

    return result.rows;
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(id) {
    const result = await pool.query(
        `
    SELECT *
    FROM invoices
    WHERE id = $1
    `,
        [id]
    );

    return result.rows[0];
}

/**
 * Update invoice status / pdf
 */
export async function updateInvoice(
    id,
    status,
    pdf_url
) {
    const result = await pool.query(
        `
    UPDATE invoices
    SET
      status = $1,
      pdf_url = $2
    WHERE id = $3
    RETURNING *
    `,
        [status, pdf_url, id]
    );

    return result.rows[0];
}

export async function updateInvoicePdfUrl(invoice_id, pdf_url) {
    const result = await pool.query(
        `
    UPDATE invoices
    SET pdf_url = $1
    WHERE id = $2
    RETURNING *
    `,
        [pdf_url, invoice_id]
    );

    return result.rows[0];
}

/**
 * Delete invoice
 */
export async function deleteInvoice(id) {
    const result = await pool.query(
        `
    DELETE FROM invoices
    WHERE id = $1
    RETURNING *
    `,
        [id]
    );

    return result.rows[0];
}



/**
 * Create invoice for worker task upload flow
 * (Client-based for transaction safety)
 */
export async function createInvoiceForTaskClient(client, {
    customer_id,
    lead_id,
    invoice_number,
    total_amount = 0,
    status = 'DRAFT'
}) {
    const { rows } = await client.query(
        `
        INSERT INTO invoices
          (customer_id, lead_id, invoice_number, total_amount, status)
        VALUES
          ($1, $2, $3, $4, $5)
        RETURNING *
        `,
        [
            customer_id,
            lead_id,
            invoice_number,
            total_amount,
            status
        ]
    );

    return rows[0];
}

export async function getLatestInvoiceByTaskIdClient(client, task_id) {
    const result = await client.query(
        `
        SELECT *
        FROM invoices
        WHERE lead_id = (
            SELECT lead_id FROM tasks WHERE id = $1
        )
        ORDER BY issued_at DESC
        LIMIT 1
        `,
        [task_id]
    );

    return result.rows[0] || null;
}