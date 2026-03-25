// api/tasks.api.ts — Raw HTTP calls for the Tasks and Schedule resources
// ============================================================
// Covers all endpoints under /tasks and /tasks/schedule:
//   GET  /tasks                        → four kanban buckets
//   PUT  /tasks/:id/status             → move card between columns
//   POST /tasks/assign                 → convert an unassigned lead into a task
//   GET  /tasks/:id                    → full task detail for the modal
//   PUT  /tasks/:id                    → edit task fields + reschedule
//   PUT  /tasks/:id/reassign           → change assigned employee
//   DELETE /tasks/:id                  → cancel/delete a task
//   GET  /tasks/schedule?date=YYYY-MM-DD → schedule view data
// ============================================================

import api from '@/lib/axios'

// ============================================================
// TYPE DEFINITIONS
// ============================================================
// These types were previously defined in hooks/useTasks.ts.
// They describe API response and request shapes — they belong here.

// An unassigned task is actually a LEAD (closed, not yet converted to a task).
// It has no task id, title, or employee — only customer/lead info.
export interface UnassignedTask {
  lead_id: string          // UUID of the lead — used in POST /tasks/assign
  customer_name: string | null
  customer_phone: string | null
  customer_address: string | null
  notes: string | null     // lead notes — shown on the schedule card
  estimated_minutes: number | null  // expected job duration set at lead creation
  total_estimate: number   // SUM of lead_services.total_price (0 if no services)
  created_at: string       // when the lead was created (ISO timestamp)
}

// A pending/active/completed task — a real task record with JOINed fields.
export interface AdminTask {
  id: number               // integer primary key of the tasks table
  lead_id: string          // UUID of the source lead
  employee_id: number | null
  title: string
  description: string | null
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED'
  due_date: string | null  // date string e.g. "2026-03-10"
  estimated_minutes: number | null
  organization_id: string
  created_at: string
  completed_at: string | null   // set when status becomes COMPLETED
  // JOINed fields
  employee_name: string | null  // from employees table
  customer_name: string | null  // from leads → customers
  customer_phone: string | null
  customer_address: string | null
}

// Full response envelope from GET /tasks.
// The backend returns four arrays in one response.
export interface AdminTasksResponse {
  success: boolean
  unassigned_tasks: UnassignedTask[]
  pending_tasks: AdminTask[]
  active_tasks: AdminTask[]
  completed_tasks: AdminTask[]
}

// Payload for POST /tasks/assign.
// Creates both a task record and an employee_schedule entry simultaneously.
export interface AssignTaskPayload {
  lead_id: string
  employee_id: number
  title: string
  description: string
  scheduled_start: string   // ISO datetime e.g. "2026-03-10T10:00:00"
  estimated_minutes: number
}

// A single already-scheduled slot on the employee_schedule table,
// enriched with task title + customer name + total estimate.
export interface ScheduledSlot {
  schedule_id: string
  employee_id: string
  lead_id: string
  scheduled_start: string    // ISO datetime e.g. "2025-03-15T09:00:00.000Z"
  scheduled_end: string
  task_id: string | null     // null if task hasn't been created yet
  task_title: string | null
  estimated_minutes: number | null
  customer_name: string | null
  total_estimate: number
}

// One employee row in the schedule view.
// work_start / work_end come from employee_working_hours for the date's weekday —
// both null means the employee has no working hours configured for that day.
export interface ScheduleEmployee {
  id: string
  name: string
  employment_type: string | null
  role: string | null
  work_start: string | null  // "HH:MM" in 24-hour format, e.g. "09:00"
  work_end: string | null    // "HH:MM" e.g. "17:00"
  on_leave: boolean
  scheduled_slots: ScheduledSlot[]
}

// Full response from GET /tasks/schedule?date=YYYY-MM-DD
export interface ScheduleViewData {
  date: string
  holiday: { holiday_name: string } | null  // null if not a holiday
  employees: ScheduleEmployee[]
}

// Full task detail returned by GET /tasks/:id.
// Contains all task fields plus JOINed employee/customer info
// and the employee_schedule entry (scheduled_start, scheduled_end).
export interface TaskDetail {
  id: number
  lead_id: string
  employee_id: number | null
  title: string
  description: string | null
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED'
  due_date: string | null
  estimated_minutes: number | null
  organization_id: string
  created_at: string
  completed_at: string | null
  // JOINed fields
  employee_name: string | null
  customer_name: string | null
  customer_phone: string | null
  customer_address: string | null
  // From employee_schedule JOIN
  schedule_id: string | null
  scheduled_start: string | null
  scheduled_end: string | null
}

// Payload for PUT /tasks/:id (edit task fields + reschedule)
export interface UpdateTaskPayload {
  title: string
  description: string
  scheduled_start: string   // ISO datetime
  estimated_minutes: number
}

// ============================================================
// API FUNCTIONS
// ============================================================

// fetchTasks: GET /tasks
// Returns all four kanban buckets in one call.
// The full response IS the AdminTasksResponse — no inner unwrapping needed.
export async function fetchTasks(): Promise<AdminTasksResponse> {
  const res = await api.get<AdminTasksResponse>('/tasks')
  return res.data
}

// updateTaskStatus: PUT /tasks/:id/status
// Moves a task card from one column to another.
export async function updateTaskStatus(id: number, status: string): Promise<unknown> {
  const res = await api.put(`/tasks/${id}/status`, { status })
  return res.data
}

// assignTask: POST /tasks/assign
// Converts an unassigned lead into a task and creates its schedule entry.
export async function assignTask(payload: AssignTaskPayload): Promise<unknown> {
  const res = await api.post('/tasks/assign', payload)
  return res.data
}

// fetchTaskDetail: GET /tasks/:id
// Returns a single task with all JOINed fields and schedule info.
// The backend wraps the task in { success: true, task: TaskDetail }.
export async function fetchTaskDetail(id: number): Promise<TaskDetail> {
  const res = await api.get<{ success: boolean; task: TaskDetail }>(`/tasks/${id}`)
  // Unwrap the envelope — callers receive TaskDetail directly, not the wrapper
  return res.data.task
}

// updateTask: PUT /tasks/:id
// Edits task fields and reschedules the employee_schedule entry.
// Returns the updated TaskDetail from the response envelope.
export async function updateTask(id: number, payload: UpdateTaskPayload): Promise<TaskDetail> {
  const res = await api.put<{ success: boolean; task: TaskDetail }>(`/tasks/${id}`, payload)
  return res.data.task
}

// reassignTask: PUT /tasks/:id/reassign
// Changes the assigned employee. Updates the employee_schedule entry too.
export async function reassignTask(id: number, employee_id: string): Promise<TaskDetail> {
  const res = await api.put<{ success: boolean; task: TaskDetail }>(
    `/tasks/${id}/reassign`,
    { employee_id }
  )
  return res.data.task
}

// deleteTask: DELETE /tasks/:id
// Permanently removes the task and its schedule entry.
export async function deleteTask(id: number): Promise<unknown> {
  const res = await api.delete(`/tasks/${id}`)
  return res.data
}

// fetchScheduleView: GET /tasks/schedule?date=YYYY-MM-DD
// Returns all employees with their scheduled slots for the given date.
// The backend wraps the data in { success: true, data: ScheduleViewData }.
export async function fetchScheduleView(date: string): Promise<ScheduleViewData> {
  const res = await api.get<{ success: boolean; data: ScheduleViewData }>(
    `/tasks/schedule?date=${date}`
  )
  return res.data.data
}
