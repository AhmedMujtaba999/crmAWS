// hooks/useEmployees.ts — TanStack Query hook for the employee list
// ============================================================
// Wraps fetchEmployees from the API layer.
// Used by the Schedule view and kanban to render one row/column per employee.
//
// Types and HTTP call have moved to src/api/employees.api.ts
// ============================================================

import { useQuery } from '@tanstack/react-query'
import { fetchEmployees } from '@/api/employees.api'
import type { Employee } from '@/api/employees.api'

// Re-export Employee so existing imports from '@/hooks/useEmployees' still work.
export type { Employee } from '@/api/employees.api'

// ============================================================
// useEmployees — GET /employees
// ============================================================
// Caches the employee list under ['employees'].
// Invalidated by useUpdateEmployee when an employee record changes.
export function useEmployees() {
  return useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
  })
}
