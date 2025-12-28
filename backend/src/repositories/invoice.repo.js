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