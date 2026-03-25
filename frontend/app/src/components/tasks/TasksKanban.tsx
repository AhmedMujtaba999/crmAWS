// components/tasks/TasksKanban.tsx — 4-Column Admin Kanban Board
// ============================================================
// Displays tasks in four status columns: Unassigned · Pending · Active · Completed
//
// DRAG-AND-DROP RULES (per user requirement):
//   - Unassigned column: FIXED — cards cannot be dragged out, nothing can be
//     dropped into it. Its only purpose is to show how many leads are waiting.
//     Assignment happens exclusively in the "Assign & Scheduling" tab.
//   - Pending / Active / Completed: cards CAN be dragged between these three
//     columns. Dropping calls PUT /tasks/:id/status to persist the change.
//
// react-dnd requires a <DndProvider backend={HTML5Backend}> ancestor.
// That provider lives in TasksPage.tsx which wraps all three tabs,
// so drag-drop works regardless of which sub-tab is visible.
// ============================================================

import { useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
// useDrag: makes an element draggable. Returns [state, dragRef].
//   dragRef must be attached to the element you want to drag.
// useDrop: makes an element a drop target. Returns [state, dropRef].
//   dropRef must be attached to the target element.

import {
  Inbox,
  Clock,
  AlertCircle,
  CheckCircle2,
  GripVertical,
  User,
  Calendar,
  MapPin,
  Phone,
} from 'lucide-react'

import type { UnassignedTask, AdminTask } from '@/hooks/useTasks'
import { useUpdateTaskStatus } from '@/hooks/useTasks'

// The string that identifies drag items in this kanban.
// react-dnd uses this to match drag sources to drop targets —
// only drop targets that `accept` this type will activate.
const DRAG_TYPE = 'ADMIN_TASK'

// ============================================================
// COLUMN DEFINITIONS
// ============================================================
const COLUMNS = [
  {
    id: 'unassigned' as const,
    label: 'Unassigned',
    color: 'text-slate-400',
    bgColor: 'bg-slate-800/50',
    borderColor: 'border-slate-700',
    icon: Inbox,
    fixed: true,   // cannot be a drop target
  },
  {
    id: 'PENDING' as const,
    label: 'Pending',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/5',
    borderColor: 'border-amber-500/20',
    icon: Clock,
    fixed: false,
  },
  {
    id: 'ACTIVE' as const,
    label: 'Active',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/5',
    borderColor: 'border-indigo-500/20',
    icon: AlertCircle,
    fixed: false,
  },
  {
    id: 'COMPLETED' as const,
    label: 'Completed',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/5',
    borderColor: 'border-emerald-500/20',
    icon: CheckCircle2,
    fixed: false,
  },
]

// Priority badge colors — the backend doesn't have a priority field yet,
// so we omit priority badges from the real implementation.

// ============================================================
// DRAGGABLE TASK CARD (Pending / Active / Completed)
// ============================================================
function TaskCard({ task, currentColumnId }: { task: AdminTask; currentColumnId: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { mutate: updateStatus } = useUpdateTaskStatus()

  // useDrag turns this card into a drag source.
  // item: the data payload sent to the drop target when this card is dropped.
  // collect: maps monitor state to component props (isDragging here).
  const [{ isDragging }, drag] = useDrag({
    type: DRAG_TYPE,
    item: { id: task.id, fromColumn: currentColumnId },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  })

  // Attach the drag ref to the actual DOM element
  drag(ref)

  // Format due_date for display: "2026-03-10" → "10 Mar 2026"
  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div
      ref={ref}
      // opacity-40 + scale-95: visual feedback while being dragged
      className={`bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-grab
        active:cursor-grabbing transition-all duration-200
        hover:border-slate-600 hover:shadow-lg group
        ${isDragging ? 'opacity-40 scale-95' : 'opacity-100'}`}
    >
      {/* Header row: grip handle + task ID */}
      <div className="flex items-center justify-between mb-2">
        <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400" />
        <span className="text-xs text-slate-600 font-mono">#{task.id}</span>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-slate-200 mb-1 leading-snug">
        {task.title}
      </p>

      {/* Description — 2 line clamp */}
      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      {/* Footer: employee + due date */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <User className="w-3 h-3" />
          <span className="truncate max-w-[90px]">
            {task.employee_name ?? 'Unassigned'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-600">
          <Calendar className="w-3 h-3" />
          {formatDate(task.due_date)}
        </div>
      </div>

      {/* Customer row — separated by a subtle border */}
      {task.customer_name && (
        <div className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{task.customer_name}</span>
        </div>
      )}
    </div>
  )
}

// ============================================================
// UNASSIGNED CARD (fixed — not draggable)
// ============================================================
function UnassignedCard({ task }: { task: UnassignedTask }) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    })

  return (
    // No drag ref — this card is intentionally not draggable.
    // cursor-default makes it visually clear it can't be grabbed.
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-default
      transition-all duration-200 hover:border-slate-700">

      {/* Customer name */}
      <p className="text-sm font-semibold text-slate-200 mb-1 leading-snug">
        {task.customer_name ?? 'Unknown customer'}
      </p>

      {/* Contact info */}
      {task.customer_phone && (
        <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
          <Phone className="w-3 h-3" />
          {task.customer_phone}
        </div>
      )}
      {task.customer_address && (
        <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{task.customer_address}</span>
        </div>
      )}

      {/* Created date */}
      <div className="flex items-center gap-1 text-xs text-slate-600 mt-2 pt-2 border-t border-slate-800">
        <Calendar className="w-3 h-3" />
        Lead created {formatDate(task.created_at)}
      </div>
    </div>
  )
}

// ============================================================
// DROP COLUMN — wraps a column and handles drops from other columns
// ============================================================
interface DropColumnProps {
  column: typeof COLUMNS[number]
  children: React.ReactNode
  count: number
  onDrop: (taskId: number, newStatus: string) => void
}

function DropColumn({ column, children, count, onDrop }: DropColumnProps) {
  const ref = useRef<HTMLDivElement>(null)
  const Icon = column.icon

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: DRAG_TYPE,

    // canDrop: returning false prevents the drop event entirely.
    // Fixed columns (unassigned) can never receive drops.
    // Also prevent dropping a card into its own column (no-op move).
    canDrop: (item: { id: number; fromColumn: string }) => {
      if (column.fixed) return false           // unassigned is locked
      return item.fromColumn !== column.id      // can't drop in same column
    },

    // drop: called when a card is released over this column.
    drop: (item: { id: number; fromColumn: string }) => {
      onDrop(item.id, column.id)
    },

    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  })

  // For fixed columns, don't attach the drop ref (they can't receive drops)
  if (!column.fixed) drop(ref)

  // Active drop target: glow border + slight scale
  const isActiveDropTarget = isOver && canDrop

  return (
    <div
      ref={ref}
      className={`flex flex-col rounded-2xl border transition-all duration-200 min-w-[260px]
        ${column.bgColor} ${column.borderColor}
        ${isActiveDropTarget ? 'border-indigo-500 shadow-lg shadow-indigo-500/10 scale-[1.01]' : ''}
      `}
    >
      {/* Column header */}
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${column.borderColor}`}>
        <Icon className={`w-4 h-4 ${column.color}`} />
        <span className={`text-sm font-semibold ${column.color}`}>{column.label}</span>
        {/* Count badge */}
        <span className={`ml-auto w-6 h-6 rounded-full flex items-center justify-center
          text-xs font-bold ${column.color} bg-current/10`}>
          {count}
        </span>
        {/* Locked indicator for unassigned column */}
        {column.fixed && (
          <span className="text-xs text-slate-600 ml-1">(assign via tab below)</span>
        )}
      </div>

      {/* Drop hint: dashed box appears at the top of the column when dragging over */}
      {isActiveDropTarget && (
        <div className="mx-3 mt-3 h-12 rounded-xl border-2 border-dashed border-indigo-500/50
          bg-indigo-500/5 flex items-center justify-center text-xs text-indigo-400">
          Drop here to mark as {column.label}
        </div>
      )}

      {/* Cards container */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 340px)', minHeight: 200 }}>
        {children}

        {/* Empty state */}
        {count === 0 && !isActiveDropTarget && (
          <div className="flex flex-col items-center justify-center h-32 text-slate-600">
            <Icon className="w-6 h-6 mb-2 opacity-40" />
            <p className="text-xs">No {column.label.toLowerCase()} tasks</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// MAIN COMPONENT
// ============================================================
interface Props {
  unassigned: UnassignedTask[]
  pending: AdminTask[]
  active: AdminTask[]
  completed: AdminTask[]
}

export default function TasksKanban({ unassigned, pending, active, completed }: Props) {
  const { mutate: updateStatus } = useUpdateTaskStatus()

  // Called by DropColumn when a card is dropped.
  // taskId: the task's numeric id. newStatus: the column's id (e.g. "ACTIVE").
  const handleDrop = (taskId: number, newStatus: string) => {
    updateStatus({ id: taskId, status: newStatus })
  }

  return (
    // Horizontal scroll so all 4 columns are always accessible
    <div className="flex gap-4 overflow-x-auto pb-4 h-full">

      {/* ---- UNASSIGNED COLUMN (fixed, no drop target) ---- */}
      <DropColumn
        column={COLUMNS[0]}
        count={unassigned.length}
        onDrop={() => {}} // no-op: canDrop returns false for this column
      >
        {unassigned.map(task => (
          <UnassignedCard key={task.lead_id} task={task} />
        ))}
      </DropColumn>

      {/* ---- PENDING COLUMN ---- */}
      <DropColumn
        column={COLUMNS[1]}
        count={pending.length}
        onDrop={handleDrop}
      >
        {pending.map(task => (
          <TaskCard key={task.id} task={task} currentColumnId="PENDING" />
        ))}
      </DropColumn>

      {/* ---- ACTIVE COLUMN ---- */}
      <DropColumn
        column={COLUMNS[2]}
        count={active.length}
        onDrop={handleDrop}
      >
        {active.map(task => (
          <TaskCard key={task.id} task={task} currentColumnId="ACTIVE" />
        ))}
      </DropColumn>

      {/* ---- COMPLETED COLUMN ---- */}
      <DropColumn
        column={COLUMNS[3]}
        count={completed.length}
        onDrop={handleDrop}
      >
        {completed.map(task => (
          <TaskCard key={task.id} task={task} currentColumnId="COMPLETED" />
        ))}
      </DropColumn>

    </div>
  )
}
