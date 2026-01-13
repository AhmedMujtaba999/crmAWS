import express from "express";
import { confirmUploads } from "../controllers/uploadConfirmation.controller.js";

const router = express.Router();

router.post("/", confirmUploads);

export default router;