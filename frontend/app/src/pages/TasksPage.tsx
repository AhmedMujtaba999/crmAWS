// pages/TasksPage.tsx — Tasks & Scheduling Page
// ============================================================
// This is the top-level page component mounted at /tasks.
//
// THREE TABS:
//   1. Tasks         — 4-column drag-drop kanban (TasksKanban)
//   2. Assign & Schedule — timeline scheduler (ScheduleView)
//   3. History       — completed tasks with filters (inline here)
//
// DndProvider lives HERE, wrapping all three tabs, so that
// react-dnd's context is shared across both drag systems:
//   - 'ADMIN_TASK'     type used in TasksKanban
//   - 'SCHEDULE_TASK'  type used in ScheduleView
// Both can coexist because they use different DRAG_TYPE strings.
//
// Data is fetched ONCE with useTasks() and split into the four
// buckets the backend returns: unassigned / pending / active / completed.
// All tabs read from the same TanStack Query cache — no duplicate requests.
// ============================================================

import { useState } from 'react'
// HTML5Backend: the standard browser drag-and-drop implementation for react-dnd.
// It uses the native HTML5 DnD API (mousedown/mousemove/mouseup events internally).
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import {
  LayoutGrid,      // Kanban icon for Tasks tab
  CalendarRange,   // Calendar icon for Assign & Schedule tab
  History,         // History icon for History tab
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  Calendar,
  MapPin,
  Search,
} from 'lucide-react'

import { useTasks } from '@/hooks/useTasks'
import type { AdminTask } from '@/hooks/useTasks'
import TasksKanban from '@/components/tasks/TasksKanban'
import ScheduleView from '@/components/tasks/ScheduleView'

// ============================================================
// TAB DEFINITIONS
// ============================================================
// Each tab has an id (string used for state comparison), label (display text),
// and an icon component from lucide-react.
const TABS = [
  { id: 'tasks',   label: 'Tasks',              Icon: LayoutGrid  },
  { id: 'assign',  label: 'Assign & Schedule',  Icon: CalendarRange },
  { id: 'history', label: 'History',             Icon: History     },
] as const
// 'as const' tells TypeScript to treat these as literal string types,
// not just generic string. So TABS[0].id is literally 'tasks', not just string.
// This enables the type: 'tasks' | 'assign' | 'history' below.

type TabId = typeof TABS[number]['id']
// typeof TABS[number]['id'] = 'tasks' | 'assign' | 'history'
// This union type is derived directly from the TABS array — if we add a tab,
// the type automatically includes the new id. No manual maintenance needed.

// ============================================================
// HISTORY TASK ROW — one completed task in the History tab
// ============================================================
function HistoryRow({ task }: { task: AdminTask }) {
  // Format a datetime string to a readable "10 Mar 2026, 09:00" string
  const fmt = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="flex items-start gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4
      hover:border-slate-700 transition-colors">

      {/* Status dot — always green for completed */}
      <div className="mt-0.5 flex-shrink-0">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      </div>

      <div className="flex-1 min-w-0 grid grid-cols-1 gap-1 sm:grid-cols-3 sm:gap-4">

        {/* Task info */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-200 truncate">{task.title}</p>
          {task.description && (
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{task.description}</p>
          )}
          {task.customer_name && (
            <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{task.customer_name}</span>
            </div>
          )}
        </div>

        {/* Employee */}
        <div className="flex items-center gap-1.5 text-sm text-slate-400">
          <User className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
          <span className="truncate">{task.employee_name ?? 'Unknown'}</span>
        </div>

        {/* Completed at timestamp */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
          Completed {fmt(task.completed_at)}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// HISTORY TAB CONTENT
// ============================================================
// Receives the completed tasks array and adds a search filter
// so admins can narrow by employee name or task title.
// No additional API call — data comes from the shared useTasks() cache.
function HistoryContent({ completed }: { completed: AdminTask[] }) {
  // Local search state — only affects the History tab's display
  const [search, setSearch] = useState('')

  // Filter completed tasks by search string (case-insensitive match on
  // title, employee name, or customer name)
  const filtered = search.trim() === ''
    ? completed
    : completed.filter(t => {
        const q = search.toLowerCase()
        return (
          t.title.toLowerCase().includes(q) ||
          (t.employee_name?.toLowerCase().includes(q) ?? false) ||
          (t.customer_name?.toLowerCase().includes(q) ?? false)
        )
      })

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Search bar */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="relative flex-1 max-w-sm">
          {/* Search icon positioned inside the input via absolute positioning */}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title, employee or customer…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl
              pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500
              focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Result count */}
        <span className="text-xs text-slate-500 flex-shrink-0">
          {filtered.length} task{filtered.length !== 1 ? 's' : ''}
          {search ? ` matching "${search}"` : ' completed recently'}
        </span>
      </div>

      {/* Scrollable list of completed tasks */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-600">
            <CheckCircle2 className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">
              {search ? 'No tasks match your search' : 'No completed tasks in the last 3 days'}
            </p>
          </div>
        ) : (
          filtered.map(task => <HistoryRow key={task.id} task={task} />)
        )}
      </div>
    </div>
  )
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function TasksPage() {
  // activeTab: which of the three tabs is currently shown.
  // TypeScript enforces this must be one of the three literal strings.
  const [activeTab, setActiveTab] = useState<TabId>('tasks')

  // useTasks() fires GET /tasks once and caches the result.
  // { data, isLoading, isError } is the TanStack Query return shape.
  // data is undefined while loading, then becomes AdminTasksResponse.
  const { data, isLoading, isError } = useTasks()

  // ---- LOADING STATE ----
  // Show a centred spinner while the initial fetch is in progress.
  // isLoading is true only on the very first fetch (no cached data yet).
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Loading tasks…</p>
        </div>
      </div>
    )
  }

  // ---- ERROR STATE ----
  // Show an error message if the API call failed (network error, 401, 500, etc.)
  if (isError || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <AlertCircle className="w-8 h-8 text-rose-400" />
          <p className="text-sm">Failed to load tasks. Please refresh.</p>
        </div>
      </div>
    )
  }

  // ---- DATA AVAILABLE ----
  // Destructure the four buckets from the API response.
  // These names match the backend's GET /tasks response shape exactly.
  const { unassigned_tasks, pending_tasks, active_tasks, completed_tasks } = data

  return (
    // DndProvider MUST wrap all components that use useDrag or useDrop.
    // HTML5Backend uses native browser drag events.
    // This is placed here (not in main.tsx) because DnD context is
    // only needed on this page — no other page uses drag-drop.
    <DndProvider backend={HTML5Backend}>

      {/* Page shell: full height, flex column */}
      <div className="flex flex-col h-full overflow-hidden">

        {/* ============================================================
            PAGE HEADER — title + tab bar
            ============================================================ */}
        <div className="flex-shrink-0 mb-4">

          {/* Page title row */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-100">Tasks & Scheduling</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {unassigned_tasks.length} unassigned ·{' '}
                {pending_tasks.length} pending ·{' '}
                {active_tasks.length} active
              </p>
            </div>
          </div>

          {/* Tab bar — pill-style navigation */}
          <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
            {TABS.map(({ id, label, Icon }) => {
              const isActive = activeTab === id
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  // Active tab: filled indigo background. Inactive: transparent with hover.
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

        {/* ============================================================
            TAB CONTENT AREA — fills remaining height
            ============================================================
            'overflow-hidden' here prevents the page from scrolling —
            each tab's internal content manages its own scrolling.
            This keeps the tab bar always visible at the top. */}
        <div className="flex-1 overflow-hidden">

          {/* TASKS TAB — 4-column kanban */}
          {activeTab === 'tasks' && (
            <TasksKanban
              unassigned={unassigned_tasks}
              pending={pending_tasks}
              active={active_tasks}
              completed={completed_tasks}
            />
          )}

          {/* ASSIGN & SCHEDULE TAB — timeline scheduler */}
          {activeTab === 'assign' && (
            <ScheduleView unassignedTasks={unassigned_tasks} />
          )}

          {/* HISTORY TAB — completed tasks with search */}
          {activeTab === 'history' && (
            <HistoryContent completed={completed_tasks} />
          )}

        </div>
      </div>
    </DndProvider>
  )
}
