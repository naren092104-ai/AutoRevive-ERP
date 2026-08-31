import React, { useState } from 'react';
import { Search, Bell, LogOut, Settings, User, ShieldCheck, ChevronDown, ExternalLink, Shield } from 'lucide-react';

interface Props {
  pageTitle?: string;
  breadcrumb?: string;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  onLogout?: () => void;
  onNavigateSettings?: () => void;
  currentAdmin?: any;
  onSwitchRole?: (role: string) => void;
}

export const TopHeader: React.FC<Props> = ({
  pageTitle = 'Document Center',
  breadcrumb = 'Home > HR > Document Center',
  searchTerm = '',
  onSearchChange,
  onLogout,
  onNavigateSettings,
  currentAdmin,
  onSwitchRole,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const adminName = currentAdmin?.full_name || 'Narendhar D';
  const adminRole = currentAdmin?.role || 'SUPER_ADMIN';
  const adminEmail = currentAdmin?.email || 'admin@autorevives.com';
  const adminId = currentAdmin?.admin_id || 'AR-ADM-2026-0001';

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">👑 SUPER ADMIN</span>;
      case 'HR_ADMIN':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-100 text-[#EA580C] border border-orange-200">💼 HR ADMIN</span>;
      case 'TELECALLING_ADMIN':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">📞 TELECALLING ADMIN</span>;
      case 'MARKETING_ADMIN':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">📈 MARKETING ADMIN</span>;
      case 'DESIGN_ADMIN':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">🎨 DESIGN ADMIN</span>;
      case 'SOCIAL_MEDIA_ADMIN':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-100 text-pink-800 border border-pink-200">📱 SOCIAL MEDIA ADMIN</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">🏢 {role}</span>;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 no-print select-none sticky top-0 z-30 shadow-2xs">
      {/* Title & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            {pageTitle}
          </h1>
          {getRoleBadge(adminRole)}
        </div>
        <p className="text-[11px] text-slate-500 font-medium">
          {breadcrumb}
        </p>
      </div>

      {/* Right Controls: Search, Notifications, Profile Dropdown */}
      <div className="flex items-center gap-4">
        {/* Search input */}
        <div className="relative w-56 md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search employees, records, docs..."
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#EA580C] focus:border-[#EA580C] text-slate-800 transition-colors"
          />
        </div>

        {/* Notification Bell with Badge */}
        <div className="relative cursor-pointer p-1.5 text-slate-600 hover:text-slate-900 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[9.5px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
            12
          </span>
        </div>

        {/* User Profile Avatar with Dropdown */}
        <div className="relative pl-2 border-l border-slate-200">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#EA580C] via-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
              {adminName.charAt(0)}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-xs font-bold text-slate-900">{adminName}</p>
              <p className="text-[10px] text-slate-500 font-medium font-mono">{adminId}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-extrabold text-slate-900">{adminName}</p>
                <p className="text-[10px] text-slate-500 font-mono">{adminEmail}</p>
                <div className="mt-1.5">
                  {getRoleBadge(adminRole)}
                </div>
              </div>

              <a
                href="#employee_portal"
                onClick={() => setIsProfileMenuOpen(false)}
                className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Employee Self-Service Portal</span>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onNavigateSettings?.();
                }}
                className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>System Settings</span>
              </button>

              <div className="border-t border-slate-100 my-1" />

              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onLogout?.();
                }}
                className="w-full px-4 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>Sign Out ({adminRole.replace(/_/g, ' ')})</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
export default TopHeader;
