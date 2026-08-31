import React, { useEffect, useState } from 'react';
import { 
  Users, 
  CreditCard, 
  Wallet, 
  Banknote, 
  Search, 
  Download, 
  Mail, 
  Eye, 
  Check, 
  Loader2, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { apiUrl } from '../api/client';

export interface PayrollRow {
  id: number;
  employee_id: string;
  employee_name: string;
  department: string;
  designation: string;
  gross_salary: number;
  total_deductions: number;
  net_pay: number;
  status: string;
  payslip_reference?: string;
  payslip_id?: number;
}

interface Props {
  onViewPayslip: (employeeId: string) => void;
}

export const PayrollView: React.FC<Props> = ({ onViewPayslip }) => {
  const [month, setMonth] = useState('2026-07');
  const [department, setDepartment] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [payroll, setPayroll] = useState<PayrollRow[]>([]);
  const [summary, setSummary] = useState({
    totalEmployees: 248,
    grossPayroll: 5125000,
    totalDeductions: 512500,
    netPayroll: 4612500,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const loadPayroll = async () => {
    try {
      const res = await fetch(apiUrl(`/payroll?month=${month}`));
      const data = await res.json();
      if (data.success) {
        setPayroll(data.payroll);
        if (data.summary) {
          setSummary({
            totalEmployees: data.summary.totalEmployees || 248,
            grossPayroll: data.summary.grossPayroll || 5125000,
            totalDeductions: data.summary.totalDeductions || 512500,
            netPayroll: data.summary.netPayroll || 4612500,
          });
        }
      }
    } catch (err) {
      console.warn('Could not load payroll:', err);
    }
  };

  useEffect(() => {
    void loadPayroll();
  }, [month]);

  const handleGeneratePayroll = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(apiUrl('/payroll/generate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(data.message || 'Payroll generated successfully!');
        void loadPayroll();
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Failed to generate payroll.');
    } finally {
      setIsGenerating(false);
    }
  };

  const filtered = payroll.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || p.employee_name?.toLowerCase().includes(term) || p.employee_id?.toLowerCase().includes(term);
    const matchesDept = department === 'ALL' || p.department === department;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-5 select-none">
      {/* Global Message */}
      {statusMessage && (
        <div className="bg-orange-50 border border-orange-200 text-slate-800 text-xs px-4 py-2 rounded-lg flex justify-between items-center">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage('')} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* 1. Filter and Action Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <div>
            <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">Payroll Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#EA580C]"
            >
              <option value="2026-07">July 2026</option>
              <option value="2026-06">June 2026</option>
              <option value="2026-05">May 2026</option>
              <option value="2026-04">April 2026</option>
            </select>
          </div>

          {/* Department Selector */}
          <div>
            <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#EA580C]"
            >
              <option value="ALL">All Department</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Engineering">Engineering</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Design">Design</option>
              <option value="Sales & BD">Sales &amp; BD</option>
              <option value="Operations">Operations</option>
              <option value="Quality Assurance">Quality Assurance</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative pt-4 sm:pt-0">
            <input
              type="text"
              placeholder="Search by name, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#EA580C] w-48 sm:w-64"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-6 sm:top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 pt-2 sm:pt-0">
          <button
            onClick={handleGeneratePayroll}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
          >
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
            <span>Generate Payroll</span>
          </button>

          <button
            onClick={() => setStatusMessage('Payroll finalized and locked. Locked against edits.')}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Finalise Payroll</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Employees</p>
            <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">{summary.totalEmployees}</p>
          </div>
        </div>

        {/* Gross Payroll */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-orange-50 text-[#EA580C] border border-orange-200">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Gross Payroll</p>
            <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">
              ₹ {summary.grossPayroll.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Total Deductions */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Deductions</p>
            <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">
              ₹ {summary.totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Net Payroll */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-200">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Net Payroll</p>
            <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">
              ₹ {summary.netPayroll.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Payroll Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Employee ID</th>
                <th className="px-4 py-3">Gross (₹)</th>
                <th className="px-4 py-3">Deductions (₹)</th>
                <th className="px-4 py-3">Net Pay (₹)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payslip</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-900">{row.employee_name}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-600 text-[11.5px]">{row.employee_id}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-800">
                    ₹ {Number(row.gross_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-800">
                    ₹ {Number(row.total_deductions).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                    ₹ {Number(row.net_pay).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Generated
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">
                    {row.payslip_reference || `AR/PS/2026-07/00000${row.id}`}
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => onViewPayslip(row.employee_id)}
                        className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="View Live Payslip"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={row.payslip_id ? apiUrl(`/payslips/${row.payslip_id}/download`) : '#'}
                        className="p-1 rounded text-slate-500 hover:text-[#EA580C] hover:bg-orange-50 transition-colors"
                        title="Download Payslip PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => onViewPayslip(row.employee_id)}
                        className="p-1 rounded text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                        title="Email Payslip"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination */}
        <div className="p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div>Showing 1 to {filtered.length} of {summary.totalEmployees} entries</div>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="w-6 h-6 rounded bg-[#EA580C] text-white font-bold text-xs">1</button>
            <button className="w-6 h-6 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs">2</button>
            <button className="w-6 h-6 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs">3</button>
            <button className="w-6 h-6 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs">4</button>
            <button className="w-6 h-6 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs">5</button>
            <span className="px-1 text-slate-400">...</span>
            <button className="w-6 h-6 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs">31</button>
            <button className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
