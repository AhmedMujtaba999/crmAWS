import * as adminTasksService from "../services/adminTasks.service.js";

export async function getAdminTasks(req, res, next) {
    try {

        const organization_id = req.user.organization_id;

        const data = await adminTasksService.getAdminTasks(
            organization_id
        );

        res.json({
            success: true,
            ...data
        });

    } catch (err) {
        next(err);
    }
}

export async function updateTaskStatus(req, res, next) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const organization_id = req.user.organization_id;

        const task = await adminTasksService.updateTaskStatus(
            id,
            status,
            organization_id
        );

        res.json({ success: true, task });

    } catch (err) {
        next(err);
    }
}

// GET /tasks/schedule?date=YYYY-MM-DD
// Returns the full timeline data for one day: employees, working hours, leaves,
// holidays, and existing scheduled slots — all merged into a single response.
export async function getScheduleView(req, res, next) {
    try {
        const { organization_id } = req.user;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ error: 'date query parameter is required (YYYY-MM-DD)' });
        }

        const data = await adminTasksService.getScheduleView(organization_id, date);

        res.json({ success: true, data });

    } catch (err) {
        next(err);
    }
}

export async function assignTask(req, res, next) {

    try {

        const task = await adminTasksService.assignTask(
            req.body,
            req.user
        );

        res.json({
            success: true,
            task
        });

    } catch (err) {
        next(err);
    }
}

// GET /tasks/:id — full task with employee, customer, and schedule entry
export async function getTaskById(req, res, next) {
    try {
        const task = await adminTasksService.getTaskById(
            req.params.id,
            req.user.organization_id
        );
        res.json({ success: true, task });
    } catch (err) {
        if (err.message === 'Task not found') return res.status(404).json({ error: err.message });
        next(err);
    }
}

// PUT /tasks/:id — update task fields + reschedule
export async function updateTask(req, res, next) {
    try {
        const task = await adminTasksService.updateTask(
            req.params.id,
            req.user.organization_id,
            req.body
        );
        res.json({ success: true, task });
    } catch (err) {
        if (err.message === 'Task not found') return res.status(404).json({ error: err.message });
        next(err);
    }
}

// PUT /tasks/:id/reassign — change the assigned employee
export async function reassignTask(req, res, next) {
    try {
        const task = await adminTasksService.reassignTask(
            req.params.id,
            req.user.organization_id,
            req.body.employee_id
        );
        res.json({ success: true, task });
    } catch (err) {
        if (err.message === 'Task not found') return res.status(404).json({ error: err.message });
        next(err);
    }
}

// DELETE /tasks/:id — cancel/delete a task and its schedule entry
export async function deleteTask(req, res, next) {
    try {
        await adminTasksService.deleteTask(
            req.params.id,
            req.user.organization_id
        );
        res.json({ success: true });
    } catch (err) {
        if (err.message === 'Task not found') return res.status(404).json({ error: err.message });
        next(err);
    }
}

// Close a lead: sets lead.status → 'CLOSED' so it appears in the
// Unassigned kanban column. Returns the updated lead row.
// Returns 422 if the lead has no services (frontend blocks UI too, but
// this is a server-side safety net in case the check is bypassed).
export async function closeLead(req, res, next) {
    try {

        const { lead_id } = req.params;
        const { organization_id } = req.user;

        const lead = await adminTasksService.closeLead(
            lead_id,
            organization_id
        );

        res.json({ success: true, lead });

    } catch (err) {

        // Known business-rule error → return a 422 with a clean JSON body.
        // 422 Unprocessable Entity: request is well-formed but can't be acted on
        // due to a business rule (no services attached).
        // The frontend reads error.response.data.error to display the message.
        if (err.message === 'Cannot close a lead with no services attached') {
            return res.status(422).json({ error: err.message });
        }

        if (err.message === 'Lead not found') {
            return res.status(404).json({ error: err.message });
        }

        next(err);
    }
}