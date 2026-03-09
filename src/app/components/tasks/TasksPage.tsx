import { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import TasksKanban from "./TasksKanban";
import AssignScheduling from "./AssignScheduling";
import HistoryPage from "./HistoryPage";
import { ListTodo, CalendarRange, History } from "lucide-react";

type SubTab = "tasks" | "assign" | "history";

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<SubTab>("tasks");

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full">
        {/* Page Header */}
        <div className="px-6 pt-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Tasks & Scheduling</h1>
              <p className="text-slate-400 text-sm mt-1">Manage tasks and employee schedules</p>
            </div>
          </div>

          {/* Sub Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
            {[
              { id: "tasks" as SubTab, label: "Tasks", icon: ListTodo },
              { id: "assign" as SubTab, label: "Assign & Scheduling", icon: CalendarRange },
              { id: "history" as SubTab, label: "History", icon: History },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "tasks" && <TasksKanban />}
          {activeTab === "assign" && <AssignScheduling />}
          {activeTab === "history" && <HistoryPage />}
        </div>
      </div>
    </DndProvider>
  );
}
