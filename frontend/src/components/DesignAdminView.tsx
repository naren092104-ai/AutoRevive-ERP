import React, { useEffect, useState } from 'react';
import { 
  Palette, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  X, 
  Eye, 
  MessageSquare, 
  RotateCcw, 
  RefreshCw, 
  Users, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { apiUrl } from '../api/client';

interface Props {
  currentAdmin: any;
}

export const DesignAdminView: React.FC<Props> = ({ currentAdmin }) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'tasks' | 'requests' | 'team'>('projects');
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState<any | null>(null);
  const [reviewForm, setReviewForm] = useState({
    status: 'Approved',
    feedback_notes: '',
    preview_url: '',
  });

  const [projectForm, setProjectForm] = useState({
    project_name: '',
    design_type: 'UI/UX Design Mockup',
    preview_url: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const headers = {
        'x-admin-id': currentAdmin?.admin_id || '',
        'x-admin-role': currentAdmin?.role || '',
      };

      const [pRes, tRes, rRes, tmRes] = await Promise.all([
        fetch(apiUrl('/design/projects'), { headers }),
        fetch(apiUrl('/design/tasks'), { headers }),
        fetch(apiUrl('/design/creative-requests'), { headers }),
        fetch(apiUrl('/design/team'), { headers }),
      ]);

      const [pData, tData, rData, tmData] = await Promise.all([
        pRes.json(),
        tRes.json(),
        rRes.json(),
        tmRes.json(),
      ]);

      if (pData.success) setProjects(pData.projects || []);
      if (tData.success) setTasks(tData.tasks || []);
      if (rData.success) setRequests(rData.requests || []);
      if (tmData.success) setTeam(tmData.team || []);
    } catch (err) {
      console.error('Error loading design data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/design/projects'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': currentAdmin?.admin_id || '',
          'x-admin-role': currentAdmin?.role || '',
        },
        body: JSON.stringify(projectForm),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        setShowProjectModal(false);
        setProjectForm({ project_name: '', design_type: 'UI/UX Design Mockup', preview_url: '' });
        loadData();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReviewModal) return;

    try {
      // If reviewing a design task vs creative request
      const isTask = showReviewModal.task_id !== undefined;
      const url = isTask
        ? apiUrl(`/design/tasks/${showReviewModal.id}`)
        : apiUrl(`/design/creative-requests/${showReviewModal.id}`);

      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': currentAdmin?.admin_id || '',
          'x-admin-role': currentAdmin?.role || '',
        },
        body: JSON.stringify(reviewForm),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        setShowReviewModal(null);
        loadData();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-indigo-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Palette className="w-6 h-6 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Creative & UI Studio Console</span>
            </div>
            <h1 className="text-2xl font-black text-white">Design & Asset Studio</h1>
            <p className="text-xs text-indigo-200/80 mt-1 max-w-xl">
              Manage product UI mockups, review creative submissions, process marketing asset requests, and approve high-resolution brand deliverables.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer border border-white/10"
              title="Refresh Design Studio"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowProjectModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Design Project</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-indigo-800/40">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-indigo-200 font-medium">Design Projects</div>
            <div className="text-2xl font-black text-white mt-0.5">{projects.length}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-amber-300 font-medium">In Review & Approvals</div>
            <div className="text-2xl font-black text-amber-400 mt-0.5">
              {projects.filter(p => p.status === 'In Review').length + tasks.filter(t => t.status === 'Under Review').length}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-purple-300 font-medium">Incoming Requests</div>
            <div className="text-2xl font-black text-purple-300 mt-0.5">{requests.length}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-emerald-300 font-medium">Designers Active</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">{team.length || 3}</div>
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
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'projects' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Projects & Boards ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Design Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'requests' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Cross-Dept Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'team' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Design Team ({team.length})
        </button>
      </div>

      {/* TAB 1: PROJECTS */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
              {p.preview_url ? (
                <div className="h-44 bg-slate-100 relative overflow-hidden group">
                  <img src={p.preview_url} alt={p.project_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-900/80 backdrop-blur-xs text-white">
                    {p.status}
                  </span>
                </div>
              ) : (
                <div className="h-32 bg-indigo-50/60 flex items-center justify-center text-indigo-400">
                  <Palette className="w-10 h-10 opacity-40" />
                </div>
              )}

              <div className="p-4 space-y-2">
                <div className="font-extrabold text-slate-900 text-sm">{p.project_name}</div>
                <div className="text-xs text-indigo-700 font-semibold">{p.design_type}</div>
                <div className="text-[11px] text-slate-500">Lead Designer: {p.designer_name || p.employee_id}</div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">Revisions: {p.revisions_count || 0}</span>
                  <button
                    onClick={() => {
                      setShowReviewModal(p);
                      setReviewForm({
                        status: p.status,
                        feedback_notes: '',
                        preview_url: p.preview_url || '',
                      });
                    }}
                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Review & Decide
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: TASKS */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Task ID & Title</th>
                <th className="px-4 py-3.5">Project</th>
                <th className="px-4 py-3.5">Designer</th>
                <th className="px-4 py-3.5">Priority</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80">
                  <td className="px-5 py-3.5">
                    <div className="font-mono font-bold text-indigo-700">{t.task_id}</div>
                    <div className="font-extrabold text-slate-900">{t.task_title}</div>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-600">{t.project_name || 'Design Sprint'}</td>
                  <td className="px-4 py-3.5 text-slate-700">{t.designer_name || t.designer_id}</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">{t.priority}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      t.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                      t.status === 'Under Review' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => {
                        setShowReviewModal(t);
                        setReviewForm({
                          status: t.status,
                          feedback_notes: t.feedback_notes || '',
                          preview_url: t.preview_url || '',
                        });
                      }}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: CROSS DEPT REQUESTS */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Request ID & Title</th>
                <th className="px-4 py-3.5">Requested By</th>
                <th className="px-4 py-3.5">Asset Type</th>
                <th className="px-4 py-3.5">Due Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80">
                  <td className="px-5 py-3.5">
                    <div className="font-mono font-bold text-purple-700">{r.request_id}</div>
                    <div className="font-extrabold text-slate-900">{r.title}</div>
                    <div className="text-[10px] text-slate-400">{r.description}</div>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-700">{r.requested_by} ({r.from_department})</td>
                  <td className="px-4 py-3.5 font-semibold text-indigo-700">{r.asset_type}</td>
                  <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">{r.due_date}</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800">
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => {
                        setShowReviewModal(r);
                        setReviewForm({
                          status: 'Approved & Completed',
                          feedback_notes: '',
                          preview_url: r.preview_url || '',
                        });
                      }}
                      className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Process & Approve
                    </button>
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
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 font-black text-lg flex items-center justify-center shrink-0">
                {emp.full_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-900 text-sm truncate">{emp.full_name}</h4>
                <p className="text-xs text-indigo-700 font-mono font-semibold">{emp.employee_id}</p>
                <p className="text-[11px] text-slate-500 truncate">{emp.role} • {emp.department}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">+ New Design Project</h3>
              <button onClick={() => setShowProjectModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateProject} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={projectForm.project_name}
                  onChange={(e) => setProjectForm({ ...projectForm, project_name: e.target.value })}
                  placeholder="e.g. Diagnostic Scan Customer Report 2.0"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Design Category</label>
                <select
                  value={projectForm.design_type}
                  onChange={(e) => setProjectForm({ ...projectForm, design_type: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-bold focus:outline-none"
                >
                  <option value="UI/UX Design Mockup">UI/UX Design Mockup</option>
                  <option value="Digital Ad Creatives">Digital Ad Creatives</option>
                  <option value="Brand Identity Asset">Brand Identity Asset</option>
                  <option value="Print Collateral">Print Collateral</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Figma / Image Preview URL</label>
                <input
                  type="url"
                  value={projectForm.preview_url}
                  onChange={(e) => setProjectForm({ ...projectForm, preview_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowProjectModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW & APPROVAL MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Review Creative Deliverable</h3>
              <button onClick={() => setShowReviewModal(null)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleReviewSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Decision / Status</label>
                <select
                  value={reviewForm.status}
                  onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-bold focus:outline-none"
                >
                  <option value="Approved">✓ Approve Deliverable</option>
                  <option value="Approved & Completed">✓ Approve & Mark Completed</option>
                  <option value="Revision Required">🔄 Request Revision</option>
                  <option value="Under Review">⏳ Keep in Review</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Feedback / Change Notes</label>
                <textarea
                  rows={2}
                  value={reviewForm.feedback_notes}
                  onChange={(e) => setReviewForm({ ...reviewForm, feedback_notes: e.target.value })}
                  placeholder="Increase font size of warranty badge, adjust brand orange tint..."
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Creative Preview URL</label>
                <input
                  type="url"
                  value={reviewForm.preview_url}
                  onChange={(e) => setReviewForm({ ...reviewForm, preview_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowReviewModal(null)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md">Confirm Decision</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default DesignAdminView;
