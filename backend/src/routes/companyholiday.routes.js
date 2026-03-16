import express from "express";
import * as companyHolidayController from "../controllers/companyHoliday.controller.js";

const router = express.Router();

/*
POST
Create new company holiday
*/
router.post(
    "/",
    companyHolidayController.createHoliday
);

/*
GET
Get all company holidays
*/
router.get(
    "/",
    companyHolidayController.getHolidays
);

/*
DELETE
Delete holiday
*/
router.delete(
    "/:id",
    companyHolidayController.deleteHoliday
);

export default router;