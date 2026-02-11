import { pool } from '../config/db.js';

/**
 * Create invoice (snapshot)
 */
export async function createInvoice({
    customer_id,
    lead_id,
    invoice_number,
    total_amount,
    status = 'DRAFT',
    pdf_url = null,
    upload_status = 'PENDING', // 👈 important
    organization_id
}) {
    const { rows } = await pool.query(
        `
        INSERT INTO invoices
          (
            customer_id,
            lead_id,
            invoice_number,
            total_amount,
            status,
            pdf_url,
            upload_status,
            organization_id
          )
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        `,
        [
            customer_id,
            lead_id,
            invoice_number,
            total_amount,
            status,
            pdf_url,
            upload_status,
            organization_id
        ]
    );

    return rows[0];
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


export async function updateInvoiceUploadStatusByPdfUrl({
    organization_id,
    task_id,
    pdf_url,
    upload_status,
}) {
    const { rows } = await pool.query(
        `
    UPDATE invoices i
    SET upload_status = $1
    FROM tasks t
    WHERE t.id = $2
      AND t.organization_id = $3
      AND (i.organization_id, i.lead_id) = (t.organization_id, t.lead_id)
      AND i.pdf_url = $4
    RETURNING i.id, i.pdf_url, i.upload_status
    `,
        [upload_status, task_id, organization_id, pdf_url]
    );

    return rows[0] ?? null;
}

export async function updateInvoiceToCompleted({
    organization_id,
    invoice_id,
    upload_status
}) {
    const { rowCount } = await pool.query(
        `
    UPDATE invoices
    SET upload_status = $1,
        updated_at = NOW()
    WHERE id = $2
      AND organization_id = $3
    `,
        [upload_status, invoice_id, organization_id]
    );

    if (rowCount === 0) {
        throw new Error("Invoice not found or already updated");
    }
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
export async function createInvoiceForTaskClient(
    client,
    {
        customer_id,
        lead_id,
        invoice_number,
        total_amount = 0,
        status = 'DRAFT',
        organization_id,
        pdf_url,              // ✅ ADD THIS
        upload_status = 'PENDING'
    }
) {
    if (!organization_id) {
        throw new Error('organization_id is required');
    }

    const { rows } = await client.query(
        `
        INSERT INTO invoices
          (
            customer_id,
            lead_id,
            invoice_number,
            total_amount,
            status,
            organization_id,
            pdf_url,
            upload_status
          )
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        `,
        [
            customer_id,
            lead_id,
            invoice_number,
            total_amount,
            status,
            organization_id,
            pdf_url,          // ✅ STORED
            upload_status
        ]
    );

    return rows[0];
}


export async function getLatestInvoiceByTaskIdClient(
    client,
    task_id,
    organization_id
) {
    const { rows } = await client.query(
        `
    SELECT i.*
    FROM invoices i
    JOIN tasks t
      ON i.lead_id = t.lead_id
     AND i.organization_id = t.organization_id
    WHERE t.id = $1
      AND t.organization_id = $2
    ORDER BY i.issued_at DESC
    LIMIT 1
    `,
        [task_id, organization_id]
    );

    return rows[0];
}