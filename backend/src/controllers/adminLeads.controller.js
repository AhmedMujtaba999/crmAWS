import * as adminLeadsService from '../services/adminLeads.service.js';

export async function getAdminLeadsList(req, res, next) {
    try {
        const organization_id = req.user.organization_id;

        const leads = await adminLeadsService.getAdminLeadsList(
            organization_id
        );

        res.json({
            success: true,
            count: leads.length,
            data: leads
        });

    } catch (err) {
        next(err);
    }
}

export async function getAdminLeadFullDetails(req, res, next) {
    try {
        const { leadId } = req.params;
        const organization_id = req.user.organization_id;

        const lead =
            await adminLeadsService.getAdminLeadFullDetails(
                leadId,
                organization_id
            );

        res.json({
            success: true,
            data: lead
        });

    } catch (err) {
        next(err);
    }
}

export async function getAdminCustomerLeadHistory(req, res, next) {
    try {
        const { leadId } = req.params;
        const organization_id = req.user.organization_id;

        const history =
            await adminLeadsService.getAdminCustomerLeadHistory(
                leadId,
                organization_id
            );

        res.json({
            success: true,
            count: history.length,
            data: history
        });

    } catch (err) {
        next(err);
    }
}