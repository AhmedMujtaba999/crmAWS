import * as repo from '../repositories/invoice.repo.js';

export async function createInvoice(data) {
    return repo.createInvoice(data);
}

export async function getAllInvoices() {
    return repo.getAllInvoices();
}

export async function getInvoiceById(id) {
    const invoice = await repo.getInvoiceById(id);
    if (!invoice) {
        throw new Error('Invoice not found');
    }
    return invoice;
}

export async function updateInvoice(id, data) {
    const updated = await repo.updateInvoice(
        id,
        data.status,
        data.pdf_url
    );

    if (!updated) {
        throw new Error('Invoice not found');
    }

    return updated;
}

export async function deleteInvoice(id) {
    const deleted = await repo.deleteInvoice(id);
    if (!deleted) {
        throw new Error('Invoice not found');
    }
    return deleted;
}