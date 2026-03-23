import express from "express";
import * as employeeWorkingHoursController from "../controllers/employeeWorkoingHours.controller.js";

const router = express.Router();

/*
POST
Create working hours
*/
router.post(
    "/",
    employeeWorkingHoursController.createWorkingHours
);

/*
GET
Get working hours for an employee
*/
router.get(
    "/:employee_id", employeeWorkingHoursController.getWorkingHours
);

/*
PUT
Update weekday / start_time / end_time for an existing entry
*/
router.put(
    "/:id",
    employeeWorkingHoursController.updateWorkingHours
);

/*
DELETE
Delete working hours entry
*/
router.delete(
    "/:id",
    employeeWorkingHoursController.deleteWorkingHours
);

export default router;