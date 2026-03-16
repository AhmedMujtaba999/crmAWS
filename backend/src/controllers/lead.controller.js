import * as leadService from '../services/lead.service.js';



export async function createLead(req, res, next) {
    try {
        const data = req.body;
        const result = await leadService.createLead(
            data,
            req.user
        );

        res.status(201).json({
            success: true,
            lead: result
        });

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

// PATCH /leads/:id/estimate — update estimated_minutes on a lead
// Used from the Assign & Schedule panel before assigning the task.
export async function updateLeadEstimate(req, res, next) {
    try {
        const { id } = req.params;
        const { estimated_minutes } = req.body;
        const { organization_id } = req.user;

        const lead = await leadService.updateLeadEstimate(id, estimated_minutes, organization_id);

        if (!lead) return res.status(404).json({ error: 'Lead not found' });

        res.json({ success: true, lead });
    } catch (err) {
        next(err);
    }
}

// export async function updateLead(req, res, next) {
//     try {
//         const lead = await leadService.updateLead(req.params.id, req.body);
//         res.json(lead);
//     } catch (err) {
//         next(err);
//     }
// }

// export async function deleteLead(req, res, next) {
//     try {
//         await leadService.deleteLead(req.params.id);
//         res.status(204).send();
//     } catch (err) {
//         next(err);
//     }
// }