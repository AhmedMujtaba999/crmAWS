import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { financeData } from "../../data/mockData";
import {
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
} from "lucide-react";

const COLORS = ["#6366f1", "#f59e0b", "#10b981"];

const formatCurrency = (val: number) =>
  `₹${(val / 100000).toFixed(1)}L`;

export default function FinancePage() {
  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Finance Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Financial overview and performance metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: `₹${(financeData.totalRevenue / 100000).toFixed(1)}L`,
            change: "+12.5%",
            positive: true,
            icon: DollarSign,
            color: "indigo",
          },
          {
            label: "Monthly Revenue",
            value: `₹${(financeData.monthlyRevenue / 1000).toFixed(0)}K`,
            change: "+8.2%",
            positive: true,
            icon: TrendingUp,
            color: "emerald",
          },
          {
            label: "Pending Payments",
            value: `₹${(financeData.pendingPayments / 1000).toFixed(0)}K`,
            change: "-3.1%",
            positive: false,
            icon: Clock,
            color: "amber",
          },
          {
            label: "Completed Deals",
            value: financeData.completedDeals,
            change: "+5 this month",
            positive: true,
            icon: CheckCircle2,
            color: "purple",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
              </div>
              <div
                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                  stat.positive
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-rose-500/10 text-rose-400"
                }`}
              >
                {stat.positive ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {stat.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white">Revenue vs Expenses</h3>
              <p className="text-xs text-slate-500 mt-0.5">Last 6 months</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              <span className="text-xs text-slate-500">Revenue</span>
              <div className="w-2 h-2 rounded-full bg-rose-500 ml-2"></div>
              <span className="text-xs text-slate-500">Expenses</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={financeData.revenueByMonth}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `₹${v / 1000}K`} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", color: "#e2e8f0" }}
                formatter={(v: number) => [`₹${v.toLocaleString()}`, ""]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revGrad)" strokeWidth={2} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="expenses" stroke="#f43f5e" fill="url(#expGrad)" strokeWidth={2} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Deal Status Pie */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Deal Breakdown</h3>
          <p className="text-xs text-slate-500 mb-4">By status</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={financeData.dealsByStatus}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="count"
              >
                {financeData.dealsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", color: "#e2e8f0" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {financeData.dealsByStatus.map((d, i) => (
              <div key={d.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-xs text-slate-400">{d.status}</span>
                </div>
                <span className="text-xs font-semibold text-slate-300">{d.count} deals</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-white">Monthly Revenue Breakdown</h3>
            <p className="text-xs text-slate-500 mt-0.5">Revenue vs expenses comparison</p>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-500" />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={financeData.revenueByMonth} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `₹${v / 1000}K`} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", color: "#e2e8f0" }}
              formatter={(v: number) => [`₹${v.toLocaleString()}`, ""]}
            />
            <Legend wrapperStyle={{ color: "#64748b", fontSize: "12px" }} />
            <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} name="Revenue" />
            <Bar dataKey="expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white">Deal Summary</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              {["Status", "# Deals", "Total Value", "Avg Value"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {financeData.dealsByStatus.map((d, i) => (
              <tr key={d.status} className="hover:bg-slate-800/40 transition-all">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-sm text-slate-200">{d.status}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-slate-400">{d.count}</td>
                <td className="px-5 py-3 text-sm font-semibold text-slate-200">₹{d.value.toLocaleString()}</td>
                <td className="px-5 py-3 text-sm text-slate-400">
                  ₹{Math.round(d.value / d.count).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}