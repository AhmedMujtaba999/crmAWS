import { pool } from '../config/db.js';

import * as customerRepo from '../repositories/customer.repo.js';
import * as leadRepo from '../repositories/lead.repo.js';
import * as taskRepo from '../repositories/task.repo.js';
import * as leadServiceRepo from '../repositories/lead-services.repo.js';
import * as workerTaskRepo from '../repositories/workerTask.repo.js';
import * as invoiceRepo from '../repositories/invoice.repo.js';
import * as emailServices from '../services/email.service.js'

const ALLOWED_STATUSES = ['ACTIVE', 'COMPLETED', 'CANCELLED', 'PENDING', 'DRAFT', 'DEFERRED'];
/**
 * POST /workertaskui
 * Creates task from worker UI and assigns planned lead services
 */
export async function createWorkerTask(payload) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const {
            date,
            task_title,
            description,
            services,
            customer_name,
            phone,
            email,
            address,
            status,
            emp_id,
            organization_id // 🔐 REQUIRED
        } = payload;
        // =========================
        // Validation
        // =========================
        if (!organization_id) throw new Error('organization_id is required');
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
        console.log('status~~!!!', status)
        // =========================
        // CUSTOMER
        // =========================
        let customer = await customerRepo.findByPhoneClient(
            client,
            phone,
            organization_id
        );


        if (!customer) {
            customer = await customerRepo.createClient(client, {
                name: customer_name,
                phone,
                email,
                address,
                organization_id
            });
        }

        // =========================
        // LEAD
        // =========================
        console.log('organization_id', organization_id);
        const lead = await leadRepo.createClient(client, {
            customer_id: customer.id,
            source: 'WORKER_UI',
            status: 'CLOSED',
            status_detail: 'test',
            notes: 'test',
            organization_id
        });

        // =========================
        // LEAD SERVICES
        // =========================
        for (const s of services) {
            await leadServiceRepo.createClient(client, {
                lead_id: lead.id,
                service_id: s.service_id,
                quantity: s.quantity ?? 1,
                unit_price: s.unit_price,
            });
        }

        // =========================
        // TASK
        // =========================
        const task = await taskRepo.createClient(client, {
            lead_id: lead.id,
            employee_id: emp_id,
            title: task_title,
            description,
            due_date: date,
            status,
            organization_id
        });

        // =========================
        // PROMOTE SERVICES
        // =========================
        const serviceIds = services.map(s => s.service_id);

        await leadServiceRepo.markServicesAssigned(
            client,
            lead.id,
            serviceIds,
            'ASSIGNED',
            organization_id
        );

        await client.query('COMMIT');

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
export async function getWorkerTasksByEmpDateStatus({
    empId,
    date,
    status,
    organization_id
}) {
    // =========================
    // 1️⃣ Validation
    // =========================
    if (!organization_id) throw new Error('organization_id is required');
    if (!empId) throw new Error('empId is required');
    if (!date) throw new Error('date is required');
    if (!status) throw new Error('status is required');

    const normalizedStatus = String(status).trim().toUpperCase();

    if (normalizedStatus == "Active") {
        return workerTaskRepo.getAllWorkerTasksStatus(
            empId,
            normalizedStatus,
            organization_id
        );

    }

    // =========================s
    // 2️⃣ Single optimized query
    // =========================
    return workerTaskRepo.getWorkerTasksByEmpDateStatus(
        empId,
        date,
        normalizedStatus,
        organization_id
    );


}

export async function getWorkerTaskHistory({
    empId,
    organization_id,
    start,
    end
}) {
    if (!empId) throw new Error("empId is required");
    if (!organization_id) throw new Error("organization_id is required");
    if (!start || !end) throw new Error("start and end date are required");

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate) || isNaN(endDate)) {
        throw new Error("Invalid date format");
    }

    if (endDate < startDate) {
        throw new Error("End date must be after start date");
    }

    // 🔒 31 day limit protection
    const diffDays = (endDate - startDate) / (1000 * 60 * 60 * 24);

    if (diffDays > 31) {
        throw new Error("Date range cannot exceed 31 days");
    }

    const STATUS = "COMPLETED";

    return workerTaskRepo.getWorkerTasksByEmpStatusAndDateRange(
        empId,
        STATUS,
        start,
        end,
        organization_id
    );
}


export async function updateWorkerTaskCompleted({
    taskId,
    status,
    send_invoice,
    send_pictures,
    organization_id
}) {
    if (!organization_id) throw new Error('organization_id is required');
    if (!ALLOWED_STATUSES.includes(status)) {
        throw new Error(`Invalid status: ${status}`);
    }

    const client = await pool.connect();
    let emailPayload = null;

    try {
        await client.query('BEGIN');

        const task = await taskRepo.updateTaskStatusAndFlags(
            client,
            taskId,
            { status, send_invoice, send_pictures },
            organization_id
        );

        if (!task) throw new Error('Task not found');

        if (status === 'COMPLETED') {
            let invoice = null;

            if (task.send_invoice === true) {
                invoice = await invoiceRepo.getLatestInvoiceByTaskIdClient(
                    client,
                    task.id,
                    organization_id
                );

                if (!invoice || !invoice.pdf_url) {
                    throw new Error('Invoice missing or invalid');
                }
            }


            if (task.send_invoice) {
                const lead = await leadRepo.getLeadByIdClient(
                    client,
                    task.lead_id,
                    organization_id
                );

                const customer = await customerRepo.getCustomerByIdClient(
                    client,
                    lead.customer_id,
                    organization_id
                );

                if (!customer?.email) {
                    throw new Error('Customer email not found');
                }

                emailPayload = {
                    to: customer.email,
                    invoice,
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

    if (emailPayload) {
        await emailServices.sendTaskCompletionInvoiceEmail(emailPayload, organization_id);
    }

    return { success: true };
}


export async function updateFullWorkerTask(task_id, payload) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const {
            date,
            task_title,
            description,
            status,
            customer_name,
            phone,
            email,
            address,
            services,
            organization_id,
            emp_id // 🔐 auth-only
        } = payload;

        // =========================
        // Validation
        // =========================
        if (!organization_id) throw new Error('organization_id missing');
        if (!emp_id) throw new Error('emp_id missing');
        if (!task_id) throw new Error('task_id missing');

        if (!date) throw new Error('date required');
        if (!task_title) throw new Error('task_title required');
        if (!description) throw new Error('description required');
        if (!phone) throw new Error('phone required');

        if (!Array.isArray(services)) {
            throw new Error('services must be an array');
        }

        if (!ALLOWED_STATUSES.includes(status)) {
            throw new Error(`Invalid status: ${status}`);
        }

        // =========================
        // Load task (auth check)
        // =========================
        const task = await taskRepo.findByIdAndEmpClient(
            client,
            task_id,
            emp_id,
            organization_id
        );

        if (!task) {
            throw new Error('Task not found or not assigned to this employee');
        }

        // =========================
        // Load lead + customer
        // =========================
        const lead = await leadRepo.getLeadByIdOrgIdClient(
            client,
            task.lead_id,
            organization_id
        );

        const customer = await customerRepo.findByIdClient(
            client,
            lead.customer_id,
            organization_id
        );

        // =========================
        // Update CUSTOMER (overwrite)
        // =========================
        await customerRepo.updateClient(
            client,
            customer.id,
            organization_id,
            {
                name: customer_name,
                phone,
                email,
                address
            }
        );

        // =========================
        // Update TASK (emp_id untouched)
        // =========================
        await taskRepo.updateClient(
            client,
            task_id,
            organization_id,
            {
                title: task_title,
                description,
                due_date: date,
                status
            }
        );

        // =========================
        // Replace SERVICES
        // =========================
        await leadServiceRepo.deleteByLeadIdClient(
            client,
            lead.id,
            organization_id
        );

        for (const s of services) {
            await leadServiceRepo.createClient(client, {
                lead_id: lead.id,
                service_id: s.service_id,
                quantity: s.quantity ?? 1,
                unit_price: s.unit_price,

            });
        }

        await client.query('COMMIT');

        return {
            success: true,
            task_id,
            message: 'Worker task updated successfully'
        };

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}



