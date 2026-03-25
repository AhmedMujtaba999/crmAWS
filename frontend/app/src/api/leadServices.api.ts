// api/leadServices.api.ts — Raw HTTP calls for attaching/detaching services on a lead
// ============================================================
// POST /lead-services — attach a service to an existing lead
// DELETE /lead-services/:leadId/:serviceId — detach a service
//
// The addLeadService function handles "custom" services (typed by admin,
// not in the catalog) via a two-step HTTP sequence:
//   1. POST /services — creates the new catalog entry, returns its id
//   2. POST /lead-services — attaches that id to the lead
// Both steps are HTTP calls, so the orchestration belongs in the API layer,
// not in the TanStack Query hook.
// ============================================================

import api from '@/lib/axios'

// ============================================================
// TYPE DEFINITIONS
// ============================================================

// Payload for adding a service to a lead.
// Exactly one of service_id or service_name should be provided:
//   service_id   — an existing service from GET /services
//   service_name — a new custom service; we create it first via POST /services
export interface AddLeadServicePayload {
  lead_id: string
  service_id?: string       // UUID of the selected catalog service
  service_name?: string     // custom service name — triggers POST /services first
  quantity: number
  unit_price: number
}

// ============================================================
// API FUNCTIONS
// ============================================================

// addLeadService: optionally POST /services, then POST /lead-services
//
// If service_name is provided (no service_id), we create a new catalog service
// first. The newly created service's id is then used in the lead-services call.
// This two-step is transparent to the caller — it always just passes a payload
// and gets a single Promise back.
export async function addLeadService(payload: AddLeadServicePayload): Promise<unknown> {
  let serviceId = payload.service_id

  // If no existing service_id was provided, create a new service in the catalog.
  // The POST /services endpoint reads organization_id from the JWT (set by Axios interceptor),
  // so we only need to send name (and optionally description).
  if (!serviceId && payload.service_name) {
    const svcRes = await api.post<{ id: string }>('/services', {
      name: payload.service_name,
      description: null,
    })
    // svcRes.data.id is the UUID of the newly created catalog service
    serviceId = svcRes.data.id
  }

  // Attach the service (existing or just-created) to the lead
  const res = await api.post('/lead-services', {
    lead_id: payload.lead_id,
    service_id: serviceId,
    quantity: payload.quantity,
    unit_price: payload.unit_price,
  })
  return res.data
}

// removeLeadService: DELETE /lead-services/:leadId/:serviceId
// Detaches a service from a lead. The service itself stays in the catalog.
export async function removeLeadService(
  leadId: string,
  serviceId: string | number
): Promise<unknown> {
  // serviceId can be string or number at runtime (SQL returns it as string,
  // but some places pass it as number). Coercing to string in the URL is safe.
  const res = await api.delete(`/lead-services/${leadId}/${serviceId}`)
  return res.data
}
