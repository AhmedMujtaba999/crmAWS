import * as leadService from '../services/lead.service.js';

export async function createLead(req, res, next) {
    try {
        const lead = await leadService.createLead(req.body);
        res.status(201).json(lead);
    } catch (err) {
        next(err);
    }
}

export async function getAllLeads(req, res, next) {
    try {
        const leads = await leadService.getAllLeads();
        res.json(leads);
    } catch (err) {
        next(err);
    }
}

export async function getLeadById(req, res, next) {
    try {
        const lead = await leadService.getLeadById(req.params.id);
        res.json(lead);
    } catch (err) {
        next(err);
    }
}

export async function updateLead(req, res, next) {
    try {
        const lead = await leadService.updateLead(req.params.id, req.body);
        res.json(lead);
    } catch (err) {
        next(err);
    }
}

export async function deleteLead(req, res, next) {
    try {
        await leadService.deleteLead(req.params.id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}