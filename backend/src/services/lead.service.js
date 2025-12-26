import * as leadRepo from '../repositories/lead.repo.js';

export async function createLead(data) {
    return leadRepo.createLead(data);
}

export async function getAllLeads() {
    return leadRepo.getAllLeads();
}

export async function getLeadById(id) {
    const lead = await leadRepo.getLeadById(id);
    if (!lead) throw new Error('Lead not found');
    return lead;
}

export async function updateLead(id, data) {
    const updated = await leadRepo.updateLead(id, data);
    if (!updated) throw new Error('Lead not found');
    return updated;
}

export async function deleteLead(id) {
    const deleted = await leadRepo.deleteLead(id);
    if (!deleted) throw new Error('Lead not found');
    return deleted;
}