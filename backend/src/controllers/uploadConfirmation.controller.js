import { confirmWorkerTaskUploads } from "../services/uploadConfirmation.service.js";

export async function confirmUploads(req, res, next) {
    try {
        const result = await confirmWorkerTaskUploads(req.body);

        res.status(200).json({
            message: "Uploads confirmed",
            result
        });
    } catch (err) {
        next(err);
    }
}