// hooks/useLeadServices.ts — TanStack Query mutations for lead services
// ============================================================
// Wraps addLeadService and removeLeadService from the API layer.
// Both mutations invalidate the ['lead', leadId] cache so the
// Services tab in the detail modal re-fetches after every change.
//
// The two-step HTTP logic for custom services (POST /services first,
// then POST /lead-services) has moved to api/leadServices.api.ts.
// ============================================================

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addLeadService, removeLeadService } from '@/api/leadServices.api'

// Re-export type so existing imports remain valid.
export type { AddLeadServicePayload } from '@/api/leadServices.api'

// ============================================================
// useAddLeadService
// ============================================================
// leadId is received upfront (not per-call) so it can be used
// in onSuccess to invalidate the correct lead's cache entry.
//
// If a new catalog service was created (service_name was provided),
// we also invalidate ['services'] so the dropdown refreshes.
export function useAddLeadService(leadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addLeadService,

    onSuccess: (_data, variables) => {
      // Refresh the lead detail so the Services tab shows the new line
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] })
      // If a new service was created in the catalog, refresh the services cache too
      if (variables.service_name) {
        queryClient.invalidateQueries({ queryKey: ['services'] })
      }
    },
  })
}

// ============================================================
// useRemoveLeadService
// ============================================================
export function useRemoveLeadService(leadId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    // The mutationFn receives { serviceId } and passes it to the API function.
    // serviceId can be string or number at runtime — the API function handles coercion.
    mutationFn: ({ serviceId }: { serviceId: string | number }) =>
      removeLeadService(leadId, serviceId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] })
    },
  })
}
