// src/services/workerTaskUploadConfirm.service.js
import * as taskImagesRepo from "../repositories/taskImages.repo.js";
import * as invoiceRepo from "../repositories/invoice.repo.js";

function toUploadStatus(flag) {
    return flag === true ? "COMPLETED" : "FAILED";
}

function isTaskImageKey(task_id, key) {
    // tasks/<task_id>/before/... OR tasks/<task_id>/after/...
    return (
        typeof key === "string" &&
        key.startsWith(`tasks/${task_id}/`) &&
        (key.includes("/before/") || key.includes("/after/")) &&
        (key.endsWith(".jpg") || key.endsWith(".jpeg") || key.endsWith(".png"))
    );
}

function isInvoiceKey(task_id, key) {
    // tasks/<task_id>/invoices/<invoiceNumber>/invoice-v1.pdf  (your latest pattern)
    return (
        typeof key === "string" &&
        key.startsWith(`tasks/${task_id}/invoices/`) &&
        key.endsWith(".pdf")
    );
}

export async function confirmWorkerTaskUploads(payload) {
    const { task_id, uploadsstatus, organization_id } = payload;

    if (!organization_id) throw new Error("organization_id is required");
    if (!task_id) throw new Error("task_id is required");
    if (!Array.isArray(uploadsstatus) || uploadsstatus.length === 0) {
        throw new Error("uploadsstatus must be a non-empty array");
    }

    // ✅ response kept light (only key + final upload_status)
    const result = {
        task_id,
        confirmed: [],
        ignored: [], // keys that don't match task patterns
    };
    console.log('upload status check!!!', uploadsstatus)
    for (const item of uploadsstatus) {
        const object_key = item?.object_key;
        const flag = item?.status;
        console.log('eacgtim!!', object_key, flag)
        if (!object_key || typeof flag !== "boolean") {
            result.ignored.push({
                object_key: object_key ?? null,
                reason: "invalid item (need object_key + boolean status)",
            });
            continue;
        }

        const upload_status = toUploadStatus(flag);

        // ✅ 1) If it's an image key → update task_images row
        if (isTaskImageKey(task_id, object_key)) {
            // infer type from key
            const image_type = object_key.includes("/before/") ? "before" : "after";

            await taskImagesRepo.updateImageUploadStatus({
                upload_status,
                organization_id,
                task_id,
                image_type,
                image_url: object_key,

            });

            result.confirmed.push({
                object_key,
                kind: "image",
                image_type,
                upload_status,
            });
            continue;
        }

        // ✅ 2) If it's an invoice key → update invoices row (by pdf_url)
        if (isInvoiceKey(task_id, object_key)) {
            await invoiceRepo.updateInvoiceUploadStatusByPdfUrl({
                organization_id,
                task_id,
                pdf_url: object_key,
                upload_status,
            });

            result.confirmed.push({
                object_key,
                kind: "invoice",
                upload_status,
            });
            continue;
        }

        // ✅ Otherwise ignore (prevents tampering with other tasks’ keys)
        result.ignored.push({
            object_key,
            reason: "key does not belong to this task_id pattern",
        });
    }

    return result;
}