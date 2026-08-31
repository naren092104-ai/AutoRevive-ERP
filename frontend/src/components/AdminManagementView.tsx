import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Filter, 
  Key, 
  UserX, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Edit3, 
  Shield, 
  RefreshCw, 
  Clock, 
  Mail, 
  Phone, 
  Building, 
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';
import { apiUrl } from '../api/client';

export interface AdminUser {
  id: number;
  admin_id: string;
  full_name: string;
  email: string;
  mobile: string | null;
  role: 'SUPER_ADMIN' | 'HR_ADMIN' | 'TELECALLING_ADMIN' | 'MARKETING_ADMIN' | 'DESIGN_ADMIN' | 'SOCIAL_MEDIA_ADMIN' | 'DEPARTMENT_MANAGER';
  department: string;
  password_hash?: string;
  status: 'Active' | 'Inactive';
  last_login: string | null;
  created_at: string;
}

interface Props {
  currentAdmin: any;
}

export const AdminManagementView: React.FC<Props> = ({ currentAdmin }) => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Live password reveal & copy state
  const [revealedPasswords, setRevealedPasswords] = useState<Record<number, boolean>>({});
  const [copiedAdminId, setCopiedAdminId] = useState<number | null>(null);

  // Admin Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<AdminUser | null>(null);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState<AdminUser | null>(null);

  // Admin Forms
  const [createForm, setCreateForm] = useState({
    full_name: '',
    email: '',
    mobile: '',
    role: 'HR_ADMIN',
    department: 'Human Resources',
    password: 'AutoRevive@2026',
  });

  const [editForm, setEditForm] = useState({
    full_name: '',
    mobile: '',
    role: 'HR_ADMIN',
    department: '',
    status: 'Active',
  });

  const [newPassword, setNewPassword] = useState('AutoRevive@2026');

  // Fetch Admins
  const fetchAdmins = async () => {
    try {
      setLoadingAdmins(true);
      const res = await fetch(apiUrl('/admins'), {
        headers: {
          'x-admin-id': currentAdmin?.admin_id || '',
          'x-admin-role': currentAdmin?.role || '',
        }
      });
      const data = await res.json();
      if (data.success) {
        setAdmins(data.admins || []);
      }
    } catch (err: any) {
      console.error('Error fetching admins:', err);
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const togglePasswordVisibility = (id: number) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopyAdminCredentials = (adm: AdminUser) => {
    const portalUrl = typeof window !== 'undefined' ? window.location.origin : 'https://autorevives.com';
    const text = `AutoRevive Admin Portal Credentials:\n-----------------------------------------\nAdmin ID: ${adm.admin_id}\nName: ${adm.full_name}\nRole: ${adm.role.replace(/_/g, ' ')}\nOfficial Email: ${adm.email}\nPassword: ${adm.password_hash || 'AutoRevive@2026'}\nPortal URL: ${portalUrl}\n-----------------------------------------`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedAdminId(adm.id);
    setTimeout(() => {
      setCopiedAdminId(null);
    }, 2500);
  };

  const handleRoleChangeInCreate = (role: string) => {
    const roleDeptMap: Record<string, string> = {
      'SUPER_ADMIN': 'Executive Office',
      'HR_ADMIN': 'Human Resources',
      'TELECALLING_ADMIN': 'Telecalling',
      'MARKETING_ADMIN': 'Marketing',
      'DESIGN_ADMIN': 'Designing',
      'SOCIAL_MEDIA_ADMIN': 'Social Media',
      'DEPARTMENT_MANAGER': 'Operations',
    };
    setCreateForm(prev => ({
      ...prev,
      role,
      department: roleDeptMap[role] || prev.department
    }));
  };

  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.full_name || !createForm.email) {
      setNotification({ type: 'error', message: 'Name and email are required.' });
      return;
    }

    try {
      const res = await fetch(apiUrl('/admins'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-id': currentAdmin?.admin_id || '',
          'x-admin-role': currentAdmin?.role || '',
          'x-admin-name': currentAdmin?.full_name || '',
        },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        setShowCreateModal(false);
        setCreateForm({
          full_name: '',
          email: '',
          mobile: '',
          role: 'HR_ADMIN',
          department: 'Human Resources',
          password: 'AutoRevive@2026',
        });
        fetchAdmins();
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleEditAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;

    try {
      const res = await fetch(apiUrl(`/admins/${showEditModal.id}`), {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-id': currentAdmin?.admin_id || '',
          'x-admin-role': currentAdmin?.role || '',
          'x-admin-name': currentAdmin?.full_name || '',
        },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        setShowEditModal(null);
        fetchAdmins();
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPasswordResetModal) return;

    try {
      const res = await fetch(apiUrl(`/admins/${showPasswordResetModal.id}/reset-password`), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-id': currentAdmin?.admin_id || '',
          'x-admin-role': currentAdmin?.role || '',
          'x-admin-name': currentAdmin?.full_name || '',
        },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        setShowPasswordResetModal(null);
        setNewPassword('AutoRevive@2026');
        fetchAdmins();
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleToggleStatus = async (adm: AdminUser) => {
    const nextStatus = adm.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await fetch(apiUrl(`/admins/${adm.id}/status`), {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-id': currentAdmin?.admin_id || '',
          'x-admin-role': currentAdmin?.role || '',
          'x-admin-name': currentAdmin?.full_name || '',
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        fetchAdmins();
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleDeleteAdmin = async (adm: AdminUser) => {
    if (!window.confirm(`Are you sure you want to delete administrator account #${adm.admin_id} (${adm.full_name})? This user will no longer be able to log in.`)) {
      return;
    }

    try {
      const res = await fetch(apiUrl(`/admins/${adm.id}`), {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-id': currentAdmin?.admin_id || '',
          'x-admin-role': currentAdmin?.role || '',
          'x-admin-name': currentAdmin?.full_name || '',
        },
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: data.message });
        fetchAdmins();
      } else {
        setNotification({ type: 'error', message: data.message || 'Unable to delete admin.' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete admin.' });
    }
  };

  const filteredAdmins = admins.filter(adm => {
    const matchesSearch = 
      adm.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adm.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adm.admin_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adm.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || adm.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || adm.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">👑 Super Admin</span>;
      case 'HR_ADMIN':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-orange-100 text-[#EA580C] border border-orange-200">💼 HR Admin</span>;
      case 'TELECALLING_ADMIN':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">📞 Telecalling Admin</span>;
      case 'MARKETING_ADMIN':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">📈 Marketing Admin</span>;
      case 'DESIGN_ADMIN':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">🎨 Design Admin</span>;
      case 'SOCIAL_MEDIA_ADMIN':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-pink-100 text-pink-800 border border-pink-200">📱 Social Media Admin</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">🏢 {role}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-purple-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-6 h-6 text-purple-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-purple-300">RBAC Security Console</span>
            </div>
            <h1 className="text-2xl font-black text-white">Admin Portals &amp; Passwords Management</h1>
            <p className="text-xs text-purple-200/80 mt-1 max-w-xl">
              Create, configure, and monitor multi-department administrators with live password visibility, 1-click credential copying, and centralized role-based access control.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAdmins}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer border border-white/10"
              title="Refresh Admins"
            >
              <RefreshCw className={`w-4 h-4 ${loadingAdmins ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#EA580C] hover:bg-[#c2410c] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Create Official Admin</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-purple-800/40">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-purple-200 font-medium">Total Admin Portals</div>
            <div className="text-2xl font-black text-white mt-0.5">{admins.length}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-emerald-300 font-medium">Active Admin Accounts</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">
              {admins.filter(a => a.status === 'Active').length}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-purple-300 font-medium">Admin Roles</div>
            <div className="text-2xl font-black text-purple-200 mt-0.5">6 Active Roles</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-[11px] text-blue-300 font-medium">Admin Portal Access</div>
            <div className="text-xs font-mono font-bold text-white mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Password &amp; OTP Enabled</span>
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

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, admin ID..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Role:</span>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="HR_ADMIN">HR Admin</option>
            <option value="TELECALLING_ADMIN">Telecalling Admin</option>
            <option value="MARKETING_ADMIN">Marketing Admin</option>
            <option value="DESIGN_ADMIN">Design Admin</option>
            <option value="SOCIAL_MEDIA_ADMIN">Social Media Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Admin ID &amp; Name</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Contact Details</th>
                <th className="px-4 py-3.5">Admin Password (Live)</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Last Login</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingAdmins ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                    <span>Loading AutoRevive system administrators...</span>
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span>No administrator accounts found matching your filter.</span>
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((adm) => {
                  const isRevealed = revealedPasswords[adm.id];
                  const isCopied = copiedAdminId === adm.id;

                  return (
                    <tr key={adm.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{adm.full_name}</div>
                        <div className="text-[11px] font-mono text-purple-700 font-semibold">{adm.admin_id}</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getRoleBadge(adm.role)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{adm.department}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{adm.email}</span>
                        </div>
                        {adm.mobile && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{adm.mobile}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                          <div className="font-mono text-xs font-bold text-slate-800 tracking-wider">
                            {isRevealed ? (adm.password_hash || 'AutoRevive@2026') : '••••••••••••'}
                          </div>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(adm.id)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            title={isRevealed ? 'Hide Password' : 'Show Password'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyAdminCredentials(adm)}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              isCopied ? 'bg-emerald-100 text-emerald-700 font-bold' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
                            }`}
                            title="Copy Admin Credentials"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {isCopied && (
                          <span className="ml-2 text-[10px] font-bold text-emerald-600 animate-in fade-in">
                            Copied!
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          adm.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${adm.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>{adm.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{adm.last_login ? new Date(adm.last_login).toLocaleString() : 'Never logged in'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setShowEditModal(adm);
                              setEditForm({
                                full_name: adm.full_name,
                                mobile: adm.mobile || '',
                                role: adm.role,
                                department: adm.department,
                                status: adm.status,
                              });
                            }}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                            title="Edit Admin"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setShowPasswordResetModal(adm);
                              setNewPassword(adm.password_hash || 'AutoRevive@2026');
                            }}
                            className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors cursor-pointer"
                            title="Reset / Change Password"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(adm)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              adm.status === 'Active' ? 'hover:bg-rose-50 text-rose-600' : 'hover:bg-emerald-50 text-emerald-600'
                            }`}
                            title={adm.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                          >
                            {adm.status === 'Active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                          {adm.role !== 'SUPER_ADMIN' && adm.email !== 'admin@autorevives.com' && (
                            <button
                              onClick={() => handleDeleteAdmin(adm)}
                              className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                              title="Delete Admin Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE ADMIN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Create Official Admin</h3>
                  <p className="text-xs text-slate-500">Add a new role-based administrator account</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdminSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="ramesh@autorevives.com"
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    value={createForm.mobile}
                    onChange={(e) => setCreateForm({ ...createForm, mobile: e.target.value })}
                    placeholder="+91 94426 93306"
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Admin Role *</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => handleRoleChangeInCreate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="SUPER_ADMIN">👑 Super Admin</option>
                    <option value="HR_ADMIN">💼 HR Admin</option>
                    <option value="TELECALLING_ADMIN">📞 Telecalling Admin</option>
                    <option value="MARKETING_ADMIN">📈 Marketing Admin</option>
                    <option value="DESIGN_ADMIN">🎨 Design Admin</option>
                    <option value="SOCIAL_MEDIA_ADMIN">📱 Social Media Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={createForm.department}
                    onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Password *</label>
                <input
                  type="text"
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="AutoRevive@2026"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold text-white bg-[#EA580C] hover:bg-[#c2410c] rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Create Admin Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ADMIN MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Edit Admin Details</h3>
                  <p className="text-xs text-slate-500">{showEditModal.admin_id} - {showEditModal.email}</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditAdminSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Admin Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="SUPER_ADMIN">👑 Super Admin</option>
                    <option value="HR_ADMIN">💼 HR Admin</option>
                    <option value="TELECALLING_ADMIN">📞 Telecalling Admin</option>
                    <option value="MARKETING_ADMIN">📈 Marketing Admin</option>
                    <option value="DESIGN_ADMIN">🎨 Design Admin</option>
                    <option value="SOCIAL_MEDIA_ADMIN">📱 Social Media Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    value={editForm.mobile}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN PASSWORD RESET MODAL */}
      {showPasswordResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Reset Admin Password</h3>
                  <p className="text-xs text-slate-500">{showPasswordResetModal.full_name} ({showPasswordResetModal.email})</p>
                </div>
              </div>
              <button onClick={() => setShowPasswordResetModal(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="AutoRevive@2026"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordResetModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Confirm Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminManagementView;
