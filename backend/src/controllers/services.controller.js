import * as serviceService from '../services/services.service.js';

export async function createService(req, res, next) {
    try {
        const service = await serviceService.createService(req.body);
        res.status(201).json(service);
    } catch (err) {
        next(err);
    }
}

export async function getAllServices(req, res, next) {
    try {
        res.json(await serviceService.getAllServices());
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
        await serviceService.deleteService(req.params.id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}