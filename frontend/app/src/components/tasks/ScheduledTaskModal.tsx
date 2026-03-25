// components/tasks/ScheduledTaskModal.tsx — Scheduled Task Details / Edit Modal
// ============================================================
// Opens when an admin clicks a scheduled block on the timeline.
// Three tabs:
//   Details  — edit title, description, start time, duration
//   Services — read-only list of lead services + quotation total
//   Reassign — pick a different employee to handle the task
//
// Footer always shows:
//   Delete Task (with inline two-step confirmation)
//   Cancel
//   Save Changes / Reassign (context-dependent action button)
//
// Data sources:
//   useTaskDetail(taskId)     — full task row + JOINed customer + schedule entry
//   useLeadDetail(lead_id)    — lead's attached services (for Services tab)
//   useEmployees()            — active employees list (for Reassign dropdown)
// ============================================================

import { useState, useEffect } from 'react'
// useEffect: runs a side-effect after every render where its dependencies change.
// We use it to pre-fill the details form once the task data finishes loading.
// The dependency array [task] means it only runs when 'task' goes from undefined
// to a loaded value — not on every render.

import {
  X, User, MapPin, Phone, Clock, Calendar,
  Loader2, AlertCircle, Trash2, UserCheck, Package,
} from 'lucide-react'

import {
  useTaskDetail,
  useUpdateTask,
  useReassignTask,
  useDeleteTask,
} from '@/hooks/useTasks'
import { useLeadDetail } from '@/hooks/useLeadDetail'
import { useEmployees } from '@/hooks/useEmployees'

// ============================================================
// HELPERS
// ============================================================

// Status → Tailwind classes for the status badge in the modal header.
// Record<string, string> means: keys are strings, values are strings.
const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  ACTIVE:    'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
}

// Convert a UTC ISO string (from the database) to the "YYYY-MM-DDTHH:MM" format
// that <input type="datetime-local"> requires in LOCAL time.
//
// Why: The database stores times as UTC. new Date(iso) parses the UTC string
// and gives you a Date object. Calling getHours() / getMinutes() on that Date
// returns the LOCAL time (automatically applying the user's timezone offset).
// Without this conversion the datetime-local input would show UTC time, which
// would be off by the user's UTC offset (e.g. IST is UTC+5:30 so it would
// show a time 5.5 hours earlier than expected).
function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Format a nullable number as Indian Rupees. Returns "₹0" for null/zero.
function formatRupees(n: number | null | undefined): string {
  if (!n) return '₹0'
  return `₹${Number(n).toLocaleString('en-IN')}`
}

// ============================================================
// PROPS
// ============================================================
interface Props {
  taskId: number    // integer PK of the tasks table — used to fetch task detail
  onClose: () => void
}

// ============================================================
// COMPONENT
// ============================================================
export default function ScheduledTaskModal({ taskId, onClose }: Props) {

  // ---- Server-state queries ----

  // useTaskDetail fires GET /tasks/:id and returns the full task record +
  // JOINed employee_name, customer_name, customer_phone, customer_address,
  // scheduled_start, scheduled_end. 'id != null' guard is handled inside the hook.
  const { data: task, isLoading: taskLoading } = useTaskDetail(taskId)

  // useLeadDetail fires GET /admin/leads/:lead_id to get the lead's attached services.
  // task?.lead_id uses optional chaining: if task is undefined (still loading),
  // this evaluates to undefined, which ?? null converts to null, which disables
  // the hook via its `enabled: !!leadId` guard — no request is made until task loads.
  const { data: leadDetail } = useLeadDetail(task?.lead_id ?? null)

  // Fetch all active employees for the Reassign dropdown
  const { data: employees = [] } = useEmployees()

  // ---- Write mutations ----
  const updateTask   = useUpdateTask()
  const reassignTask = useReassignTask()
  const deleteTask   = useDeleteTask()

  // ---- UI state ----

  // Active tab — 'details' | 'services' | 'reassign'
  // TypeScript: the 'as const' pattern combined with typeof makes the type a
  // union of literal strings: 'details' | 'services' | 'reassign'
  const [activeTab, setActiveTab] = useState<'details' | 'services' | 'reassign'>('details')

  // Two-step delete: first click shows confirmation, second click deletes.
  const [confirmDelete, setConfirmDelete] = useState(false)

  // ---- Details form ----
  // null = form not yet initialized (task data hasn't arrived).
  // Once task arrives (via useEffect below), this is populated with the task's values.
  const [detailsForm, setDetailsForm] = useState<{
    title: string
    description: string
    scheduled_start: string  // "YYYY-MM-DDTHH:MM" local time (for datetime-local input)
    estimated_minutes: number
  } | null>(null)

  // ---- Reassign form ----
  // Pre-filled with the current employee_id when task loads.
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null)

  // ---- Pre-fill forms once task data arrives ----
  // useEffect(callback, [task]) — runs the callback when 'task' changes.
  // '!detailsForm' guard: if the user has already started editing, don't overwrite.
  useEffect(() => {
    if (task && !detailsForm) {
      setDetailsForm({
        title: task.title,
        description: task.description ?? '',
        // Convert UTC → local time for the datetime-local input
        scheduled_start: task.scheduled_start
          ? isoToDatetimeLocal(task.scheduled_start)
          : isoToDatetimeLocal(new Date().toISOString()),
        estimated_minutes: task.estimated_minutes ?? 60,
      })
      if (task.employee_id) setSelectedEmpId(task.employee_id)
    }
  }, [task])  // re-run only when 'task' changes

  // ---- Submit handlers ----

  // Save task title, description, start time, duration.
  // Converts the local "YYYY-MM-DDTHH:MM" back to UTC ISO for the backend.
  const handleSaveDetails = () => {
    if (!detailsForm) return
    updateTask.mutate(
      {
        id: taskId,
        payload: {
          title: detailsForm.title,
          description: detailsForm.description,
          // new Date("YYYY-MM-DDTHH:MM") parses as LOCAL time.
          // .toISOString() converts it back to UTC ISO string for the server.
          scheduled_start: new Date(detailsForm.scheduled_start).toISOString(),
          estimated_minutes: Number(detailsForm.estimated_minutes),
        },
      },
      { onSuccess: () => onClose() }
    )
  }

  // Reassign the task to a different employee.
  // The backend updates both tasks.employee_id and employee_schedule.employee_id.
  const handleReassign = () => {
    if (!selectedEmpId) return
    reassignTask.mutate(
      { id: taskId, employee_id: String(selectedEmpId) },
      { onSuccess: () => onClose() }
    )
  }

  // Delete the task and its schedule entry. The lead remains CLOSED and
  // re-appears in the Unassigned column automatically.
  const handleDelete = () => {
    deleteTask.mutate(taskId, { onSuccess: () => onClose() })
  }

  // ---- Derived values ----

  // Calculate the end time from the form values — shown as a hint below the inputs.
  // getTime() returns milliseconds since epoch; * 60_000 converts minutes → ms.
  const estimatedEnd =
    detailsForm?.scheduled_start && detailsForm.estimated_minutes > 0
      ? new Date(
          new Date(detailsForm.scheduled_start).getTime() +
          detailsForm.estimated_minutes * 60_000
        ).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : null

  // Services come from the lead detail. Default to empty array if not yet loaded.
  const services = leadDetail?.services ?? []
  // Sum all total_price values. ?? 0 handles null total_price on individual rows.
  const totalEstimate = services.reduce((sum, s) => sum + (s.total_price ?? 0), 0)

  // Shared input style — same as AssignModal and CreateLeadModal
  const inputClass =
    'w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors'

  // ============================================================
  // RENDER
  // ============================================================
  return (
    // Fixed full-screen overlay — sits above everything (z-50)
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* Backdrop — clicking it closes the modal */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card — flex column so footer sticks to the bottom */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

        {/* ================================================
            HEADER — customer name, status badge, phone, address
            ================================================ */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex-1 min-w-0 mr-3">
            {taskLoading ? (
              // Skeleton placeholder while loading
              <div className="space-y-2">
                <div className="h-5 w-48 bg-slate-800 rounded animate-pulse" />
                <div className="h-3.5 w-32 bg-slate-800 rounded animate-pulse" />
              </div>
            ) : (
              <>
                {/* Name + status badge on the same line */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-white truncate">
                    {task?.customer_name ?? 'Task Details'}
                  </h2>
                  {task?.status && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status] ?? ''}`}>
                      {task.status}
                    </span>
                  )}
                </div>

                {/* Phone + address below the name */}
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {task?.customer_phone && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {task.customer_phone}
                    </span>
                  )}
                  {task?.customer_address && (
                    <span className="text-xs text-slate-500 flex items-center gap-1 min-w-0">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{task.customer_address}</span>
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================================================
            ASSIGNED EMPLOYEE STRIP (shown when task is loaded)
            ================================================ */}
        {task?.employee_name && (
          <div className="px-6 py-2.5 border-b border-slate-800/60 bg-slate-800/30 flex items-center gap-2 flex-shrink-0">
            <User className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <span className="text-xs text-slate-400">
              Assigned to{' '}
              <span className="text-indigo-300 font-medium">{task.employee_name}</span>
            </span>
          </div>
        )}

        {/* ================================================
            TAB BAR
            ================================================ */}
        <div className="flex border-b border-slate-800 px-6 flex-shrink-0">
          {(['details', 'services', 'reassign'] as const).map(tab => (
            // The 'as const' tells TypeScript these are literal string values,
            // not just generic strings, so the type is the union
            // 'details' | 'services' | 'reassign' rather than string.
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2.5 px-3 text-xs font-medium border-b-2 -mb-px capitalize transition-colors ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {/* Capitalise first letter for display */}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ================================================
            TAB CONTENT — scrollable area
            flex-1 min-h-0: fills remaining height between header and footer.
            overflow-y-auto: scrolls when content exceeds the available height.
            ================================================ */}
        <div className="overflow-y-auto flex-1 px-6 py-4">

          {/* Loading spinner */}
          {taskLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
            </div>

          ) : !task ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-rose-400">Failed to load task details.</p>
            </div>

          ) : (
            <>
              {/* ============================================
                  DETAILS TAB
                  ============================================ */}
              {activeTab === 'details' && detailsForm && (
                <div className="space-y-4">

                  {/* Task title */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">
                      Task Title <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={detailsForm.title}
                      onChange={e => setDetailsForm({ ...detailsForm, title: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={detailsForm.description}
                      onChange={e => setDetailsForm({ ...detailsForm, description: e.target.value })}
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  {/* Scheduled start + duration side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Scheduled Start
                      </label>
                      <input
                        type="datetime-local"
                        value={detailsForm.scheduled_start}
                        onChange={e => setDetailsForm({ ...detailsForm, scheduled_start: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Duration (min)
                      </label>
                      <input
                        type="number"
                        min={15}
                        max={480}
                        step={15}
                        value={detailsForm.estimated_minutes}
                        onChange={e => setDetailsForm({ ...detailsForm, estimated_minutes: Number(e.target.value) })}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Estimated end time — read-only hint */}
                  {estimatedEnd && (
                    <p className="text-xs text-slate-500 -mt-1">
                      Estimated end:{' '}
                      <span className="text-slate-300">{estimatedEnd}</span>
                    </p>
                  )}

                  {/* Error from update mutation */}
                  {updateTask.error && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <p className="text-sm text-rose-400">
                        {(updateTask.error as any)?.response?.data?.error ?? 'Update failed. Please try again.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================
                  SERVICES TAB
                  ============================================ */}
              {activeTab === 'services' && (
                <div>
                  {services.length === 0 ? (
                    <div className="py-8 text-center">
                      <Package className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">No services attached to this lead</p>
                      <p className="text-[10px] text-slate-700 mt-1">
                        Services can be added from the Leads page
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Column headers */}
                      <div className="grid grid-cols-[1fr_48px_80px_80px] gap-2 mb-2 px-1">
                        <span className="text-[10px] text-slate-600 uppercase tracking-wide">Service</span>
                        <span className="text-[10px] text-slate-600 uppercase tracking-wide text-center">Qty</span>
                        <span className="text-[10px] text-slate-600 uppercase tracking-wide text-right">Unit</span>
                        <span className="text-[10px] text-slate-600 uppercase tracking-wide text-right">Total</span>
                      </div>

                      {/* Service rows */}
                      <div className="space-y-0.5">
                        {services.map((svc, i) => (
                          // Using index as part of key because service_id might not be unique
                          // if the same service appears multiple times on a lead
                          <div
                            key={`${svc.service_id}-${i}`}
                            className="grid grid-cols-[1fr_48px_80px_80px] gap-2 items-center px-1 py-2.5 rounded-lg hover:bg-slate-800/40 transition-colors"
                          >
                            <span className="text-sm text-slate-200 truncate">
                              {svc.service_name ?? 'Unknown service'}
                            </span>
                            <span className="text-sm text-slate-400 text-center">{svc.quantity ?? 1}</span>
                            <span className="text-sm text-slate-400 text-right">{formatRupees(svc.unit_price)}</span>
                            <span className="text-sm text-slate-200 font-medium text-right">{formatRupees(svc.total_price)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Total row */}
                      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-500">Quotation total</span>
                        <span className="text-sm font-bold text-emerald-400">
                          {formatRupees(totalEstimate)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ============================================
                  REASSIGN TAB
                  ============================================ */}
              {activeTab === 'reassign' && (
                <div className="space-y-4">

                  {/* Current assignee info card */}
                  {task.employee_name && (
                    <div className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-xl">
                      {/* Avatar with initials */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {task.employee_name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Currently assigned to</p>
                        <p className="text-sm font-medium text-slate-200">{task.employee_name}</p>
                      </div>
                    </div>
                  )}

                  {/* Employee select dropdown */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> Reassign to
                    </label>
                    <select
                      value={selectedEmpId ?? ''}
                      // Number() converts the select value (always a string) to a number.
                      // || null handles the empty placeholder option: Number('') = 0, so || null → null.
                      onChange={e => setSelectedEmpId(Number(e.target.value) || null)}
                      className={inputClass}
                    >
                      <option value="">Select employee…</option>
                      {/* Only show active employees */}
                      {employees
                        .filter(e => e.is_active)
                        .map(e => (
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                    </select>
                  </div>

                  {/* Error from reassign mutation */}
                  {reassignTask.error && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <p className="text-sm text-rose-400">
                        {(reassignTask.error as any)?.response?.data?.error ?? 'Reassign failed. Please try again.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ================================================
            FOOTER — Delete (left) + Cancel / Action button (right)
            flex-shrink-0 prevents the footer from being squeezed by long content
            ================================================ */}
        {!taskLoading && task && (
          <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900 flex-shrink-0">

            {/* ---- Delete section (left side) ---- */}
            {confirmDelete ? (
              // Second step: confirmation buttons replace the delete button
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs text-rose-400 truncate">Delete this task?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleteTask.isPending}
                  className="px-3 py-1.5 bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1 flex-shrink-0"
                >
                  {deleteTask.isPending
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Trash2 className="w-3 h-3" />}
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-400 hover:bg-slate-700 rounded-lg text-xs transition-all flex-shrink-0"
                >
                  Cancel
                </button>
              </div>
            ) : (
              // First step: show the delete button
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 hover:border-rose-500/50 rounded-lg text-xs transition-all"
              >
                <Trash2 className="w-3 h-3" />
                Delete Task
              </button>
            )}

            {/* ---- Right-side actions (only when not in confirm-delete state) ---- */}
            {!confirmDelete && (
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>

                {/* Details tab → Save Changes button */}
                {activeTab === 'details' && (
                  <button
                    onClick={handleSaveDetails}
                    disabled={updateTask.isPending || !detailsForm}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                  >
                    {updateTask.isPending ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                )}

                {/* Reassign tab → Reassign button */}
                {activeTab === 'reassign' && (
                  <button
                    onClick={handleReassign}
                    // Disable if no employee selected, or same employee selected, or request in flight
                    disabled={
                      reassignTask.isPending ||
                      !selectedEmpId ||
                      selectedEmpId === task.employee_id
                    }
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                  >
                    {reassignTask.isPending ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Reassigning…</>
                    ) : (
                      'Reassign'
                    )}
                  </button>
                )}

                {/* Services tab → no action button (read-only tab) */}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
