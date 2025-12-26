import * as repo from '../repositories/services.repo.js';

export async function createService(data) {
    return repo.createService(data);
}

export async function getAllServices() {
    return repo.getAllServices();
}

export async function getServiceById(id) {
    const service = await repo.getServiceById(id);
    if (!service) throw new Error('Service not found');
    return service;
}

export async function updateService(id, data) {
    const updated = await repo.updateService(id, data);
    if (!updated) throw new Error('Service not found');
    return updated;
}

export async function deleteService(id) {
    const deleted = await repo.deleteService(id);
    if (!deleted) throw new Error('Service not found');
    return deleted;
}