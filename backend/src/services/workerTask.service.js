import { pool } from '../config/db.js';

import * as customerRepo from '../repositories/customer.repo.js';
import * as leadRepo from '../repositories/lead.repo.js';
import * as taskRepo from '../repositories/task.repo.js';
import * as leadServiceRepo from '../repositories/lead-services.repo.js';
import * as workerTaskRepo from '../repositories/workerTask.repo.js';


const ALLOWED_STATUSES = ['ACTIVE', 'COMPLETED', 'CANCELLED', 'PENDING'];
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


export async function updateWorkerTaskStatus(taskId, status) {
    if (!taskId) throw new Error('taskId is required');
    if (!status) throw new Error('status is required');

    if (!ALLOWED_STATUSES.includes(status)) {
        throw new Error(`Invalid status: ${status}`);
    }

    const updatedTask = await taskRepo.updateTaskStatus(taskId, status);

    if (!updatedTask) {
        throw new Error('Task not found');
    }

    return updatedTask;
}
