import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Megaphone, 
  Target, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Calendar, 
  DollarSign, 
  Layers, 
  BarChart3, 
  RefreshCw, 
  Send,
  Users
} from 'lucide-react';
import { apiUrl } from '../api/client';

interface Props {
  currentAdmin: any;
}

export const MarketingAdminView: React.FC<Props> = ({ currentAdmin }) => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'tasks' | 'creative_requests' | 'analytics' | 'team'>('campaigns');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [creativeRequests, setCreativeRequests] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCreativeModal, setShowCreativeModal] = useState(false);

  // Form states
  const [campaignForm, setCampaignForm] = useState({
    campaign_name: '',
    channel: 'Google / Meta Ads',
    target_count: 100,
    incentive: 10000,
  });

  const [taskForm, setTaskForm] = useState({
    task_title: '',
    deadline: '',
    priority: 'High',
    notes: '',
  });

  const [creativeForm, setCreativeForm] = useState({
    title: '',
    asset_type: 'Instagram Post',
    description: '',
    due_date: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const headers = {
        'x-admin-id': currentAdmin?.admin_id || '',
        'x-admin-role': currentAdmin?.role || '',
      };

      const [cRes, tRes, crRes, tmRes] = await Promise.all([
        fetch(apiUrl('/marketing/campaigns'), { headers }),
        fetch(apiUrl('/marketing/tasks'), { headers }),
        fetch(apiUrl('/design/creative-requests'), { headers }),
        fetch(apiUrl('/marketing/team'), { headers }),
      ]);

      const [cData, tData, crData, tmData] = await Promise.all([
        cRes.json(),
        tRes.json(),
        crRes.json(),
        tmRes.json(),
      ]);

      if (cData.success) setCampaigns(cData.campaigns || []);
      if (tData.success) setTasks(tData.tasks || []);
      if (crData.success) setCreativeRequests(crData.requests || []);
      if (tmData.success) setTeam(tmData.team || []);
    } catch (err) {
      console.error('Error loading marketing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/marketing/campaigns'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': currentAdmin?.admin_id || '',
          'x-admin-role': currentAdmin?.role || '',
        },
        body: JSON.stringify(campaignForm),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        setShowCampaignModal(false);
        setCampaignForm({
          campaign_name: '',
          channel: 'Google / Meta Ads',
          target_count: 100,
          incentive: 10000,
        });
        loadData();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/marketing/tasks'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': currentAdmin?.admin_id || '',
          'x-admin-role': currentAdmin?.role || '',
        },
        body: JSON.stringify(taskForm),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        setShowTaskModal(false);
        loadData();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleCreateCreativeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/design/creative-requests'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': currentAdmin?.admin_id || '',
          'x-admin-role': currentAdmin?.role || '',
        },
        body: JSON.stringify({
          ...creativeForm,
          from_department: 'Marketing',
          requested_by: `${currentAdmin?.full_name || 'Marketing Admin'} (Marketing)`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        setShowCreativeModal(false);
        loadData();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const totalLeads = campaigns.reduce((sum, c) => sum + Number(c.leads_generated || 0), 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + Number(c.conversions || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-emerald-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">Growth & Campaigns Console</span>
            </div>
            <h1 className="text-2xl font-black text-white">Marketing & Ad Operations</h1>
            <p className="text-xs text-emerald-200/80 mt-1 max-w-xl">
              Launch paid campaigns, track conversion ROI, request creative collateral from the Design Admin, and delegate sprint tasks.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer border border-white/10"
              title="Refresh Marketing Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowCreativeModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Request Design Asset</span>
            </button>
            <button
              onClick={() => setShowCampaignModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Campaign</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-emerald-800/40">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-emerald-200 font-medium">Active Campaigns</div>
            <div className="text-2xl font-black text-white mt-0.5">
              {campaigns.filter(c => c.status === 'Active').length}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-emerald-300 font-medium">Total Leads Generated</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">{totalLeads}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-teal-300 font-medium">Deal Conversions</div>
            <div className="text-2xl font-black text-teal-300 mt-0.5">{totalConversions}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-blue-300 font-medium">Overall Conversion Rate</div>
            <div className="text-2xl font-black text-blue-300 mt-0.5">
              {totalLeads > 0 ? ((totalConversions / totalLeads) * 100).toFixed(1) : '15.2'}%
            </div>
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'campaigns' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Campaigns ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'tasks' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Marketing Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('creative_requests')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'creative_requests' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Design Asset Requests
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'team' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Marketing Team ({team.length})
        </button>
      </div>

      {/* TAB 1: CAMPAIGNS */}
      {activeTab === 'campaigns' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {campaigns.map((camp) => (
            <div key={camp.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">{camp.campaign_name}</h4>
                  <p className="text-xs text-emerald-700 font-semibold">{camp.channel}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  camp.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {camp.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <div className="text-slate-400 text-[10px]">Leads Generated</div>
                  <div className="text-lg font-black text-slate-900">{camp.leads_generated} / {camp.target_count}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Deals Converted</div>
                  <div className="text-lg font-black text-emerald-600">{camp.conversions}</div>
                </div>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full" 
                  style={{ width: `${Math.min(100, Math.round((camp.leads_generated / (camp.target_count || 1)) * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Create Task</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Task ID & Title</th>
                  <th className="px-4 py-3.5">Assigned Marketer</th>
                  <th className="px-4 py-3.5">Deadline</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-3.5">
                      <div className="font-mono font-bold text-emerald-700">{t.task_id}</div>
                      <div className="font-extrabold text-slate-900">{t.task_title}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 font-medium">{t.assigned_name || t.assigned_to}</td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">{t.deadline}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">{t.priority}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">{t.status}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">{t.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CREATIVE REQUESTS */}
      {activeTab === 'creative_requests' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Request ID & Title</th>
                <th className="px-4 py-3.5">Asset Type</th>
                <th className="px-4 py-3.5">Assigned Designer</th>
                <th className="px-4 py-3.5">Due Date</th>
                <th className="px-4 py-3.5">Design Team Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {creativeRequests.map((cr) => (
                <tr key={cr.id} className="hover:bg-slate-50/80">
                  <td className="px-5 py-3.5">
                    <div className="font-mono font-bold text-purple-700">{cr.request_id}</div>
                    <div className="font-extrabold text-slate-900">{cr.title}</div>
                    <div className="text-[10px] text-slate-400">{cr.description}</div>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-700">{cr.asset_type}</td>
                  <td className="px-4 py-3.5 text-slate-600">{cr.assigned_name || cr.assigned_designer || 'Pending'}</td>
                  <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">{cr.due_date}</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800">
                      {cr.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: TEAM */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {team.map((emp) => (
            <div key={emp.employee_id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 font-black text-lg flex items-center justify-center shrink-0">
                {emp.full_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-900 text-sm truncate">{emp.full_name}</h4>
                <p className="text-xs text-emerald-700 font-mono font-semibold">{emp.employee_id}</p>
                <p className="text-[11px] text-slate-500 truncate">{emp.role} • {emp.department}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CAMPAIGN MODAL */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">+ Launch Marketing Campaign</h3>
              <button onClick={() => setShowCampaignModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleLaunchCampaign} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  required
                  value={campaignForm.campaign_name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, campaign_name: e.target.value })}
                  placeholder="e.g. Navaratri Mega Auto Carnival 2026"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Channel / Platform</label>
                <select
                  value={campaignForm.channel}
                  onChange={(e) => setCampaignForm({ ...campaignForm, channel: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-bold focus:outline-none"
                >
                  <option value="Google / Meta Ads">Google / Meta Ads</option>
                  <option value="Instagram & YouTube">Instagram & YouTube</option>
                  <option value="LinkedIn B2B">LinkedIn B2B</option>
                  <option value="Outdoor & Radio">Outdoor & Radio</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Lead Count</label>
                  <input
                    type="number"
                    value={campaignForm.target_count}
                    onChange={(e) => setCampaignForm({ ...campaignForm, target_count: Number(e.target.value) })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Team Incentive (₹)</label>
                  <input
                    type="number"
                    value={campaignForm.incentive}
                    onChange={(e) => setCampaignForm({ ...campaignForm, incentive: Number(e.target.value) })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowCampaignModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md">Launch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">+ Create Marketing Task</h3>
              <button onClick={() => setShowTaskModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateTask} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={taskForm.task_title}
                  onChange={(e) => setTaskForm({ ...taskForm, task_title: e.target.value })}
                  placeholder="Setup Meta Pixel Conversion Tracking..."
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Deadline *</label>
                  <input
                    type="date"
                    required
                    value={taskForm.deadline}
                    onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-semibold focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATIVE REQUEST MODAL */}
      {showCreativeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Request Design Collateral</h3>
              <button onClick={() => setShowCreativeModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateCreativeRequest} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Creative Title *</label>
                <input
                  type="text"
                  required
                  value={creativeForm.title}
                  onChange={(e) => setCreativeForm({ ...creativeForm, title: e.target.value })}
                  placeholder="Used Car Financing 0% Downpayment Banner"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Asset Format</label>
                  <select
                    value={creativeForm.asset_type}
                    onChange={(e) => setCreativeForm({ ...creativeForm, asset_type: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-bold focus:outline-none"
                  >
                    <option value="Instagram Post">Instagram Post (1:1)</option>
                    <option value="Instagram Reel / Story">Story / Reel (9:16)</option>
                    <option value="Website Banner">Website Banner</option>
                    <option value="Ad Creative">Ad Creative</option>
                    <option value="Brochure / Flyer">Brochure / Flyer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={creativeForm.due_date}
                    onChange={(e) => setCreativeForm({ ...creativeForm, due_date: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description & Copy Text</label>
                <textarea
                  rows={2}
                  value={creativeForm.description}
                  onChange={(e) => setCreativeForm({ ...creativeForm, description: e.target.value })}
                  placeholder="Include AutoRevive logo, car warranty badge, and contact number..."
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowCreativeModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 text-xs font-extrabold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-md">Submit to Design Team</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default MarketingAdminView;
