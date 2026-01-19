import * as repo from '../repositories/services.repo.js';


export async function createService({ name, description, organization_id }) {
    if (!organization_id) throw new Error('organization_id is required');
    if (!name) throw new Error('name is required');

    return repo.createService({
        name,
        description,
        organization_id
    });
}

export async function getAllServices({ organization_id }) {
    if (!organization_id) throw new Error('organization_id is required');

    return repo.getAllServices({ organization_id });
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

export async function deleteService({ id, organization_id }) {
    if (!id) throw new Error('service id is required');
    if (!organization_id) throw new Error('organization_id is required');

    const deleted = await repo.deleteService({ id, organization_id });
    if (!deleted) throw new Error('Service not found');

    return deleted;
}