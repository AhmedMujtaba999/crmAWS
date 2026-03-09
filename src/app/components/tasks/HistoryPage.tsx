import { useState } from "react";
import { tasksData, employeesData } from "../../data/mockData";
import { History, Calendar, Search, Download, CheckCircle2, User, Mail, MapPin, ArrowLeft, TrendingUp, Award } from "lucide-react";

export default function HistoryPage() {
  const [fromDate, setFromDate] = useState("2026-02-01");
  const [tillDate, setTillDate] = useState("2026-03-03");
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  const completedTasks = tasksData.filter((t) => t.status === "completed");

  const filtered = completedTasks.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.clientName?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (t.clientEmail?.toLowerCase().includes(search.toLowerCase()) ?? false);

    const completedDate = t.completedDate || t.dueDate;
    const matchDate =
      (!fromDate || completedDate >= fromDate) &&
      (!tillDate || completedDate <= tillDate);

    const matchEmployee = !selectedEmployee || t.assignee === selectedEmployee;

    return matchSearch && matchDate && matchEmployee;
  });

  // If an employee is selected, show their details
  if (selectedEmployee) {
    const employee = employeesData.find((e) => e.id === selectedEmployee);
    const employeeTasks = completedTasks.filter((t) => t.assignee === selectedEmployee);
    
    if (!employee) {
      setSelectedEmployee(null);
      return null;
    }

    return (
      <div className="p-6 h-full overflow-y-auto">
        {/* Back button */}
        <button
          onClick={() => setSelectedEmployee(null)}
          className="flex items-center gap-2 mb-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to All Employees</span>
        </button>

        {/* Employee Header */}
        <div className="bg-gradient-to-r from-indigo-900/40 to-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/30">
              {employee.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">{employee.name}</h2>
              <p className="text-slate-400 text-sm mt-1">{employee.empType} · {employee.email}</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1 text-slate-400 text-sm">
                  <User className="w-4 h-4" />
                  {employee.id}
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-sm">
                  <Mail className="w-4 h-4" />
                  {employee.phone}
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-slate-800/60 rounded-xl p-4 text-center">
                <div className="flex items-center gap-2 justify-center mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-2xl font-bold text-white">{employeeTasks.length}</span>
                </div>
                <p className="text-xs text-slate-500">Completed Tasks</p>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-4 text-center">
                <div className="flex items-center gap-2 justify-center mb-1">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <span className="text-2xl font-bold text-white">{employee.performance}%</span>
                </div>
                <p className="text-xs text-slate-500">Performance</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks for this employee */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white">Task History</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                {["Task Title", "Client", "Completed Date", "Client Email", "Address"].map((col) => (
                  <th
                    key={col}
                    className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {employeeTasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-800/40 transition-all">
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-200">{task.title}</p>
                        <p className="text-xs text-slate-500">{task.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-200">{task.clientName || "-"}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 text-sm text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {task.completedDate || task.dueDate}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 text-sm text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[160px]">{task.clientEmail || "-"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 text-sm text-slate-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[160px]">{task.clientAddress || "-"}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {employeeTasks.length === 0 && (
            <div className="py-16 text-center">
              <History className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No completed tasks for this employee</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show employee list
  return (
    <div className="p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
            <History className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Employee History</h2>
            <p className="text-slate-400 text-sm">Click on an employee to view their task history</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-sm transition-all">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {employeesData.map((employee) => {
          const employeeCompletedTasks = completedTasks.filter((t) => t.assignee === employee.id);
          return (
            <button
              key={employee.id}
              onClick={() => setSelectedEmployee(employee.id)}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
                  {employee.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                    {employee.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{employee.empType}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs text-slate-400">{employeeCompletedTasks.length} tasks</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-xs text-slate-400">{employee.performance}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Date range */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-500">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <span className="text-sm text-slate-500">→ Till</span>
            <input
              type="date"
              value={tillDate}
              onChange={(e) => setTillDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Search */}
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search history..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              {["Task Title", "Name", "Date", "Email", "Address"].map((col) => (
                <th
                  key={col}
                  className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
              <th className="px-5 py-3 w-20 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map((task) => (
              <tr key={task.id} className="hover:bg-slate-800/40 transition-all group">
                <td className="px-5 py-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-200">{task.title}</p>
                      <p className="text-xs text-slate-500">{task.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                      {(task.clientName || "?").charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm text-slate-200">{task.clientName || "-"}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <User className="w-3 h-3" />
                        {task.assignee}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 text-sm text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {task.completedDate || task.dueDate}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 text-sm text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[160px]">{task.clientEmail || "-"}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 text-sm text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[160px]">{task.clientAddress || "-"}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium">
                    Completed
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <History className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No completed tasks in selected date range</p>
          </div>
        )}
      </div>
    </div>
  );
}