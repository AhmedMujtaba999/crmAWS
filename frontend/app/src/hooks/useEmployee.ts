// hooks/useEmployee.ts — TanStack Query hooks for Employee detail operations
// ============================================================
// Wraps all employee-detail API functions with TanStack Query.
// Covers: employee info, working hours, and leave records.
//
// All types and HTTP calls have moved to src/api/employees.api.ts
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchEmployee,
  updateEmployee,
  fetchEmployeeWorkingHours,
  createWorkingHours,
  updateWorkingHours,
  deleteWorkingHours,
  fetchEmployeeLeaves,
  createLeave,
  deleteLeave,
} from '@/api/employees.api'
import type {
  EmployeeDetail,
  WorkingHours,
  LeaveRecord,
} from '@/api/employees.api'

// ============================================================
// RE-EXPORTS
// ============================================================
// Re-export all types that were previously defined in this file.
// Components importing from '@/hooks/useEmployee' continue to work unchanged.
export type {
  EmployeeDetail,
  UpdateEmployeePayload,
  WorkingHours,
  CreateWorkingHoursPayload,
  UpdateWorkingHoursPayload,
  LeaveRecord,
  CreateLeavePayload,
} from '@/api/employees.api'

// ============================================================
// useEmployee — GET /employees/:id
// ============================================================
export function useEmployee(id: string) {
  return useQuery<EmployeeDetail>({
    queryKey: ['employee', id],
    queryFn: () => fetchEmployee(id),
    enabled: !!id,
  })
}

// ============================================================
// useUpdateEmployee — PUT /employees/:id
// ============================================================
// On success invalidates both the single-employee cache and the list cache,
// so the detail page and the employees list table both refresh.
export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: import('@/api/employees.api').UpdateEmployeePayload }) =>
      updateEmployee(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

// ============================================================
// useEmployeeWorkingHours — GET /employee-working-hours/:employeeId
// ============================================================
export function useEmployeeWorkingHours(employeeId: string) {
  return useQuery<WorkingHours[]>({
    queryKey: ['employee-working-hours', employeeId],
    queryFn: () => fetchEmployeeWorkingHours(employeeId),
    enabled: !!employeeId,
  })
}

// ============================================================
// useCreateWorkingHours — POST /employee-working-hours
// ============================================================
// On success: refresh working hours for this employee + schedule view
// (schedule view uses working hours to determine available time slots).
export function useCreateWorkingHours() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWorkingHours,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['employee-working-hours', variables.employee_id],
      })
      queryClient.invalidateQueries({ queryKey: ['schedule-view'] })
    },
  })
}

// ============================================================
// useUpdateWorkingHours — PUT /employee-working-hours/:id
// ============================================================
// The mutationFn receives { id, employee_id, payload }.
// employee_id is not used in the HTTP call but IS needed in onSuccess
// to invalidate the correct per-employee cache key.
export function useUpdateWorkingHours() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      employee_id: string  // used in onSuccess only — not passed to API function
      payload: import('@/api/employees.api').UpdateWorkingHoursPayload
    }) => updateWorkingHours(id, payload),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['employee-working-hours', variables.employee_id],
      })
      queryClient.invalidateQueries({ queryKey: ['schedule-view'] })
    },
  })
}

// ============================================================
// useDeleteWorkingHours — DELETE /employee-working-hours/:id
// ============================================================
// Same pattern: employee_id is in the mutationFn argument for onSuccess use only.
export function useDeleteWorkingHours() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }: { id: number; employee_id: string }) =>
      deleteWorkingHours(id),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['employee-working-hours', variables.employee_id],
      })
      queryClient.invalidateQueries({ queryKey: ['schedule-view'] })
    },
  })
}

// ============================================================
// useEmployeeLeaves — GET /employee-leaves (filtered client-side)
// ============================================================
// The endpoint returns ALL leaves for the organisation.
// TanStack Query's `select` option filters the result for this employee
// AFTER the fetch, without changing what is stored in the cache.
// The cache always holds the full list — the filtered view is computed
// on-the-fly per component that calls this hook with a specific employeeId.
export function useEmployeeLeaves(employeeId: string) {
  return useQuery<LeaveRecord[], Error, LeaveRecord[]>({
    queryKey: ['employee-leaves'],
    queryFn: fetchEmployeeLeaves,
    // select: runs after the fetch and transforms data before returning it
    // to the component. The cache stores LeaveRecord[], the component sees
    // only the leaves for this employee.
    select: (leaves) => leaves.filter(l => l.employee_id === employeeId),
    enabled: !!employeeId,
  })
}

// ============================================================
// useCreateLeave — POST /employee-leaves
// ============================================================
export function useCreateLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createLeave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-leaves'] })
      queryClient.invalidateQueries({ queryKey: ['schedule-view'] })
    },
  })
}

// ============================================================
// useDeleteLeave — DELETE /employee-leaves/:id
// ============================================================
export function useDeleteLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteLeave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-leaves'] })
      queryClient.invalidateQueries({ queryKey: ['schedule-view'] })
    },
  })
}
