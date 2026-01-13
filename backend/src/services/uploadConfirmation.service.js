import { saveTaskImage } from "../repositories/taskImages.repo.js";
import { updateInvoicePdfUrl } from "../repositories/invoice.repo.js";

export async function confirmWorkerTaskUploads(payload) {
    const { task_id, invoice_id, uploads } = payload;

    if (!task_id || !uploads || Object.keys(uploads).length === 0) {
        throw new Error("Nothing to confirm");
    }

    const results = {};

    if (uploads.before) {
        results.before = await saveTaskImage({
            task_id,
            image_type: "before",
            image_url: uploads.before.object_key
        });
    }

    if (uploads.after) {
        results.after = await saveTaskImage({
            task_id,
            image_type: "after",
            image_url: uploads.after.object_key
        });
    }

    if (uploads.invoice) {
        if (!invoice_id) {
            throw new Error("invoice_id required for invoice upload");
        }

        results.invoice = await updateInvoicePdfUrl(
            invoice_id,
            uploads.invoice.object_key
        );
    }

    return results;
}