// api/services.api.ts — Raw HTTP call for the Services catalog
// ============================================================
// GET /services returns the list of services defined for this organisation.
// Used in the Create Lead modal and the Lead Detail services tab
// to populate the service picker dropdown.
// ============================================================

import api from '@/lib/axios'

// Shape of a single service record from the services table.
export interface Service {
  id: string           // UUID — the services table uses uuid primary keys
  name: string
  description: string | null
  organization_id: string
  created_at: string
}

// fetchServices: GET /services
// The endpoint returns a plain array — no { success, data } envelope to unwrap.
export async function fetchServices(): Promise<Service[]> {
  const res = await api.get<Service[]>('/services')
  return res.data
}
