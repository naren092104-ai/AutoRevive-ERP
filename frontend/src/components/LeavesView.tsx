import React, { useEffect, useState } from 'react';
import { CalendarDays, Plus, Check, X, Clock, CheckCircle2, AlertCircle, Calendar, User, Search, Filter } from 'lucide-react';
import { apiUrl } from '../api/client';

export const LeavesView: React.FC = () => {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [newLeave, setNewLeave] = useState({
    employee_id: 'AR-EMP-2026-0001',
    leave_type: 'Casual Leave',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    days_count: 1.0,
    reason: 'Personal obligation',
  });

  const loadLeaves = async () => {
    try {
      const res = await fetch(apiUrl('/leaves'));
      const data = await res.json();
      if (data.success) setLeaves(data.leaves || []);
    } catch (err) {
      console.warn('Could not load leaves:', err);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await fetch(apiUrl('/employees'));
      const data = await res.json();
      if (data.success) setEmployees(data.employees || []);
    } catch (err) {
      console.warn('Could not load employees:', err);
    }
  };

  useEffect(() => {
    void loadLeaves();
    void loadEmployees();
  }, []);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/leaves'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeave),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage('Leave request logged successfully.');
        setIsApplyModalOpen(false);
        void loadLeaves();
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Failed to submit leave.');
    }
  };

  const handleAction = async (leaveId: number, status: 'APPROVED' | 'REJECTED', approverNotes?: string) => {
    try {
      const res = await fetch(apiUrl(`/leaves/${leaveId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status,
          approver_notes: approverNotes || (status === 'APPROVED' ? 'Approved by HR' : 'Rejected by HR')
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Leave request ${status.toLowerCase()} successfully and updated in Employee Portal.`);
        void loadLeaves();
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Failed to update leave.');
    }
  };

  const pendingCount = leaves.filter((l) => l.status === 'PENDING').length;
  const approvedCount = leaves.filter((l) => l.status === 'APPROVED').length;
  const rejectedCount = leaves.filter((l) => l.status === 'REJECTED').length;

  const filteredLeaves = leaves.filter((l) => {
    const matchesFilter = statusFilter === 'ALL' || l.status === statusFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || 
      l.employee_name?.toLowerCase().includes(term) || 
      l.employee_id?.toLowerCase().includes(term) ||
      l.leave_type?.toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
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

      {/* 1. Leave Approval KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Pending HR Review</span>
          <p className="text-2xl font-extrabold text-[#EA580C] font-mono mt-1">{pendingCount}</p>
          <p className="text-[10px] text-slate-400">Action Required</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Approved Leaves</span>
          <p className="text-2xl font-extrabold text-emerald-600 font-mono mt-1">{approvedCount}</p>
          <p className="text-[10px] text-slate-400">Updated in Attendance</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Rejected Requests</span>
          <p className="text-2xl font-extrabold text-rose-600 font-mono mt-1">{rejectedCount}</p>
          <p className="text-[10px] text-slate-400">Notified to Employee</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Total Leave Applications</span>
          <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1">{leaves.length}</p>
          <p className="text-[10px] text-slate-400">Centralized SQL</p>
        </div>
      </div>

      {/* 2. Top Header & Action Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search employee or leave type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#EA580C] w-64"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === filter
                    ? 'bg-white text-[#EA580C] font-bold shadow-2xs'
                    : 'hover:text-slate-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold text-xs rounded-xl transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Apply Leave on Behalf of Employee</span>
        </button>
      </div>

      {/* 3. Leave Applications Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Leave Type</th>
                <th className="px-4 py-3">Date Range</th>
                <th className="px-4 py-3">Days</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLeaves.length > 0 ? (
                filteredLeaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{l.employee_name || l.employee_id}</p>
                      <p className="font-mono text-[10.5px] text-[#EA580C]">{l.employee_id}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{l.department || 'Engineering'}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{l.leave_type}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {l.start_date} → {l.end_date}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{l.days_count} Days</td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs">{l.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        l.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        l.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {l.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(l.id, 'APPROVED')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleAction(l.id, 'REJECTED')}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-semibold">
                          Reviewed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No leave requests found matching current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Apply Leave on Behalf of Employee</h3>
              <button onClick={() => setIsApplyModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleApplyLeave} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Employee</label>
                <select
                  value={newLeave.employee_id}
                  onChange={(e) => setNewLeave({ ...newLeave, employee_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  {employees.map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.full_name} ({emp.employee_id}) — {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Leave Type</label>
                <select
                  value={newLeave.leave_type}
                  onChange={(e) => setNewLeave({ ...newLeave, leave_type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  <option>Casual Leave</option>
                  <option>Sick Leave</option>
                  <option>Earned Leave</option>
                  <option>Maternity / Paternity Leave</option>
                  <option>Compensatory Off</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newLeave.start_date}
                    onChange={(e) => setNewLeave({ ...newLeave, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newLeave.end_date}
                    onChange={(e) => setNewLeave({ ...newLeave, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Number of Days</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={newLeave.days_count}
                  onChange={(e) => setNewLeave({ ...newLeave, days_count: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Reason</label>
                <textarea
                  required
                  rows={3}
                  value={newLeave.reason}
                  onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-xl text-xs font-bold"
                >
                  Submit &amp; Log Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default LeavesView;
