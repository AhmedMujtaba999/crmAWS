// components/tasks/AssignModal.tsx — Assignment Form Modal
// ============================================================
// Shown when an admin drops an unassigned lead onto an employee card.
// Collects the extra fields required by POST /tasks/assign:
//   title, description, scheduled_start, estimated_minutes
//
// The lead_id and employee_id are already known from the drag-drop action
// so the user doesn't need to enter them manually.
// ============================================================

import { useState } from 'react'
import { X, Calendar, Clock, User, MapPin, Loader2, AlertCircle } from 'lucide-react'
import type { UnassignedTask } from '@/hooks/useTasks'
import type { Employee } from '@/hooks/useEmployees'
import { useAssignTask } from '@/hooks/useTasks'

interface Props {
  lead: UnassignedTask       // the lead being assigned
  employee: Employee         // the employee receiving the task
  onClose: () => void        // dismiss without saving
  onSuccess: () => void      // called after successful assignment
  // When the modal is opened by dropping on a time slot, this is pre-filled.
  // Format: "YYYY-MM-DDTHH:MM" (the same format datetime-local inputs expect).
  // If not provided, defaults to today at 09:00.
  initialScheduledStart?: string
}

export default function AssignModal({ lead, employee, onClose, onSuccess, initialScheduledStart }: Props) {
  // Form fields required by POST /tasks/assign (lead_id + employee_id come from props)
  const [form, setForm] = useState({
    title: lead.customer_name ? `Visit - ${lead.customer_name}` : '',
    description: '',
    // Use the pre-filled slot time if provided (from timeline drop), else 09:00 today.
    // datetime-local inputs expect "YYYY-MM-DDTHH:MM" format — slice(0,16) ensures that.
    scheduled_start: initialScheduledStart?.slice(0, 16) ?? (() => {
      const d = new Date()
      d.setHours(9, 0, 0, 0)
      return d.toISOString().slice(0, 16)
    })(),
    // Pre-fill from the lead's stored estimate. ?? 60 = default to 1 hour if not set.
    estimated_minutes: lead.estimated_minutes ?? 60,
  })

  const { mutate: assignTask, isPending, error } = useAssignTask()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    assignTask(
      {
        lead_id: lead.lead_id,
        employee_id: employee.id,
        title: form.title,
        description: form.description,
        // Convert local datetime string to ISO string for the backend
        scheduled_start: new Date(form.scheduled_start).toISOString(),
        estimated_minutes: Number(form.estimated_minutes),
      },
      {
        // These callbacks run after the mutationFn resolves/rejects.
        // They are passed as a second argument to mutate(), not to useMutation().
        // This lets us react to the result at the call site rather than globally.
        onSuccess: () => {
          onSuccess()
          onClose()
        },
      }
    )
  }

  // Error message from the API response
  const errorMessage = error
    ? (error as any)?.response?.data?.error ?? 'Assignment failed. Please try again.'
    : null

  // Shared input class string — reused for every form field
  const inputClass =
    'w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors'

  return (
    // Fixed full-screen overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Assign Task</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Scheduling for <span className="text-indigo-400">{employee.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lead summary — so the admin can see what they're assigning */}
        <div className="px-6 pt-4">
          <div className="bg-slate-800/60 rounded-xl p-3 flex gap-3">
            <User className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200">
                {lead.customer_name ?? 'Unknown customer'}
              </p>
              {lead.customer_phone && (
                <p className="text-xs text-slate-500 mt-0.5">{lead.customer_phone}</p>
              )}
              {lead.customer_address && (
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{lead.customer_address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <p className="text-sm text-rose-400">{errorMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">

          {/* Task title */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">
              Task Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Site Survey - Sharma"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Any notes or instructions for the employee..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Scheduled start + estimated duration side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Scheduled Start <span className="text-rose-400">*</span>
              </label>
              {/* datetime-local: HTML input that shows a date + time picker */}
              <input
                type="datetime-local"
                required
                value={form.scheduled_start}
                onChange={e => setForm({ ...form, scheduled_start: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Duration (minutes) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                required
                min={15}
                max={480}
                step={15}
                value={form.estimated_minutes}
                onChange={e => setForm({ ...form, estimated_minutes: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
          </div>

          {/* Calculated end time — derived from form values, shown for reference */}
          {form.scheduled_start && form.estimated_minutes > 0 && (
            <p className="text-xs text-slate-500 -mt-1">
              Estimated end:{' '}
              <span className="text-slate-300">
                {new Date(
                  new Date(form.scheduled_start).getTime() +
                  form.estimated_minutes * 60000
                ).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
              {' '}— conflict check is done by the server
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 rounded-xl text-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Assigning…
                </>
              ) : (
                'Assign Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
