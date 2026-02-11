import { createWorkerTaskUploads } from "../services/workerTaskUpload.service.js";
import { getWorkerTaskUploads } from '../services/workerTaskUpload.service.js';

export async function postWorkerTaskInvoicePicture(req, res, next) {
    try {
        const organization_id = req.user.organization_id;
        const { task_id, status, action } = req.body;

        if (!task_id || !action || typeof action !== "object") {
            return res.status(400).json({ error: "Invalid request" });
        }

        const uploads = await createWorkerTaskUploads({
            task_id,
            status,
            action,
            organization_id
        });

        res.status(200).json({
            task_id,
            status,
            uploads
        });
    } catch (err) {
        next(err);
    }
}

export async function getWorkerTaskUploadsController(req, res, next) {
    try {

        const organization_id = req.user.organization_id;
        const { task_id } = req.params;
        const { before, after, invoice } = req.query;

        if (!before && !after && !invoice) {
            return res.status(400).json({
                error: 'At least one query param required (before, after, invoice)'
            });
        }

        const result = await getWorkerTaskUploads({
            task_id,
            before,
            after,
            invoice,
            organization_id
        });

        res.json(result);
    } catch (err) {
        next(err);
    }
}