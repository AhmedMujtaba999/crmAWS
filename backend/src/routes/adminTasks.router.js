import express from "express";
import * as controller from "../controllers/adminTasks.controller.js";

const router = express.Router();

router.get("/", controller.getAdminTasks);

// Schedule view: all employees + availability + existing slots for a given date.
// date is a required query param: ?date=2025-03-15
router.get("/schedule", controller.getScheduleView);

// Admin kanban: move a task between PENDING / ACTIVE / COMPLETED.
router.put("/:id/status", controller.updateTaskStatus);

// Full task detail — used by ScheduledTaskModal
router.get("/:id", controller.getTaskById);

// Update task fields + reschedule
router.put("/:id", controller.updateTask);

// Reassign task to a different employee
router.put("/:id/reassign", controller.reassignTask);

// Cancel / delete a task (also removes the schedule entry)
router.delete("/:id", controller.deleteTask);

router.post("/assign", controller.assignTask);

// Close a lead — sets lead.status = 'CLOSED', making it appear in the
// Unassigned kanban column. Blocked with 422 if no services are attached.
router.post("/close/:lead_id", controller.closeLead);

export default router;