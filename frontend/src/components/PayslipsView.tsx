import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Mail, 
  Eye, 
  FileText, 
  CheckCircle2, 
  MoreVertical,
  Loader2,
  Share2,
  Send,
  Globe
} from 'lucide-react';
import { OfficialPayslipA4, PayslipRecord } from './OfficialPayslipA4';
import { apiUrl } from '../api/client';

export const PayslipsView: React.FC = () => {
  const [month, setMonth] = useState('2026-07');
  const [department, setDepartment] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [payslips, setPayslips] = useState<PayslipRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<PayslipRecord | null>(null);
  const [isEmailing, setIsEmailing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const loadPayslips = async () => {
    try {
      const res = await fetch(apiUrl(`/payslips?month=${month}`));
      const data = await res.json();
      if (data.success && data.payslips) {
        setPayslips(data.payslips);
        if (data.payslips.length > 0 && !selectedRecord) {
          const naren = data.payslips.find((p: any) => p.employee_id === 'AR-EMP-2026-0001');
          setSelectedRecord(naren || data.payslips[0]);
        }
      }
    } catch (err) {
      console.warn('Could not load payslips:', err);
    }
  };

  useEffect(() => {
    void loadPayslips();
  }, [month]);

  const handlePublishPayslip = async (payslipId: number) => {
    try {
      const res = await fetch(apiUrl(`/payslips/${payslipId}/publish`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage('Payslip published to Employee Portal successfully.');
        void loadPayslips();
      }
    } catch (err: any) {
      setStatusMessage('Failed to publish payslip.');
    }
  };

  const handlePublishAll = async () => {
    try {
      const res = await fetch(apiUrl('/payslips/publish-all'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`All payslips for ${month} are now published to the Employee Self-Service Portal.`);
        void loadPayslips();
      }
    } catch (err: any) {
      setStatusMessage('Bulk publish failed.');
    }
  };

  const handleEmailPayslip = async (payslip: PayslipRecord) => {
    if (!payslip.id) return;
    setIsEmailing(true);
    setStatusMessage('Dispatching official payslip email with PDF attached...');
    try {
      const res = await fetch(apiUrl(`/payslips/${payslip.id}/send-email`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(data.message || 'Payslip emailed successfully!');
        void loadPayslips();
      } else {
        setStatusMessage(data.message || 'Email dispatch failed.');
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Failed to email payslip.');
    } finally {
      setIsEmailing(false);
    }
  };

  const handleEmailAll = async () => {
    setIsEmailing(true);
    setStatusMessage(`Sending emails with attached PDF payslips to all employees for ${month}...`);
    try {
      for (const p of payslips) {
        if (p.id) {
          await fetch(apiUrl(`/payslips/${p.id}/send-email`), { method: 'POST' });
        }
      }
      setStatusMessage(`All payslip emails dispatched successfully to employee official inboxes.`);
      void loadPayslips();
    } catch (err: any) {
      setStatusMessage('Error emailing some payslips.');
    } finally {
      setIsEmailing(false);
    }
  };

  const handlePrint = (payslip: PayslipRecord) => {
    if (!payslip.id) return;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = apiUrl(`/payslips/${payslip.id}/preview`);
    document.body.appendChild(iframe);
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 300);
    };
  };

  const filtered = payslips.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || 
      p.employee_name?.toLowerCase().includes(term) || 
      p.employee_id?.toLowerCase().includes(term) ||
      p.payslip_reference?.toLowerCase().includes(term);
    const matchesDept = department === 'ALL' || p.department === department;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Toast */}
      {statusMessage && (
        <div className="bg-orange-50 border border-orange-200 text-slate-800 text-xs px-4 py-2.5 rounded-xl flex justify-between items-center shadow-2xs">
          <span className="font-semibold">{statusMessage}</span>
          <button onClick={() => setStatusMessage('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
        </div>
      )}

      {/* 1. Filter Bar & Bulk Action Hub */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Payroll Month */}
          <div>
            <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">Payroll Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#EA580C]"
            >
              <option value="2026-07">July 2026</option>
              <option value="2026-06">June 2026</option>
              <option value="2026-05">May 2026</option>
              <option value="2026-04">April 2026</option>
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-[10.5px] font-semibold text-slate-500 mb-0.5">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#EA580C]"
            >
              <option value="ALL">All Departments</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Engineering">Engineering</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Design">Design</option>
              <option value="Sales & Business Development">Sales &amp; BD</option>
              <option value="Operations">Operations</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative pt-4 sm:pt-0">
            <input
              type="text"
              placeholder="Search by name, ID or ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#EA580C] w-48 sm:w-60"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-6 sm:top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePublishAll}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Publish All to Employee Portal</span>
          </button>

          <button
            onClick={handleEmailAll}
            disabled={isEmailing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            {isEmailing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
            <span>Email All Payslips (PDF)</span>
          </button>

          <a
            href={apiUrl('/reports/payroll/export')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* 2. Payslips Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Payslip Reference</th>
                <th className="px-4 py-3">Gross (₹)</th>
                <th className="px-4 py-3">Deductions (₹)</th>
                <th className="px-4 py-3">Net Pay (₹)</th>
                <th className="px-4 py-3">Portal Status</th>
                <th className="px-4 py-3">Email Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((row) => {
                const isSelected = selectedRecord?.employee_id === row.employee_id;
                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedRecord(row)}
                    className={`transition-colors cursor-pointer ${
                      isSelected ? 'bg-orange-50/70 font-semibold' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{row.employee_name}</p>
                      <p className="font-mono text-[10.5px] text-[#EA580C]">{row.employee_id}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-[11px]">Jul 2026</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800 text-[11.5px]">
                      {row.payslip_reference}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {Number(row.total_earnings || row.gross_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {Number(row.total_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {Number(row.net_pay).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Live on Portal
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {row.email_status === 'SENT' ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>SENT</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium text-[11px]">
                          NOT SENT
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(row);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View Live Payslip"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href={apiUrl(`/payslips/${row.id}/download`)}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#EA580C] hover:bg-orange-50 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleEmailPayslip(row);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                          title="Email PDF Payslip"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrint(row);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="Print Payslip"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Bottom Split Panel: Left Details & Right Live Payslip Preview */}
      {selectedRecord && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Details Card (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>{selectedRecord.employee_name} — Payslip Details</span>
              <span className="text-[10.5px] text-[#EA580C] font-mono font-bold">AR/PS/2026-07</span>
            </h3>

            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Employee ID</span>
                <span className="font-mono font-bold text-slate-800">{selectedRecord.employee_id}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Designation</span>
                <span className="text-slate-800 font-semibold">{selectedRecord.designation || selectedRecord.role}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Department</span>
                <span className="text-slate-800">{selectedRecord.department}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Bank &amp; Account</span>
                <span className="font-mono text-slate-700">{selectedRecord.bank_name || 'HDFC Bank'} ({selectedRecord.account_number || '•••• 2166'})</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Total Paid Days</span>
                <span className="font-mono font-bold text-slate-800">{selectedRecord.paid_days || 31} Days</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Net Take-Home Salary</span>
                <span className="font-mono font-extrabold text-[#EA580C] text-sm">₹ {Number(selectedRecord.net_pay).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => void handleEmailPayslip(selectedRecord)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Official PDF to {selectedRecord.employee_name}</span>
              </button>
              <a
                href={apiUrl(`/payslips/${selectedRecord.id}/download`)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Generated PDF File</span>
              </a>
            </div>
          </div>

          {/* Right Live A4 Payslip Document Panel (8 cols) */}
          <div className="lg:col-span-8 bg-slate-100 border border-slate-200 rounded-2xl p-4 shadow-2xs overflow-x-auto flex justify-center">
            <div className="scale-90 origin-top">
              <OfficialPayslipA4 payslip={selectedRecord} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PayslipsView;
