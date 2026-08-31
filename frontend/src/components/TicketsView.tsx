import React, { useEffect, useState } from 'react';
import { LifeBuoy, Search, Filter, Check, Clock, AlertCircle, MessageSquare, CheckCircle2, User, Phone, Mail, ChevronRight } from 'lucide-react';
import { apiUrl } from '../api/client';

export const TicketsView: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const loadTickets = async () => {
    try {
      const res = await fetch(apiUrl('/tickets'));
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.warn('Could not load support tickets:', err);
    }
  };

  useEffect(() => {
    void loadTickets();
  }, []);

  const handleResolveTicket = async (ticketId: number, status: 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED') => {
    try {
      const res = await fetch(apiUrl(`/tickets/${ticketId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status === 'REJECTED' ? 'CLOSED' : status,
          hr_response: ticketReply || (status === 'RESOLVED' ? 'Approved & accepted by HR.' : status === 'REJECTED' ? 'Resignation / Relieving request rejected by HR.' : 'Under investigation by HR team.'),
          resolved_by: 'Jemsina Banu (HR Manager)',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Ticket #${ticketId} updated to ${status} and notified to employee.`);
        setSelectedTicket(null);
        setTicketReply('');
        void loadTickets();
      }
    } catch (err) {
      setStatusMessage('Error updating ticket.');
    }
  };

  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      t.ticket_id?.toLowerCase().includes(term) ||
      t.employee_name?.toLowerCase().includes(term) ||
      t.employee_id?.toLowerCase().includes(term) ||
      t.subject?.toLowerCase().includes(term) ||
      t.description?.toLowerCase().includes(term);
    return matchesStatus && matchesCategory && matchesSearch;
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

      {/* 1. KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Open Tickets</span>
          <p className="text-2xl font-extrabold text-[#EA580C] font-mono mt-1">{openCount}</p>
          <p className="text-[10px] text-slate-400">Needs Immediate Action</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">In Progress</span>
          <p className="text-2xl font-extrabold text-blue-600 font-mono mt-1">{inProgressCount}</p>
          <p className="text-[10px] text-slate-400">Under HR Review</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Resolved &amp; Closed</span>
          <p className="text-2xl font-extrabold text-emerald-600 font-mono mt-1">{resolvedCount}</p>
          <p className="text-[10px] text-slate-400">Successfully Solved</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Total Submissions</span>
          <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1">{tickets.length}</p>
          <p className="text-[10px] text-slate-400">Centralized SQL Helpdesk</p>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by ticket ID, employee, subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#EA580C] w-72"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Categories</option>
            <option value="Relieving & Resignation">📝 1-Month Relieving &amp; Resignation</option>
            <option value="Profile Change Request">👤 Profile Change Request</option>
            <option value="Attendance & Punch">Attendance &amp; Punch</option>
            <option value="Payroll & Salary">Payroll &amp; Salary</option>
            <option value="Document Request">Document Request</option>
            <option value="IT & Equipment">IT &amp; Equipment</option>
            <option value="HR Policy & General">HR Policy &amp; General</option>
          </select>

          {/* Status filter buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === filter
                    ? 'bg-white text-[#EA580C] font-bold shadow-2xs'
                    : 'hover:text-slate-900'
                }`}
              >
                {filter.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Tickets Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                <th className="px-4 py-3">Ticket ID</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Subject &amp; Issue Details</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTickets.length > 0 ? (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#EA580C]">{t.ticket_id}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{t.employee_name || t.employee_id}</p>
                      <p className="font-mono text-[10.5px] text-slate-500">{t.employee_id} • {t.department}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-slate-100 text-slate-800">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-sm">
                      <p className="font-bold text-slate-900">{t.subject}</p>
                      <p className="text-[11px] text-slate-600 line-clamp-2">{t.description}</p>
                      {t.hr_response && (
                        <p className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 border border-emerald-100">
                          <strong>HR:</strong> {t.hr_response}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.priority === 'Urgent' || t.priority === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'RESOLVED' || t.status === 'CLOSED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        t.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedTicket(t);
                          setTicketReply(t.hr_response || '');
                        }}
                        className="px-3 py-1.5 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                      >
                        <span>{t.status === 'RESOLVED' ? 'View Details' : 'Respond & Resolve'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No tickets found matching the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Response / Resolution Modal */}
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
                <p className="text-xs text-slate-500">
                  Raised by: <strong>{selectedTicket.employee_name}</strong> ({selectedTicket.employee_id})
                </p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-200">
              <p><strong>Category:</strong> {selectedTicket.category} • <strong>Priority:</strong> {selectedTicket.priority}</p>
              <p><strong>Subject:</strong> {selectedTicket.subject}</p>
              <p className="text-slate-700 pt-1 leading-relaxed">
                <strong>Employee Issue:</strong> {selectedTicket.description}
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                HR Decision Remarks / Employee Feedback
              </label>
              <textarea
                rows={3}
                placeholder="Enter decision notes, action taken, or explanation for the employee..."
                value={ticketReply}
                onChange={(e) => setTicketReply(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-[#EA580C]"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
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
                      <span>
                        {selectedTicket.category === 'Profile Change Request'
                          ? 'Approve & Apply to Profile'
                          : 'Mark Resolved'}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TicketsView;
