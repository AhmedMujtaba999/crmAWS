// src/services/adminLeads.service.js
import * as adminLeadsRepo from '../repositories/admin_leads.repo.js';


export async function getAdminLeadsList(organization_id) {
    if (!organization_id) {
        throw new Error('organization_id is required');
    }

    const leads = await adminLeadsRepo.getAdminLeadsList(
        organization_id
    );

    return leads;
}

export async function getAdminLeadFullDetails(
    lead_id,
    organization_id
) {
    if (!lead_id) {
        throw new Error('lead_id is required');
    }

    if (!organization_id) {
        throw new Error('organization_id is required');
    }

    const lead =
        await adminLeadsRepo.getAdminCustomerFullLeadHistory(
            lead_id,
            organization_id
        );

    if (!lead) {
        throw new Error('Lead not found');
    }

    return lead;
}

export async function getAdminCustomerLeadHistory(
    lead_id,
    organization_id
) {
    if (!lead_id) {
        throw new Error('lead_id is required');
    }

    if (!organization_id) {
        throw new Error('organization_id is required');
    }

    const history =
        await adminLeadsRepo.getAdminCustomerLeadHistoryByLeadId(
            lead_id,
            organization_id
        );

    return history;
}