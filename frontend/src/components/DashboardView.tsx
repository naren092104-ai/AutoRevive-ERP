import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  Briefcase, 
  FileText, 
  CheckCircle2, 
  Calendar, 
  Send, 
  Award, 
  GraduationCap, 
  Clock, 
  Percent, 
  CreditCard, 
  Receipt,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { apiUrl } from '../api/client';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  newJoiners: number;
  openVacancies: number;
  applications: number;
  shortlisted: number;
  interviews: number;
  offersSent: number;
  offersAccepted: number;
  interns: number;
  onLeaveToday: number;
  attendanceRate: number;
  payrollPending: number;
  payslipsGenerated: number;
}

interface Props {
  onNavigate: (page: string) => void;
}

export const DashboardView: React.FC<Props> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 256,
    activeEmployees: 248,
    newJoiners: 12,
    openVacancies: 8,
    applications: 142,
    shortlisted: 36,
    interviews: 18,
    offersSent: 15,
    offersAccepted: 9,
    interns: 24,
    onLeaveToday: 11,
    attendanceRate: 87,
    payrollPending: 5,
    payslipsGenerated: 236,
  });

  const [activities, setActivities] = useState<Array<{ id: number; text: string; time: string; type: string }>>([
    { id: 1, text: 'New application submitted by Priya S', time: '10:00 AM', type: 'application' },
    { id: 2, text: 'Rohan M shortlisted for DevOps Engineer', time: '09:45 AM', type: 'shortlist' },
    { id: 3, text: 'Interview completed: Anitha R', time: 'Yesterday', type: 'interview' },
    { id: 4, text: 'Offer sent to Karthik N', time: 'Yesterday', type: 'offer' },
    { id: 5, text: 'Offer accepted by Karthik N', time: 'Yesterday', type: 'accepted' },
    { id: 6, text: 'Employee created: Karthik N (AR-EMP-2026-0005)', time: 'Yesterday', type: 'employee' },
    { id: 7, text: 'Payslip generated for July 2026', time: '2 days ago', type: 'payslip' },
  ]);

  useEffect(() => {
    fetch(apiUrl('/dashboard/stats'))
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          if (d.stats) setStats(d.stats);
          if (d.recentActivities && d.recentActivities.length > 0) setActivities(d.recentActivities);
        }
      })
      .catch((e) => console.warn('Could not load dashboard stats:', e));
  }, []);

  const cards = [
    { label: 'Total Employees', val: stats.totalEmployees, sub: '', icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { label: 'Active Employees', val: stats.activeEmployees, sub: '', icon: UserCheck, color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { label: 'New Joiners', val: stats.newJoiners, sub: 'This Month', icon: UserPlus, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { label: 'Open Vacancies', val: stats.openVacancies, sub: '', icon: Briefcase, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { label: 'Applications', val: stats.applications, sub: '', icon: FileText, color: 'text-sky-600 bg-sky-50 border-sky-200' },
    { label: 'Shortlisted', val: stats.shortlisted, sub: '', icon: CheckCircle2, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { label: 'Interviews', val: stats.interviews, sub: 'Scheduled', icon: Calendar, color: 'text-orange-500 bg-orange-50 border-orange-200' },
    { label: 'Offers Sent', val: stats.offersSent, sub: '', icon: Send, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { label: 'Offers Accepted', val: stats.offersAccepted, sub: '', icon: Award, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { label: 'Interns', val: stats.interns, sub: '', icon: GraduationCap, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { label: 'On Leave Today', val: stats.onLeaveToday, sub: '', icon: Clock, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { label: "Today's Attendance", val: `${stats.attendanceRate}%`, sub: '', icon: Percent, color: 'text-teal-600 bg-teal-50 border-teal-200' },
    { label: 'Payroll Pending', val: stats.payrollPending, sub: '', icon: CreditCard, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { label: 'Payslips Generated', val: stats.payslipsGenerated, sub: 'This Month', icon: Receipt, color: 'text-[#EA580C] bg-orange-50 border-orange-200' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. 14 Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition-shadow flex items-center gap-3"
            >
              <div className={`p-2.5 rounded-lg shrink-0 border ${c.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500 truncate">{c.label}</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-base font-bold text-slate-900 font-mono">{c.val}</span>
                  {c.sub && <span className="text-[9.5px] text-slate-400 font-medium">{c.sub}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Pending Employee Portal Approvals & Actions Hub */}
      <div className="bg-gradient-to-r from-orange-50/80 to-amber-50/60 border border-orange-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#EA580C] text-white rounded-lg shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Pending Employee Portal Approvals &amp; Self-Service Actions
              </h3>
              <p className="text-[11px] text-slate-500">
                Live employee requests submitted via the AutoRevive Self-Service Portal requiring HR action.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-white border border-orange-200 text-[#EA580C] text-[10px] font-bold rounded-full uppercase tracking-wider shadow-2xs">
            Live Synchronized
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {/* Action 1: Leave Requests */}
          <div 
            onClick={() => onNavigate('leaves')}
            className="bg-white p-3.5 rounded-xl border border-orange-100/90 shadow-2xs hover:border-[#EA580C] transition-all cursor-pointer space-y-1.5"
          >
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-700">Leave Approvals</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-[#EA580C]">
                {stats.onLeaveToday || 0} Pending
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Approve Casual, Sick &amp; Earned Leaves</p>
            <span className="text-[10px] font-bold text-[#EA580C] flex items-center gap-1 pt-0.5">
              Review Leaves →
            </span>
          </div>

          {/* Action 2: Attendance Corrections */}
          <div 
            onClick={() => onNavigate('attendance')}
            className="bg-white p-3.5 rounded-xl border border-orange-100/90 shadow-2xs hover:border-[#EA580C] transition-all cursor-pointer space-y-1.5"
          >
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-700">Attendance Corrections</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                Missed Punches
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Review &amp; approve punch adjustment requests</p>
            <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1 pt-0.5">
              Open Corrections Sheet →
            </span>
          </div>

          {/* Action 3: Profile Updates */}
          <div 
            onClick={() => onNavigate('employees')}
            className="bg-white p-3.5 rounded-xl border border-orange-100/90 shadow-2xs hover:border-[#EA580C] transition-all cursor-pointer space-y-1.5"
          >
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-700">Profile Updates</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                KYC &amp; Contact
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Verify address, mobile &amp; emergency info</p>
            <span className="text-[10px] font-bold text-purple-600 flex items-center gap-1 pt-0.5">
              Verify Requests →
            </span>
          </div>

          {/* Action 4: Tasks Assignment */}
          <div 
            onClick={() => onNavigate('performance')}
            className="bg-white p-3.5 rounded-xl border border-orange-100/90 shadow-2xs hover:border-[#EA580C] transition-all cursor-pointer space-y-1.5"
          >
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-700">Assign Tasks &amp; Sprints</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                Sprint 2026.Q3
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Assign deliverables &amp; track live progress</p>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 pt-0.5">
              Manage Tasks →
            </span>
          </div>
        </div>
      </div>

      {/* 3. Bottom 3-Card Row: Funnel + Headcount + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Recruitment Funnel */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recruitment Funnel</h3>
              <button 
                onClick={() => onNavigate('recruitment')} 
                className="text-[11px] font-bold text-[#EA580C] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Inverted Funnel Graphic */}
            <div className="space-y-2 pt-2">
              <div className="bg-[#EA580C] text-white py-2 px-4 rounded-lg flex justify-between items-center text-xs font-bold shadow-2xs mx-0">
                <span>Applications</span>
                <span className="font-mono">{stats.applications}</span>
              </div>
              <div className="bg-[#f97316] text-white py-2 px-4 rounded-lg flex justify-between items-center text-xs font-bold shadow-2xs mx-3">
                <span>Shortlisted</span>
                <span className="font-mono">{stats.shortlisted}</span>
              </div>
              <div className="bg-[#fb923c] text-white py-2 px-4 rounded-lg flex justify-between items-center text-xs font-bold shadow-2xs mx-6">
                <span>Interviews</span>
                <span className="font-mono">{stats.interviews}</span>
              </div>
              <div className="bg-[#10b981] text-white py-2 px-4 rounded-lg flex justify-between items-center text-xs font-bold shadow-2xs mx-9">
                <span>Offers Sent</span>
                <span className="font-mono">{stats.offersSent}</span>
              </div>
              <div className="bg-[#059669] text-white py-2 px-4 rounded-lg flex justify-between items-center text-xs font-bold shadow-2xs mx-12">
                <span>Offers Accepted</span>
                <span className="font-mono">{stats.offersAccepted}</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 text-center">AutoRevive End-to-End Talent Acquisition Pipeline</p>
        </div>

        {/* Card 2: Employee Headcount */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Employee Headcount</h3>
              <div className="flex items-center gap-1 text-emerald-600 text-[11px] font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+8.5% This Month</span>
              </div>
            </div>

            <div className="py-2">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Workforce</p>
              <p className="text-2xl font-bold text-slate-900 font-mono mt-0.5">{stats.totalEmployees}</p>
            </div>

            {/* Visual SVG Line Chart */}
            <div className="pt-2">
              <svg viewBox="0 0 300 120" className="w-full h-28 overflow-visible">
                <defs>
                  <linearGradient id="headcountGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 10 100 Q 50 90, 80 82 T 150 65 T 220 50 T 290 35 L 290 110 L 10 110 Z"
                  fill="url(#headcountGrad)"
                />
                <path
                  d="M 10 100 Q 50 90, 80 82 T 150 65 T 220 50 T 290 35"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="290" cy="35" r="4" fill="#2563eb" stroke="#fff" strokeWidth="2" />
                <text x="10" y="118" fontSize="8" fill="#94a3b8">Feb</text>
                <text x="70" y="118" fontSize="8" fill="#94a3b8">Mar</text>
                <text x="130" y="118" fontSize="8" fill="#94a3b8">Apr</text>
                <text x="190" y="118" fontSize="8" fill="#94a3b8">May</text>
                <text x="240" y="118" fontSize="8" fill="#94a3b8">Jun</text>
                <text x="280" y="118" fontSize="8" fill="#2563eb" fontWeight="bold">Jul</text>
              </svg>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>Active: <strong className="text-slate-800">{stats.activeEmployees}</strong></span>
            <span>Interns: <strong className="text-slate-800">{stats.interns}</strong></span>
            <span>Retained: <strong className="text-emerald-600">98.2%</strong></span>
          </div>
        </div>

        {/* Card 3: Recent Activity */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Activity</h3>
              <span className="text-[10.5px] text-slate-400 font-medium">Real-Time Audit</span>
            </div>

            <div className="space-y-2.5">
              {activities.slice(0, 7).map((act) => (
                <div key={act.id} className="flex items-start justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C] shrink-0 mt-1" />
                    <span className="text-slate-700 text-[11.5px] truncate">{act.text}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">{act.time}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('reports')}
            className="text-[11px] text-[#EA580C] font-bold hover:underline mt-4 text-center block w-full pt-2 border-t border-slate-100 cursor-pointer"
          >
            View Full System Audit Trail →
          </button>
        </div>
      </div>
    </div>
  );
};
