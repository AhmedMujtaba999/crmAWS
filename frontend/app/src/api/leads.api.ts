// api/leads.api.ts — Raw HTTP calls for the Leads resource
// ============================================================
// This file is the "API layer" for leads. It contains:
//   1. TypeScript type definitions for lead-related data shapes
//   2. Plain async functions that make HTTP calls via Axios
//
// What this file does NOT contain:
//   - useQuery / useMutation (those are TanStack Query concepts — they live in hooks/)
//   - Cache keys, invalidation logic, loading/error state
//   - Any React code (no hooks, no components)
//
// Why separate from the hook?
//   - These functions can be called from anywhere (a utility, a future
//     server component, a unit test) without needing React or TanStack Query.
//   - The hook (useLeads.ts) only needs to handle caching — the actual
//     HTTP details are encapsulated here.
// ============================================================

import api from '@/lib/axios'
// api is the shared Axios instance from src/lib/axios.ts.
// It automatically attaches Authorization: Bearer <token> to every request.

// ============================================================
// TYPE DEFINITIONS
// ============================================================
// These types were previously defined in hooks/useLeads.ts.
// They live here now because they describe the shape of API responses
// and request payloads — that's an API concern, not a cache concern.
//
// They are exported so that:
//   - The hook (useLeads.ts) can import and re-export them for backwards compat
//   - Any component that imports from this file directly also gets them

// Lead: matches the SQL SELECT in backend/src/repositories/admin_leads.repo.js
// Field names match the SQL column aliases exactly (e.g. l.id AS lead_id).
// string | null means the field can be a string OR null (TypeScript union type).
// This matters because customer fields come from a LEFT JOIN — if no customer
// record exists, those fields will be null.
export interface Lead {
  lead_id: string         // UUID — the primary key of the lead (l.id AS lead_id)
  name: string | null     // from customers table LEFT JOIN — null if customer was deleted
  phone: string | null    // from customers table
  email: string | null    // from customers table
  address: string | null  // from customers table
  source: string          // e.g. "Website", "Referral", "LinkedIn", "Cold Call", "Trade Show"
  status: string          // "New" | "Contacted" | "Qualified" | "Proposal" | "Negotiation" | "Closed"
  status_detail: string | null  // free-text description of where the lead is at
  estimated_minutes: number | null  // job duration hint; null until the admin sets it
  services_count: number  // how many service lines are attached (0 = none yet)
  created_at: string      // ISO 8601 timestamp string e.g. "2024-03-07T10:30:00.000Z"
}

// A single service line sent with a lead creation request.
// Exactly one of service_id or service_name must be present:
//   service_id   — an existing service from the catalog (GET /services)
//   service_name — a custom service name; the backend creates it in the
//                  same transaction and links it to the lead
export interface LeadServiceLine {
  service_id?: string       // UUID of existing catalog service
  service_name?: string     // custom "Other" service to be created on the fly
  quantity: number
  unit_price: number
}

// Payload for POST /leads.
// The backend service reads data.customer, data.lead, and data.services.
// services is optional — if omitted or empty, the backend skips lead_services inserts.
export interface CreateLeadPayload {
  customer: {
    name: string
    phone: string
    email: string
    address: string
  }
  lead: {
    source: string
    status: string
    status_detail: string
    notes: string
    estimated_minutes?: number  // optional — sent only if the admin entered a value
  }
  services?: LeadServiceLine[]
}

// Internal type — the full HTTP response envelope from GET /admin/leads.
// The backend wraps list responses in { success, count, data }.
// Not exported — only fetchLeads() needs to know about the envelope.
interface LeadsListResponse {
  success: boolean
  count: number
  data: Lead[]
}

// ============================================================
// API FUNCTIONS
// ============================================================
// Each function is a plain async function that makes one HTTP call
// and returns the unwrapped data. No React, no TanStack Query.
//
// These are called by the queryFn / mutationFn in the hook layer.

// fetchLeads: GET /admin/leads
// Returns the array of leads for the logged-in organisation.
// Unwraps the { success, count, data } envelope — callers receive Lead[] directly.
export async function fetchLeads(): Promise<Lead[]> {
  const res = await api.get<LeadsListResponse>('/admin/leads')
  // res.data is the full JSON body: { success: true, count: 6, data: [...] }
  // We unwrap and return only the array.
  return res.data.data
}

// createLead: POST /leads
// Sends customer + lead + optional services in one request.
// Returns whatever the backend sends back (typically { success, lead_id }).
export async function createLead(payload: CreateLeadPayload): Promise<unknown> {
  const res = await api.post('/leads', payload)
  return res.data
}

// closeDeal: POST /tasks/close/:leadId
// Sets the lead's status to CLOSED so it appears in the Unassigned kanban column.
// Returns the backend confirmation object.
export async function closeDeal(leadId: string): Promise<unknown> {
  const res = await api.post(`/tasks/close/${leadId}`)
  return res.data
}

// updateLeadEstimate: PATCH /leads/:leadId/estimate
// Updates only the estimated_minutes field on the lead.
// PATCH means "partial update" — only the sent fields change; all others are untouched.
export async function updateLeadEstimate(
  leadId: string,
  estimated_minutes: number
): Promise<unknown> {
  const res = await api.patch(`/leads/${leadId}/estimate`, { estimated_minutes })
  return res.data
}
