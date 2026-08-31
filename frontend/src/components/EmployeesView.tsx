import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Eye, 
  Edit3, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Briefcase,
  Clock,
  CreditCard,
  FileText,
  Trash2,
  Check,
  XCircle,
  AlertCircle,
  LayoutGrid,
  List,
  ChevronRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { apiUrl } from '../api/client';

export interface EmployeeProfile {
  id: number;
  employee_id: string;
  full_name: string;
  email: string;
  mobile: string;
  department: string;
  role: string;
  employment_type?: string;
  work_location?: string;
  address?: string;
  joining_date?: string;
  salary_month?: number;
  annual_ctc?: number;
  gender?: string;
  bank_name?: string;
  account_number?: string;
  status: string;
  pan_number?: string;
  aadhaar_number?: string;
  ifsc_code?: string;
  reporting_manager?: string;
  emergency_contact?: string;
}

interface Props {
  onIssueDocument?: (emp: EmployeeProfile) => void;
}

export const EmployeesView: React.FC<Props> = ({ onIssueDocument }) => {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedEmp, setSelectedEmp] = useState<EmployeeProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'split'>('table');
  const [statusMessage, setStatusMessage] = useState('');

  // New Employee Form State
  const [newEmp, setNewEmp] = useState({
    full_name: '',
    email: '',
    mobile: '+91 ',
    department: 'Sales & Business Development',
    role: 'Sales & BD Specialist',
    joining_date: '03/11/2026',
    salary_month: 41500,
    annual_ctc: 498000,
    work_location: 'Uthangarai, Krishnagiri',
    bank_name: 'HDFC Bank',
    gender: 'Male',
  });

  const loadEmployees = async () => {
    try {
      const res = await fetch(apiUrl('/employees'));
      const data = await res.json();
      if (data.success && data.employees) {
        setEmployees(data.employees);
        if (data.employees.length > 0 && !selectedEmp) {
          setSelectedEmp(data.employees[0]);
        }
      }
    } catch (err) {
      console.warn('Could not load employees:', err);
    }
  };

  useEffect(() => {
    void loadEmployees();
  }, []);

  const handleDeleteEmployee = async (empId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete employee ${empId}?`)) return;
    try {
      const res = await fetch(apiUrl(`/employees/${empId}`), { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Employee ${empId} deleted successfully.`);
        if (selectedEmp?.employee_id === empId) setSelectedEmp(null);
        setIsDetailModalOpen(false);
        void loadEmployees();
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Delete failed.');
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/employees'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmp),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Employee ${newEmp.full_name} created successfully.`);
        setIsAddModalOpen(false);
        void loadEmployees();
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Create failed.');
    }
  };

  const handleOpenDetailModal = (emp: EmployeeProfile) => {
    setSelectedEmp(emp);
    setIsDetailModalOpen(true);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesDept = selectedDept === 'ALL' || emp.department === selectedDept;
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      emp.full_name?.toLowerCase().includes(term) ||
      emp.employee_id?.toLowerCase().includes(term) ||
      emp.email?.toLowerCase().includes(term);
    return matchesDept && matchesSearch;
  });

  return (
    <div className="space-y-5 select-none font-sans">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="bg-orange-50 border border-orange-200 text-slate-800 text-xs px-4 py-2.5 rounded-xl flex justify-between items-center shadow-2xs">
          <span className="font-semibold">{statusMessage}</span>
          <button onClick={() => setStatusMessage('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Total Headcount</span>
          <p className="text-2xl font-extrabold text-[#EA580C] font-mono mt-1">{employees.length}</p>
          <p className="text-[10px] text-slate-400">Master Employee Base</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Active Staff</span>
          <p className="text-2xl font-extrabold text-emerald-600 font-mono mt-1">
            {employees.filter(e => (e.status || 'Active').toLowerCase() === 'active').length}
          </p>
          <p className="text-[10px] text-slate-400">On Payroll &amp; Active</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Departments</span>
          <p className="text-2xl font-extrabold text-blue-600 font-mono mt-1">
            {Array.from(new Set(employees.map(e => e.department))).length || 4}
          </p>
          <p className="text-[10px] text-slate-400">Operational Units</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Monthly Payroll Cost</span>
          <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
            ₹ {employees.reduce((acc, curr) => acc + (Number(curr.salary_month) || 41500), 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-slate-400">Gross Monthly Outflow</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, ID, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#EA580C] w-64"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Sales & Business Development">Sales &amp; BD</option>
            <option value="Operations">Operations</option>
            <option value="Design">Design</option>
            <option value="Human Resources">Human Resources</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-white text-[#EA580C] shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table View</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'split'
                  ? 'bg-white text-[#EA580C] shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold text-xs rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Employee</span>
          </button>
        </div>
      </div>

      {/* 1. CLASSIC FULL-WIDTH TABLE VIEW */}
      {viewMode === 'table' ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 bg-slate-50 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-4 py-3.5">Employee ID</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Designation</th>
                  <th className="px-4 py-3.5">Joining Date</th>
                  <th className="px-4 py-3.5 text-right">Monthly Salary</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <tr
                      key={emp.employee_id}
                      onClick={() => handleOpenDetailModal(emp)}
                      className="hover:bg-orange-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#EA580C] to-amber-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {emp.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-[#EA580C] transition-colors">{emp.full_name}</p>
                            <p className="text-[10.5px] text-slate-400">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs font-bold text-[#EA580C] bg-orange-50/80 px-2 py-0.5 rounded-lg border border-orange-200">
                          {emp.employee_id}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-semibold">
                          {emp.department}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 font-medium">
                        {emp.role}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">
                        {emp.joining_date || '03/11/2026'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                        ₹ {Number(emp.salary_month || 41500).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {emp.status === 'On Notice Period' || emp.status === 'Notice Period Pending Approval' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center justify-center gap-1">
                            <span>⚠️ 1-Mo Notice</span>
                            {emp.notice_period_end_date && (
                              <span className="font-mono text-[9px]">({new Date(emp.notice_period_end_date).toLocaleDateString('en-GB')})</span>
                            )}
                          </span>
                        ) : emp.status === 'Relieved' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                            Relieved
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {emp.status || 'Active'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetailModal(emp)}
                            title="View Full Profile Details"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteEmployee(emp.employee_id, e)}
                            title="Delete Employee"
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      No employee records found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 2. SPLIT MASTER-DETAIL VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs space-y-2 max-h-[750px] overflow-y-auto">
            {filteredEmployees.map((emp) => {
              const isSelected = selectedEmp?.employee_id === emp.employee_id;
              const isOnNotice = emp.status === 'On Notice Period' || emp.status === 'Notice Period Pending Approval';
              return (
                <div
                  key={emp.employee_id}
                  onClick={() => setSelectedEmp(emp)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-orange-50/70 border-[#EA580C] shadow-2xs'
                      : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#EA580C] to-amber-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {emp.full_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{emp.full_name}</p>
                      <p className="font-mono text-[10.5px] font-bold text-[#EA580C]">{emp.employee_id}</p>
                      <p className="text-[10px] text-slate-500 truncate">{emp.role} • {emp.department}</p>
                    </div>
                  </div>
                  {isOnNotice ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                      Notice Period
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      {emp.status || 'Active'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
            {selectedEmp ? (
              <>
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#EA580C] to-amber-500 text-white font-bold text-xl flex items-center justify-center shadow-xs">
                      {selectedEmp.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{selectedEmp.full_name}</h3>
                        {selectedEmp.status === 'On Notice Period' ? (
                          <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            ⚠️ In 1-Month Notice Period
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {selectedEmp.status || 'Active'}
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-xs font-bold text-[#EA580C]">{selectedEmp.employee_id}</p>
                      <p className="text-xs text-slate-500">{selectedEmp.role} • {selectedEmp.department}</p>
                    </div>
                  </div>
                </div>

                {/* Notice Period Alert Banner if applicable */}
                {(selectedEmp.status === 'On Notice Period' || selectedEmp.notice_period_end_date) && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>1-Month Notice Period Active (Relieving in progress)</span>
                      </p>
                      <p className="text-[11px] text-amber-700">
                        Official Relieving Date: <strong>{selectedEmp.notice_period_end_date ? new Date(selectedEmp.notice_period_end_date).toLocaleDateString('en-GB') : 'In 30 Days'}</strong>
                        {selectedEmp.relieving_reason && ` • Reason: ${selectedEmp.relieving_reason}`}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Information</span>
                    <p className="flex items-center gap-2 text-slate-800">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedEmp.email}</span>
                    </p>
                    <p className="flex items-center gap-2 text-slate-800 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedEmp.mobile}</span>
                    </p>
                    <p className="flex items-center gap-2 text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedEmp.address || 'Uthangarai, Krishnagiri'}</span>
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Employment &amp; Hierarchy</span>
                    <p className="text-slate-800">Department: <strong>{selectedEmp.department}</strong></p>
                    <p className="text-slate-800">Designation: <strong>{selectedEmp.role}</strong></p>
                    <p className="text-slate-800">Joining Date: <strong className="font-mono">{selectedEmp.joining_date || '03/11/2026'}</strong></p>
                    <p className="text-slate-800">Reporting: <strong>{selectedEmp.reporting_manager || 'Arun Kumar (VP Operations)'}</strong></p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Compensation &amp; Banking</span>
                    <p className="text-slate-800">Gross Monthly: <strong className="font-mono text-[#EA580C]">₹ {Number(selectedEmp.salary_month || 41500).toLocaleString('en-IN')}</strong></p>
                    <p className="text-slate-800">Annual CTC: <strong className="font-mono">₹ {Number(selectedEmp.annual_ctc || 498000).toLocaleString('en-IN')}</strong></p>
                    <p className="text-slate-800 font-mono">Bank: {selectedEmp.bank_name || 'HDFC Bank'} (A/C: {selectedEmp.account_number || '50100612342166'})</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Statutory KYC Details</span>
                    <p className="text-slate-800 font-mono">PAN: <strong>{selectedEmp.pan_number || 'ABCDE1234F'}</strong></p>
                    <p className="text-slate-800 font-mono">Aadhaar: <strong>{selectedEmp.aadhaar_number || '4567 8901 2345'}</strong></p>
                    <p className="text-slate-800 font-mono">IFSC: <strong>{selectedEmp.ifsc_code || 'HDFC0001234'}</strong></p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-slate-400 text-xs">
                Select an employee from the directory to view master profile details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. FULL EMPLOYEE PROFILE MODAL */}
      {isDetailModalOpen && selectedEmp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white max-w-2xl w-full rounded-3xl p-6 shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#EA580C] to-amber-500 text-white font-bold text-2xl flex items-center justify-center shadow-xs">
                  {selectedEmp.full_name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{selectedEmp.full_name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {selectedEmp.status || 'Active'}
                    </span>
                  </div>
                  <p className="font-mono text-xs font-bold text-[#EA580C]">{selectedEmp.employee_id}</p>
                  <p className="text-xs text-slate-500">{selectedEmp.role} • {selectedEmp.department}</p>
                </div>
              </div>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Profile Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Contact Details</span>
                <p className="flex items-center gap-2 text-slate-800">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedEmp.email}</span>
                </p>
                <p className="flex items-center gap-2 text-slate-800 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedEmp.mobile}</span>
                </p>
                <p className="flex items-center gap-2 text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedEmp.address || 'Uthangarai, Krishnagiri'}</span>
                </p>
                {selectedEmp.emergency_contact && (
                  <p className="text-slate-600 text-[11px] pt-1">
                    Emergency Contact: <strong className="font-mono">{selectedEmp.emergency_contact}</strong>
                  </p>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Hierarchy &amp; Role</span>
                <p className="text-slate-800">Department: <strong>{selectedEmp.department}</strong></p>
                <p className="text-slate-800">Designation: <strong>{selectedEmp.role}</strong></p>
                <p className="text-slate-800">Joining Date: <strong className="font-mono">{selectedEmp.joining_date || '03/11/2026'}</strong></p>
                <p className="text-slate-800">Reporting Manager: <strong>{selectedEmp.reporting_manager || 'Arun Kumar (VP Operations)'}</strong></p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Compensation Structure</span>
                <p className="text-slate-800">Gross Monthly: <strong className="font-mono text-[#EA580C]">₹ {Number(selectedEmp.salary_month || 41500).toLocaleString('en-IN')}</strong></p>
                <p className="text-slate-800">Annual CTC: <strong className="font-mono">₹ {Number(selectedEmp.annual_ctc || 498000).toLocaleString('en-IN')}</strong></p>
                <p className="text-slate-800 font-mono">Bank: {selectedEmp.bank_name || 'HDFC Bank'}</p>
                <p className="text-slate-800 font-mono">A/C: {selectedEmp.account_number || '50100612342166'}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Statutory &amp; KYC</span>
                <p className="text-slate-800 font-mono">PAN Number: <strong>{selectedEmp.pan_number || 'ABCDE1234F'}</strong></p>
                <p className="text-slate-800 font-mono">Aadhaar: <strong>{selectedEmp.aadhaar_number || '4567 8901 2345'}</strong></p>
                <p className="text-slate-800 font-mono">IFSC Code: <strong>{selectedEmp.ifsc_code || 'HDFC0001234'}</strong></p>
                <p className="text-slate-800">Gender: <strong>{selectedEmp.gender || 'Male'}</strong></p>
              </div>
            </div>

            {/* Relieving / Notice details if active */}
            {(selectedEmp.status === 'On Notice Period' || selectedEmp.notice_period_end_date) && (
              <div className="p-4 bg-amber-50 rounded-2xl space-y-1.5 border border-amber-200 text-xs">
                <span className="text-[10.5px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>1-Month Notice Period &amp; Relieving Status</span>
                </span>
                <p className="text-slate-800 font-bold">
                  Expected Last Working Date / Relieving: <span className="font-mono text-[#EA580C]">{selectedEmp.notice_period_end_date ? new Date(selectedEmp.notice_period_end_date).toLocaleDateString('en-GB') : 'In 30 Days'}</span>
                </p>
                {selectedEmp.relieving_reason && (
                  <p className="text-slate-700">Reason for Relieving: {selectedEmp.relieving_reason}</p>
                )}
                <p className="text-[11px] text-amber-700">Official AutoRevive Relieving Letter will be generated on completion of notice period.</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button
                onClick={(e) => handleDeleteEmployee(selectedEmp.employee_id, e)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add New AutoRevive Employee</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateEmployee} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anandha Kumar"
                  value={newEmp.full_name}
                  onChange={(e) => setNewEmp({ ...newEmp, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. anand@autorevive.com"
                    value={newEmp.email}
                    onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={newEmp.mobile}
                    onChange={(e) => setNewEmp({ ...newEmp, mobile: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Department</label>
                  <select
                    value={newEmp.department}
                    onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option>Engineering</option>
                    <option>Sales & Business Development</option>
                    <option>Operations</option>
                    <option>Design</option>
                    <option>Human Resources</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Designation / Role</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Full Stack Developer"
                    value={newEmp.role}
                    onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Monthly Gross (₹)</label>
                  <input
                    type="number"
                    required
                    value={newEmp.salary_month}
                    onChange={(e) => setNewEmp({ ...newEmp, salary_month: Number(e.target.value), annual_ctc: Number(e.target.value) * 12 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Annual CTC (₹)</label>
                  <input
                    type="number"
                    required
                    value={newEmp.annual_ctc}
                    onChange={(e) => setNewEmp({ ...newEmp, annual_ctc: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                >
                  Create Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default EmployeesView;
