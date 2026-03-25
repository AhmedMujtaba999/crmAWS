// hooks/useTasks.ts — TanStack Query hooks for the Tasks and Schedule resources
// ============================================================
// This file only handles TanStack Query logic:
//   - queryKey definitions
//   - enabled conditions
//   - placeholderData for smooth transitions
//   - which caches to invalidate on mutation success
//
// All types and HTTP calls have moved to src/api/tasks.api.ts
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchTasks,
  updateTaskStatus,
  assignTask,
  fetchTaskDetail,
  updateTask,
  reassignTask,
  deleteTask,
  fetchScheduleView,
} from '@/api/tasks.api'
import type {
  AdminTasksResponse,
  TaskDetail,
  ScheduleViewData,
} from '@/api/tasks.api'

// ============================================================
// RE-EXPORTS
// ============================================================
// Types live in the API layer. Re-exported here so components that
// import from '@/hooks/useTasks' don't need to change their import paths.
export type {
  UnassignedTask,
  AdminTask,
  AdminTasksResponse,
  AssignTaskPayload,
  ScheduledSlot,
  ScheduleEmployee,
  ScheduleViewData,
  TaskDetail,
  UpdateTaskPayload,
} from '@/api/tasks.api'

// ============================================================
// useTasks — fetch all four kanban buckets
// ============================================================
// Caches the response under ['admin-tasks'].
// Multiple mutations (assign, update, delete, reassign) all invalidate this key.
export function useTasks() {
  return useQuery<AdminTasksResponse>({
    queryKey: ['admin-tasks'],
    queryFn: fetchTasks,
  })
}

// ============================================================
// useUpdateTaskStatus — PUT /tasks/:id/status
// ============================================================
// Called when an admin drags a task card to a new column.
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    // The mutationFn receives { id, status } — destructure and pass individually
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] })
    },
  })
}

// ============================================================
// useAssignTask — POST /tasks/assign
// ============================================================
// Converts an unassigned lead into a task + schedule entry.
export function useAssignTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: assignTask,
    onSuccess: () => {
      // Unassigned list shrinks, pending grows
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] })
      // New slot appears on the schedule timeline
      queryClient.invalidateQueries({ queryKey: ['schedule-view'] })
    },
  })
}

// ============================================================
// useTaskDetail — GET /tasks/:id
// ============================================================
// id: the task id, or null when no task is selected.
// enabled: id != null prevents the query from firing until a task is clicked.
export function useTaskDetail(id: number | null) {
  return useQuery<TaskDetail>({
    queryKey: ['task', id],
    queryFn: () => fetchTaskDetail(id!),
    // id! is the non-null assertion operator — safe because enabled: id != null
    // guarantees queryFn only runs when id is a real number.
    enabled: id != null,
  })
}

// ============================================================
// useUpdateTask — PUT /tasks/:id
// ============================================================
// Edit task fields and reschedule. On success invalidates:
//   ['task', id]     → detail modal refreshes with new values
//   ['admin-tasks']  → kanban cards refresh
//   ['schedule-view']→ schedule timeline refreshes
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: import('@/api/tasks.api').UpdateTaskPayload }) =>
      updateTask(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['schedule-view'] })
    },
  })
}

// ============================================================
// useReassignTask — PUT /tasks/:id/reassign
// ============================================================
export function useReassignTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, employee_id }: { id: number; employee_id: string }) =>
      reassignTask(id, employee_id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['schedule-view'] })
    },
  })
}

// ============================================================
// useDeleteTask — DELETE /tasks/:id
// ============================================================
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['schedule-view'] })
    },
  })
}

// ============================================================
// useScheduleView — GET /tasks/schedule?date=YYYY-MM-DD
// ============================================================
// Each date is cached separately under ['schedule-view', date].
// Switching dates does not invalidate previous days' data — they
// remain in cache and load instantly when the user navigates back.
//
// placeholderData: (prev) => prev
//   While a new date is loading, TanStack Query shows the previous day's
//   data instead of a blank state. This prevents a flash of empty content.
export function useScheduleView(date: string) {
  return useQuery<ScheduleViewData>({
    queryKey: ['schedule-view', date],
    queryFn: () => fetchScheduleView(date),
    enabled: !!date,
    placeholderData: (prev) => prev,
  })
}
