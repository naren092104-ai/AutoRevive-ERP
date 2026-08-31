import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  FileText, 
  Clock, 
  CreditCard, 
  CalendarDays, 
  Star, 
  BarChart3, 
  Settings,
  LifeBuoy,
  CalendarCheck,
  LogOut,
  PhoneCall,
  TrendingUp,
  Palette,
  Instagram,
  ShieldCheck,
  History
} from 'lucide-react';
import { AutoReviveLogo } from './AutoReviveLogo';

export type SidebarPage = 
  | 'dashboard'
  | 'employees'
  | 'recruitment'
  | 'document_center'
  | 'attendance'
  | 'payroll'
  | 'payslips'
  | 'leaves'
  | 'performance'
  | 'tickets'
  | 'holidays'
  | 'reports'
  | 'settings'
  | 'telecalling'
  | 'marketing'
  | 'design'
  | 'social_media'
  | 'admin_management'
  | 'audit_logs';

interface Props {
  activePage: SidebarPage;
  onSelectPage: (page: SidebarPage) => void;
  onLogout?: () => void;
  adminRole?: string;
  adminName?: string;
}

export const Sidebar: React.FC<Props> = ({ 
  activePage, 
  onSelectPage, 
  onLogout,
  adminRole = 'SUPER_ADMIN',
  adminName
}) => {
  const allMenuItems: Array<{ 
    id: SidebarPage; 
    label: string; 
    icon: React.ComponentType<{ className?: string }>;
    roles: string[];
    badge?: string;
  }> = [
    { id: 'dashboard',        label: 'Dashboard',             icon: LayoutDashboard, roles: ['*'] },
    
    // Core HR Suite
    { id: 'employees',        label: 'Employees Directory',   icon: Users,           roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
    { id: 'recruitment',      label: 'Recruitment & Offers',  icon: UserPlus,        roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
    { id: 'document_center',  label: 'Document Center',       icon: FileText,        roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
    { id: 'attendance',       label: 'Attendance Tracking',   icon: Clock,           roles: ['*'] },
    { id: 'payroll',          label: 'Payroll Processing',    icon: CreditCard,      roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
    { id: 'payslips',         label: 'Monthly Payslips',      icon: FileText,        roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
    { id: 'leaves',           label: 'Leave Management',      icon: CalendarDays,    roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
    
    // Department Specific Consoles
    { id: 'telecalling',      label: 'Telecalling CRM',       icon: PhoneCall,       roles: ['SUPER_ADMIN', 'TELECALLING_ADMIN'], badge: 'CRM' },
    { id: 'marketing',        label: 'Marketing & Ads',       icon: TrendingUp,      roles: ['SUPER_ADMIN', 'MARKETING_ADMIN'], badge: 'Growth' },
    { id: 'design',           label: 'Design Studio',         icon: Palette,         roles: ['SUPER_ADMIN', 'DESIGN_ADMIN'], badge: 'UI/UX' },
    { id: 'social_media',     label: 'Social Media & Reels',  icon: Instagram,       roles: ['SUPER_ADMIN', 'SOCIAL_MEDIA_ADMIN'], badge: 'Social' },

    // Cross-functional Hubs
    { id: 'performance',      label: 'Performance Appraisals',icon: Star,           roles: ['*'] },
    { id: 'tickets',          label: 'Helpdesk & Resignations',icon: LifeBuoy,        roles: ['*'] },
    { id: 'holidays',         label: 'Holidays Calendar',     icon: CalendarCheck,   roles: ['*'] },
    { id: 'reports',          label: 'Analytics & Reports',   icon: BarChart3,       roles: ['*'] },

    // Administration & Security (Super Admin)
    { id: 'admin_management', label: 'Admin Management',      icon: ShieldCheck,     roles: ['SUPER_ADMIN'], badge: 'RBAC' },
    { id: 'audit_logs',       label: 'Audit & Activity Logs', icon: History,         roles: ['SUPER_ADMIN'] },
    { id: 'settings',         label: 'System Settings',       icon: Settings,        roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
  ];

  const visibleMenuItems = allMenuItems.filter(item => {
    if (adminRole === 'SUPER_ADMIN') return true;
    if (item.roles.includes('*')) return true;
    return item.roles.includes(adminRole);
  });

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-screen select-none no-print sticky top-0 h-screen z-30">
      {/* Brand Logo Section */}
      <div>
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <AutoReviveLogo size="sm" showSubText={true} />
          </div>
        </div>

        {/* Navigation Menu Links */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-175px)] custom-scrollbar">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-orange-50 text-[#EA580C] font-extrabold border-l-4 border-[#EA580C] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#EA580C]' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-[#EA580C] text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Section */}
      <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50">
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-semibold text-xs rounded-xl transition-colors cursor-pointer bg-white"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out ({adminRole.replace(/_/g, ' ')})</span>
          </button>
        )}

        {/* Copyright */}
        <div className="px-1 text-[10px] text-slate-400 text-center font-medium">
          &copy; 2026 AutoRevive HR ERP
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
