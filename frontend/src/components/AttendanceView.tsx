import React, { useEffect, useState } from 'react';
import { Clock, Calendar, Check, Search, Save, UserCheck, AlertCircle, CheckCircle2, XCircle, FileText, ArrowRight } from 'lucide-react';
import { apiUrl } from '../api/client';

export const AttendanceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sheet' | 'corrections'>('sheet');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [rejectNotes, setRejectNotes] = useState<{ [id: number]: string }>({});

  const loadAttendance = async () => {
    try {
      const res = await fetch(apiUrl(`/attendance?date=${date}`));
      const data = await res.json();
      if (data.success) {
        setAttendance(data.attendance || []);
      }
    } catch (err) {
      console.warn('Could not load attendance:', err);
    }
  };

  const loadCorrections = async () => {
    try {
      const res = await fetch(apiUrl('/attendance/corrections'));
      const data = await res.json();
      if (data.success) {
        setCorrections(data.corrections || []);
      }
    } catch (err) {
      console.warn('Could not load attendance corrections:', err);
    }
  };

  useEffect(() => {
    void loadAttendance();
    void loadCorrections();
  }, [date]);

  const handleUpdateStatus = (empId: string, newStatus: string) => {
    setAttendance((prev) =>
      prev.map((a) => (a.employee_id === empId ? { ...a, status: newStatus } : a))
    );
  };

  const handleSaveRow = async (row: any) => {
    setIsSaving(true);
    try {
      const res = await fetch(apiUrl('/attendance'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: row.employee_id,
          date,
          status: row.status,
          check_in: row.check_in,
          check_out: row.check_out,
          working_hours: row.working_hours,
          late_minutes: row.late_minutes,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setStatusMessage(`Attendance saved for ${row.employee_name}.`);
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Failed to save attendance.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkAllPresent = () => {
    setAttendance((prev) => prev.map((a) => ({ ...a, status: 'Present' })));
    setStatusMessage('All employees updated to Present. Click Save on individual rows or refresh.');
  };

  const handleCorrectionDecision = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(apiUrl(`/attendance/corrections/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          approver_notes: rejectNotes[id] || (status === 'APPROVED' ? 'Approved by HR' : 'Rejected by HR'),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Attendance correction ${status.toLowerCase()} successfully and synchronized with Employee Portal.`);
        void loadCorrections();
        void loadAttendance();
      }
    } catch (err: any) {
      setStatusMessage('Error updating correction status.');
    }
  };

  const filtered = attendance.filter((a) => {
    const term = searchTerm.toLowerCase();
    return !term || a.employee_name?.toLowerCase().includes(term) || a.employee_id?.toLowerCase().includes(term);
  });

  const pendingCorrectionsCount = corrections.filter((c) => c.status === 'PENDING').length;

  return (
    <div className="space-y-5 select-none font-sans">
      {/* Toast */}
      {statusMessage && (
        <div className="bg-orange-50 border border-orange-200 text-slate-800 text-xs px-4 py-2.5 rounded-xl flex justify-between items-center shadow-2xs">
          <span className="font-semibold">{statusMessage}</span>
          <button onClick={() => setStatusMessage('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 pt-3 rounded-2xl shadow-2xs gap-6">
        <button
          onClick={() => setActiveTab('sheet')}
          className={`pb-3 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'sheet'
              ? 'text-[#EA580C] border-b-2 border-[#EA580C]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Daily Attendance Sheet</span>
        </button>
        <button
          onClick={() => setActiveTab('corrections')}
          className={`pb-3 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'corrections'
              ? 'text-[#EA580C] border-b-2 border-[#EA580C]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Attendance Correction Requests</span>
          {pendingCorrectionsCount > 0 && (
            <span className="px-2 py-0.2 rounded-full bg-[#EA580C] text-white text-[10px] font-bold">
              {pendingCorrectionsCount} Pending
            </span>
          )}
        </button>
      </div>

      {activeTab === 'sheet' ? (
        <>
          {/* Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#EA580C]" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#EA580C]"
                />
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#EA580C] w-56"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={handleMarkAllPresent}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Mark All Present</span>
            </button>
          </div>

          {/* Attendance Matrix Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Check In</th>
                    <th className="px-4 py-3">Check Out</th>
                    <th className="px-4 py-3">Working Hours</th>
                    <th className="px-4 py-3">Attendance Status</th>
                    <th className="px-4 py-3 text-right">Save</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((row) => (
                    <tr key={row.employee_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{row.employee_name}</p>
                        <p className="font-mono text-[10.5px] text-slate-500">{row.employee_id}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.department}</td>
                      <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">
                        {row.check_in || '09:15 AM'}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">
                        {row.check_out || '06:00 PM'}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">
                        {row.working_hours} Hrs
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={row.status}
                          onChange={(e) => handleUpdateStatus(row.employee_id, e.target.value)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                            row.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                            row.status === 'Absent' ? 'bg-rose-50 text-rose-700 border-rose-300' :
                            row.status === 'Late' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                            row.status === 'Leave' ? 'bg-purple-50 text-purple-700 border-purple-300' :
                            'bg-blue-50 text-blue-700 border-blue-300'
                          }`}
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Late">Late</option>
                          <option value="Half Day">Half Day</option>
                          <option value="Leave">Leave</option>
                          <option value="Work From Home">Work From Home</option>
                          <option value="Week Off">Week Off</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleSaveRow(row)}
                          className="p-1.5 bg-slate-100 hover:bg-[#EA580C] hover:text-white rounded-lg text-slate-600 transition-colors cursor-pointer"
                          title="Save to database"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Attendance Correction Requests Tab */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Attendance Correction Requests</h3>
              <p className="text-xs text-slate-500">
                Review missed or delayed punches submitted by employees from the Employee Self-Service Portal.
              </p>
            </div>
            <span className="px-3 py-1 bg-orange-50 text-[#EA580C] border border-orange-200 rounded-xl text-xs font-bold">
              {corrections.length} Total Submissions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 bg-slate-50">
                  <th className="px-4 py-2.5">Employee</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Requested Timing</th>
                  <th className="px-4 py-2.5">Employee Reason</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">HR Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {corrections.length > 0 ? (
                  corrections.map((corr) => (
                    <tr key={corr.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{corr.employee_name}</p>
                        <p className="font-mono text-[10.5px] text-[#EA580C]">{corr.employee_id} • {corr.department}</p>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{corr.attendance_date}</td>
                      <td className="px-4 py-3 font-mono text-slate-700">
                        {corr.requested_check_in} — {corr.requested_check_out}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs">{corr.reason}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          corr.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          corr.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {corr.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {corr.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleCorrectionDecision(corr.id, 'APPROVED')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleCorrectionDecision(corr.id, 'REJECTED')}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold">
                            Reviewed by {corr.approved_by || 'HR'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No attendance correction requests submitted.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default AttendanceView;
