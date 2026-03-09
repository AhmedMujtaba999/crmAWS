import { useState, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { employeesData, Employee, tasksData, Task } from "../../data/mockData";
import {
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Edit3,
  GripVertical,
  Inbox,
  Calendar,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react";

const DRAG_TYPE = "UNASSIGNED_TASK";

const unassignedTasks = tasksData.filter((t) => t.status === "unassigned");

interface UnassignedCardProps {
  task: Task;
}

function UnassignedCard({ task }: UnassignedCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: DRAG_TYPE,
    item: { task },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(ref);

  return (
    <div
      ref={ref}
      className={`group bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all duration-200 hover:border-indigo-500/40 hover:bg-slate-800 ${
        isDragging ? "opacity-40 scale-95" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-300 leading-snug truncate">{task.title}</p>
          <p className="text-xs text-slate-600 mt-0.5">{task.clientName}</p>
          <div className="flex items-center gap-1 mt-1">
            <Calendar className="w-3 h-3 text-slate-600" />
            <span className="text-xs text-slate-600">{task.dueDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EmployeeDropZoneProps {
  employee: Employee;
  assignedTasks: Task[];
  onAssign: (task: Task, empId: string) => void;
  onEdit: (emp: Employee) => void;
}

function EmployeeDropZone({ employee, assignedTasks, onAssign, onEdit }: EmployeeDropZoneProps) {
  const [expanded, setExpanded] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const [{ isOver, canDrop }, drop] = useDrop<{ task: Task }, void, { isOver: boolean; canDrop: boolean }>({
    accept: DRAG_TYPE,
    drop: (item) => {
      onAssign(item.task, employee.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  drop(ref);

  const empKey = employee.name.replace(" ", "").slice(0, 4);

  return (
    <div
      ref={ref}
      className={`bg-slate-900 border rounded-xl transition-all duration-200 overflow-hidden ${
        isOver && canDrop
          ? "border-indigo-500 shadow-lg shadow-indigo-500/20"
          : "border-slate-800"
      }`}
    >
      {/* Employee Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {employee.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-200">{employee.name}</p>
            <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-500 rounded-md">{employee.empType}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              {employee.workingHours.from} — {employee.workingHours.to}
            </div>
            <div className="flex items-center gap-1 text-xs text-indigo-400">
              <AlertCircle className="w-3 h-3" />
              {assignedTasks.length} task{assignedTasks.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(employee)}
            className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
            title="Change Hours / Edit Employee"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-all"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-slate-500 hover:text-slate-300 transition-all"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Drop hint */}
      {isOver && canDrop && (
        <div className="mx-3 mb-2 h-10 rounded-lg border-2 border-dashed border-indigo-500/60 bg-indigo-500/10 flex items-center justify-center">
          <span className="text-xs text-indigo-400">Assign to {employee.name.split(" ")[0]}</span>
        </div>
      )}

      {/* Tasks */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-slate-800 pt-3">
          {assignedTasks.length === 0 ? (
            <div className="text-center py-4 text-slate-600 text-xs border border-dashed border-slate-700 rounded-lg">
              <Inbox className="w-5 h-5 mx-auto mb-1 opacity-40" />
              Drop tasks here to assign
            </div>
          ) : (
            assignedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 bg-slate-800/60 rounded-lg p-3 border border-slate-700/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-300 truncate">{task.title}</p>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                        task.status === "active"
                          ? "bg-indigo-500/20 text-indigo-400"
                          : task.status === "pending"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{task.clientName}</span>
                    <span className="text-xs text-slate-600">•</span>
                    <span className="text-xs text-slate-600">Due: {task.dueDate}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface EditHoursModalProps {
  employee: Employee;
  onClose: () => void;
  onSave: (emp: Employee) => void;
}

function EditHoursModal({ employee, onClose, onSave }: EditHoursModalProps) {
  const [form, setForm] = useState({
    from: employee.workingHours.from,
    to: employee.workingHours.to,
    name: employee.name,
    phone: employee.phone,
    email: employee.email,
    empType: employee.empType,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Edit Employee</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">From</label>
              <input
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
                placeholder="8:00 AM"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">To</label>
              <input
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
                placeholder="6:00 PM"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Employee Type</label>
            <select
              value={form.empType}
              onChange={(e) => setForm({ ...form, empType: e.target.value as Employee["empType"] })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {["Full-Time", "Part-Time", "Contractor", "Manager"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2 bg-slate-800 text-slate-400 rounded-xl text-sm hover:bg-slate-700 transition-all">
              Cancel
            </button>
            <button
              onClick={() => {
                onSave({ ...employee, name: form.name, empType: form.empType as Employee["empType"], workingHours: { from: form.from, to: form.to } });
                onClose();
              }}
              className="flex-1 py-2 bg-indigo-500 text-white rounded-xl text-sm hover:bg-indigo-400 transition-all"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssignScheduling() {
  const [employees, setEmployees] = useState<Employee[]>(employeesData);
  const [tasks, setTasks] = useState<Task[]>(tasksData);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  const unassigned = tasks.filter((t) => t.status === "unassigned");

  const handleAssign = (task: Task, empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, assignee: emp.name, status: "pending" as const }
          : t
      )
    );
  };

  const getEmpTasks = (emp: Employee) =>
    tasks.filter((t) => t.assignee === emp.name && t.status !== "unassigned");

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* Unassigned Panel */}
      <div className="w-72 flex-shrink-0 bg-slate-900/50 border-r border-slate-800 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-300">Unassigned Tasks</h3>
            <span className="ml-auto w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center text-xs text-slate-400">
              {unassigned.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Drag tasks to assign them</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {unassigned.length === 0 ? (
            <div className="text-center py-8 text-slate-600 text-xs">
              <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
              All tasks assigned!
            </div>
          ) : (
            unassigned.map((task) => (
              <UnassignedCard key={task.id} task={task} />
            ))
          )}
        </div>
      </div>

      {/* Employee Schedule Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-300">Employee Schedules</h2>
          <p className="text-xs text-slate-500">Drag tasks from left panel to assign</p>
        </div>
        <div className="space-y-3">
          {employees.map((emp) => (
            <EmployeeDropZone
              key={emp.id}
              employee={emp}
              assignedTasks={getEmpTasks(emp)}
              onAssign={handleAssign}
              onEdit={setEditingEmp}
            />
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingEmp && (
        <EditHoursModal
          employee={editingEmp}
          onClose={() => setEditingEmp(null)}
          onSave={(updated) => {
            setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
            setEditingEmp(null);
          }}
        />
      )}
    </div>
  );
}