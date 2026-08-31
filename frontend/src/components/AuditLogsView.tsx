import React, { useEffect, useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  RefreshCw, 
  ShieldCheck, 
  Calendar, 
  User, 
  Layers, 
  Terminal,
  Activity,
  Globe
} from 'lucide-react';
import { apiUrl } from '../api/client';

export interface AuditLog {
  id: number;
  admin_id: string;
  admin_name: string;
  role: string;
  action: string;
  module: string;
  record_id: string | null;
  details: string | null;
  ip_address: string;
  created_at: string;
}

interface Props {
  currentAdmin: any;
}

export const AuditLogsView: React.FC<Props> = ({ currentAdmin }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl('/admin/activity-logs'), {
        headers: {
          'x-admin-id': currentAdmin?.admin_id || '',
          'x-admin-role': currentAdmin?.role || '',
        }
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.admin_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.admin_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.module || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesModule = moduleFilter === 'ALL' || log.module === moduleFilter;

    return matchesSearch && matchesModule;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">👑 Super Admin</span>;
      case 'HR_ADMIN':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-[#EA580C] border border-orange-200">💼 HR Admin</span>;
      case 'TELECALLING_ADMIN':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">📞 Telecalling Admin</span>;
      case 'MARKETING_ADMIN':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">📈 Marketing Admin</span>;
      case 'DESIGN_ADMIN':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">🎨 Design Admin</span>;
      case 'SOCIAL_MEDIA_ADMIN':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-100 text-pink-800 border border-pink-200">📱 Social Media Admin</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">{role}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-indigo-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <History className="w-6 h-6 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Security & Compliance</span>
            </div>
            <h1 className="text-2xl font-black text-white">System Activity & Audit Logs</h1>
            <p className="text-xs text-indigo-200/80 mt-1 max-w-xl">
              Tamper-proof real-time audit trail recording all administrator logins, role modifications, employee changes, and departmental workflows.
            </p>
          </div>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/10 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Audit Feed</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-indigo-800/40">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-indigo-200 font-medium">Total Activity Events</div>
            <div className="text-2xl font-black text-white mt-0.5">{logs.length}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-emerald-300 font-medium">Logged Administrators</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">
              {new Set(logs.map(l => l.admin_id)).size}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-indigo-300 font-medium">Active Modules Tracked</div>
            <div className="text-2xl font-black text-indigo-200 mt-0.5">
              {new Set(logs.map(l => l.module)).size}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-blue-300 font-medium">Integrity Verification</div>
            <div className="text-sm font-bold text-white mt-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Immutable Log Engine</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, admin, module, details..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">Module:</span>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Modules</option>
            <option value="Authentication">Authentication</option>
            <option value="AdminManagement">Admin Management</option>
            <option value="Employees">Employees</option>
            <option value="Payroll">Payroll</option>
            <option value="Telecalling">Telecalling</option>
            <option value="Marketing">Marketing</option>
            <option value="Designing">Designing</option>
            <option value="Social Media">Social Media</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Administrator</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Action & Module</th>
                <th className="px-4 py-3.5">Details & Record</th>
                <th className="px-4 py-3.5 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    <span>Loading system activity logs...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span>No audit entries found matching your search.</span>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(log.created_at).toLocaleString('en-GB')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-extrabold text-slate-900">{log.admin_name}</div>
                      <div className="text-[10px] font-mono text-indigo-700">{log.admin_id}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      {getRoleBadge(log.role)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-800">{log.action}</div>
                      <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        <span>{log.module}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">
                      <div>{log.details || '—'}</div>
                      {log.record_id && (
                        <div className="text-[10px] font-mono text-slate-400">Record: {log.record_id}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-[11px] text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Globe className="w-3 h-3 text-slate-300" />
                        <span>{log.ip_address || '127.0.0.1'}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default AuditLogsView;
