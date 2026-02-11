import { confirmWorkerTaskUploads } from "../services/uploadConfirmation.service.js";

export async function confirmUploads(req, res, next) {
    try {
        const organization_id = req.user.organization_id;

        const result = await confirmWorkerTaskUploads({
            ...req.body,
            organization_id,
        });

        res.status(200).json({
            message: "Uploads confirmed",
            result,
        });
    } catch (err) {
        next(err);
    }
}