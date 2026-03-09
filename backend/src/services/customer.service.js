// src/services/customer.service.js
import * as customerRepo from '../repositories/customer.repo.js';

export async function createCustomer(data, organization_id) {
    if (!data.name) {
        throw new Error('Customer name is required');
    }
    return customerRepo.create(data, organization_id);
}

export async function listCustomers() {
    return customerRepo.getAllCustomers();
}

export async function getCustomer(id) {
    const customer = await customerRepo.getCustomerById(id);

    if (!customer) {
        throw new Error('Customer not found');
    }

    return customer;
}

export async function updateCustomer(id, data) {
    const customer = await customerRepo.updateCustomer(id, data);

    if (!customer) {
        throw new Error('Customer not found');
    }

    return customer;
}

export async function removeCustomer(id) {
    await customerRepo.deleteCustomer(id);
}