// api/employees.api.ts — Raw HTTP calls for the Employees resource
// ============================================================
// Covers all employee-related endpoints:
//   GET  /employees                          → employee list
//   GET  /employees/:id                      → single employee detail
//   PUT  /employees/:id                      → edit employee info
//   GET  /employee-working-hours/:employeeId → working hours for one employee
//   POST /employee-working-hours             → add a working hours entry
//   PUT  /employee-working-hours/:id         → edit a working hours entry
//   DELETE /employee-working-hours/:id       → remove a working hours entry
//   GET  /employee-leaves                    → all leaves for the organisation
//   POST /employee-leaves                    → add a leave entry
//   DELETE /employee-leaves/:id             → remove a leave entry
//
// Types from hooks/useEmployee.ts and hooks/useEmployees.ts are consolidated
// here because both deal with the same resource.
// ============================================================

import api from '@/lib/axios'

// ============================================================
// TYPE DEFINITIONS
// ============================================================

// Employee: shape returned by GET /employees (lightweight list row)
// Used by useEmployees.ts for the kanban/schedule view.
export interface Employee {
  id: number
  name: string
  phone: string | null
  email: string | null
  role: string | null             // e.g. "TECHNICIAN", "ADMIN"
  employment_type: string | null  // e.g. "Full-Time", "Part-Time"
  hourly_rate: number | null
  is_active: boolean
  organization_id: string
  created_at: string
}

// EmployeeDetail: full record returned by GET /employees/:id
// id is a UUID string in the database (unlike Employee.id which is number).
export interface EmployeeDetail {
  id: string
  name: string
  phone: string | null
  email: string | null
  role: string | null
  employment_type: string | null
  hourly_rate: number | null
  is_active: boolean
  organization_id: string
  created_at: string
}

// Partial update payload for PUT /employees/:id.
// All fields are optional — only the provided fields are changed.
export interface UpdateEmployeePayload {
  name?: string
  phone?: string | null
  email?: string | null
  role?: string | null
  employment_type?: string | null
  hourly_rate?: number | null
  is_active?: boolean
}

// One row from employee_working_hours table.
// weekday: 0 = Sunday, 1 = Monday, ..., 6 = Saturday  (PostgreSQL DOW convention)
export interface WorkingHours {
  id: number
  employee_id: string
  weekday: number
  start_time: string           // "HH:MM:SS" from DB — slice(0,5) to display "HH:MM"
  end_time: string
  organization_id: string
}

// Payload for POST /employee-working-hours.
// organization_id is NOT sent — the backend reads it from the JWT.
export interface CreateWorkingHoursPayload {
  employee_id: string
  weekday: number
  start_time: string           // "HH:MM"
  end_time: string             // "HH:MM"
}

// Payload for PUT /employee-working-hours/:id.
// employee_id cannot be changed — only time/day fields.
export interface UpdateWorkingHoursPayload {
  weekday: number
  start_time: string           // "HH:MM"
  end_time: string             // "HH:MM"
}

// One row from employee_leaves (with employee name from the JOIN in the backend).
export interface LeaveRecord {
  id: number
  employee_id: string
  leave_type: string
  start_date: string           // "YYYY-MM-DD"
  end_date: string             // "YYYY-MM-DD"
  reason: string | null
  name: string                 // employee name — added by the backend JOIN
}

// Payload for POST /employee-leaves.
export interface CreateLeavePayload {
  employee_id: string
  leave_type: string
  start_date: string
  end_date: string
  reason?: string
}

// ============================================================
// INTERNAL ENVELOPE TYPES
// ============================================================
// The backend wraps working hours and leaves responses in { success, <key> }.
// These internal types tell TypeScript the full HTTP response shape so we
// can correctly unwrap with res.data.hours / res.data.leaves.
// Not exported — only the functions below need to know about the envelope.
interface WorkingHoursEnvelope  { success: boolean; hours: WorkingHours[] }
interface WorkingHourEnvelope   { success: boolean; hours: WorkingHours  }
interface LeavesEnvelope        { success: boolean; leaves: LeaveRecord[] }
interface LeaveEnvelope         { success: boolean; leave: LeaveRecord   }

// ============================================================
// API FUNCTIONS — Employee list and detail
// ============================================================

// fetchEmployees: GET /employees
// Returns a plain array — no envelope to unwrap.
export async function fetchEmployees(): Promise<Employee[]> {
  const res = await api.get<Employee[]>('/employees')
  return res.data
}

// fetchEmployee: GET /employees/:id
// Returns a plain object — no envelope to unwrap.
export async function fetchEmployee(id: string): Promise<EmployeeDetail> {
  const res = await api.get<EmployeeDetail>(`/employees/${id}`)
  return res.data
}

// updateEmployee: PUT /employees/:id
// Returns the updated employee record (plain object, no envelope).
export async function updateEmployee(
  id: string,
  payload: UpdateEmployeePayload
): Promise<EmployeeDetail> {
  const res = await api.put<EmployeeDetail>(`/employees/${id}`, payload)
  return res.data
}

// ============================================================
// API FUNCTIONS — Working hours
// ============================================================

// fetchEmployeeWorkingHours: GET /employee-working-hours/:employeeId
// Backend returns: { success: true, hours: WorkingHours[] }
// We unwrap and return only the array.
export async function fetchEmployeeWorkingHours(employeeId: string): Promise<WorkingHours[]> {
  const res = await api.get<WorkingHoursEnvelope>(`/employee-working-hours/${employeeId}`)
  return res.data.hours
}

// createWorkingHours: POST /employee-working-hours
// Backend returns: { success: true, hours: WorkingHours }  (single object)
export async function createWorkingHours(
  payload: CreateWorkingHoursPayload
): Promise<WorkingHours> {
  const res = await api.post<WorkingHourEnvelope>('/employee-working-hours', payload)
  return res.data.hours
}

// updateWorkingHours: PUT /employee-working-hours/:id
// Backend returns: { success: true, hours: WorkingHours }  (single object)
export async function updateWorkingHours(
  id: number,
  payload: UpdateWorkingHoursPayload
): Promise<WorkingHours> {
  const res = await api.put<WorkingHourEnvelope>(`/employee-working-hours/${id}`, payload)
  return res.data.hours
}

// deleteWorkingHours: DELETE /employee-working-hours/:id
export async function deleteWorkingHours(id: number): Promise<unknown> {
  const res = await api.delete(`/employee-working-hours/${id}`)
  return res.data
}

// ============================================================
// API FUNCTIONS — Leaves
// ============================================================

// fetchEmployeeLeaves: GET /employee-leaves
// Returns ALL leaves for the organisation. The hook filters by employee client-side.
// Backend returns: { success: true, leaves: LeaveRecord[] }
export async function fetchEmployeeLeaves(): Promise<LeaveRecord[]> {
  const res = await api.get<LeavesEnvelope>('/employee-leaves')
  return res.data.leaves
}

// createLeave: POST /employee-leaves
// Backend returns: { success: true, leave: LeaveRecord }  (single object)
export async function createLeave(payload: CreateLeavePayload): Promise<LeaveRecord> {
  const res = await api.post<LeaveEnvelope>('/employee-leaves', payload)
  return res.data.leave
}

// deleteLeave: DELETE /employee-leaves/:id
export async function deleteLeave(id: number): Promise<unknown> {
  const res = await api.delete(`/employee-leaves/${id}`)
  return res.data
}
