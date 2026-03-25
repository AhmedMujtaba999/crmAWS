// pages/EmployeeDetailPage.tsx — Employee Detail Page
// ============================================================
// Mounted at /employees/:id.
// Reads :id from the URL via useParams() and loads the employee.
//
// THREE TABS:
//   1. Overview       — employee info + edit form
//   2. Work Schedule  — weekly working hours with add / delete
//   3. Leaves         — leave records with add / delete
//
// All data comes from the hooks in useEmployee.ts.
// ============================================================

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
// useParams: reads URL parameters — :id in /employees/:id becomes params.id
// useNavigate: programmatic navigation — used for the "← Back" button

import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  User,
  Clock,
  CalendarOff,
  CheckCircle2,
  XCircle,
  Trash2,
  Plus,
  Save,
  Phone,
  Mail,
  Briefcase,
  Edit2,
  X,
} from 'lucide-react'

import {
  useEmployee,
  useUpdateEmployee,
  useEmployeeWorkingHours,
  useCreateWorkingHours,
  useUpdateWorkingHours,
  useDeleteWorkingHours,
  useEmployeeLeaves,
  useCreateLeave,
  useDeleteLeave,
} from '@/hooks/useEmployee'
import type {
  UpdateEmployeePayload,
  CreateWorkingHoursPayload,
  UpdateWorkingHoursPayload,
  CreateLeavePayload,
} from '@/hooks/useEmployee'

// ============================================================
// CONSTANTS
// ============================================================

// Maps weekday number (PostgreSQL DOW convention) to display name.
// PostgreSQL EXTRACT(DOW): 0=Sunday, 1=Monday, ..., 6=Saturday
const WEEKDAY_NAMES: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}

const ROLE_OPTIONS = ['ADMIN', 'TECHNICIAN', 'MANAGER', 'SALES']
const EMPLOYMENT_TYPE_OPTIONS = ['Full-Time', 'Part-Time', 'Contract', 'Intern']
const LEAVE_TYPE_OPTIONS = ['Sick', 'Casual', 'Vacation', 'Unpaid', 'Personal']

// Shared Tailwind class string for all form inputs — reused across all tabs
const INPUT_CLASS =
  'w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors'

const SELECT_CLASS =
  'w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors'

// ============================================================
// TAB DEFINITIONS
// ============================================================
// 'as const' makes TypeScript treat these as literal types, not just strings.
// TABS[number]['id'] becomes the union 'overview' | 'schedule' | 'leaves'.
const TABS = [
  { id: 'overview',  label: 'Overview',       Icon: User       },
  { id: 'schedule',  label: 'Work Schedule',   Icon: Clock      },
  { id: 'leaves',    label: 'Leaves',          Icon: CalendarOff },
] as const

type TabId = typeof TABS[number]['id']

// ============================================================
// OVERVIEW TAB
// ============================================================
// Shows employee info. An "Edit" button toggles an inline edit form.
// ============================================================
function OverviewTab({ employeeId }: { employeeId: string }) {
  const { data: emp, isLoading, isError } = useEmployee(employeeId)
  const updateEmployee = useUpdateEmployee()

  // editMode: when true, the form fields become editable
  const [editMode, setEditMode] = useState(false)

  // form: mirrors the editable fields of the employee record.
  // Initialised lazily from emp when it loads.
  const [form, setForm] = useState<UpdateEmployeePayload>({})

  // ---- Initialise form when employee data loads ----
  // We only set the form when emp arrives and we're not already editing.
  // This prevents overwriting in-progress edits if a background refetch occurs.
  const startEdit = () => {
    if (!emp) return
    setForm({
      name: emp.name,
      phone: emp.phone ?? '',
      email: emp.email ?? '',
      role: emp.role ?? '',
      employment_type: emp.employment_type ?? '',
      hourly_rate: emp.hourly_rate ?? undefined,
      is_active: emp.is_active,
    })
    setEditMode(true)
  }

  const cancelEdit = () => {
    setEditMode(false)
    setForm({})
    updateEmployee.reset()  // clears any previous error state
  }

  const handleSave = () => {
    if (!emp) return
    updateEmployee.mutate(
      { id: employeeId, payload: form },
      {
        onSuccess: () => {
          setEditMode(false)
          setForm({})
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
      </div>
    )
  }

  if (isError || !emp) {
    return (
      <div className="flex items-center gap-2 text-rose-400 py-8">
        <AlertCircle className="w-4 h-4" />
        <p className="text-sm">Failed to load employee details.</p>
      </div>
    )
  }

  // Error message from the mutation (update failed)
  const errorMsg = updateEmployee.error
    ? (updateEmployee.error as any)?.response?.data?.error ?? 'Update failed. Please try again.'
    : null

  return (
    <div className="max-w-2xl space-y-6">

      {/* Action buttons row */}
      <div className="flex items-center gap-3">
        {!editMode ? (
          <button
            onClick={startEdit}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400
              text-white text-sm font-medium rounded-xl transition-all"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit Details
          </button>
        ) : (
          <>
            <button
              onClick={handleSave}
              disabled={updateEmployee.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400
                disabled:opacity-50 disabled:cursor-not-allowed
                text-white text-sm font-medium rounded-xl transition-all"
            >
              {updateEmployee.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save Changes
            </button>
            <button
              onClick={cancelEdit}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700
                text-slate-300 text-sm rounded-xl transition-all"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <p className="text-sm text-rose-400">{errorMsg}</p>
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Name */}
        <InfoField
          label="Full Name"
          icon={<User className="w-3.5 h-3.5" />}
          editMode={editMode}
          display={emp.name}
          editContent={
            <input
              type="text"
              value={form.name ?? ''}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className={INPUT_CLASS}
            />
          }
        />

        {/* Phone */}
        <InfoField
          label="Phone"
          icon={<Phone className="w-3.5 h-3.5" />}
          editMode={editMode}
          display={emp.phone ?? '—'}
          editContent={
            <input
              type="tel"
              value={(form.phone as string) ?? ''}
              onChange={e => setForm({ ...form, phone: e.target.value || null })}
              placeholder="e.g. +91 98765 43210"
              className={INPUT_CLASS}
            />
          }
        />

        {/* Email */}
        <InfoField
          label="Email"
          icon={<Mail className="w-3.5 h-3.5" />}
          editMode={editMode}
          display={emp.email ?? '—'}
          editContent={
            <input
              type="email"
              value={(form.email as string) ?? ''}
              onChange={e => setForm({ ...form, email: e.target.value || null })}
              placeholder="e.g. ravi@example.com"
              className={INPUT_CLASS}
            />
          }
        />

        {/* Role */}
        <InfoField
          label="Role"
          icon={<Briefcase className="w-3.5 h-3.5" />}
          editMode={editMode}
          display={emp.role ?? '—'}
          editContent={
            <select
              value={(form.role as string) ?? ''}
              onChange={e => setForm({ ...form, role: e.target.value || null })}
              className={SELECT_CLASS}
            >
              <option value="">— Select role —</option>
              {ROLE_OPTIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          }
        />

        {/* Employment type */}
        <InfoField
          label="Employment Type"
          icon={<Briefcase className="w-3.5 h-3.5" />}
          editMode={editMode}
          display={emp.employment_type ?? '—'}
          editContent={
            <select
              value={(form.employment_type as string) ?? ''}
              onChange={e => setForm({ ...form, employment_type: e.target.value || null })}
              className={SELECT_CLASS}
            >
              <option value="">— Select type —</option>
              {EMPLOYMENT_TYPE_OPTIONS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          }
        />

        {/* Hourly rate */}
        <InfoField
          label="Hourly Rate (₹)"
          icon={<Briefcase className="w-3.5 h-3.5" />}
          editMode={editMode}
          display={emp.hourly_rate != null ? `₹${emp.hourly_rate}/hr` : '—'}
          editContent={
            <input
              type="number"
              min={0}
              step={0.5}
              value={form.hourly_rate ?? ''}
              onChange={e =>
                setForm({ ...form, hourly_rate: e.target.value ? Number(e.target.value) : null })
              }
              placeholder="e.g. 250"
              className={INPUT_CLASS}
            />
          }
        />

        {/* Active status toggle — full width */}
        <div className="sm:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4
          flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium mb-0.5">Account Status</p>
            <p className="text-sm text-slate-200">
              {editMode
                ? (form.is_active ? 'Active — employee can log in' : 'Inactive — access blocked')
                : (emp.is_active ? 'Active' : 'Inactive')
              }
            </p>
          </div>
          {editMode ? (
            // Toggle button — switches between Active and Inactive
            <button
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200
                ${form.is_active ? 'bg-emerald-500' : 'bg-slate-600'}`}
            >
              {/* The circular thumb that slides left/right */}
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow
                  transition-transform duration-200
                  ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          ) : (
            // Read-only status badge
            emp.is_active ? (
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Active
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-rose-400 text-xs font-medium">
                <XCircle className="w-4 h-4" />
                Inactive
              </div>
            )
          )}
        </div>

      </div>

      {/* Member since — read-only, always shown */}
      <div className="text-xs text-slate-600">
        Member since {new Date(emp.created_at).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric',
        })}
      </div>
    </div>
  )
}

// ============================================================
// InfoField — reusable read/edit field wrapper
// ============================================================
// Shows either a display value (read mode) or an edit input (edit mode).
// This avoids repeating the card layout for every field.
interface InfoFieldProps {
  label: string
  icon: React.ReactNode
  editMode: boolean
  display: string
  editContent: React.ReactNode
}

function InfoField({ label, icon, editMode, display, editContent }: InfoFieldProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      {/* Label row */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
        {/* React.ReactNode is the TypeScript type for anything React can render:
            a string, JSX element, array, null, etc. */}
        <span className="text-slate-600">{icon}</span>
        {label}
      </div>
      {editMode ? editContent : (
        <p className="text-sm text-slate-200">{display}</p>
      )}
    </div>
  )
}

// ============================================================
// WORK SCHEDULE TAB
// ============================================================
// Displays the employee's configured working hours (per weekday).
// Admin can add, inline-edit, and delete entries.
// ============================================================
function WorkScheduleTab({ employeeId }: { employeeId: string }) {
  const { data: hours, isLoading } = useEmployeeWorkingHours(employeeId)
  const createWH = useCreateWorkingHours()
  const updateWH = useUpdateWorkingHours()
  const deleteWH = useDeleteWorkingHours()

  // showAddForm: toggles the add-new-hours form
  const [showAddForm, setShowAddForm] = useState(false)

  // editingId: the id of the row currently being edited (null = none)
  // Only one row can be edited at a time.
  const [editingId, setEditingId] = useState<number | null>(null)

  // editForm: the current values in the inline edit form
  const [editForm, setEditForm] = useState<UpdateWorkingHoursPayload>({
    weekday: 1,
    start_time: '09:00',
    end_time: '17:00',
  })

  // addForm: state for the new working hours entry
  const [addForm, setAddForm] = useState<CreateWorkingHoursPayload>({
    employee_id: employeeId,
    weekday: 1,
    start_time: '09:00',
    end_time: '17:00',
  })

  // startEditing: opens the inline edit form for a specific row,
  // pre-filling the edit form with the row's current values
  const startEditing = (h: { id: number; weekday: number; start_time: string; end_time: string }) => {
    setEditingId(h.id)
    setEditForm({
      weekday:    h.weekday,
      start_time: h.start_time.slice(0, 5),  // DB returns "HH:MM:SS", input needs "HH:MM"
      end_time:   h.end_time.slice(0, 5),
    })
    updateWH.reset()
  }

  const cancelEditing = () => {
    setEditingId(null)
    updateWH.reset()
  }

  const handleUpdate = (id: number) => {
    updateWH.mutate(
      { id, employee_id: employeeId, payload: editForm },
      { onSuccess: () => { setEditingId(null); updateWH.reset() } }
    )
  }

  const handleAdd = () => {
    createWH.mutate(addForm, {
      onSuccess: () => {
        setShowAddForm(false)
        setAddForm({ employee_id: employeeId, weekday: 1, start_time: '09:00', end_time: '17:00' })
        createWH.reset()
      },
    })
  }

  const handleDelete = (id: number) => {
    deleteWH.mutate({ id, employee_id: employeeId })
  }

  const addError = createWH.error
    ? (createWH.error as any)?.response?.data?.error ?? 'Failed to add hours.'
    : null

  const updateError = updateWH.error
    ? (updateWH.error as any)?.response?.data?.error ?? 'Failed to update hours.'
    : null

  return (
    <div className="max-w-2xl space-y-4">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {isLoading ? 'Loading…' : `${hours?.length ?? 0} working hour entries`}
        </p>
        <button
          onClick={() => { setShowAddForm(!showAddForm); createWH.reset() }}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-500 hover:bg-indigo-400
            text-white text-xs font-medium rounded-xl transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Hours
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <p className="text-sm font-semibold text-slate-200">New Working Hours Entry</p>

          {addError && (
            <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/30 rounded-xl">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <p className="text-xs text-rose-400">{addError}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Day</label>
              <select
                value={addForm.weekday}
                onChange={e => setAddForm({ ...addForm, weekday: Number(e.target.value) })}
                className={SELECT_CLASS}
              >
                {Object.entries(WEEKDAY_NAMES).map(([num, name]) => (
                  <option key={num} value={num}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Start Time</label>
              <input
                type="time"
                value={addForm.start_time}
                onChange={e => setAddForm({ ...addForm, start_time: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">End Time</label>
              <input
                type="time"
                value={addForm.end_time}
                onChange={e => setAddForm({ ...addForm, end_time: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAdd}
              disabled={createWH.isPending}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400
                disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all"
            >
              {createWH.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
            <button
              onClick={() => { setShowAddForm(false); createWH.reset() }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
        </div>
      ) : hours && hours.length > 0 ? (
        <div className="space-y-2">
          {hours.map(h => {
            const isEditing = editingId === h.id

            return (
              <div
                key={h.id}
                className={`bg-slate-900 border rounded-xl px-4 py-3 transition-colors
                  ${isEditing ? 'border-indigo-500/50' : 'border-slate-800 hover:border-slate-700'}`}
              >
                {isEditing ? (
                  // ---- INLINE EDIT MODE ----
                  <div className="space-y-3">
                    {updateError && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                        <p className="text-xs text-rose-400">{updateError}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">Day</label>
                        <select
                          value={editForm.weekday}
                          onChange={e => setEditForm({ ...editForm, weekday: Number(e.target.value) })}
                          className={SELECT_CLASS}
                        >
                          {Object.entries(WEEKDAY_NAMES).map(([num, name]) => (
                            <option key={num} value={num}>{name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">Start</label>
                        <input
                          type="time"
                          value={editForm.start_time}
                          onChange={e => setEditForm({ ...editForm, start_time: e.target.value })}
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">End</label>
                        <input
                          type="time"
                          value={editForm.end_time}
                          onChange={e => setEditForm({ ...editForm, end_time: e.target.value })}
                          className={INPUT_CLASS}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(h.id)}
                        disabled={updateWH.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400
                          disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-all"
                      >
                        {updateWH.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs rounded-lg transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // ---- READ MODE ----
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10
                        px-2.5 py-1 rounded-lg w-24 text-center">
                        {WEEKDAY_NAMES[h.weekday] ?? `Day ${h.weekday}`}
                      </span>
                      {/* slice(0,5) trims "HH:MM:SS" → "HH:MM" — PostgreSQL stores time with seconds */}
                      <span className="text-sm text-slate-200 font-medium tabular-nums">
                        {h.start_time.slice(0, 5)} – {h.end_time.slice(0, 5)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Edit button */}
                      <button
                        onClick={() => startEditing(h)}
                        className="p-2 text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10
                          rounded-lg transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(h.id)}
                        disabled={deleteWH.isPending}
                        className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10
                          rounded-lg transition-all disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-slate-600">
          <Clock className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">No working hours configured</p>
          <p className="text-xs mt-1 opacity-70">Add hours above to set availability</p>
        </div>
      )}
    </div>
  )
}

// ============================================================
// LEAVES TAB
// ============================================================
// Shows all leaves for this employee. Admin can add and delete entries.
// ============================================================
function LeavesTab({ employeeId }: { employeeId: string }) {
  const { data: leaves, isLoading } = useEmployeeLeaves(employeeId)
  const createLeave = useCreateLeave()
  const deleteLeave = useDeleteLeave()

  const [showAddForm, setShowAddForm] = useState(false)

  // Today's date in "YYYY-MM-DD" format — used as the default start/end date
  const today = new Date().toISOString().slice(0, 10)

  const [addForm, setAddForm] = useState<CreateLeavePayload>({
    employee_id: employeeId,
    leave_type: 'Casual',
    start_date: today,
    end_date: today,
    reason: '',
  })

  const handleAdd = () => {
    createLeave.mutate(addForm, {
      onSuccess: () => {
        setShowAddForm(false)
        setAddForm({ employee_id: employeeId, leave_type: 'Casual', start_date: today, end_date: today, reason: '' })
        createLeave.reset()
      },
    })
  }

  const handleDelete = (id: number) => {
    deleteLeave.mutate(id)
  }

  const addError = createLeave.error
    ? (createLeave.error as any)?.response?.data?.error ?? 'Failed to add leave.'
    : null

  // Format a "YYYY-MM-DD" date string to a readable "10 Mar 2026"
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="max-w-2xl space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {isLoading ? 'Loading…' : `${leaves?.length ?? 0} leave entries`}
        </p>
        <button
          onClick={() => { setShowAddForm(!showAddForm); createLeave.reset() }}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-500 hover:bg-indigo-400
            text-white text-xs font-medium rounded-xl transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Leave
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <p className="text-sm font-semibold text-slate-200">New Leave Entry</p>

          {addError && (
            <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/30 rounded-xl">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <p className="text-xs text-rose-400">{addError}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Leave type */}
            <div className="col-span-2">
              <label className="text-xs text-slate-400 block mb-1.5">Leave Type</label>
              <select
                value={addForm.leave_type}
                onChange={e => setAddForm({ ...addForm, leave_type: e.target.value })}
                className={SELECT_CLASS}
              >
                {LEAVE_TYPE_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Start date */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Start Date</label>
              {/* type="date" renders a native date picker, value format is "YYYY-MM-DD" */}
              <input
                type="date"
                value={addForm.start_date}
                onChange={e => setAddForm({ ...addForm, start_date: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>

            {/* End date */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">End Date</label>
              <input
                type="date"
                value={addForm.end_date}
                min={addForm.start_date}  // HTML validation: end can't be before start
                onChange={e => setAddForm({ ...addForm, end_date: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>

            {/* Reason — optional */}
            <div className="col-span-2">
              <label className="text-xs text-slate-400 block mb-1.5">Reason (optional)</label>
              <input
                type="text"
                value={addForm.reason ?? ''}
                onChange={e => setAddForm({ ...addForm, reason: e.target.value })}
                placeholder="e.g. Medical appointment"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAdd}
              disabled={createLeave.isPending}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400
                disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all"
            >
              {createLeave.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
            <button
              onClick={() => { setShowAddForm(false); createLeave.reset() }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
        </div>
      ) : leaves && leaves.length > 0 ? (
        <div className="space-y-2">
          {leaves.map(l => (
            <div
              key={l.id}
              className="flex items-start justify-between
                bg-slate-900 border border-slate-800 rounded-xl px-4 py-3
                hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col gap-1">
                {/* Leave type badge */}
                <span className="text-xs font-semibold text-amber-400 bg-amber-500/10
                  px-2.5 py-1 rounded-lg self-start">
                  {l.leave_type}
                </span>
                {/* Date range */}
                <p className="text-sm text-slate-200 font-medium">
                  {fmtDate(l.start_date)}
                  {l.start_date !== l.end_date && ` — ${fmtDate(l.end_date)}`}
                </p>
                {/* Reason */}
                {l.reason && (
                  <p className="text-xs text-slate-500">{l.reason}</p>
                )}
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(l.id)}
                disabled={deleteLeave.isPending}
                className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10
                  rounded-lg transition-all disabled:opacity-50 flex-shrink-0 mt-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        // Empty state
        <div className="flex flex-col items-center justify-center py-16 text-slate-600">
          <CalendarOff className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">No leave records found</p>
          <p className="text-xs mt-1 opacity-70">Add leave above to block employee availability</p>
        </div>
      )}
    </div>
  )
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function EmployeeDetailPage() {
  // useParams reads the URL parameter — /employees/:id gives us { id: "abc-uuid" }
  // The `id` may be undefined if the route somehow matches without the param,
  // so we fall back to '' and let useEmployee's enabled:!!id guard handle it.
  const { id = '' } = useParams<{ id: string }>()

  const navigate = useNavigate()

  // Active tab state — TypeScript enforces it must be one of the three literal strings
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  // Load the employee for the page header — the tab components load their own data
  const { data: emp, isLoading: empLoading } = useEmployee(id)

  // Derive initials for the header avatar
  const initials = emp?.name
    .split(' ')
    .map(w => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '??'

  return (
    // Full-height flex column — tab bar stays visible, content scrolls
    <div className="flex flex-col h-full overflow-hidden">

      {/* ================================================================
          PAGE HEADER — back button + employee summary card
          ================================================================ */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-slate-800">

        {/* Back button */}
        <button
          onClick={() => navigate('/employees')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-200
            mb-4 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          All Employees
        </button>

        {/* Employee summary — avatar + name + role + status */}
        {empLoading ? (
          <div className="flex items-center gap-3 h-14">
            <div className="w-12 h-12 rounded-xl bg-slate-800 animate-pulse" />
            <div className="space-y-2">
              <div className="w-32 h-4 rounded bg-slate-800 animate-pulse" />
              <div className="w-20 h-3 rounded bg-slate-800 animate-pulse" />
            </div>
          </div>
        ) : emp ? (
          <div className="flex items-center gap-4">
            {/* Large avatar */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600
              flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
              <span className="text-white text-base font-bold">{initials}</span>
            </div>

            <div className="flex-1 min-w-0">
              {/* Name */}
              <h1 className="text-lg font-bold text-slate-100 leading-tight">{emp.name}</h1>
              {/* Role + employment type */}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {emp.role && (
                  <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10
                    px-2 py-0.5 rounded-lg">
                    {emp.role}
                  </span>
                )}
                {emp.employment_type && (
                  <span className="text-xs text-slate-500">{emp.employment_type}</span>
                )}
              </div>
            </div>

            {/* Active status badge */}
            <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl
              ${emp.is_active
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              {emp.is_active ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              {emp.is_active ? 'Active' : 'Inactive'}
            </div>
          </div>
        ) : null}

        {/* Tab bar — below the employee header */}
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit mt-4">
          {TABS.map(({ id: tabId, label, Icon }) => {
            const isActive = activeTab === tabId
            return (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-150
                  ${isActive
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ================================================================
          TAB CONTENT — scrollable area below the fixed header
          ================================================================ */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {activeTab === 'overview'  && <OverviewTab      employeeId={id} />}
        {activeTab === 'schedule'  && <WorkScheduleTab  employeeId={id} />}
        {activeTab === 'leaves'    && <LeavesTab        employeeId={id} />}
      </div>
    </div>
  )
}
