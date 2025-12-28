import * as service from '../services/lead-services.service.js';

export async function addService(req, res, next) {
    try {
        const record = await service.addServiceToLead(req.body);
        res.status(201).json(record);
    } catch (err) {
        next(err);
    }
}

export async function getAll(req, res, next) {
    try {
        res.json(await service.getAllLeadServices());
    } catch (err) {
        next(err);
    }
}

export async function getServices(req, res, next) {
    try {
        res.json(await service.getServicesByLead(req.params.leadId));
    } catch (err) {
        next(err);
    }
}

/**
 * PUT handler
 */
export async function updateService(req, res, next) {
    try {
        const updated = await service.updateLeadService(
            req.params.leadId,
            req.params.serviceId,
            req.body.quantity,
            req.body.unit_price
        );
        res.json(updated);
    } catch (err) {
        next(err);
    }
}

export async function removeService(req, res, next) {
    try {
        await service.removeServiceFromLead(
            req.params.leadId,
            req.params.serviceId
        );
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}