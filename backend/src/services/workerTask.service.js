import { pool } from '../config/db.js';

import * as customerRepo from '../repositories/customer.repo.js';
import * as leadRepo from '../repositories/lead.repo.js';
import * as taskRepo from '../repositories/task.repo.js';
import * as leadServiceRepo from '../repositories/lead-services.repo.js';
import * as workerTaskRepo from '../repositories/workerTask.repo.js';
import * as invoiceRepo from '../repositories/invoice.repo.js';
import * as taskImagesRepo from '../repositories/taskImages.repo.js';
import { sendTaskCompletionEmail } from './emailInvoice.service.js';


const ALLOWED_STATUSES = ['ACTIVE', 'COMPLETED', 'CANCELLED', 'PENDING', 'DRAFT', 'DEFERRED'];
/**
 * POST /workertaskui
 * Creates task from worker UI and assigns planned lead services
 */
export async function createWorkerTask(payload) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // =========================
        // 1️⃣ Destructure payload
        // =========================
        const {
            date,
            task_title,
            description,
            emp_id,
            services,
            customer_name,
            phone,
            email,
            address,
            status // ✅ NEW
        } = payload;

        // =========================
        // 2️⃣ Validation
        // =========================
        if (!date) throw new Error('date is required');
        if (!task_title) throw new Error('task_title is required');
        if (!description || description.trim().length < 5) {
            throw new Error('description is required');
        }
        if (!emp_id) throw new Error('emp_id is required');
        if (!phone) throw new Error('customer phone is required');
        if (!ALLOWED_STATUSES.includes(status)) {
            throw new Error(`Invalid status: ${status}`);
        }
        //if (!Array.isArray(services) || services.length === 0) {
        //    throw new Error('services array is required');
        //}

        // =========================
        // 3️⃣ CUSTOMER
        // =========================
        let customer = await customerRepo.findByPhoneClient(client, phone);

        if (!customer) {
            customer = await customerRepo.createClient(client, {
                name: customer_name,
                phone,
                email,
                address
            });
        }

        // =========================
        // 4️⃣ LEAD
        // =========================
        const lead = await leadRepo.createClient(client, {
            customer_id: customer.id,
            status: 'POTENTIAL',
            source: 'WORKER_UI'
        });

        // =========================
        // 5️⃣ LEAD SERVICES (PLANNED)
        // =========================
        for (const s of services) {
            await leadServiceRepo.createClient(client, {
                lead_id: lead.id,
                service_id: s.service_id,
                quantity: s.quantity ?? 1,
                unit_price: s.unit_price
            });
        }

        // =========================
        // 6️⃣ TASK
        // =========================
        const task = await taskRepo.createClient(client, {
            lead_id: lead.id,
            employee_id: emp_id,
            title: task_title,
            description: description,
            due_date: date,
            status: status
        });

        // =========================
        // 7️⃣ PROMOTE SERVICES → ASSIGNED
        // =========================
        const serviceIds = services.map(s => s.service_id);

        await leadServiceRepo.markServicesAssigned(
            client,
            lead.id,
            serviceIds,
            'ASSIGNED'
        );

        await client.query('COMMIT');

        // =========================
        // 8️⃣ RESPONSE
        // =========================
        return {
            success: true,
            task_id: task.id,
            lead_id: lead.id,
            message: 'Worker task created and services assigned'
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}


//get /wokertaskui/emp/date

export async function getWorkerTasksByEmpDateStatus({ empId, date, status }) {
    // Basic validation (keep it strict to avoid bad queries)
    if (!empId) throw new Error('empId is required');
    if (!date) throw new Error('date is required (YYYY-MM-DD)');
    if (!status) throw new Error('status is required');

    // Optional: normalize status (if your DB stores uppercase)
    const normalizedStatus = String(status).trim().toUpperCase();

    // Example: if you want to restrict allowed statuses
    // const allowed = ['PENDING','IN_PROGRESS','COMPLETED','CANCELLED','ACTIVE'];
    // if (!allowed.includes(normalizedStatus)) throw new Error('Invalid status');

    return workerTaskRepo.getWorkerTasksByEmpDateStatus(empId, date, normalizedStatus);
}

export async function getWorkerTaskHistory(empId) {
    if (!empId) {
        throw new Error('empId is required');
    }

    // 🔒 Hard-coded business rule
    const STATUS = 'COMPLETED';
    console.log("sh", empId);
    return workerTaskRepo.getTasksByEmpAndStatus(empId, STATUS);
}


export async function updateWorkerTaskStatus({
    taskId,
    status,
    send_invoice,
    send_pictures
}) {
    if (!ALLOWED_STATUSES.includes(status)) {
        throw new Error(`Invalid status: ${status}`);
    }

    const client = await pool.connect();
    let emailPayload = null; // 🚫 never send email inside transaction

    try {
        await client.query('BEGIN');

        // 1️⃣ Update task status + flags
        const task = await taskRepo.updateTaskStatusAndFlags(client, taskId, {
            status,
            send_invoice,
            send_pictures
        });

        if (!task) throw new Error('Task not found');

        // 2️⃣ Trigger validation ONLY on COMPLETED
        if (status === 'COMPLETED') {
            let invoice = null;
            let images = [];

            // 📄 Invoice validation
            if (task.send_invoice === true) {
                invoice = await invoiceRepo.getLatestInvoiceByTaskIdClient(
                    client,
                    task.id
                );

                // ❌ HARD FAIL if invoice missing
                if (!invoice) {
                    throw new Error('Invoice not found for completed task');
                }

                if (!invoice.pdf_url) {
                    throw new Error('Invoice PDF missing');
                }
            }

            // 🖼️ Image validation
            if (task.send_pictures === true) {
                images = await taskImagesRepo.getTaskImagesByTaskIdClient(
                    client,
                    task.id
                );

                // ❌ HARD FAIL if no images
                if (!images || images.length === 0) {
                    throw new Error('No task images found');
                }
            }

            // 📧 Resolve customer email ONLY if something must be sent
            if (task.send_invoice || task.send_pictures) {
                const lead = await leadRepo.getLeadByIdClient(
                    client,
                    task.lead_id
                );
                if (!lead) throw new Error('Lead not found');

                const customer = await customerRepo.getCustomerByIdClient(
                    client,
                    lead.customer_id
                );
                if (!customer?.email) {
                    throw new Error('Customer email not found');
                }

                // Prepare email payload (send AFTER commit)
                emailPayload = {
                    to: customer.email,
                    invoice,
                    images
                };
            }
        }

        await client.query('COMMIT');

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;

    } finally {
        client.release();
    }

    // 🚀 Send email OUTSIDE transaction
    if (emailPayload) {
        await sendTaskCompletionEmail(emailPayload);
    }

    return { success: true };
}