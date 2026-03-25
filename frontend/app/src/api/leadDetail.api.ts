// api/leadDetail.api.ts — Raw HTTP call for a single lead's full detail
// ============================================================
// Called when the user clicks a lead row to open the detail modal.
// Returns rich data: all leads for the same customer, with services,
// task, invoice, and notes per lead.
//
// Why is this separate from leads.api.ts?
//   The list endpoint (GET /admin/leads) returns lightweight rows — just
//   enough for the table. The detail endpoint (GET /admin/leads/:id) runs
//   an expensive JOIN across lead_services, tasks, and invoices.
//   Keeping them separate makes it clear which call is cheap (list) and
//   which is expensive (detail).
// ============================================================

import api from '@/lib/axios'

// ============================================================
// TYPE DEFINITIONS
// ============================================================

// A single service attached to this lead (from the lead_services + services JOIN)
export interface LeadService {
  service_id: string
  service_name: string | null   // from services.name — null if service was deleted
  quantity: number | null
  unit_price: number | null
  total_price: number | null
  type: string | null            // e.g. "main", "addon" — depends on data
}

// Full detail shape for one lead (matches SQL aliases in admin_leads.repo.js)
export interface LeadFullDetail {
  lead_id: string
  status: string
  status_detail: string | null
  source: string
  notes: string | null
  lead_created_at: string       // ISO timestamp

  services: LeadService[]       // aggregated with json_agg in SQL
  total_estimate: number        // SUM(lead_services.total_price), 0 if no services

  // Task — null if this lead hasn't been converted to a task yet
  task_id: string | null
  task_title: string | null
  task_description: string | null
  task_status: string | null
  due_date: string | null       // date string

  // Invoice — null if no invoice has been raised
  invoice_id: string | null
  invoice_number: string | null
  total_amount: number | null
  invoice_status: string | null
  invoice_issued_at: string | null
  paid_at: string | null
}

// Internal envelope type — not exported because only fetchLeadDetail needs it.
// The backend returns an ARRAY of leads for the customer (all leads for the
// same customer are returned so the modal can show the full history).
interface LeadDetailResponse {
  success: boolean
  data: LeadFullDetail[]
}

// ============================================================
// API FUNCTION
// ============================================================

// fetchLeadDetail: GET /admin/leads/:leadId
// Returns the specific lead that was clicked, or null if not found.
//
// Why does the backend return an array?
//   The SQL query JOINs on customer_id — it returns ALL leads for the same
//   customer so the modal can show the customer's full history. We find the
//   specific one by lead_id.
//
// The ?? items[0] is a safety fallback: if find() returns undefined
// (shouldn't happen), take the first item. If the array is empty, return null.
export async function fetchLeadDetail(leadId: string): Promise<LeadFullDetail | null> {
  const res = await api.get<LeadDetailResponse>(`/admin/leads/${leadId}`)
  const items = res.data.data
  return items.find(d => d.lead_id === leadId) ?? items[0] ?? null
}
