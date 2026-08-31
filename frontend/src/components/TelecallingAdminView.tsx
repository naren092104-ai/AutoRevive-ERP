import React, { useEffect, useState } from 'react';
import { 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing, 
  UserCheck, 
  Clock, 
  Target, 
  Award, 
  Search, 
  Filter, 
  Plus, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Calendar, 
  DollarSign, 
  Send,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { apiUrl } from '../api/client';

interface Props {
  currentAdmin: any;
}

export const TelecallingAdminView: React.FC<Props> = ({ currentAdmin }) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'calls' | 'targets' | 'incentives' | 'team'>('leads');
  const [leads, setLeads] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const [incentives, setIncentives] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showLogCallModal, setShowLogCallModal] = useState<any | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<any | null>(null);

  // Form states
  const [leadForm, setLeadForm] = useState({
    lead_name: '',
    phone: '',
    email: '',
    source: 'Meta Ads',
    status: 'New',
    call_notes: '',
    follow_up_date: '',
    employee_id: '',
  });

  const [callForm, setCallForm] = useState({
    caller_name: '',
    contact_number: '',
    call_type: 'Outbound',
    duration_seconds: 180,
    outcome: 'Connected - Interested',
    notes: '',
    follow_up_date: '',
  });

  const [selectedEmployeeForAssign, setSelectedEmployeeForAssign] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const headers = {
        'x-admin-id': currentAdmin?.admin_id || '',
        'x-admin-role': currentAdmin?.role || '',
      };

      const [leadsRes, callsRes, targetsRes, incRes, teamRes] = await Promise.all([
        fetch(apiUrl('/telecalling/leads'), { headers }),
        fetch(apiUrl('/telecalling/calls'), { headers }),
        fetch(apiUrl('/telecalling/targets'), { headers }),
        fetch(apiUrl('/telecalling/incentives'), { headers }),
        fetch(apiUrl('/telecalling/team'), { headers }),
      ]);

      const [leadsData, callsData, targetsData, incData, teamData] = await Promise.all([
        leadsRes.json(),
        callsRes.json(),
        targetsRes.json(),
        incRes.json(),
        teamRes.json(),
      ]);

      if (leadsData.success) setLeads(leadsData.leads || []);
      if (callsData.success) setCalls(callsData.calls || []);
      if (targetsData.success) setTargets(targetsData.targets || []);
      if (incData.success) setIncentives(incData.incentives || []);
      if (teamData.success) setTeam(teamData.team || []);
    } catch (err) {
      console.error('Error loading telecalling data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.lead_name || !leadForm.phone) {
      setNotification({ type: 'error', message: 'Lead name and phone number are required.' });
      return;
    }

    try {
      const res = await fetch(apiUrl('/telecalling/leads'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': currentAdmin?.admin_id || '',
          'x-admin-role': currentAdmin?.role || '',
        },
        body: JSON.stringify(leadForm),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        setShowAddLeadModal(false);
        setLeadForm({
          lead_name: '',
          phone: '',
          email: '',
          source: 'Meta Ads',
          status: 'New',
          call_notes: '',
          follow_up_date: '',
          employee_id: '',
        });
        loadData();
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleLogCallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showLogCallModal) return;

    try {
      const res = await fetch(apiUrl('/telecalling/calls'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': currentAdmin?.admin_id || '',
          'x-admin-role': currentAdmin?.role || '',
        },
        body: JSON.stringify({
          ...callForm,
          lead_id: showLogCallModal.id,
          caller_name: showLogCallModal.lead_name,
          contact_number: showLogCallModal.phone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        setShowLogCallModal(null);
        loadData();
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleAssignLead = async (leadId: number) => {
    if (!selectedEmployeeForAssign) {
      setNotification({ type: 'error', message: 'Please select an employee to assign.' });
      return;
    }

    try {
      const res = await fetch(apiUrl('/telecalling/leads/assign'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': currentAdmin?.admin_id || '',
          'x-admin-role': currentAdmin?.role || '',
        },
        body: JSON.stringify({
          lead_ids: [leadId],
          employee_id: selectedEmployeeForAssign,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        setShowAssignModal(null);
        loadData();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleSendToPayroll = async (incentiveId: number) => {
    try {
      const res = await fetch(apiUrl(`/telecalling/incentives/${incentiveId}/send-payroll`), {
        method: 'POST',
        headers: {
          'x-admin-id': currentAdmin?.admin_id || '',
          'x-admin-role': currentAdmin?.role || '',
        }
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        loadData();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const totalLeads = leads.length;
  const convertedLeads = leads.filter(l => l.status === 'Converted').length;
  const interestedLeads = leads.filter(l => l.status === 'Interested').length;
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-blue-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PhoneCall className="w-6 h-6 text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-blue-300">Telecalling CRM Console</span>
            </div>
            <h1 className="text-2xl font-black text-white">Inbound & Outbound Calling Hub</h1>
            <p className="text-xs text-blue-200/80 mt-1 max-w-xl">
              Track automotive inquiries, assign telecaller leads, monitor follow-up schedules, and calculate sales incentives in real time.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer border border-white/10"
              title="Refresh CRM"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowAddLeadModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Customer Lead</span>
            </button>
          </div>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-blue-800/40">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-blue-200 font-medium">Total Leads</div>
            <div className="text-2xl font-black text-white mt-0.5">{totalLeads}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-emerald-300 font-medium">Converted Deals</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">{convertedLeads}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-amber-300 font-medium">Interested / Pipeline</div>
            <div className="text-2xl font-black text-amber-400 mt-0.5">{interestedLeads}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-blue-300 font-medium">Conversion Rate</div>
            <div className="text-2xl font-black text-blue-300 mt-0.5">{conversionRate}%</div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-bold ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'leads' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Leads Pipeline ({leads.length})
        </button>
        <button
          onClick={() => setActiveTab('calls')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'calls' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Call Logs ({calls.length})
        </button>
        <button
          onClick={() => setActiveTab('targets')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'targets' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Monthly Targets
        </button>
        <button
          onClick={() => setActiveTab('incentives')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'incentives' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Incentives & Payroll Sync
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'team' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Telecalling Team ({team.length})
        </button>
      </div>

      {/* TAB 1: LEADS PIPELINE */}
      {activeTab === 'leads' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Customer Name & Contact</th>
                  <th className="px-4 py-3.5">Source</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Assigned Telecaller</th>
                  <th className="px-4 py-3.5">Follow-up Date</th>
                  <th className="px-4 py-3.5">Call Notes</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      No customer leads found in the telecalling pipeline.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-extrabold text-slate-900">{lead.lead_name}</div>
                        <div className="text-slate-500 font-mono text-[11px]">{lead.phone}</div>
                        {lead.email && <div className="text-slate-400 text-[10px]">{lead.email}</div>}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">{lead.source}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          lead.status === 'Converted' ? 'bg-emerald-100 text-emerald-800' :
                          lead.status === 'Interested' ? 'bg-blue-100 text-blue-800' :
                          lead.status === 'Follow-up Scheduled' ? 'bg-amber-100 text-amber-800' :
                          lead.status === 'Contacted' ? 'bg-purple-100 text-purple-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 font-medium">
                        {lead.assigned_employee_name || lead.employee_id}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                        {lead.follow_up_date || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">
                        {lead.call_notes || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setShowLogCallModal(lead);
                              setCallForm({
                                caller_name: lead.lead_name,
                                contact_number: lead.phone,
                                call_type: 'Outbound',
                                duration_seconds: 180,
                                outcome: 'Connected - Interested',
                                notes: lead.call_notes || '',
                                follow_up_date: lead.follow_up_date || '',
                              });
                            }}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            📞 Log Call
                          </button>
                          <button
                            onClick={() => setShowAssignModal(lead)}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            👤 Assign
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CALL LOGS */}
      {activeTab === 'calls' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Call ID & Time</th>
                  <th className="px-4 py-3.5">Customer Name & Number</th>
                  <th className="px-4 py-3.5">Type & Duration</th>
                  <th className="px-4 py-3.5">Call Outcome</th>
                  <th className="px-4 py-3.5">Caller / Telecaller</th>
                  <th className="px-4 py-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {calls.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-mono font-bold text-blue-700">{c.call_id}</div>
                      <div className="text-[10px] text-slate-400">{new Date(c.call_time).toLocaleString('en-GB')}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-extrabold text-slate-900">{c.caller_name}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{c.contact_number}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-700">{c.call_type}</div>
                      <div className="text-[10px] text-slate-400">{Math.floor(c.duration_seconds / 60)}m {c.duration_seconds % 60}s</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                        {c.outcome}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 font-medium">
                      {c.employee_name || c.employee_id}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-sm truncate">
                      {c.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TARGETS */}
      {activeTab === 'targets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {targets.map((tgt) => (
            <div key={tgt.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">{tgt.employee_name || tgt.employee_id}</h4>
                  <p className="text-xs text-slate-500">{tgt.period} ({tgt.target_type})</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                  Target Active
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Call Target: {tgt.achieved_calls} / {tgt.target_calls} Calls</span>
                  <span>{Math.round((tgt.achieved_calls / tgt.target_calls) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min(100, Math.round((tgt.achieved_calls / tgt.target_calls) * 100))}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Deal Conversions: {tgt.achieved_conversions} / {tgt.target_conversions} Deals</span>
                  <span>{Math.round((tgt.achieved_conversions / tgt.target_conversions) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${Math.min(100, Math.round((tgt.achieved_conversions / tgt.target_conversions) * 100))}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: INCENTIVES */}
      {activeTab === 'incentives' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Incentive ID & Period</th>
                  <th className="px-4 py-3.5">Telecaller</th>
                  <th className="px-4 py-3.5">Deals Converted</th>
                  <th className="px-4 py-3.5">Rate / Deal</th>
                  <th className="px-4 py-3.5">Total Incentive</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incentives.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-blue-700">
                      {inc.incentive_id}
                      <div className="text-[10px] text-slate-400 font-sans">{inc.month}</div>
                    </td>
                    <td className="px-4 py-3.5 font-extrabold text-slate-900">
                      {inc.employee_name || inc.employee_id}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-700">
                      {inc.leads_converted} Deals
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-mono">
                      ₹ {Number(inc.incentive_rate).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5 font-black text-emerald-700 font-mono text-sm">
                      ₹ {Number(inc.total_incentive).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        inc.status === 'Sent to Payroll' ? 'bg-purple-100 text-purple-800' :
                        inc.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {inc.status !== 'Sent to Payroll' ? (
                        <button
                          onClick={() => handleSendToPayroll(inc.id)}
                          className="px-3 py-1 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                        >
                          📤 Send to Payroll
                        </button>
                      ) : (
                        <span className="text-[11px] text-purple-700 font-bold">✓ Synced with HR</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: TEAM */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {team.map((emp) => (
            <div key={emp.employee_id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 font-black text-lg flex items-center justify-center shrink-0">
                {emp.full_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-900 text-sm truncate">{emp.full_name}</h4>
                <p className="text-xs text-blue-700 font-mono font-semibold">{emp.employee_id}</p>
                <p className="text-[11px] text-slate-500 truncate">{emp.role} • {emp.department}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD LEAD MODAL */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">+ Add Customer Lead</h3>
              <button onClick={() => setShowAddLeadModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLeadSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={leadForm.lead_name}
                  onChange={(e) => setLeadForm({ ...leadForm, lead_name: e.target.value })}
                  placeholder="e.g. Vignesh R"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    placeholder="+91 98401 22334"
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    placeholder="vignesh@gmail.com"
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lead Source</label>
                  <select
                    value={leadForm.source}
                    onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-semibold focus:outline-none"
                  >
                    <option value="Meta Ads">Meta Ads</option>
                    <option value="Google Search">Google Search</option>
                    <option value="Website Inquiry">Website Inquiry</option>
                    <option value="Direct Walk-in">Direct Walk-in</option>
                    <option value="Referral">Referral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Status</label>
                  <select
                    value={leadForm.status}
                    onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-semibold focus:outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Interested">Interested</option>
                    <option value="Follow-up Scheduled">Follow-up Scheduled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Call / Vehicle Notes</label>
                <textarea
                  rows={2}
                  value={leadForm.call_notes}
                  onChange={(e) => setLeadForm({ ...leadForm, call_notes: e.target.value })}
                  placeholder="Inquired about Maruti Swift 2021 VXi..."
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  Add Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG CALL MODAL */}
      {showLogCallModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Log Call Record</h3>
                <p className="text-xs text-slate-500">{showLogCallModal.lead_name} ({showLogCallModal.phone})</p>
              </div>
              <button onClick={() => setShowLogCallModal(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogCallSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Call Type</label>
                  <select
                    value={callForm.call_type}
                    onChange={(e) => setCallForm({ ...callForm, call_type: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-semibold focus:outline-none"
                  >
                    <option value="Outbound">Outbound Dial</option>
                    <option value="Inbound">Inbound Call</option>
                    <option value="Follow-up">Follow-up Call</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Seconds)</label>
                  <input
                    type="number"
                    value={callForm.duration_seconds}
                    onChange={(e) => setCallForm({ ...callForm, duration_seconds: Number(e.target.value) })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Call Outcome *</label>
                <select
                  value={callForm.outcome}
                  onChange={(e) => setCallForm({ ...callForm, outcome: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-bold focus:outline-none"
                >
                  <option value="Connected - Interested">Connected - Interested</option>
                  <option value="Call Back Requested">Call Back Requested</option>
                  <option value="Converted / Deal Closed">Converted / Deal Closed</option>
                  <option value="Connected - Not Interested">Connected - Not Interested</option>
                  <option value="Ringing / No Answer">Ringing / No Answer</option>
                  <option value="Busy / Disconnected">Busy / Disconnected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Conversation Notes</label>
                <textarea
                  rows={2}
                  value={callForm.notes}
                  onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })}
                  placeholder="Customer agreed to visit workshop for test drive on Saturday..."
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Follow-up Date</label>
                <input
                  type="date"
                  value={callForm.follow_up_date}
                  onChange={(e) => setCallForm({ ...callForm, follow_up_date: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLogCallModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  Save Call Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Assign Lead</h3>
              <button onClick={() => setShowAssignModal(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-600">Assign <strong>{showAssignModal.lead_name}</strong> to telecaller:</p>
              <select
                value={selectedEmployeeForAssign}
                onChange={(e) => setSelectedEmployeeForAssign(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-bold focus:outline-none"
              >
                <option value="">Select Telecaller</option>
                {team.map((t) => (
                  <option key={t.employee_id} value={t.employee_id}>
                    {t.full_name} ({t.employee_id})
                  </option>
                ))}
              </select>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleAssignLead(showAssignModal.id)}
                  className="px-5 py-2 text-xs font-extrabold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-md"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TelecallingAdminView;
