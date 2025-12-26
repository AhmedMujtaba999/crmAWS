// src/controllers/customer.controller.js
import * as customerService from '../services/customer.service.js';

export async function createCustomer(req, res, next) {
    try {
        const customer = await customerService.createCustomer(req.body);
        res.status(201).json(customer);
    } catch (err) {
        next(err);
    }
}

export async function getCustomers(req, res, next) {
    try {
        const customers = await customerService.listCustomers();
        res.json(customers);
    } catch (err) {
        next(err);
    }
}

export async function getCustomerById(req, res, next) {
    try {
        const customer = await customerService.getCustomer(req.params.id);
        res.json(customer);
    } catch (err) {
        next(err);
    }
}

export async function updateCustomer(req, res, next) {
    try {
        const customer = await customerService.updateCustomer(
            req.params.id,
            req.body
        );
        res.json(customer);
    } catch (err) {
        next(err);
    }
}

export async function deleteCustomer(req, res, next) {
    try {
        await customerService.removeCustomer(req.params.id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}