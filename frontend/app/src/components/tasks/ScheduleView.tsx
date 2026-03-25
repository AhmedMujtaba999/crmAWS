// components/tasks/ScheduleView.tsx — Timeline Scheduler for Assign & Schedule Tab
// ============================================================
// Layout:
//   [Date navigation bar]
//   [Holiday banner — shown when the selected day is a company holiday]
//   ┌─────────────────┬──────────────────────────────────────────────┐
//   │  Unassigned     │  Timeline (horizontally scrollable)          │
//   │  Task Panel     │  [Hour labels row]                           │
//   │  (draggable     │  [Employee row — slots + blocks + drop zones]│
//   │   cards)        │  [Employee row ...]                          │
//   └─────────────────┴──────────────────────────────────────────────┘
//
// Drag type: 'SCHEDULE_TASK' — avoids collision with kanban's 'ADMIN_TASK'
//
// Drop flow:
//   1. Admin drags an UnassignedCard from the left panel
//   2. Drops it on a TimeSlot in an employee row (only available slots accept drops)
//   3. AssignModal opens pre-filled with employee + slot start time
//   4. Admin confirms → POST /tasks/assign
//   5. TanStack Query invalidates ['admin-tasks'] and ['schedule-view']
//      → unassigned list shrinks, slot appears on the timeline
// ============================================================

import { useState, useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  GripVertical,
  AlertTriangle,
  Clock,
  User,
  Package,
  X,
  Loader2,
} from 'lucide-react'

import type { UnassignedTask, ScheduleEmployee, ScheduledSlot, ScheduleViewData } from '@/hooks/useTasks'
import { useScheduleView } from '@/hooks/useTasks'
import type { Employee } from '@/hooks/useEmployees'
import AssignModal from './AssignModal'
import ScheduledTaskModal from './ScheduledTaskModal'
import { useUpdateLeadEstimate } from '@/hooks/useLeads'

// ============================================================
// TIMELINE CONSTANTS
// ============================================================
// All measurements that define the timeline grid.
// Changing SLOT_PX or VIEW_START/VIEW_END here automatically updates all rendering.

const VIEW_START = 6        // 6am  — first hour shown
const VIEW_END   = 22       // 10pm — last hour (exclusive)
const SLOT_MIN   = 30       // minutes per slot
const SLOT_PX    = 50       // pixels per 30-min slot → 1 hour = 100px
const EMPLOYEE_COL_W = 180  // pixels for the employee info column (left of timeline)
const ROW_H = 64            // pixels per employee row height

// Total number of 30-min slots visible: (22-6) * 2 = 32
const TOTAL_SLOTS = (VIEW_END - VIEW_START) * (60 / SLOT_MIN)
// Total scrollable width of the timeline area: 32 * 50 = 1600px
const TIMELINE_PX = TOTAL_SLOTS * SLOT_PX

// ============================================================
// DRAG TYPE
// ============================================================
// Using a unique string constant prevents drops from accidentally landing on
// the kanban's drop zones (which accept 'ADMIN_TASK') or vice versa.
const DRAG_TYPE = 'SCHEDULE_TASK'

// TypeScript interface for the object attached to each drag item.
// This is the payload that useDrop receives when a card is dropped.
interface DragItem {
  type: typeof DRAG_TYPE
  task: UnassignedTask
}

// State held while a drop happened but the modal hasn't been submitted yet.
interface PendingAssign {
  task: UnassignedTask
  employee: ScheduleEmployee
  slotISO: string   // pre-filled start time for AssignModal ("YYYY-MM-DDTHH:MM")
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

// Convert "HH:MM" string (from employee_working_hours) to minutes since midnight.
// e.g. "09:30" → 570
function timeStrToMins(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// Given a date string ("YYYY-MM-DD") and slot index (0 = 06:00, 1 = 06:30, ...),
// return a "YYYY-MM-DDTHH:MM" string for the datetime-local input.
function slotToLocalISO(dateStr: string, slotIndex: number): string {
  const totalMinutes = VIEW_START * 60 + slotIndex * SLOT_MIN
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0')
  const m = (totalMinutes % 60).toString().padStart(2, '0')
  return `${dateStr}T${h}:${m}`
}

// Given an ISO datetime string, extract hours + minutes in LOCAL time.
// getHours() / getMinutes() return local time (adjusting for the user's timezone).
function isoToLocalMins(iso: string): number {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

// Format an ISO datetime as "HH:MM" in local time (for display in blocks).
function formatTime(iso: string): string {
  const d = new Date(iso)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

// Format currency in Indian Rupees.
function formatRupees(n: number): string {
  if (n === 0) return '—'
  return `₹${Number(n).toLocaleString('en-IN')}`
}

// Format a date string ("YYYY-MM-DD") as "Mon, Mar 15 2025" for the header.
function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00') // noon avoids timezone-day-shift edge cases
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Return today's date as "YYYY-MM-DD" in local time.
function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Add or subtract days from a "YYYY-MM-DD" string.
function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ============================================================
// SCHEDULED BLOCK GEOMETRY
// ============================================================
// Given a slot's ISO start/end and the currently viewed date, compute:
//   left  — pixel offset from the left edge of the timeline area
//   width — pixel width of the block
//   startsEarlier — true if the slot started on a previous day (show ← badge)
//   endsLater     — true if the slot ends on a future day (show → badge)
function blockGeometry(
  startISO: string,
  endISO: string,
  dateStr: string
): { left: number; width: number; startsEarlier: boolean; endsLater: boolean } {
  const viewStartMins = VIEW_START * 60
  const viewEndMins   = VIEW_END * 60

  const startDate = new Date(startISO)
  const endDate   = new Date(endISO)
  // Build a local midnight Date for the viewed date for comparison
  const viewDate  = new Date(dateStr + 'T00:00:00')

  // Check if the task started on the same calendar day
  const sameStartDay =
    startDate.getFullYear() === viewDate.getFullYear() &&
    startDate.getMonth()    === viewDate.getMonth()    &&
    startDate.getDate()     === viewDate.getDate()

  // Check if the task ends on the same calendar day
  const sameEndDay =
    endDate.getFullYear() === viewDate.getFullYear() &&
    endDate.getMonth()    === viewDate.getMonth()    &&
    endDate.getDate()     === viewDate.getDate()

  const startsEarlier = !sameStartDay
  const endsLater     = !sameEndDay

  // Start minutes: clip to view start if it started on a previous day
  const startMins = startsEarlier
    ? viewStartMins
    : startDate.getHours() * 60 + startDate.getMinutes()

  // End minutes: clip to view end if it ends on a later day
  const endMins = endsLater
    ? viewEndMins
    : endDate.getHours() * 60 + endDate.getMinutes()

  // Clamp within the visible range
  const clampedStart = Math.max(startMins, viewStartMins)
  const clampedEnd   = Math.min(endMins,   viewEndMins)

  const left  = ((clampedStart - viewStartMins) / SLOT_MIN) * SLOT_PX
  // Minimum width = one slot so tiny blocks are still clickable
  const width = Math.max(((clampedEnd - clampedStart) / SLOT_MIN) * SLOT_PX, SLOT_PX)

  return { left, width, startsEarlier, endsLater }
}

// ============================================================
// UnassignedCard — draggable card in the left panel
// ============================================================
// useDrag returns [collectedProps, dragRef].
// dragRef is a React ref attached to the DOM element; react-dnd uses it to
// register the element as a drag source. isDragging dims the card while dragging.
//
// onEditEstimate: callback called when admin clicks the duration badge.
// The badge is a <button> with onMouseDown={e.stopPropagation()} to prevent
// react-dnd from interpreting the click as the start of a drag operation.
function UnassignedCard({
  task,
  onEditEstimate,
}: {
  task: UnassignedTask
  onEditEstimate: (t: UnassignedTask) => void
}) {
  const [{ isDragging }, dragRef] = useDrag<DragItem, unknown, { isDragging: boolean }>({
    type: DRAG_TYPE,
    item: { type: DRAG_TYPE, task },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  })

  return (
    <div
      ref={dragRef as any}
      className={`group bg-slate-800 border border-slate-700 rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'opacity-40 scale-95' : 'hover:border-indigo-500/50 hover:bg-slate-800/80'
      }`}
    >
      {/* Drag handle + customer name row */}
      <div className="flex items-start gap-2">
        <GripVertical className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-0.5 group-hover:text-slate-400 transition-colors" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-200 truncate">
            {task.customer_name ?? 'Unknown customer'}
          </p>
          {task.customer_address && (
            <p className="text-xs text-slate-500 truncate mt-0.5">{task.customer_address}</p>
          )}
          {task.notes && (
            <p className="text-xs text-slate-500 truncate mt-0.5 italic">{task.notes}</p>
          )}
        </div>
      </div>

      {/* Bottom row: phone + duration badge + estimate badge */}
      <div className="mt-2 flex items-center justify-between gap-1.5">
        <span className="text-xs text-slate-600 truncate min-w-0">
          {task.customer_phone ?? ''}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Duration badge — clicking opens the EditDurationModal.
              onMouseDown e.stopPropagation() prevents react-dnd from treating
              this mousedown as the start of a drag gesture. Without it, clicking
              the button would immediately start dragging the whole card. */}
          <button
            type="button"
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onEditEstimate(task) }}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-400 bg-slate-700/50 hover:bg-indigo-500/10 border border-slate-700 hover:border-indigo-500/30 px-2 py-0.5 rounded-lg transition-all"
            title="Edit estimated job duration"
          >
            <Clock className="w-3 h-3" />
            {task.estimated_minutes ? `${task.estimated_minutes}min` : 'Set duration'}
          </button>

          {/* Quotation total badge */}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${
            task.total_estimate > 0
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-slate-700 text-slate-500'
          }`}>
            {formatRupees(task.total_estimate)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// TimeSlot — a single 30-min droppable cell in an employee row
// ============================================================
// isAvailable: false for slots outside working hours, on-leave days, holidays.
// useDrop's canDrop returns false for unavailable slots — react-dnd shows the
// "no-drop" cursor automatically and the drop callback is never called.
function TimeSlot({
  employee,
  slotIndex,
  dateStr,
  onDrop,
  isAvailable,
}: {
  employee: ScheduleEmployee
  slotIndex: number
  dateStr: string
  onDrop: (pending: PendingAssign) => void
  isAvailable: boolean
}) {
  const [{ isOver, canDrop }, dropRef] = useDrop<DragItem, unknown, { isOver: boolean; canDrop: boolean }>({
    accept: DRAG_TYPE,
    // canDrop: always allow — the striped visual styling already communicates
    // which slots are outside working hours without hard-blocking the drop.
    // Previously `() => isAvailable` caused drops to fail silently for all employees
    // whose working hours weren't configured.
    canDrop: () => true,
    drop: (item) => {
      onDrop({
        task: item.task,
        employee,
        slotISO: slotToLocalISO(dateStr, slotIndex),
      })
    },
    collect: monitor => ({
      isOver:  monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  })

  // Diagonal stripe pattern for unavailable slots — done with CSS repeating-linear-gradient.
  // This makes it visually clear which times cannot be dropped on.
  const unavailableStyle: React.CSSProperties = !isAvailable ? {
    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.03) 4px, rgba(255,255,255,0.03) 8px)',
    backgroundColor: '#0a0f1a',
  } : {}

  return (
    <div
      ref={dropRef as any}
      className={`h-full flex-shrink-0 border-r border-slate-800/40 transition-colors ${
        isOver
          ? 'bg-emerald-500/20 border-emerald-400/30'
          : isAvailable
            ? 'bg-slate-950 hover:bg-slate-900/60'
            : ''
      }`}
      style={{ width: SLOT_PX, ...unavailableStyle }}
    />
  )
}

// ============================================================
// ScheduledBlock — a task block drawn on top of the timeline slots
// ============================================================
// Absolutely positioned over the slot grid using CSS left + width.
// Shows task title, customer name, time range.
// If the task spans multiple days, shows ← or → badges.
//
// onClickBlock: optional callback; called with the task's integer id
// when the admin clicks the block. Opens ScheduledTaskModal.
// Only active when slot.task_id is non-null.
function ScheduledBlock({
  slot,
  dateStr,
  onClickBlock,
}: {
  slot: ScheduledSlot
  dateStr: string
  onClickBlock?: (taskId: number) => void
}) {
  const { left, width, startsEarlier, endsLater } = blockGeometry(
    slot.scheduled_start,
    slot.scheduled_end,
    dateStr
  )

  return (
    <div
      // cursor-pointer when the block is clickable (has a task_id)
      className={`absolute top-1.5 bottom-1.5 rounded-lg bg-indigo-500/25 border border-indigo-500/50 px-2 overflow-hidden z-10 flex flex-col justify-center group transition-all ${
        slot.task_id
          ? 'cursor-pointer hover:bg-indigo-500/35 hover:border-indigo-400/60'
          : ''
      }`}
      style={{ left, width }}
      title={`${slot.task_title ?? slot.customer_name ?? 'Task'} — ${formatTime(slot.scheduled_start)} to ${formatTime(slot.scheduled_end)} — Click to view/edit`}
      onClick={() => {
        // Number(slot.task_id): converts the string task id to an integer.
        // The tasks table uses an integer PK so the value will be e.g. "42" → 42.
        if (slot.task_id && onClickBlock) {
          onClickBlock(Number(slot.task_id))
        }
      }}
    >
      {/* Title row */}
      <p className="text-xs font-semibold text-indigo-200 truncate leading-tight">
        {startsEarlier && <span className="mr-1 text-indigo-400">←</span>}
        {slot.task_title ?? slot.customer_name ?? 'Task'}
        {endsLater && <span className="ml-1 text-indigo-400">→</span>}
      </p>

      {/* Customer + time row */}
      {width >= 80 && (
        <p className="text-[10px] text-indigo-300/60 truncate leading-tight mt-0.5">
          {slot.customer_name && `${slot.customer_name} · `}
          {formatTime(slot.scheduled_start)}–{formatTime(slot.scheduled_end)}
        </p>
      )}

      {/* Estimate badge — only shown if the block is wide enough */}
      {width >= 120 && slot.total_estimate > 0 && (
        <p className="text-[10px] text-emerald-400/70 leading-tight mt-0.5">
          {formatRupees(slot.total_estimate)}
        </p>
      )}
    </div>
  )
}

// ============================================================
// EmployeeRow — one row in the timeline (info sidebar + slots + blocks)
// ============================================================
function EmployeeRow({
  employee,
  dateStr,
  onDrop,
  isHoliday,
  onClickBlock,
}: {
  employee: ScheduleEmployee
  dateStr: string
  onDrop: (pending: PendingAssign) => void
  isHoliday: boolean
  onClickBlock: (taskId: number) => void
}) {
  // Fully unavailable if: holiday, on leave, or no working hours configured for today
  const fullyUnavailable = isHoliday || employee.on_leave || (!employee.work_start)

  // Build availability array: index i = true if slot i is within working hours.
  // Math: slot i covers [VIEW_START*60 + i*30, VIEW_START*60 + (i+1)*30) minutes.
  const slotAvailability = Array.from({ length: TOTAL_SLOTS }, (_, i) => {
    if (fullyUnavailable) return false
    const slotStart = VIEW_START * 60 + i * SLOT_MIN
    const workStart = timeStrToMins(employee.work_start!)
    const workEnd   = timeStrToMins(employee.work_end!)
    // Slot is available if it starts at or after work_start and ends at or before work_end
    return slotStart >= workStart && (slotStart + SLOT_MIN) <= workEnd
  })

  return (
    <div className="flex border-b border-slate-800/60" style={{ height: ROW_H }}>

      {/* ---- Employee info sidebar ---- */}
      {/* flex-shrink-0 prevents this column from compressing when the timeline overflows */}
      <div
        className="flex-shrink-0 flex flex-col justify-center px-3 border-r border-slate-800/60 bg-slate-900"
        style={{ width: EMPLOYEE_COL_W }}
      >
        <div className="flex items-center gap-2">
          {/* Avatar with initials */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {employee.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{employee.name}</p>
            <p className="text-[10px] text-slate-500 truncate">
              {employee.role ?? employee.employment_type ?? ''}
            </p>
          </div>
        </div>

        {/* Status badges */}
        {employee.on_leave && (
          <span className="mt-1 self-start text-[10px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
            On Leave
          </span>
        )}
        {isHoliday && (
          <span className="mt-1 self-start text-[10px] font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
            Holiday
          </span>
        )}
        {!employee.work_start && !employee.on_leave && !isHoliday && (
          <span className="mt-1 self-start text-[10px] text-slate-600">No hours set</span>
        )}
        {employee.work_start && !employee.on_leave && !isHoliday && (
          <span className="mt-1 self-start text-[10px] text-slate-500">
            {employee.work_start}–{employee.work_end}
          </span>
        )}
      </div>

      {/* ---- Timeline area (drop zones + task blocks) ---- */}
      {/* position:relative is needed so the ScheduledBlocks can be absolutely positioned */}
      <div className="relative flex" style={{ width: TIMELINE_PX }}>

        {/* Drop zone layer — a flat row of TOTAL_SLOTS individual drop targets */}
        {slotAvailability.map((isAvail, i) => (
          <TimeSlot
            key={i}
            employee={employee}
            slotIndex={i}
            dateStr={dateStr}
            onDrop={onDrop}
            isAvailable={isAvail}
          />
        ))}

        {/* Scheduled blocks drawn on top of the drop zone layer.
            z-10 puts them above the slots. Clicking a block opens ScheduledTaskModal. */}
        {employee.scheduled_slots.map(slot => (
          <ScheduledBlock
            key={slot.schedule_id}
            slot={slot}
            dateStr={dateStr}
            onClickBlock={onClickBlock}
          />
        ))}

        {/* On-leave or holiday overlay — covers the entire row with a striped tint */}
        {fullyUnavailable && (
          <div
            className="absolute inset-0 z-5 flex items-center justify-center"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.015) 6px, rgba(255,255,255,0.015) 12px)',
              backgroundColor: '#050a14',
            }}
          >
            {employee.on_leave && (
              <span className="text-xs text-amber-500/50 font-medium pointer-events-none">
                On leave — not available for scheduling
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// EditDurationModal — tiny modal for editing estimated_minutes on a lead card
// ============================================================
// Opened when admin clicks the duration badge on an UnassignedCard.
// Only purpose: update leads.estimated_minutes via PATCH /leads/:id/estimate.
// Defined here (not a separate file) because it's only ever used in ScheduleView.
function EditDurationModal({
  lead,
  onClose,
}: {
  lead: UnassignedTask
  onClose: () => void
}) {
  // Local state for the input — initialised to the lead's current value or 60
  const [minutes, setMinutes] = useState<number>(lead.estimated_minutes ?? 60)
  const { mutate: updateEstimate, isPending } = useUpdateLeadEstimate()

  const handleSave = () => {
    updateEstimate(
      { leadId: lead.lead_id, estimated_minutes: minutes },
      { onSuccess: onClose }
    )
  }

  const inputClass =
    'w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xs bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white">Edit Job Duration</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {lead.customer_name ?? 'Unknown customer'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input */}
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" /> Estimated Duration (minutes)
            </label>
            <input
              type="number"
              min={15}
              max={480}
              step={15}
              value={minutes}
              onChange={e => setMinutes(Number(e.target.value) || 60)}
              className={inputClass}
              autoFocus
            />
            <p className="text-[10px] text-slate-600 mt-1.5">
              Pre-fills the duration when assigning this lead to a worker
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-slate-800 text-slate-400 hover:bg-slate-700 rounded-xl text-sm transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// TimeHeader — the hour labels at the top of the timeline
// ============================================================
// Shows one label per hour (every 2 slots), left-aligned to the hour boundary.
function TimeHeader() {
  // Generate one label per hour from VIEW_START to VIEW_END
  const hours = Array.from(
    { length: VIEW_END - VIEW_START },
    (_, i) => VIEW_START + i
  )

  return (
    <div
      className="flex flex-shrink-0 border-b border-slate-800/60 bg-slate-900"
      style={{ height: 28 }}
    >
      {/* Empty cell matching the employee info sidebar width */}
      <div className="flex-shrink-0 border-r border-slate-800/60" style={{ width: EMPLOYEE_COL_W }} />

      {/* Hour label row */}
      <div className="relative flex-shrink-0" style={{ width: TIMELINE_PX }}>
        {hours.map((h, i) => (
          <span
            key={h}
            className="absolute text-[10px] text-slate-500 top-1/2 -translate-y-1/2 -translate-x-1/2"
            style={{ left: i * 2 * SLOT_PX }}
          >
            {/* Format as 12h: 6→6am, 12→12pm, 13→1pm */}
            {h === 12 ? '12pm' : h > 12 ? `${h - 12}pm` : `${h}am`}
          </span>
        ))}
        {/* Hour grid lines — vertical lines at each full-hour boundary */}
        {hours.map((h, i) => (
          <div
            key={h + '-line'}
            className="absolute top-0 bottom-0 border-l border-slate-800/60"
            style={{ left: i * 2 * SLOT_PX }}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================================
// MAIN COMPONENT: ScheduleView
// ============================================================
export default function ScheduleView({
  unassignedTasks,
}: {
  unassignedTasks: UnassignedTask[]
}) {
  // ---- Date state ----
  // Initialized to today in "YYYY-MM-DD" local format.
  const [selectedDate, setSelectedDate] = useState<string>(todayStr)

  // ---- Schedule data for the selected date ----
  // useScheduleView fetches GET /tasks/schedule?date=... and caches by date.
  const { data: schedule, isLoading, isError } = useScheduleView(selectedDate)

  // ---- Pending assignment state ----
  // Set when user drops a task on a time slot; triggers AssignModal.
  // null = no modal open.
  const [pending, setPending] = useState<PendingAssign | null>(null)

  // ---- Scheduled task detail modal state ----
  // Set when admin clicks a ScheduledBlock. null = modal closed.
  // The integer task id comes from ScheduledSlot.task_id (converted to number).
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)

  // ---- Edit duration modal state ----
  // Set when admin clicks the duration badge on an UnassignedCard. null = modal closed.
  const [pendingEditLead, setPendingEditLead] = useState<UnassignedTask | null>(null)

  // ---- Date navigation handlers ----
  const prevDay  = () => setSelectedDate(d => shiftDate(d, -1))
  const nextDay  = () => setSelectedDate(d => shiftDate(d, +1))
  const goToday  = () => setSelectedDate(todayStr())

  const isToday = selectedDate === todayStr()

  // Ref for the scrollable timeline container — used for the sticky header sync
  const scrollRef = useRef<HTMLDivElement>(null)

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ======================================================
          DATE NAVIGATION BAR
          ====================================================== */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900 flex-shrink-0">

        {/* Prev/Next day buttons */}
        <button
          onClick={prevDay}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
          title="Previous day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Date label + picker */}
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-slate-200">
            {formatDateLabel(selectedDate)}
          </span>
          {/* Hidden date input for direct date picking.
              type="date" renders a native date picker.
              The label above shows the formatted date, the input does the actual picking. */}
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="text-xs text-slate-400 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <button
          onClick={nextDay}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
          title="Next day"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* "Today" shortcut — only shown when viewing a different day */}
        {!isToday && (
          <button
            onClick={goToday}
            className="ml-1 px-3 py-1 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 rounded-lg transition-all"
          >
            Today
          </button>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <span className="ml-auto text-xs text-slate-500 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Loading schedule…
          </span>
        )}

        {/* Legend */}
        <div className="ml-auto flex items-center gap-4 text-[10px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-indigo-500/30 border border-indigo-500/50 inline-block" />
            Scheduled
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-900 border border-slate-700 inline-block" />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-sm inline-block"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.06) 2px, rgba(255,255,255,0.06) 4px)',
                backgroundColor: '#0a0f1a',
              }}
            />
            Unavailable
          </span>
        </div>
      </div>

      {/* ======================================================
          HOLIDAY BANNER
          ====================================================== */}
      {schedule?.holiday && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-sm text-amber-300 font-medium">
            Company Holiday: {schedule.holiday.holiday_name}
          </span>
          <span className="text-xs text-amber-400/60 ml-1">
            — All employees are unavailable for scheduling
          </span>
        </div>
      )}

      {/* ======================================================
          MAIN CONTENT — Left panel + Timeline
          flex-1 min-h-0: makes the content area fill remaining height.
          The inner panels have overflow-y-auto / overflow-x-auto to scroll
          independently. min-h-0 is required on flex children to make overflow
          work correctly inside a flex column (a common React/CSS gotcha).
          ====================================================== */}
      <div className="flex flex-1 min-h-0">

        {/* ---- LEFT PANEL: Unassigned tasks ---- */}
        {/* w-64 = 256px fixed width; overflow-y-auto scrolls long lists */}
        <div className="w-64 flex-shrink-0 border-r border-slate-800 bg-slate-900/50 flex flex-col">
          <div className="px-3 py-2.5 border-b border-slate-800 flex-shrink-0">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-indigo-400" />
              Unassigned Tasks
            </h3>
            <p className="text-[10px] text-slate-600 mt-0.5">Drag a card onto the timeline</p>
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {unassignedTasks.length === 0 ? (
              <div className="py-8 text-center">
                <User className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-600">No unassigned tasks</p>
                <p className="text-[10px] text-slate-700 mt-1">Close a deal to create one</p>
              </div>
            ) : (
              unassignedTasks.map(task => (
                <UnassignedCard
                  key={task.lead_id}
                  task={task}
                  onEditEstimate={setPendingEditLead}
                />
              ))
            )}
          </div>
        </div>

        {/* ---- RIGHT PANEL: Timeline ---- */}
        {/* overflow-x-auto enables horizontal scrolling for the timeline */}
        <div className="flex-1 min-w-0 overflow-auto" ref={scrollRef}>

          {isError ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-rose-400">Failed to load schedule. Please refresh.</p>
            </div>
          ) : !schedule ? (
            // Skeleton shown while initial load is in progress
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className="w-8 h-8 animate-spin text-slate-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                <p className="text-xs text-slate-600">Loading schedule…</p>
              </div>
            </div>
          ) : (
            // The timeline table — min-width forces the scrollable container to be
            // at least wide enough for the employee col + full timeline.
            <div style={{ minWidth: EMPLOYEE_COL_W + TIMELINE_PX }}>

              {/* Sticky-ish time header — scrolls horizontally with the content */}
              <TimeHeader />

              {/* Employee rows */}
              {schedule.employees.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-sm text-slate-600">No active employees found</p>
                </div>
              ) : (
                schedule.employees.map(emp => (
                  <EmployeeRow
                    key={emp.id}
                    employee={emp}
                    dateStr={selectedDate}
                    onDrop={setPending}
                    isHoliday={!!schedule.holiday}
                    onClickBlock={setSelectedTaskId}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================
          ASSIGN MODAL
          Rendered when the user drops a task on a time slot.
          pending is set by EmployeeRow's onDrop → TimeSlot's drop handler.
          AssignModal's initialScheduledStart pre-fills the start time.
          ====================================================== */}
      {pending && (
        <AssignModal
          lead={pending.task}
          // AssignModal expects Employee type (id: number) but ScheduleEmployee has id: string.
          // Cast to satisfy the prop type — the id is only used in the POST /tasks/assign payload.
          employee={{ ...pending.employee, id: pending.employee.id as any }}
          initialScheduledStart={pending.slotISO}
          onClose={() => setPending(null)}
          onSuccess={() => setPending(null)}
        />
      )}

      {/* ======================================================
          SCHEDULED TASK MODAL
          Opens when the admin clicks a scheduled block on the timeline.
          selectedTaskId is set by ScheduledBlock's onClick handler.
          ====================================================== */}
      {selectedTaskId !== null && (
        <ScheduledTaskModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      {/* ======================================================
          EDIT DURATION MODAL
          Opens when the admin clicks the duration badge on an unassigned card.
          pendingEditLead is set by UnassignedCard's onEditEstimate callback.
          ====================================================== */}
      {pendingEditLead && (
        <EditDurationModal
          lead={pendingEditLead}
          onClose={() => setPendingEditLead(null)}
        />
      )}
    </div>
  )
}
