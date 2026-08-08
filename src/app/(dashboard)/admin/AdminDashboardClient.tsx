'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Search, Sparkles, Download, RefreshCw, Filter, Calendar,
  MoreHorizontal, ChevronDown, Check, ArrowDownRight, ArrowUpRight,
  GripVertical, Users, Shield, Bot, AlertTriangle, CheckCircle2,
  FileText, Activity, RadioReceiver, X, ExternalLink
} from 'lucide-react';
import { formatDate, formatRelative } from '@/lib/utils';
import { AdminSettings } from '@/components/AdminSettings';

interface AdminDashboardClientProps {
  initialPatientsCount: number;
  initialStaffCount: number;
  initialTodayApptsCount: number;
  initialPendingInvoicesCount: number;
  recentLogs: any[];
  recentUsers: any[];
  upcomingAppointments: any[];
  webhookUrl: string;
}

// Chart weekly data matching the curve in screenshot
const WEEKLY_PATIENTS_DATA = [
  { day: 'Monday', count: 320 },
  { day: 'Tuesday', count: 540 },
  { day: 'Wednesday', count: 280 },
  { day: 'Thursday', count: 610 },
  { day: 'Friday', count: 390 },
  { day: 'Saturday', count: 520 },
  { day: 'Sunday', count: 480 },
];

const MONTHLY_PATIENTS_DATA = [
  { day: 'Week 1', count: 1240 },
  { day: 'Week 2', count: 1850 },
  { day: 'Week 3', count: 1420 },
  { day: 'Week 4', count: 2100 },
];

// Fallback appointment rows matching the design screenshot
const DEFAULT_APPOINTMENTS = [
  {
    id: '#78624E',
    date: '01 Apr 2026',
    time: '10:00 PM',
    patientName: 'William Turner',
    email: 'william@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    disease: 'Hypertension',
    age: 43,
    status: 'Waiting',
  },
  {
    id: '#247824',
    date: '01 Apr 2026',
    time: '09:30 PM',
    patientName: 'Rocky R.',
    email: 'rocky@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    disease: 'Type 2 Diabetes',
    age: 58,
    status: 'Appointed',
  },
  {
    id: '#242824',
    date: '01 Apr 2026',
    time: '09:25 PM',
    patientName: 'Mohammed H.',
    email: 'mohammad@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    disease: 'Asthma',
    age: 35,
    status: 'Cancelled',
  },
  {
    id: '#357935',
    date: '01 Apr 2026',
    time: '09:15 PM',
    patientName: 'Rocky C.',
    email: 'rockyc@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80',
    disease: 'GERD',
    age: 26,
    status: 'Waiting',
  },
  {
    id: '#248924',
    date: '01 Apr 2026',
    time: '09:00 PM',
    patientName: 'James C.',
    email: 'james@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
    disease: 'High Cholesterol',
    age: 17,
    status: 'Appointed',
  },
];

export function AdminDashboardClient({
  initialPatientsCount,
  initialStaffCount,
  initialTodayApptsCount,
  initialPendingInvoicesCount,
  recentLogs,
  recentUsers,
  upcomingAppointments,
  webhookUrl,
}: AdminDashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'Weekly' | 'Monthly'>('Weekly');
  const [genderTimeFilter, setGenderTimeFilter] = useState<'Monthly' | 'Weekly'>('Monthly');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [exportToast, setExportToast] = useState(false);

  // Merge real database appointments with fallbacks to ensure rich view
  const appointmentRows = useMemo(() => {
    if (!upcomingAppointments || upcomingAppointments.length === 0) {
      return DEFAULT_APPOINTMENTS;
    }
    const mapped = upcomingAppointments.map((appt, idx) => {
      const patient = appt.patient || {};
      const name = patient.first_name ? `${patient.first_name} ${patient.last_name}` : appt.patient_name || 'Patient';
      const age = patient.date_of_birth
        ? Math.floor((new Date().getTime() - new Date(patient.date_of_birth).getTime()) / 31557600000)
        : [43, 58, 35, 26, 17][idx % 5];

      let statusLabel = 'Waiting';
      if (appt.status === 'confirmed' || appt.status === 'completed') statusLabel = 'Appointed';
      if (appt.status === 'cancelled') statusLabel = 'Cancelled';

      return {
        id: appt.id ? `#${appt.id.slice(0, 6).toUpperCase()}` : `#${786240 + idx}`,
        date: formatDate(appt.scheduled_at, 'dd MMM yyyy'),
        time: formatDate(appt.scheduled_at, 'hh:mm a'),
        patientName: name,
        email: patient.email || `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        avatar: patient.avatar_url || [
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
        ][idx % 3],
        disease: appt.chief_complaint || ['Hypertension', 'Type 2 Diabetes', 'Asthma', 'GERD', 'Checkup'][idx % 5],
        age,
        status: statusLabel,
      };
    });

    return mapped.length < 5 ? [...mapped, ...DEFAULT_APPOINTMENTS.slice(mapped.length)] : mapped;
  }, [upcomingAppointments]);

  // Filtered rows based on top search bar
  const filteredAppointments = useMemo(() => {
    if (!searchQuery.trim()) return appointmentRows;
    const q = searchQuery.toLowerCase();
    return appointmentRows.filter(
      (row) =>
        row.patientName.toLowerCase().includes(q) ||
        row.disease.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q)
    );
  }, [appointmentRows, searchQuery]);

  const toggleSelectAll = () => {
    if (selectedRows.length === filteredAppointments.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredAppointments.map((r) => r.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    setExportToast(true);
    setTimeout(() => setExportToast(false), 3000);
  };

  const handleAskAi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResponse(null);
    setTimeout(() => {
      setAiResponse(
        `Based on recent patient metrics: Patient inflow increased by +2.1% this week with 479 total visits. Adult demographic represents 35% of volume while pediatric checkups grew by +0.8%. Clinic bed occupancy is optimal at 320 beds.`
      );
      setAiLoading(false);
    }, 800);
  };

  // Sparkline bar generator helper for top metric cards
  const renderSparklineBars = (pattern: number[]) => (
    <div className="flex items-end gap-1 h-7 shrink-0">
      {pattern.map((h, i) => (
        <span
          key={i}
          className="w-1 bg-[#22D3EE] rounded-t-sm transition-all"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in font-sans text-slate-800">
      
      {/* ── TOP HEADER SEARCH BAR & ACTIONS ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border border-slate-200 p-3 sm:px-4 sm:py-3 rounded-2xl shadow-sm">
        {/* Search Bar + Ask AI Button */}
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search patients, doctors, records…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0891B2]/30 focus:border-[#0891B2] transition-all"
            />
            <span className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">
              /
            </span>
          </div>

          <button
            type="button"
            onClick={() => setAiModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0891B2]" />
            <span>Ask AI</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh View"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* ── TOP KPI METRIC CARDS (4 COLUMNS) ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Visitors */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-500">Total Visitors</p>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">5,568</p>
              <div className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                <ArrowDownRight className="w-3 h-3" />
                <span>-18%</span>
              </div>
            </div>
            {renderSparklineBars([30, 45, 25, 60, 40, 75, 90, 50, 65, 80, 45, 60])}
          </div>
        </div>

        {/* Card 2: Total Patients */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-500">Total Patients</p>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">
                {initialPatientsCount || 540}
              </p>
              <div className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="w-3 h-3" />
                <span>10+ %</span>
              </div>
            </div>
            {renderSparklineBars([40, 30, 55, 70, 45, 80, 60, 90, 50, 70, 85, 100])}
          </div>
        </div>

        {/* Card 3: Total Doctor's */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-500">Total Doctor's</p>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">
                {initialStaffCount || 260}
              </p>
              <div className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="w-3 h-3" />
                <span>+9%</span>
              </div>
            </div>
            {renderSparklineBars([50, 60, 40, 75, 55, 70, 65, 80, 95, 60, 70, 85])}
          </div>
        </div>

        {/* Card 4: Total Beds */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-500">Total Beds</p>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">320</p>
              <div className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                <ArrowDownRight className="w-3 h-3" />
                <span>+9%</span>
              </div>
            </div>
            {renderSparklineBars([60, 45, 70, 50, 85, 60, 90, 75, 40, 65, 80, 55])}
          </div>
        </div>
      </div>

      {/* ── MIDDLE ROW: PATIENT OVERVIEW CHART + GENDER DEMOGRAPHICS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Patient Overview Area Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
              <h2 className="font-bold text-base text-slate-900">Patient Overview</h2>
              <div className="inline-flex items-center gap-1.5 ml-2">
                <span className="text-sm font-bold text-slate-900">479</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold">
                  +2.1%
                </span>
                <span className="text-[11px] text-slate-400">vs last week</span>
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setTimeFilter(timeFilter === 'Weekly' ? 'Monthly' : 'Weekly')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <span>{timeFilter}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Recharts Monotone Area Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={timeFilter === 'Weekly' ? WEEKLY_PATIENTS_DATA : MONTHLY_PATIENTS_DATA}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="patientOverviewGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0891B2" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0891B2" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }}
                  domain={[0, 800]}
                  ticks={[0, 100, 400, 600, 800]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xl border border-slate-800">
                          <p className="text-slate-300">{payload[0].payload.day}</p>
                          <p className="text-cyan-400 font-bold text-sm mt-0.5">
                            {payload[0].value} Patients
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#0891B2"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#patientOverviewGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Patients Gender / Demographics Card (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
              <h2 className="font-bold text-base text-slate-900">Patients Gender</h2>
              <div className="inline-flex items-center gap-1.5 ml-2">
                <span className="text-sm font-bold text-slate-900">1,200</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold">
                  -1.4%
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setGenderTimeFilter(genderTimeFilter === 'Monthly' ? 'Weekly' : 'Monthly')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <span>{genderTimeFilter}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* 3 Demographic Columns with Vertical Dashed Dividers */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            {/* Column 1: Old */}
            <div className="space-y-3 text-left border-r border-dashed border-slate-200 pr-3">
              <p className="text-xs font-medium text-slate-400">Old</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">55%</p>
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                  -3.2% <ArrowDownRight className="w-3 h-3" />
                </p>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[55%]" />
                </div>
              </div>
            </div>

            {/* Column 2: Adult */}
            <div className="space-y-3 text-left border-r border-dashed border-slate-200 pr-3 pl-1">
              <p className="text-xs font-medium text-slate-400">Adult</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">35%</p>
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                  -6.4% <ArrowDownRight className="w-3 h-3" />
                </p>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 w-[35%]" />
                </div>
              </div>
            </div>

            {/* Column 3: Child */}
            <div className="space-y-3 text-left pl-1">
              <p className="text-xs font-medium text-slate-400">Child</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">10%</p>
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  +0.8% <ArrowUpRight className="w-3 h-3" />
                </p>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-[10%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM SECTION: UPCOMING APPOINTMENTS TABLE ─────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
        
        {/* Table Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
            <h2 className="font-bold text-lg text-slate-900">Upcoming Appointments</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
              {filteredAppointments.length} total
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all"
            >
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Filter</span>
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>01 Apr, 2026</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === filteredAppointments.length && filteredAppointments.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-[#0891B2] focus:ring-[#0891B2] w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="pb-3 pr-4">ID</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Patient Name</th>
                <th className="pb-3 pr-4">Disease</th>
                <th className="pb-3 pr-4">Patient Age</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.map((row) => {
                const isSelected = selectedRows.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-cyan-50/40' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(row.id)}
                        className="rounded border-slate-300 text-[#0891B2] focus:ring-[#0891B2] w-4 h-4 cursor-pointer"
                      />
                    </td>

                    {/* ID */}
                    <td className="py-4 pr-4 font-bold text-[#0891B2] font-mono">
                      {row.id}
                    </td>

                    {/* Date & Time */}
                    <td className="py-4 pr-4">
                      <p className="font-bold text-slate-800">{row.date}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{row.time}</p>
                    </td>

                    {/* Patient Name + Avatar + Email */}
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={row.avatar}
                          alt={row.patientName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{row.patientName}</p>
                          <p className="text-[11px] text-slate-400">{row.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Disease */}
                    <td className="py-4 pr-4 font-semibold text-slate-700">
                      {row.disease}
                    </td>

                    {/* Age */}
                    <td className="py-4 pr-4 font-bold text-slate-800">
                      {row.age}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 pr-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold border ${
                          row.status === 'Appointed'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : row.status === 'Waiting'
                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                            : 'bg-rose-50 text-rose-600 border-rose-200'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>

                    {/* Action Menu */}
                    <td className="py-4 text-right">
                      <button
                        type="button"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── LOWER SECTION: AUDIT LOGS + RECENT USERS + SYSTEM SETTINGS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Audit Log */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" /> Recent Audit Events
            </h3>
            <Link
              href="/admin/audit-logs"
              className="text-xs font-bold text-[#0891B2] hover:underline flex items-center gap-1"
            >
              View all <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            {recentLogs?.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                <div className="mt-0.5">
                  {['delete', 'export'].includes(log.action) ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800">
                    <span className="font-bold">
                      {log.actor?.first_name} {log.actor?.last_name}
                    </span>{' '}
                    <span className="text-slate-500">{log.action}d on {log.table_name}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{formatRelative(log.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Registered Users */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0891B2]" /> Registered Users
            </h3>
            <Link
              href="/admin/users"
              className="text-xs font-bold text-[#0891B2] hover:underline flex items-center gap-1"
            >
              User Management <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            {recentUsers?.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-slate-100 last:border-0">
                <div>
                  <p className="font-bold text-slate-900">{u.first_name} {u.last_name}</p>
                  <p className="text-[10px] text-slate-400">{u.email || '—'}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 text-[#0891B2] border border-cyan-200 font-bold uppercase text-[10px]">
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Automation Webhook Settings */}
      <div className="pt-2">
        <AdminSettings initialWebhookUrl={webhookUrl} />
      </div>

      {/* ── ASK AI INSIGHT MODAL ───────────────────────────────────────── */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#0891B2]/10 border border-[#0891B2]/20 text-[#0891B2] flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">MediSynx Admin AI Assistant</h3>
                  <p className="text-xs text-slate-500">Ask operational queries & clinical analytics</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAskAi} className="space-y-4">
              <textarea
                rows={3}
                placeholder="Ask about patient volume, bed capacity, doctor workload, or revenue metrics…"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#0891B2]/30 outline-none"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAiModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={aiLoading || !aiQuery.trim()}
                  className="px-5 py-2 rounded-xl bg-[#0891B2] text-white text-xs font-bold hover:bg-[#0F766E] shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {aiLoading ? 'Analyzing Data…' : 'Generate Insight'}
                </button>
              </div>
            </form>

            {aiResponse && (
              <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-200 text-xs text-slate-800 space-y-1">
                <p className="font-bold text-[#0891B2] flex items-center gap-1.5">
                  <Bot className="w-4 h-4" /> Operational AI Summary
                </p>
                <p className="leading-relaxed text-slate-700 mt-1">{aiResponse}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export Toast Notification */}
      {exportToast && (
        <div className="fixed bottom-5 right-5 z-50 animate-slide-up">
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs border border-slate-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold">Export Initialized</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Downloading CureDesk administrative report (CSV format)…
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
