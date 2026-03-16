import express from "express";
import * as scheduleController from "../controllers/schedule.controller.js";

const router = express.Router();

router.post(
    "/",
    scheduleController.createSchedule
);

router.get(
    "/",
    scheduleController.getSchedules
);

router.put(
    "/:id",
    scheduleController.updateSchedule
);

router.delete(
    "/:id",
    scheduleController.deleteSchedule
);

export default router;