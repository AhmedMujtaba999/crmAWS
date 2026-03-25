// hooks/useLeads.ts — TanStack Query hooks for the Leads resource
// ============================================================
// This file is the "hook layer" for leads. It only handles:
//   - Cache keys (queryKey)
//   - When to fire queries (enabled, staleTime)
//   - What to invalidate after a mutation (invalidateQueries)
//
// All type definitions and raw HTTP calls have moved to:
//   src/api/leads.api.ts
//
// The pattern:
//   api/leads.api.ts     → defines types + makes HTTP calls
//   hooks/useLeads.ts    → wraps those calls in TanStack Query (caching, loading state)
//   components/pages     → call these hooks and get back { data, isLoading, isError }
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// useQuery:    hook for read operations (GET). Fires automatically on mount.
// useMutation: hook for write operations (POST/PUT/DELETE). Fires on mutate() call.
// useQueryClient: returns the shared cache so we can call invalidateQueries after writes.

import {
  fetchLeads,
  createLead,
  closeDeal,
  updateLeadEstimate,
} from '@/api/leads.api'
// These are plain async functions from the API layer.
// They make the HTTP calls and return unwrapped data.

// ============================================================
// RE-EXPORTS
// ============================================================
// Types live in the API layer (that's where they belong — they describe
// API response and request shapes). We re-export them here so that existing
// component imports like:
//   import type { Lead } from '@/hooks/useLeads'
// continue to work without any changes to component files.
//
// `export type { ... } from '...'` is a TypeScript barrel re-export.
// It does NOT import the type into this file — it just makes it
// available under this module's path.
export type { Lead, LeadServiceLine, CreateLeadPayload } from '@/api/leads.api'

// Import Lead for use in useQuery's generic below
import type { Lead } from '@/api/leads.api'

// ============================================================
// useLeads — fetch all leads for the organisation
// ============================================================
// Calls fetchLeads() from the API layer.
// TanStack Query caches the result under ['leads'] and re-fetches
// after any mutation that calls invalidateQueries({ queryKey: ['leads'] }).
export function useLeads() {
  return useQuery<Lead[]>({
    queryKey: ['leads'],
    // queryFn: just point to the API function — no inline HTTP logic here
    queryFn: fetchLeads,
  })
}

// ============================================================
// useCreateLead — POST /leads
// ============================================================
// On success: invalidates ['leads'] so the table re-fetches and shows the new row.
export function useCreateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

// ============================================================
// useCloseDeal — POST /tasks/close/:leadId
// ============================================================
// Sets lead status to CLOSED. On success invalidates two caches:
//   ['leads']       → leads table re-fetches with updated status
//   ['admin-tasks'] → kanban re-fetches; the lead appears in Unassigned column
export function useCloseDeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: closeDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] })
    },
  })
}

// ============================================================
// useUpdateLeadEstimate — PATCH /leads/:leadId/estimate
// ============================================================
// Updates estimated_minutes on a lead. On success invalidates:
//   ['leads']       → leads list shows updated duration
//   ['admin-tasks'] → Unassigned column card duration badge updates
//
// The mutationFn receives { leadId, estimated_minutes } as an object.
// It destructures and passes individual args to the API function.
export function useUpdateLeadEstimate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ leadId, estimated_minutes }: { leadId: string; estimated_minutes: number }) =>
      updateLeadEstimate(leadId, estimated_minutes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] })
    },
  })
}
