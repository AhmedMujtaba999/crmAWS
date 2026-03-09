import { useNavigate } from "react-router";
import { leadsData, tasksData, employeesData, financeData } from "../data/mockData";
import {
  Users,
  CalendarCheck,
  DollarSign,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Activity,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();

  const activeTasks = tasksData.filter((t) => t.status === "active").length;
  const pendingTasks = tasksData.filter((t) => t.status === "pending").length;
  const completedTasks = tasksData.filter((t) => t.status === "completed").length;
  const qualifiedLeads = leadsData.filter((l) => l.status === "Qualified" || l.status === "Negotiation").length;

  const quickStats = [
    {
      label: "Total Leads",
      value: leadsData.length,
      sub: `${qualifiedLeads} qualified`,
      icon: Users,
      color: "indigo",
      iconBg: "bg-indigo-500/20",
      iconText: "text-indigo-400",
      path: "/leads",
    },
    {
      label: "Active Tasks",
      value: activeTasks,
      sub: `${pendingTasks} pending`,
      icon: CalendarCheck,
      color: "amber",
      iconBg: "bg-amber-500/20",
      iconText: "text-amber-400",
      path: "/tasks",
    },
    {
      label: "Revenue (MTD)",
      value: `₹${(financeData.monthlyRevenue / 1000).toFixed(0)}K`,
      sub: "+8.2% vs last month",
      icon: DollarSign,
      color: "emerald",
      iconBg: "bg-emerald-500/20",
      iconText: "text-emerald-400",
      path: "/finance",
    },
    {
      label: "Employees",
      value: employeesData.length,
      sub: "All active",
      icon: Settings,
      color: "purple",
      iconBg: "bg-purple-500/20",
      iconText: "text-purple-400",
      path: "/manage",
    },
  ];

  const recentLeads = leadsData.slice(0, 4);
  const urgentTasks = tasksData.filter((t) => t.priority === "High" && t.status !== "completed").slice(0, 3);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Good morning, Admin!</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Here's what's happening with your operations today.
            </p>
          </div>
          <div className="ml-auto text-right hidden md:block">
            <p className="text-slate-400 text-sm">Tuesday</p>
            <p className="text-white font-semibold">March 3, 2026</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => (
          <button
            key={stat.label}
            onClick={() => navigate(stat.path)}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left hover:border-slate-600 transition-all group hover:shadow-lg"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.iconText}`} />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-all" />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-slate-400 mt-0.5">{stat.label}</p>
            <p className="text-xs text-slate-600 mt-1">{stat.sub}</p>
          </button>
        ))}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Revenue Trend</h3>
              <p className="text-xs text-slate-500">Last 6 months</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              +12.5%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={financeData.revenueByMonth}>
              <defs>
                <linearGradient id="dashRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `₹${v / 1000}K`} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", color: "#e2e8f0" }}
                formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#dashRevGrad)" strokeWidth={2} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Task Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Task Overview</h3>
          <div className="space-y-3">
            {[
              { label: "Active", count: activeTasks, iconBg: "bg-indigo-500/20", iconText: "text-indigo-400", icon: Activity },
              { label: "Pending", count: pendingTasks, iconBg: "bg-amber-500/20", iconText: "text-amber-400", icon: Clock },
              { label: "Completed", count: completedTasks, iconBg: "bg-emerald-500/20", iconText: "text-emerald-400", icon: CheckCircle2 },
              {
                label: "Unassigned",
                count: tasksData.filter((t) => t.status === "unassigned").length,
                iconBg: "bg-slate-700",
                iconText: "text-slate-400",
                icon: AlertCircle,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl"
              >
                <div className={`w-8 h-8 rounded-lg ${item.iconBg} flex items-center justify-center`}>
                  <item.icon className={`w-4 h-4 ${item.iconText}`} />
                </div>
                <span className="text-sm text-slate-400 flex-1">{item.label}</span>
                <span className="text-sm font-bold text-slate-200">{item.count}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/tasks")}
            className="mt-4 w-full py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-1"
          >
            View All Tasks <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Recent Leads */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Recent Leads</h3>
            <button
              onClick={() => navigate("/leads")}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-xl transition-all">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {lead.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{lead.name}</p>
                  <p className="text-xs text-slate-500">{lead.source}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-lg ${
                    lead.status === "Qualified"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : lead.status === "Negotiation"
                      ? "bg-orange-500/20 text-orange-400"
                      : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Urgent Tasks */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">High Priority Tasks</h3>
            <button
              onClick={() => navigate("/tasks")}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {urgentTasks.map((task) => (
              <div key={task.id} className="p-3 bg-slate-800/50 rounded-xl border border-rose-500/10">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-200 flex-1">{task.title}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-lg flex-shrink-0 ${
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
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-slate-500">{task.clientName}</span>
                  <span className="text-slate-700">•</span>
                  <span className="text-xs text-rose-400/80">Due: {task.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}