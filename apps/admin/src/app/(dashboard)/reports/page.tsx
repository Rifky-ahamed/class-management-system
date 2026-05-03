"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { 
  Users, 
  GraduationCap, 
  TrendingUp, 
  Wrench,
  DollarSign
} from "lucide-react";

// Mock Data for Charts (Because real historical revenue data is sparse in dev environments)
const revenueData = [
  { month: "Jan", revenue: 4000, expenses: 2400 },
  { month: "Feb", revenue: 3000, expenses: 1398 },
  { month: "Mar", revenue: 2000, expenses: 9800 },
  { month: "Apr", revenue: 2780, expenses: 3908 },
  { month: "May", revenue: 1890, expenses: 4800 },
  { month: "Jun", revenue: 2390, expenses: 3800 },
  { month: "Jul", revenue: 3490, expenses: 4300 },
  { month: "Aug", revenue: 5490, expenses: 2300 },
  { month: "Sep", revenue: 6490, expenses: 3300 },
  { month: "Oct", revenue: 7490, expenses: 4300 },
  { month: "Nov", revenue: 8490, expenses: 5300 },
  { month: "Dec", revenue: 10490, expenses: 6300 },
];

const studentDistribution = [
  { name: "Science Batch", value: 400 },
  { name: "Arts Batch", value: 300 },
  { name: "Commerce Batch", value: 300 },
  { name: "IT Batch", value: 200 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function AdminReportsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    requests: 0,
    revenue: 124500 // Mock total
  });

  useEffect(() => {
    async function loadStats() {
      const [
        { count: studentCount },
        { count: teacherCount },
        { count: requestCount }
      ] = await Promise.all([
        supabase.from("student").select("*", { count: 'exact', head: true }),
        supabase.from("teachers").select("*", { count: 'exact', head: true }),
        supabase.from("requests").select("*", { count: 'exact', head: true }).eq("status", "pending")
      ]);

      setStats({
        students: studentCount || 0,
        teachers: teacherCount || 0,
        requests: requestCount || 0,
        revenue: 124500
      });
      setLoading(false);
    }
    loadStats();
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-neutral-900">Analytics & Reports</h1>
        <p className="text-sm text-neutral-500">Comprehensive overview of institute performance and demographics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-none shadow-sm bg-white hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-edu-50 rounded-full translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-600 text-sm">Total Revenue (YTD)</h3>
              <div className="w-10 h-10 rounded-full bg-edu-100 flex items-center justify-center text-edu-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            {loading ? <Skeleton className="h-8 w-24" /> : (
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-neutral-900">${stats.revenue.toLocaleString()}</p>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +14%
                </span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-600 text-sm">Active Students</h3>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
            {loading ? <Skeleton className="h-8 w-16" /> : (
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-neutral-900">{stats.students}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-600 text-sm">Active Teachers</h3>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
            {loading ? <Skeleton className="h-8 w-16" /> : (
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-neutral-900">{stats.teachers}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 border-none shadow-sm bg-white hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-600 text-sm">Pending Requests</h3>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <Wrench className="w-5 h-5" />
              </div>
            </div>
            {loading ? <Skeleton className="h-8 w-16" /> : (
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-neutral-900">{stats.requests}</p>
                {stats.requests > 0 && (
                  <span className="text-xs font-bold text-orange-600">Requires Action</span>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Bar Chart (Spans 2 columns on large screens) */}
        <Card className="p-6 border-none shadow-sm bg-white lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-neutral-900">Financial Overview</h2>
            <p className="text-sm text-neutral-500">Monthly breakdown of revenue vs expenses.</p>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="revenue" name="Revenue" fill="#0369a1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Demographics Pie Chart */}
        <Card className="p-6 border-none shadow-sm bg-white">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-neutral-900">Batch Demographics</h2>
            <p className="text-sm text-neutral-500">Student distribution across major batches.</p>
          </div>
          <div className="h-[350px] w-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={studentDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {studentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend 
                  iconType="circle" 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ fontSize: '12px', color: '#4B5563' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Secondary Line Chart (Growth Trend) */}
        <Card className="p-6 border-none shadow-sm bg-white lg:col-span-3">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-neutral-900">Enrollment Growth Trend</h2>
            <p className="text-sm text-neutral-500">Year-over-year comparison of new student registrations.</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Current Year" 
                  stroke="#0284c7" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  name="Previous Year" 
                  stroke="#94a3b8" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>
    </div>
  );
}
