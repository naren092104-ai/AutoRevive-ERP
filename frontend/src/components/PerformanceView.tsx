import React, { useEffect, useState } from 'react';
import { Award, GraduationCap, Star, CheckCircle2, AlertCircle, ArrowRight, UserCheck, Plus, CheckSquare, Clock, Search } from 'lucide-react';
import { apiUrl } from '../api/client';

export const PerformanceView: React.FC<{ onIssuePlacementOffer?: (intern: any) => void }> = ({ onIssuePlacementOffer }) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'internships' | 'appraisals'>('tasks');
  const [interns, setInterns] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isAssignTaskModalOpen, setIsAssignTaskModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [newTask, setNewTask] = useState({
    employee_id: 'AR-EMP-2026-0001',
    title: '',
    project: 'AutoRevive Engineering',
    assigned_by: 'Jemsina Banu (HR Manager)',
    priority: 'High',
    due_date: '2026-09-10',
    description: '',
  });

  const loadInternships = async () => {
    try {
      const res = await fetch(apiUrl('/internships'));
      const data = await res.json();
      if (data.success) setInterns(data.internships || []);
    } catch (err) {
      console.warn('Could not load internships:', err);
    }
  };

  const loadTasks = async () => {
    try {
      const res = await fetch(apiUrl('/tasks'));
      const data = await res.json();
      if (data.success) setTasks(data.tasks || []);
    } catch (err) {
      console.warn('Could not load tasks:', err);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await fetch(apiUrl('/employees'));
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees || []);
        if (data.employees.length > 0 && !newTask.employee_id) {
          setNewTask((prev) => ({ ...prev, employee_id: data.employees[0].employee_id }));
        }
      }
    } catch (err) {
      console.warn('Could not load employees:', err);
    }
  };

  useEffect(() => {
    void loadInternships();
    void loadTasks();
    void loadEmployees();
  }, []);

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/tasks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Task assigned successfully to ${newTask.employee_id} and notified in Employee Portal.`);
        setIsAssignTaskModalOpen(false);
        setNewTask({
          employee_id: employees[0]?.employee_id || 'AR-EMP-2026-0001',
          title: '',
          project: 'AutoRevive Engineering',
          assigned_by: 'Jemsina Banu (HR Manager)',
          priority: 'High',
          due_date: '2026-09-10',
          description: '',
        });
        void loadTasks();
      }
    } catch (err: any) {
      setStatusMessage('Error assigning task.');
    }
  };

  const handleUpdatePlacement = async (internId: number, eligible: 'YES' | 'NO') => {
    try {
      const res = await fetch(apiUrl(`/internships/${internId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placement_eligible: eligible }),
      });
      const d = await res.json();
      if (d.success) {
        setStatusMessage(`Placement eligibility updated to ${eligible}.`);
        void loadInternships();
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Update failed.');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const term = searchTerm.toLowerCase();
    return !term ||
      t.title?.toLowerCase().includes(term) ||
      t.employee_name?.toLowerCase().includes(term) ||
      t.employee_id?.toLowerCase().includes(term) ||
      t.project?.toLowerCase().includes(term);
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

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 pt-3 rounded-2xl shadow-2xs gap-6">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-3 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'tasks'
              ? 'text-[#EA580C] border-b-2 border-[#EA580C]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Employee Tasks &amp; Sprint Deliverables ({tasks.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('internships')}
          className={`pb-3 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'internships'
              ? 'text-[#EA580C] border-b-2 border-[#EA580C]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Internship Evaluation &amp; Placement (PPO)</span>
        </button>
        <button
          onClick={() => setActiveTab('appraisals')}
          className={`pb-3 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'appraisals'
              ? 'text-[#EA580C] border-b-2 border-[#EA580C]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Appraisal Ratings</span>
        </button>
      </div>

      {activeTab === 'tasks' ? (
        <>
          {/* Action Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tasks, project, or employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#EA580C] w-72"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            <button
              onClick={() => setIsAssignTaskModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold text-xs rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Assign New Task to Employee</span>
            </button>
          </div>

          {/* Tasks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      task.priority === 'Urgent' || task.priority === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {task.priority} Priority
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {task.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900">{task.title}</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{task.description}</p>
                  
                  <div className="text-[10.5px] text-slate-500 space-y-0.5 pt-1">
                    <p>Assigned Employee: <strong className="text-slate-800">{task.employee_name || task.employee_id}</strong> ({task.employee_id})</p>
                    <p>Project: <strong className="text-slate-800">{task.project}</strong></p>
                    <p>Due Date: <strong className="text-slate-800">{task.due_date}</strong></p>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-[10.5px] font-mono font-semibold text-slate-600">
                    <span>Live Employee Progress</span>
                    <span className="font-bold text-[#EA580C]">{task.progress || 0}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#EA580C] rounded-full transition-all" style={{ width: `${task.progress || 0}%` }} />
                  </div>
                  {task.notes && (
                    <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg italic">
                      Notes from Employee: "{task.notes}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : activeTab === 'internships' ? (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Enrolled Interns</p>
                <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">24 Active Trainees</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Placement Conversion (PPO)</p>
                <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">85% Eligibility</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Average Score</p>
                <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">88.5 / 100</p>
              </div>
            </div>
          </div>

          {/* Internship & Performance Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Internship Performance &amp; Placement Evaluation Board
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Evaluation Cycle: Q3 2026</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Intern ID</th>
                    <th className="px-4 py-3">Candidate Name</th>
                    <th className="px-4 py-3">Assigned Role</th>
                    <th className="px-4 py-3">Mentor</th>
                    <th className="px-4 py-3">Tasks</th>
                    <th className="px-4 py-3">Performance</th>
                    <th className="px-4 py-3">PPO Eligible</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {interns.map((intern) => (
                    <tr key={intern.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[#EA580C]">{intern.intern_id}</td>
                      <td className="px-4 py-3 text-slate-900 font-bold">{intern.full_name}</td>
                      <td className="px-4 py-3 text-slate-600">{intern.role}</td>
                      <td className="px-4 py-3 text-slate-600">{intern.mentor_name}</td>
                      <td className="px-4 py-3 font-mono">{intern.tasks_completed || 12} done</td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-600">{intern.performance_score || 92}%</td>
                      <td className="px-4 py-3">
                        <select
                          value={intern.placement_eligible || 'YES'}
                          onChange={(e) => handleUpdatePlacement(intern.id, e.target.value as any)}
                          className="px-2 py-1 rounded-lg text-xs font-bold border border-slate-200 bg-white"
                        >
                          <option value="YES">YES</option>
                          <option value="NO">NO</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {onIssuePlacementOffer && intern.placement_eligible === 'YES' && (
                          <button
                            onClick={() => onIssuePlacementOffer(intern)}
                            className="px-3 py-1 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>Issue Offer</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Appraisals Tab */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <h4 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
            Quarterly Employee Appraisal &amp; Feedback System
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {employees.map((emp) => (
              <div key={emp.employee_id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <h5 className="text-xs font-bold text-slate-900">{emp.full_name}</h5>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Grade: A+ (94.5%)
                  </span>
                </div>
                <p className="text-[11px] font-mono text-[#EA580C]">{emp.employee_id} • {emp.department}</p>
                <p className="text-[11px] text-slate-600">
                  Target milestone turnaround: 95%. Adherence to AutoRevive technical quality standards.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Task Modal */}
      {isAssignTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Assign Task to Employee</h3>
              <button onClick={() => setIsAssignTaskModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAssignTask} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Select Employee</label>
                <select
                  value={newTask.employee_id}
                  onChange={(e) => setNewTask({ ...newTask, employee_id: e.target.value })}
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
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement OBD-II Sensor Telemetry Parser"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Project</label>
                  <input
                    type="text"
                    required
                    value={newTask.project}
                    onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Description / Deliverable Specs</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Specific requirements for employee..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignTaskModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default PerformanceView;
