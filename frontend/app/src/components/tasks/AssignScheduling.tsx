// components/tasks/AssignScheduling.tsx — Drag-to-Assign Panel
// ============================================================
// Two-panel layout:
//   LEFT  — list of unassigned leads (draggable cards)
//   RIGHT — one drop zone per employee
//
// When a lead card is dropped onto an employee zone, AssignModal
// opens to collect task title, scheduled time, and duration.
// On form submit → POST /tasks/assign → task created + scheduled.
//
// Drag type: "UNASSIGNED_TASK" (different from the kanban's "ADMIN_TASK"
// so the two drag systems don't interfere with each other).
// ============================================================

import { useRef, useState } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import {
  Inbox,
  GripVertical,
  Calendar,
  Phone,
  MapPin,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Users,
} from 'lucide-react'

import type { UnassignedTask, AdminTask } from '@/hooks/useTasks'
import type { Employee } from '@/hooks/useEmployees'
import { useEmployees } from '@/hooks/useEmployees'
import AssignModal from './AssignModal'

const DRAG_TYPE = 'UNASSIGNED_TASK'

// ============================================================
// DRAGGABLE UNASSIGNED CARD
// ============================================================
function UnassignedDragCard({ task }: { task: UnassignedTask }) {
  const ref = useRef<HTMLDivElement>(null)

  const [{ isDragging }, drag] = useDrag({
    type: DRAG_TYPE,
    // item payload: the full lead object so the drop zone knows what was dropped
    item: { task },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  })

  drag(ref)

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

  return (
    <div
      ref={ref}
      className={`group bg-slate-800/60 border border-slate-700/50 rounded-xl p-3
        cursor-grab active:cursor-grabbing transition-all duration-200
        hover:border-indigo-500/40 hover:bg-slate-800
        ${isDragging ? 'opacity-40 scale-95' : 'opacity-100'}`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 mt-0.5 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-300 leading-snug truncate">
            {task.customer_name ?? 'Unknown customer'}
          </p>
          {task.customer_phone && (
            <div className="flex items-center gap-1 text-xs text-slate-600 mt-0.5">
              <Phone className="w-2.5 h-2.5" />
              {task.customer_phone}
            </div>
          )}
          {task.customer_address && (
            <div className="flex items-center gap-1 text-xs text-slate-600 mt-0.5">
              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate">{task.customer_address}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
            <Calendar className="w-2.5 h-2.5" />
            {formatDate(task.created_at)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// EMPLOYEE DROP ZONE
// ============================================================
interface EmployeeDropZoneProps {
  employee: Employee
  assignedTasks: AdminTask[]        // tasks already assigned to this employee
  onDrop: (task: UnassignedTask, employee: Employee) => void
}

function EmployeeDropZone({ employee, assignedTasks, onDrop }: EmployeeDropZoneProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(true)

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: DRAG_TYPE,
    drop: (item: { task: UnassignedTask }) => {
      onDrop(item.task, employee)
    },
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  })

  drop(ref)

  const isActiveTarget = isOver && canDrop

  // Get initials from name: "Kiran Kumar" → "KK"
  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div
      ref={ref}
      className={`bg-slate-900 border rounded-xl transition-all duration-200 ${
        isActiveTarget
          ? 'border-indigo-500 shadow-lg shadow-indigo-500/20'
          : 'border-slate-800'
      }`}
    >
      {/* Employee header row — always visible */}
      <div className="flex items-center gap-3 px-4 py-3">

        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600
          flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {getInitials(employee.name)}
        </div>

        {/* Name + type + task count */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-200 truncate">{employee.name}</p>
            {employee.employment_type && (
              <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-500 rounded-md flex-shrink-0">
                {employee.employment_type}
              </span>
            )}
          </div>
          {employee.role && (
            <p className="text-xs text-slate-500 mt-0.5">{employee.role}</p>
          )}
          <div className="flex items-center gap-1 text-xs text-indigo-400 mt-0.5">
            <AlertCircle className="w-3 h-3" />
            {assignedTasks.length} task{assignedTasks.length !== 1 ? 's' : ''} assigned
          </div>
        </div>

        {/* Expand/collapse toggle */}
        <button
          onClick={() => setExpanded(p => !p)}
          className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Drop hint: shown while dragging over this zone */}
      {isActiveTarget && (
        <div className="mx-3 mb-2 h-10 rounded-lg border-2 border-dashed border-indigo-500/60
          bg-indigo-500/10 flex items-center justify-center text-xs text-indigo-400">
          Assign to {employee.name.split(' ')[0]}
        </div>
      )}

      {/* Expanded task list */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-slate-800 pt-3">
          {assignedTasks.length === 0 ? (
            // Dashed empty state — also acts as a visual drop hint
            <div className="text-center py-4 rounded-lg border border-dashed border-slate-700 text-slate-600">
              <Inbox className="w-4 h-4 mx-auto mb-1 opacity-50" />
              <p className="text-xs">Drop tasks here to assign</p>
            </div>
          ) : (
            assignedTasks.map(task => (
              <div
                key={task.id}
                className="flex items-start gap-3 bg-slate-800/60 rounded-lg p-3 border border-slate-700/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-slate-300 truncate flex-1">
                      {task.title}
                    </p>
                    {/* Status badge */}
                    <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                      task.status === 'ACTIVE'
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : task.status === 'PENDING'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {task.customer_name ?? '—'}
                    {task.due_date && (
                      <> · Due {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</>
                    )}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
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
}

export default function AssignScheduling({ unassigned, pending, active }: Props) {
  const { data: employees, isLoading: loadingEmployees } = useEmployees()

  // pendingAssignment: set when a drop happens — triggers the AssignModal
  const [pendingAssignment, setPendingAssignment] = useState<{
    lead: UnassignedTask
    employee: Employee
  } | null>(null)

  // All assigned tasks (pending + active) — used to show what each employee has
  const allAssigned = [...pending, ...active]

  const handleDrop = (task: UnassignedTask, employee: Employee) => {
    // Open the modal instead of calling the API directly —
    // we still need title, scheduled_start, estimated_minutes from the user
    setPendingAssignment({ lead: task, employee })
  }

  return (
    <div className="flex gap-6 h-full overflow-hidden">

      {/* ============================================================
          LEFT PANEL — Unassigned leads (drag sources)
          ============================================================ */}
      <div className="w-72 flex flex-col flex-shrink-0">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-full overflow-hidden">

          {/* Panel header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 flex-shrink-0">
            <Inbox className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-300">Unassigned</span>
            <span className="ml-auto w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
              {unassigned.length}
            </span>
          </div>

          {/* Instruction text */}
          <p className="px-4 py-2 text-xs text-slate-600">
            Drag a lead onto an employee to assign it
          </p>

          {/* Scrollable card list */}
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
            {unassigned.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-600">
                <Inbox className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs text-center">All leads are assigned</p>
              </div>
            ) : (
              unassigned.map(task => (
                <UnassignedDragCard key={task.lead_id} task={task} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ============================================================
          RIGHT PANEL — Employee drop zones
          ============================================================ */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">

        {loadingEmployees ? (
          // Skeleton placeholders while employees load
          [1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
          ))
        ) : !employees || employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-600">
            <Users className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No employees found</p>
          </div>
        ) : (
          employees
            // Only show active employees
            .filter(emp => emp.is_active)
            .map(employee => (
              <EmployeeDropZone
                key={employee.id}
                employee={employee}
                // Tasks assigned to this specific employee
                assignedTasks={allAssigned.filter(t => t.employee_id === employee.id)}
                onDrop={handleDrop}
              />
            ))
        )}
      </div>

      {/* ============================================================
          ASSIGN MODAL — appears after a drop, collects task details
          ============================================================ */}
      {pendingAssignment && (
        <AssignModal
          lead={pendingAssignment.lead}
          employee={pendingAssignment.employee}
          onClose={() => setPendingAssignment(null)}
          onSuccess={() => setPendingAssignment(null)}
        />
      )}
    </div>
  )
}
