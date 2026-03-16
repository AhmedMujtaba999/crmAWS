import express from "express";
import * as employeeLeaveController from "../controllers/employeeLeave.controller.js";

const router = express.Router();

/*
POST
Create employee leave
*/
router.post(
    "/",
    employeeLeaveController.createLeave
);

/*
GET
Get all employee leaves
*/
router.get(
    "/",
    employeeLeaveController.getLeaves
);

/*
DELETE
Delete employee leave
*/
router.delete(
    "/:id",
    employeeLeaveController.deleteLeave
);

export default router;