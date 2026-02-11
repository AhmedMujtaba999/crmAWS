import { pool } from '../config/db.js';
import * as taskRepo from '../repositories/task.repo.js';
import * as leadRepo from '../repositories/lead.repo.js';
import * as invoiceRepo from '../repositories/invoice.repo.js';
import * as taskImageRepo from '../repositories/taskImages.repo.js';
import { createPresignedUpload } from './s3Upload.service.js';
import { createPresignedDownload } from "./s3Download.service.js";

export async function createWorkerTaskUploads({
    task_id,
    status = 'DRAFT',
    action = {},
    organization_id
}) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1️⃣ Validate task
        const task = await taskRepo.getTaskByIdClient(
            client,
            task_id,
            organization_id
        );
        if (!task) throw new Error('Task not found');

        let invoice = null;
        let key = null;

        // 2️⃣ Invoice (placeholder row)
        if (action.invoice === true) {
            const existing =
                await invoiceRepo.getLatestInvoiceByTaskIdClient(
                    client,
                    task_id,
                    organization_id
                );

            if (existing) {

                if (existing.upload_status == 'PENDING') {
                    //logic later 
                    console.log('invoice already exists with upload_status =', existing.upload_status)
                    throw new Error(
                        `Invoice already exists with status error 1 '${existing.status}'`
                    )
                }
                else if (!['DEFERRED', 'CANCELLED'].includes(existing.status)) {
                    throw new Error(
                        `Invoice already exists with status error 2'${existing.status}'`
                    )
                }


            }

            const lead = await leadRepo.getLeadByIdClient(
                client,
                task.lead_id,
                organization_id
            );

            const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now()}`;
            key = `tasks/${task_id}/invoices/${invoiceNumber}/invoice-v1.pdf`;
            invoice = await invoiceRepo.createInvoiceForTaskClient(client, {
                customer_id: lead.customer_id,
                lead_id: lead.id,
                invoice_number: invoiceNumber,
                total_amount: 0,
                status,
                organization_id,
                pdf_url: key,
                upload_status: "PENDING"
            });
        }

        const response = { task_id };

        // 📄 Invoice PDF upload
        if (invoice) {
            response.invoice = {
                invoice_id: invoice.id,
                invoice_number: invoice.invoice_number,
                upload_urls: {
                    invoice_pdf: await createPresignedUpload({
                        key,
                        contentType: 'application/pdf'
                    })
                }
            };
        }

        // 🖼️ Helper for images
        async function prepareImages(type, count) {
            response.image_uploads ??= {};
            response.image_uploads[type] = [];

            for (let i = 0; i < count; i++) {
                const key = `tasks/${task_id}/${type}/${Date.now()}-${i}.jpg`;

                // ✅ CREATE PLACEHOLDER ROW
                await taskImageRepo.createTaskImagePlaceholder(client, {
                    task_id,
                    image_type: type,
                    image_url: key,
                    organization_id,
                    upload_status: 'PENDING'
                });

                const upload = await createPresignedUpload({
                    key,
                    contentType: 'image/jpeg'
                });

                response.image_uploads[type].push(upload);
            }
        }

        if (action.beforePic) {
            await prepareImages(
                'before',
                Number(action.beforePic)
            );
        }

        if (action.afterPic) {
            await prepareImages(
                'after',
                Number(action.afterPic)
            );
        }

        await client.query('COMMIT');
        return response;

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
    invoice,
    organization_id
}) {
    const client = await pool.connect();

    try {
        const response = { task_id };
        console.log('1', response, before, after, invoice)
        // 🖼 BEFORE IMAGES
        if (before === "true") {
            const images = await taskImageRepo.getTaskImagesByType(
                client,
                task_id,
                "before",
                organization_id
            );

            response.images ??= {};
            response.images.before = await Promise.all(
                images.map(async img => ({
                    image_id: img.id,
                    upload_status: img.upload_status,
                    object_key: img.image_url,
                    download: await createPresignedDownload({
                        key: img.image_url
                    })
                }))
            );
        }

        console.log('2', response)

        // 🖼 AFTER IMAGES
        if (after === "true") {
            const images = await taskImageRepo.getTaskImagesByType(
                client,
                task_id,
                "after",
                organization_id
            );

            response.images ??= {};
            response.images.after = await Promise.all(
                images.map(async img => ({
                    image_id: img.id,
                    upload_status: img.upload_status,
                    object_key: img.image_url,
                    download: await createPresignedDownload({
                        key: img.image_url
                    })
                }))
            );
        }
        console.log('3', response)
        // 📄 INVOICE
        if (invoice === "true") {
            const inv = await invoiceRepo.getLatestInvoiceByTaskIdClient(
                client,
                task_id,
                organization_id
            );

            console.log('invoice', inv)

            if (inv?.pdf_url) {
                response.invoice = {
                    invoice_id: inv.id,
                    upload_status: inv.upload_status,
                    object_key: inv.pdf_url,
                    download: await createPresignedDownload({
                        key: inv.pdf_url
                    })
                };
            }
        }
        console.log('3', response)

        return response;

    } finally {
        client.release();
    }
}