import React from 'react';
import { SidebarPage } from './Sidebar';
import { 
  Users, 
  UserPlus, 
  Clock, 
  CreditCard, 
  CalendarDays, 
  Star, 
  BarChart3, 
  Settings, 
  LayoutDashboard,
  FileText,
  ArrowRight
} from 'lucide-react';

interface Props {
  page: SidebarPage;
  onNavigateToDocuments: () => void;
}

export const GenericModulePage: React.FC<Props> = ({ page, onNavigateToDocuments }) => {
  const getModuleDetails = () => {
    switch (page) {
      case 'dashboard':
        return {
          title: 'HR Executive Dashboard',
          desc: 'Real-time overview of workforce headcount, onboarding pipelines, document generation, and department distributions.',
          icon: LayoutDashboard,
          stats: [
            { label: 'Active Workforce', val: '248 Employees' },
            { label: 'Pending Onboarding', val: '14 Candidates' },
            { label: 'Documents Issued (Aug)', val: '32 Documents' },
            { label: 'Attendance Rate', val: '97.8%' },
          ],
        };
      case 'employees':
        return {
          title: 'Employee Directory & Profiles',
          desc: 'Centralized employee repository with employment contracts, CTC structures, designations, and departmental alignments.',
          icon: Users,
          stats: [
            { label: 'Total Headcount', val: '248' },
            { label: 'Full-Time Staff', val: '215' },
            { label: 'Graduate Interns', val: '33' },
            { label: 'Locations', val: '4 Branches' },
          ],
        };
      case 'recruitment':
        return {
          title: 'Talent Acquisition & Recruitment Pipeline',
          desc: 'Manage candidate applications, interview evaluations, technical assessments, and pre-placement offer approvals.',
          icon: UserPlus,
          stats: [
            { label: 'Open Requisitions', val: '8 Roles' },
            { label: 'Interviews Scheduled', val: '12 Today' },
            { label: 'Offers Extended', val: '5 Candidates' },
            { label: 'Acceptance Rate', val: '92%' },
          ],
        };
      case 'attendance':
        return {
          title: 'Time, Attendance & Shift Management',
          desc: 'Biometric logging, vehicle auction shift rosters, overtime calculations, and leave regularization records.',
          icon: Clock,
          stats: [
            { label: 'Present Today', val: '242' },
            { label: 'On Approved Leave', val: '4' },
            { label: 'On Duty / Travel', val: '2' },
            { label: 'Average Log Time', val: '9:24 AM' },
          ],
        };
      case 'payroll':
        return {
          title: 'Payroll & Statutory Remuneration',
          desc: 'Monthly salary disbursements, PF & ESIC statutory computations, Form 16 generation, and incentive payouts.',
          icon: CreditCard,
          stats: [
            { label: 'August Payroll Status', val: 'Processed' },
            { label: 'Net Disbursed', val: '₹ 84.6 Lakhs' },
            { label: 'Statutory Dues (PF/ESIC)', val: 'Compliant' },
            { label: 'TDS Withholding', val: '₹ 12.4 Lakhs' },
          ],
        };
      case 'leaves':
        return {
          title: 'Leave Approvals & Accrual Balance',
          desc: 'Annual casual, sick, privilege, and paternity/maternity leave tracking against statutory entitlement quotas.',
          icon: CalendarDays,
          stats: [
            { label: 'Pending Requests', val: '3 Approvals' },
            { label: 'Casual Leaves Logged', val: '18 Days' },
            { label: 'Earned Leaves Bank', val: '420 Days' },
            { label: 'Holiday Calendar', val: 'Next: 05 Sep' },
          ],
        };
      case 'performance':
        return {
          title: 'Performance Appraisals & OKRs',
          desc: 'Quarterly milestone appraisals, mentor evaluations for interns, PPO regularization scoring, and promotion ladders.',
          icon: Star,
          stats: [
            { label: 'Active Cycles', val: 'Q3 Appraisal' },
            { label: 'Internship Evaluations', val: '14 Completed' },
            { label: 'Top Performers', val: '28 Engineers' },
            { label: 'PPO Eligibility Score', val: '≥ 80% Benchmark' },
          ],
        };
      case 'reports':
        return {
          title: 'Analytics, MIS & Statutory Reports',
          desc: 'Generate executive headcount reports, attrition analytics, gender parity summaries, and audit logs.',
          icon: BarChart3,
          stats: [
            { label: 'Scheduled Reports', val: '6 Weekly' },
            { label: 'Annual Turnover', val: '4.2%' },
            { label: 'Audit Trail Logs', val: '1,420 Records' },
            { label: 'Data Health', val: '100% Synced' },
          ],
        };
      case 'settings':
      default:
        return {
          title: 'System Preferences & Organization Settings',
          desc: 'Company letterheads, authorized digital signatories, SMTP email relay configurations, and database credentials.',
          icon: Settings,
          stats: [
            { label: 'Company Name', val: 'AutoRevive' },
            { label: 'Authorized Signatory', val: 'Jemsina Banu (HR)' },
            { label: 'SMTP Service', val: 'Active & Verified' },
            { label: 'MySQL Schema', val: 'v2.4 Production' },
          ],
        };
    }
  };

  const details = getModuleDetails();
  const Icon = details.icon;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-50 text-[#EA580C] rounded-xl border border-orange-200">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{details.title}</h2>
            <p className="text-xs text-slate-500 max-w-xl mt-0.5">{details.desc}</p>
          </div>
        </div>

        <button
          onClick={onNavigateToDocuments}
          className="flex items-center gap-2 px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>Open Document Center</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {details.stats.map((st, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{st.label}</p>
            <p className="text-base font-bold text-slate-900 mt-1 font-mono">{st.val}</p>
          </div>
        ))}
      </div>

      {/* Quick Action Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-orange-400">Need to issue an official HR document?</h3>
          <p className="text-xs text-slate-300 mt-1">
            Access Offer Letters, Internship Agreements, Internship-Cum-Placement Contracts, and Appointment Letters with verified live preview.
          </p>
        </div>
        <button
          onClick={onNavigateToDocuments}
          className="px-4 py-2 bg-white text-slate-950 font-bold text-xs rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
        >
          Go to Document Center
        </button>
      </div>
    </div>
  );
};
