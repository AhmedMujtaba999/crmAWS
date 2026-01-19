import * as serviceService from '../services/services.service.js';

export async function createService(req, res, next) {
    try {
        const { name, description } = req.body;
        const organization_id = req.user.organization_id;

        const service = await serviceService.createService({
            name,
            description,
            organization_id
        });

        res.status(201).json(service);
    } catch (err) {
        next(err);
    }
}

export async function getAllServices(req, res, next) {
    try {
        const organization_id = req.user.organization_id;

        const services = await serviceService.getAllServices({
            organization_id
        });

        res.json(services);
    } catch (err) {
        next(err);
    }
}

export async function getServiceById(req, res, next) {
    try {
        res.json(await serviceService.getServiceById(req.params.id));
    } catch (err) {
        next(err);
    }
}

export async function updateService(req, res, next) {
    try {
        res.json(
            await serviceService.updateService(req.params.id, req.body)
        );
    } catch (err) {
        next(err);
    }
}

export async function deleteService(req, res, next) {
    try {
        const { id } = req.params;
        const organization_id = req.user.organization_id;

        await serviceService.deleteService({
            id,
            organization_id
        });

        res.status(204).send();
    } catch (err) {
        next(err);
    }
}