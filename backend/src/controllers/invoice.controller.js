import * as service from '../services/invoice.service.js';

export async function create(req, res, next) {
    try {
        const invoice = await service.createInvoice(req.body);
        res.status(201).json(invoice);
    } catch (err) {
        next(err);
    }
}

export async function getAll(req, res, next) {
    try {
        res.json(await service.getAllInvoices());
    } catch (err) {
        next(err);
    }
}

export async function getById(req, res, next) {
    try {
        res.json(await service.getInvoiceById(req.params.id));
    } catch (err) {
        next(err);
    }
}

export async function update(req, res, next) {
    try {
        res.json(await service.updateInvoice(req.params.id, req.body));
    } catch (err) {
        next(err);
    }
}

export async function remove(req, res, next) {
    try {
        await service.deleteInvoice(req.params.id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}