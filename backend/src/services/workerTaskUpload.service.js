import { pool } from '../config/db.js';
import * as taskRepo from '../repositories/task.repo.js';
import * as leadRepo from '../repositories/lead.repo.js';
import * as invoiceRepo from '../repositories/invoice.repo.js';
import * as taskImageRepo from '../repositories/taskImages.repo.js';
import { createPresignedUpload } from './s3Upload.service.js';

export async function createWorkerTaskUploads({
    task_id,
    status = 'DRAFT',
    action = {}
}) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1️⃣ Task
        const task = await taskRepo.getTaskByIdClient(client, task_id);
        if (!task) throw new Error('Task not found');

        // 2️⃣ Lead + Invoice (ONLY if requested)
        let lead = null;
        let invoice = null;

        if (action.invoice === true) {

            // 🔒 CHECK EXISTING INVOICE STATUS
            const existingInvoice =
                await invoiceRepo.getLatestInvoiceByTaskIdClient(client, task_id);

            if (
                existingInvoice &&
                !['DEFERRED', 'CANCELLED'].includes(existingInvoice.status)
            ) {
                throw new Error(
                    `Invoice already exists with status '${existingInvoice.status}'. ` +
                    `New invoice allowed only if status is DEFERRED or CANCELLED`
                );
            }

            // ✅ Allowed → create new invoice
            lead = await leadRepo.getLeadByIdClient(client, task.lead_id);
            if (!lead) throw new Error('Lead not found');

            const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now()}`;

            invoice = await invoiceRepo.createInvoiceForTaskClient(client, {
                customer_id: lead.customer_id,
                lead_id: lead.id,
                invoice_number: invoiceNumber,
                total_amount: 0,
                status
            });
        }

        // 3️⃣ Response object (locked shape)
        const uploadResponse = {
            task_id
        };

        // 📄 Invoice PDF
        if (action.invoice === true) {
            uploadResponse.invoice = {
                invoice_id: invoice.id,
                invoice_number: invoice.invoice_number,
                upload_urls: {
                    invoice_pdf: await createPresignedUpload({
                        key: `invoices/${invoice.id}/invoice-v1.pdf`,
                        contentType: 'application/pdf'
                    })
                }
            };
        }

        // 🖼️ Before images (single or multiple)
        if (action.beforePic) {
            const count =
                action.beforePic === true ? 1 : Number(action.beforePic);

            uploadResponse.image_uploads ??= {};
            uploadResponse.image_uploads.before = [];

            for (let i = 0; i < count; i++) {
                const beforeImage = await createPresignedUpload({
                    key: `tasks/${task_id}/before/${Date.now()}-${i}.jpg`,
                    contentType: 'image/jpeg'
                });

                uploadResponse.image_uploads.before.push(beforeImage);
            }
        }

        // 🖼️ After images (single or multiple)
        if (action.afterPic) {
            const count =
                action.afterPic === true ? 1 : Number(action.afterPic);

            uploadResponse.image_uploads ??= {};
            uploadResponse.image_uploads.after = [];

            for (let i = 0; i < count; i++) {
                const afterImage = await createPresignedUpload({
                    key: `tasks/${task_id}/after/${Date.now()}-${i}.jpg`,
                    contentType: 'image/jpeg'
                });

                uploadResponse.image_uploads.after.push(afterImage);
            }
        }

        await client.query('COMMIT');
        return uploadResponse;

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

export async function getWorkerTaskUploads({
    task_id,
    before,
    after,
    invoice
}) {
    const client = await pool.connect();

    try {
        const response = { task_id };

        if (before === 'true') {
            response.images ??= {};
            response.images.before = await taskImageRepo.getTaskImagesByType(
                client,
                task_id,
                'before'
            );
        }

        if (after === 'true') {
            response.images ??= {};
            response.images.after = await taskImageRepo.getTaskImagesByType(
                client,
                task_id,
                'after'
            );
        }

        if (invoice === 'true') {
            response.invoice = await invoiceRepo.getLatestInvoiceByTaskIdClient(
                client,
                task_id
            );
        }

        return response;

    } finally {
        client.release();
    }
}