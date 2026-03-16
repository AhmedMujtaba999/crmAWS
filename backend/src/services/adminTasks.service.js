import { pool } from "../config/db.js";

import * as adminTasksRepo from "../repositories/admin_tasks.repo.js";
import * as tasksRepo from "../repositories/task.repo.js";
import * as scheduleRepo from "../repositories/schedule.repo.js";
import * as leadRepo from "../repositories/lead.repo.js";
import * as leadServicesRepo from "../repositories/lead-services.repo.js";


export async function getAdminTasks(organization_id) {

    if (!organization_id)
        throw new Error("organization_id required");

    return await adminTasksRepo.getAdminTasks(
        organization_id
    );
}



// Update a task's status from the admin kanban (pending → active → completed).
// Unassigned items are leads, not tasks, so they cannot be updated here.
// Valid transitions: PENDING → ACTIVE, ACTIVE → COMPLETED (and reverse).
export async function updateTaskStatus(id, status, organization_id) {

    const VALID = ['PENDING', 'ACTIVE', 'COMPLETED'];

    if (!VALID.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${VALID.join(', ')}`);
    }

    const task = await tasksRepo.updateTaskStatusAdmin(
        id,
        status,
        organization_id
    );

    if (!task) {
        throw new Error('Task not found or does not belong to this organisation');
    }

    return task;
}

export async function assignTask(data, user) {

    const organization_id = user.organization_id;

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        // 1️⃣ check if task already exists
        const existing =
            await tasksRepo.getTaskByLeadIdClient(
                client,
                data.lead_id,
                organization_id
            );

        if (existing) {
            throw new Error(
                "Task already exists for this lead"
            );
        }

        // 2️⃣ create task
        const task = await tasksRepo.createClient(
            client,
            {
                lead_id: data.lead_id,
                employee_id: data.employee_id,
                title: data.title,
                description: data.description,
                due_date: data.scheduled_start,
                estimated_minutes: data.estimated_minutes,
                organization_id
            }
        );


        // 3️⃣ calculate schedule end time
        const start = new Date(data.scheduled_start);

        const end = new Date(
            start.getTime()
            + data.estimated_minutes * 60000
        );


        // 4️⃣ check scheduling conflict
        const conflict =
            await scheduleRepo.checkEmployeeConflictClient(
                client,
                data.employee_id,
                start,
                end,
                organization_id
            );

        if (conflict) {
            throw new Error(
                "Employee already scheduled in this time slot"
            );
        }


        // 5️⃣ create schedule
        await scheduleRepo.createScheduleClient(
            client,
            {
                employee_id: data.employee_id,
                lead_id: data.lead_id,
                scheduled_start: start,
                scheduled_end: end,
                organization_id
            }
        );


        await client.query("COMMIT");

        return task;

    } catch (err) {

        await client.query("ROLLBACK");

        throw err;

    } finally {

        client.release();

    }
}

// ============================================================
// getScheduleView
// ============================================================
// Builds the full schedule view payload for a given date.
// Groups the flat scheduled_slots array into per-employee arrays, then
// merges working-hours, leave status, and slots into each employee object.
//
// The result matches the ScheduleViewData TypeScript type on the frontend.
export async function getScheduleView(organization_id, date) {

    const raw = await adminTasksRepo.getScheduleViewData(organization_id, date);

    // Group scheduled slots by employee_id — Map<employee_id, slot[]>
    const slotsByEmp = new Map();
    raw.scheduled_slots.forEach(slot => {
        if (!slotsByEmp.has(slot.employee_id)) {
            slotsByEmp.set(slot.employee_id, []);
        }
        slotsByEmp.get(slot.employee_id).push(slot);
    });

    // Merge working hours, leave flag, and slots into each employee row
    const employees = raw.employees.map(emp => ({
        id:               emp.id,
        name:             emp.name,
        employment_type:  emp.employment_type,
        role:             emp.role,
        work_start:       emp.work_start,  // "HH:MM" or null (no hours this weekday)
        work_end:         emp.work_end,
        on_leave:         raw.leave_ids.has(emp.id),
        scheduled_slots:  slotsByEmp.get(emp.id) ?? [],
    }));

    return {
        date,
        holiday:   raw.holiday,    // { holiday_name } or null
        employees,
    };
}

// ============================================================
// Task CRUD service methods (used by the ScheduledTaskModal)
// ============================================================

export async function getTaskById(id, organization_id) {
    const task = await adminTasksRepo.getTaskById(id, organization_id);
    if (!task) throw new Error('Task not found');
    return task;
}

export async function updateTask(id, organization_id, data) {
    const task = await adminTasksRepo.updateTask(id, organization_id, data);
    if (!task) throw new Error('Task not found');
    return task;
}

export async function reassignTask(id, organization_id, new_employee_id) {
    const task = await adminTasksRepo.reassignTask(id, organization_id, new_employee_id);
    if (!task) throw new Error('Task not found');
    return task;
}

export async function deleteTask(id, organization_id) {
    const task = await adminTasksRepo.deleteTask(id, organization_id);
    if (!task) throw new Error('Task not found');
    return task;
}

// Close a lead: marks the lead's status as 'CLOSED' (uppercase) so it appears
// in the Unassigned column of the admin kanban (which queries WHERE status = 'CLOSED'
// AND no task exists). No task is created here — that happens when the admin drags
// the card to an employee in the Assign & Schedule tab.
//
// Pre-condition: the lead must have at least one service attached.
// Rationale: a lead with no services has no work to be done — closing it would
// create a meaningless unassigned card on the kanban board.
export async function closeLead(lead_id, organization_id) {

    // Guard: check that the lead has at least one service before closing.
    // countByLeadId returns a plain JS number (0, 1, 2, ...).
    const serviceCount = await leadServicesRepo.countByLeadId(lead_id);

    if (serviceCount === 0) {
        // Throw with a descriptive message so the controller can return a 422
        // (Unprocessable Entity) instead of a generic 500 error.
        throw new Error('Cannot close a lead with no services attached');
    }

    // Update lead.status → 'CLOSED'. This single change is what makes the lead
    // appear in the Unassigned kanban column (admin_tasks.repo.js queries for
    // leads WHERE status = 'CLOSED' AND no task row exists).
    const lead = await leadRepo.closeLeadAdmin(lead_id, organization_id);

    // closeLeadAdmin returns null if no row matched (lead doesn't exist or belongs
    // to a different org). Treat this as a 404.
    if (!lead) {
        throw new Error('Lead not found');
    }

    return lead;
}