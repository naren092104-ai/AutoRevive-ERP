import React, { useEffect, useState } from 'react';
import { Settings, Database, Mail, Clock, Building, ShieldCheck, CheckCircle2, Calendar, Plus, Trash2, HelpCircle, Check, MessageSquare } from 'lucide-react';
import { apiUrl } from '../api/client';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'holidays' | 'tickets'>('general');
  const [dbHealth, setDbHealth] = useState({ success: true, service: 'AutoRevive HR Backend', database: 'connected' });
  const [saved, setSaved] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Holidays state
  const [holidays, setHolidays] = useState<any[]>([]);
  const [isAddHolidayOpen, setIsAddHolidayOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    name: '',
    holiday_date: '2026-10-02',
    day_name: 'Friday',
    holiday_type: 'National Holiday',
  });

  // Support tickets state
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketReply, setTicketReply] = useState('');

  const loadHealth = () => {
    fetch(apiUrl('/health'))
      .then((r) => r.json())
      .then(setDbHealth)
      .catch(() => setDbHealth({ success: false, service: 'AutoRevive HR Backend', database: 'disconnected' }));
  };

  const loadHolidays = async () => {
    try {
      const res = await fetch(apiUrl('/holidays'));
      const data = await res.json();
      if (data.success) setHolidays(data.holidays || []);
    } catch (err) {
      console.warn('Could not load holidays:', err);
    }
  };

  const loadTickets = async () => {
    try {
      const res = await fetch(apiUrl('/tickets'));
      const data = await res.json();
      if (data.success) setTickets(data.tickets || []);
    } catch (err) {
      console.warn('Could not load tickets:', err);
    }
  };

  useEffect(() => {
    loadHealth();
    void loadHolidays();
    void loadTickets();
  }, []);

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/holidays'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHoliday),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(data.message || 'Holiday added to company calendar.');
        setIsAddHolidayOpen(false);
        setNewHoliday({ name: '', holiday_date: '2026-10-02', day_name: 'Friday', holiday_type: 'National Holiday' });
        void loadHolidays();
      }
    } catch (err) {
      setStatusMessage('Failed to add holiday.');
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this holiday from the company calendar?')) return;
    try {
      const res = await fetch(apiUrl(`/holidays/${id}`), { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setStatusMessage('Holiday removed from calendar.');
        void loadHolidays();
      }
    } catch (err) {
      setStatusMessage('Error removing holiday.');
    }
  };

  const handleResolveTicket = async (ticketId: number, status: 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED') => {
    try {
      const res = await fetch(apiUrl(`/tickets/${ticketId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status === 'REJECTED' ? 'CLOSED' : status,
          hr_response: ticketReply || (status === 'RESOLVED' ? 'Approved & accepted by HR.' : status === 'REJECTED' ? 'Resignation / Relieving request rejected by HR.' : 'Under investigation by HR.'),
          resolved_by: 'Jemsina Banu (HR Manager)',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Ticket #${ticketId} updated to ${status}.`);
        setSelectedTicket(null);
        setTicketReply('');
        void loadTickets();
      }
    } catch (err) {
      setStatusMessage('Error updating ticket.');
    }
  };

  return (
    <div className="space-y-6 select-none font-sans">
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
          onClick={() => setActiveTab('general')}
          className={`pb-3 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'general'
              ? 'text-[#EA580C] border-b-2 border-[#EA580C]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Organization &amp; System Timings</span>
        </button>
        <button
          onClick={() => setActiveTab('holidays')}
          className={`pb-3 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'holidays'
              ? 'text-[#EA580C] border-b-2 border-[#EA580C]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Company Holidays Setup ({holidays.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`pb-3 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'tickets'
              ? 'text-[#EA580C] border-b-2 border-[#EA580C]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Employee Support Tickets ({tickets.filter((t) => t.status === 'OPEN').length} Open)</span>
        </button>
      </div>

      {activeTab === 'general' ? (
        <div className="space-y-6 max-w-4xl">
          {/* 1. Organization Master Settings */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <Building className="w-4 h-4 text-[#EA580C]" />
              <h3 className="text-sm font-bold text-slate-900">Organization &amp; Corporate Identity</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Company Legal Name</label>
                <input type="text" readOnly value="AutoRevive" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Corporate Tagline</label>
                <input type="text" readOnly value="UNLOCK. BID. DRIVE." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Registered Address</label>
                <input type="text" readOnly value="No. 999, Kuppusamy Naidu Street, Uthangarai, Krishnagiri – 635207, Tamil Nadu, India." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Official HR Contact Email</label>
                <input type="text" readOnly value="hr@autorevives.com" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Authorized HR Signatory</label>
                <input type="text" readOnly value="Jemsina Banu (Human Resources Manager)" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold" />
              </div>
            </div>
          </div>

          {/* 2. Work Timings & Shift Management */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <Clock className="w-4 h-4 text-[#EA580C]" />
              <h3 className="text-sm font-bold text-slate-900">Work Timing &amp; Attendance Policy</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Standard Work Start</label>
                <input type="text" defaultValue="09:15 AM" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Standard Work End</label>
                <input type="text" defaultValue="06:00 PM" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Late Grace Period</label>
                <input type="text" defaultValue="15 Minutes" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800" />
              </div>
            </div>
          </div>

          {/* 3. System Infrastructure & Database Health */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-[#EA580C]" />
              <h3 className="text-sm font-bold text-slate-900">System Infrastructure &amp; Services Health</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-bold text-slate-900">MySQL Database</p>
                    <p className="text-[10.5px] text-slate-500">Database: autorevive_hr (Port 3306)</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  dbHealth.database === 'connected' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700'
                }`}>
                  {dbHealth.database === 'connected' ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'holidays' ? (
        /* Holidays Tab */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Official Company Holidays Calendar (2026)</h3>
              <p className="text-xs text-slate-500">
                Setup and manage paid company holidays. Updates immediately reflect in the Employee Portal calendar.
              </p>
            </div>
            <button
              onClick={() => setIsAddHolidayOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Company Holiday</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 bg-slate-50">
                  <th className="px-4 py-3">Holiday Name</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Day of Week</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {holidays.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900 font-bold">{h.name}</td>
                    <td className="px-4 py-3 font-mono font-bold text-[#EA580C]">{h.holiday_date}</td>
                    <td className="px-4 py-3 text-slate-700">{h.day_name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {h.holiday_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteHoliday(h.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Holiday"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tickets Tab */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Employee Helpdesk &amp; Support Tickets</h3>
              <p className="text-xs text-slate-500">
                Manage tickets raised by employees regarding Attendance, Payroll, Document Requests, and IT issues.
              </p>
            </div>
            <span className="px-3 py-1 bg-orange-50 text-[#EA580C] border border-orange-200 rounded-xl text-xs font-bold">
              {tickets.length} Total Tickets
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 bg-slate-50">
                  <th className="px-4 py-3">Ticket ID</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Subject &amp; Issue</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-[#EA580C]">{t.ticket_id}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{t.employee_name || t.employee_id}</p>
                      <p className="font-mono text-[10.5px] text-slate-500">{t.employee_id}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{t.category}</td>
                    <td className="px-4 py-3 max-w-sm">
                      <p className="font-bold text-slate-900">{t.subject}</p>
                      <p className="text-[11px] text-slate-600 truncate">{t.description}</p>
                      {t.hr_response && (
                        <p className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mt-1">
                          HR: {t.hr_response}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.priority === 'Urgent' || t.priority === 'High' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        t.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {t.status !== 'RESOLVED' && t.status !== 'CLOSED' ? (
                        <button
                          onClick={() => setSelectedTicket(t)}
                          className="px-3 py-1.5 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Respond &amp; Resolve
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-semibold">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Holiday Modal */}
      {isAddHolidayOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add Company Holiday</h3>
              <button onClick={() => setIsAddHolidayOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddHoliday} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Holiday Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gandhi Jayanti"
                  value={newHoliday.name}
                  onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newHoliday.holiday_date}
                    onChange={(e) => {
                      const d = new Date(e.target.value);
                      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
                      setNewHoliday({ ...newHoliday, holiday_date: e.target.value, day_name: dayName });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Day of Week</label>
                  <input
                    type="text"
                    readOnly
                    value={newHoliday.day_name}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Holiday Type</label>
                <select
                  value={newHoliday.holiday_type}
                  onChange={(e) => setNewHoliday({ ...newHoliday, holiday_type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  <option>National Holiday</option>
                  <option>Public Holiday</option>
                  <option>Regional / State Festival</option>
                  <option>Company Holiday</option>
                  <option>Optional Holiday</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddHolidayOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Response Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedTicket.category === 'Relieving & Resignation' || selectedTicket.subject?.toLowerCase().includes('relieving')
                    ? 'Review Resignation & 1-Month Relieving Application'
                    : `Resolve Ticket #${selectedTicket.ticket_id}`}
                </h3>
                <p className="text-xs text-slate-500">Employee: {selectedTicket.employee_name} ({selectedTicket.employee_id})</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <p><strong>Subject:</strong> {selectedTicket.subject}</p>
              <p><strong>Category:</strong> {selectedTicket.category}</p>
              <p className="text-slate-600"><strong>Issue Description:</strong> {selectedTicket.description}</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">HR Decision Remarks / Feedback</label>
              <textarea
                rows={3}
                placeholder="Explain the HR action / feedback for the employee..."
                value={ticketReply}
                onChange={(e) => setTicketReply(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>

              {selectedTicket.category === 'Relieving & Resignation' || selectedTicket.subject?.toLowerCase().includes('relieving') || selectedTicket.subject?.toLowerCase().includes('resignation') ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleResolveTicket(selectedTicket.id, 'REJECTED')}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <span>✕ Reject Resignation</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolveTicket(selectedTicket.id, 'RESOLVED')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>✓ Accept 1-Month Notice &amp; Approve</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleResolveTicket(selectedTicket.id, 'IN_PROGRESS')}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Mark In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolveTicket(selectedTicket.id, 'RESOLVED')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{selectedTicket.category === 'Profile Change Request' ? 'Approve & Apply to Profile' : 'Mark Resolved'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SettingsView;
