// hooks/useServices.ts — TanStack Query hook for the services catalog
// ============================================================
// Wraps fetchServices from the API layer.
// Used in the Create Lead modal and Lead Detail services tab
// to populate the service picker dropdown.
//
// Types and HTTP call have moved to src/api/services.api.ts
// ============================================================

import { useQuery } from '@tanstack/react-query'
import { fetchServices } from '@/api/services.api'
import type { Service } from '@/api/services.api'

// Re-export Service so existing imports from '@/hooks/useServices' still work.
export type { Service } from '@/api/services.api'

// ============================================================
// useServices — GET /services
// ============================================================
// Caches the catalog under ['services'].
// Invalidated by useAddLeadService when a new custom service is created.
export function useServices() {
  return useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: fetchServices,
  })
}
