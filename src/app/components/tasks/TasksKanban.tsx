import { useState, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { tasksData, Task } from "../../data/mockData";
import {
  Plus,
  AlertCircle,
  Clock,
  CheckCircle2,
  Inbox,
  GripVertical,
  User,
  Calendar,
  ChevronRight,
} from "lucide-react";

const DRAG_TYPE = "TASK";

type TaskStatus = "unassigned" | "pending" | "active" | "completed";

const columns: { id: TaskStatus; label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }[] = [
  {
    id: "unassigned",
    label: "Unassigned",
    color: "text-slate-400",
    bgColor: "bg-slate-800/50",
    borderColor: "border-slate-700",
    icon: <Inbox className="w-4 h-4" />,
  },
  {
    id: "pending",
    label: "Pending",
    color: "text-amber-400",
    bgColor: "bg-amber-500/5",
    borderColor: "border-amber-500/20",
    icon: <Clock className="w-4 h-4" />,
  },
  {
    id: "active",
    label: "Active",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/5",
    borderColor: "border-indigo-500/20",
    icon: <AlertCircle className="w-4 h-4" />,
  },
  {
    id: "completed",
    label: "Completed",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/5",
    borderColor: "border-emerald-500/20",
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
];

const priorityColors: Record<string, string> = {
  High: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
  Medium: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  Low: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
};

interface TaskCardProps {
  task: Task;
  onMove: (id: string, status: TaskStatus) => void;
}

function TaskCard({ task }: TaskCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: DRAG_TYPE,
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(ref);

  return (
    <div
      ref={ref}
      className={`group bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-grab active:cursor-grabbing transition-all duration-200 hover:border-slate-600 hover:shadow-lg ${
        isDragging ? "opacity-40 scale-95" : "opacity-100"
      }`}
    >
      {/* Drag handle + Priority */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
          <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
        </div>
        <span className="text-xs text-slate-600 font-mono">{task.id}</span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-slate-200 mb-1 leading-snug">{task.title}</h4>
      <p className="text-xs text-slate-500 line-clamp-2 mb-3">{task.description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.assignee && task.assignee !== "unassigned" && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <User className="w-3 h-3" />
              {task.assignee}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-600">
          <Calendar className="w-3 h-3" />
          {task.dueDate}
        </div>
      </div>

      {/* Client */}
      {task.clientName && (
        <div className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-1 text-xs text-slate-500">
          <ChevronRight className="w-3 h-3" />
          {task.clientName}
        </div>
      )}
    </div>
  );
}

interface DropColumnProps {
  column: typeof columns[0];
  tasks: Task[];
  onMove: (id: string, status: TaskStatus) => void;
}

function DropColumn({ column, tasks, onMove }: DropColumnProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isOver, canDrop }, drop] = useDrop<
    { id: string; status: TaskStatus },
    void,
    { isOver: boolean; canDrop: boolean }
  >({
    accept: DRAG_TYPE,
    canDrop: (item) => {
      // Prevent dropping INTO unassigned column
      if (column.id === "unassigned") {
        return false;
      }
      return item.status !== column.id;
    },
    drop: (item) => {
      if (item.status !== column.id) {
        onMove(item.id, column.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  drop(ref);

  return (
    <div
      ref={ref}
      className={`flex flex-col rounded-2xl border transition-all duration-200 ${column.bgColor} ${column.borderColor} ${
        isOver && canDrop ? "border-indigo-500 shadow-lg shadow-indigo-500/10 scale-[1.01]" : ""
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
        <div className={`flex items-center gap-2 ${column.color}`}>
          {column.icon}
          <span className="text-sm font-semibold">{column.label}</span>
          <span className={`w-5 h-5 rounded-full bg-current/10 flex items-center justify-center text-xs font-bold ${column.color}`}>
            {tasks.length}
          </span>
        </div>
        {column.id === "unassigned" && (
          <button className="w-6 h-6 rounded-lg bg-slate-700 hover:bg-indigo-500 text-slate-400 hover:text-white flex items-center justify-center transition-all">
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Drop zone indicator */}
      {isOver && canDrop && (
        <div className="mx-3 mt-3 h-12 rounded-xl border-2 border-dashed border-indigo-500/50 bg-indigo-500/5 flex items-center justify-center">
          <span className="text-xs text-indigo-400">Drop here</span>
        </div>
      )}

      {/* Tasks */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-340px)] min-h-[200px]">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-slate-600 text-xs">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-2">
              {column.icon}
            </div>
            No tasks
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onMove={onMove} />
          ))
        )}
      </div>
    </div>
  );
}

export default function TasksKanban() {
  const [tasks, setTasks] = useState<Task[]>(tasksData.filter((t) => t.status !== "completed" || true));

  const moveTask = (id: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: newStatus,
              assignee: newStatus === "unassigned" ? "unassigned" : t.assignee,
              completedDate: newStatus === "completed" ? new Date().toISOString().split("T")[0] : t.completedDate,
            }
          : t
      )
    );
  };

  return (
    <div className="p-6 h-full">
      <div className="grid grid-cols-4 gap-4 h-full">
        {columns.map((col) => (
          <DropColumn
            key={col.id}
            column={col}
            tasks={tasks.filter((t) => t.status === col.id)}
            onMove={moveTask}
          />
        ))}
      </div>
    </div>
  );
}