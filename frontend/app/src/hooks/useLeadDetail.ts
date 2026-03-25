// hooks/useLeadDetail.ts — TanStack Query hook for a single lead's full detail
// ============================================================
// Wraps fetchLeadDetail (from api/leadDetail.api.ts) with TanStack Query.
// The `enabled: !!leadId` pattern pauses the query until a lead is actually
// selected — calling useLeadDetail(null) causes no network request.
//
// Types have moved to src/api/leadDetail.api.ts
// ============================================================

import { useQuery } from '@tanstack/react-query'
import { fetchLeadDetail } from '@/api/leadDetail.api'
import type { LeadFullDetail } from '@/api/leadDetail.api'

// Re-export types so existing component imports remain valid.
// e.g. `import type { LeadFullDetail } from '@/hooks/useLeadDetail'` still works.
export type { LeadFullDetail, LeadService } from '@/api/leadDetail.api'

// ============================================================
// useLeadDetail — fetch rich detail for one lead on demand
// ============================================================
// leadId: the UUID of the selected lead, or null when nothing is selected.
//
// enabled: !!leadId
//   Converts leadId to boolean. null → false (query paused), "abc-123" → true (query fires).
//   When paused: { data: undefined, isLoading: false } — no network request.
//
// queryKey: ['lead', leadId]
//   Each lead is cached separately. Opening the same lead twice re-uses the cache.
//   When leadId is null the key is ['lead', null] — but enabled: false prevents firing.
export function useLeadDetail(leadId: string | null) {
  return useQuery<LeadFullDetail | null>({
    queryKey: ['lead', leadId],
    enabled: !!leadId,
    queryFn: () => fetchLeadDetail(leadId!),
    // leadId! is the non-null assertion operator — tells TypeScript "trust me,
    // it's not null here". Safe because enabled: !!leadId guarantees queryFn
    // only runs when leadId is a non-empty string.
  })
}
