import express from "express";
import * as controller from "../controllers/organization.controller.js";

const router = express.Router();

router.post("/", controller.createOrganization);
router.get("/", controller.getAllOrganizations);
router.get("/:id", controller.getOrganizationById);
router.put("/:id", controller.updateOrganization);

export default router;