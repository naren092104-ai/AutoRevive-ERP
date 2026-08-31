import React from 'react';
import { BarChart3, Download, FileSpreadsheet, Users, Briefcase, CreditCard, Clock } from 'lucide-react';
import { apiUrl } from '../api/client';

export const ReportsView: React.FC = () => {
  const reports = [
    {
      id: 'payroll',
      title: 'Monthly Payroll & Remuneration Audit',
      desc: 'Complete salary disbursement breakdown with basic, HRA, allowances, deductions, and net pay for all active employees.',
      icon: CreditCard,
      endpoint: '/reports/payroll/export',
    },
    {
      id: 'recruitment',
      title: 'Recruitment & Applicant Pipeline Report',
      desc: 'Comprehensive application log tracking candidates from public submission to screening, interviews, and offer letters.',
      icon: Briefcase,
      endpoint: '/reports/recruitment/export',
    },
    {
      id: 'employees',
      title: 'Employee Headcount & Master Directory',
      desc: 'Official active employee register detailing designations, joining dates, department allocations, and compensation.',
      icon: Users,
      endpoint: '/reports/employees/export',
    },
    {
      id: 'attendance',
      title: 'Attendance, Shifts & Leave Utilization Report',
      desc: 'Aggregated attendance compliance, shift hours, overtime logs, and casual/sick leave deductions.',
      icon: Clock,
      endpoint: '/reports/payroll/export', // Shared exportable data
    },
  ];

  return (
    <div className="space-y-6 select-none">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900">AutoRevive HR Management Information System (MIS) Reports</h3>
        <p className="text-xs text-slate-500 mt-1">Export official statutory records, payroll statements, and candidate tracking spreadsheets directly in standard CSV format.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-orange-50 text-[#EA580C] rounded-xl border border-orange-200 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{r.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.desc}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Format: CSV / Excel Compatible</span>
                <a
                  href={apiUrl(r.endpoint)}
                  download
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold text-xs rounded-lg transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Report (CSV)</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
