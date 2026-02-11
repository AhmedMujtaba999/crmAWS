import * as organizationService from "../services/organization.service.js";

export async function createOrganization(req, res, next) {
    try {
        const result = await organizationService.createOrganization(req.body);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

export async function getAllOrganizations(req, res, next) {
    try {
        const result = await organizationService.getAllOrganizations();
        res.json(result);
    } catch (err) {
        next(err);
    }
}

export async function getOrganizationById(req, res, next) {
    try {
        const { id } = req.params;

        const result = await organizationService.getOrganizationById(id);

        res.json({
            success: true,
            data: result
        });

    } catch (err) {
        next(err);
    }
}

export async function updateOrganization(req, res, next) {
    try {
        const { id } = req.params;

        const result = await organizationService.updateOrganization(
            id,
            req.body
        );

        res.json(result);
    } catch (err) {
        next(err);
    }
}