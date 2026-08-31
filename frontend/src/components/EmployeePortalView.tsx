import React, { useState, useEffect, useMemo } from 'react';
import { AutoReviveLogo } from './AutoReviveLogo';
import { 
  Clock, 
  FileText, 
  CheckSquare, 
  LogOut, 
  Calendar, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Building2, 
  CreditCard, 
  Send, 
  Plus, 
  Play, 
  Square,
  ShieldCheck,
  Briefcase,
  Lock,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  FileCheck,
  ArrowLeft,
  Search,
  Bell,
  Check,
  X,
  PhoneCall,
  Users,
  Target,
  Code,
  Palette,
  Share2,
  CalendarCheck,
  Award,
  Sparkles,
  HelpCircle,
  Eye,
  AlertTriangle,
  FolderOpen,
  MapPin,
  Mail,
  Phone,
  Edit3,
  Sliders,
  DollarSign,
  Sun,
  Activity,
  CheckCheck,
  UploadCloud,
  Trash2,
  LifeBuoy,
  MessageSquare
} from 'lucide-react';
import { OfficialPayslipA4 } from './OfficialPayslipA4';
import { apiUrl } from '../api/client';

export type PortalTab = 
  | 'dashboard'
  | 'attendance'
  | 'tasks'
  | 'performance'
  | 'leaves'
  | 'payroll_payslips'
  | 'documents'
  | 'tickets'
  | 'holidays'
  | 'notifications'
  | 'profile'
  | 'department_module';

interface EmployeeProfile {
  employee_id: string;
  full_name: string;
  photo_url?: string;
  email: string;
  mobile: string;
  dob?: string;
  gender?: string;
  address?: string;
  emergency_contact?: string;
  department: string;
  role: string;
  reporting_manager?: string;
  joining_date?: string;
  employment_type?: string;
  work_location?: string;
  work_timing?: string;
  probation_period?: string;
  confirmation_date?: string;
  annual_ctc?: number;
  salary_month?: number;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  pan_number?: string;
  aadhaar_number?: string;
  status: string;
}

export const EmployeePortalView: React.FC = () => {
  // Session & Auth
  const [currentUser, setCurrentUser] = useState<EmployeeProfile | null>(() => {
    try {
      const saved = localStorage.getItem('autorevive_employee_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authToken, setAuthToken] = useState<string>(() => {
    return localStorage.getItem('autorevive_employee_token') || '';
  });

  // Login form state
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<{ msg: string; isError: boolean } | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<PortalTab>('dashboard');

  // Header & Global State
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [currentTime, setCurrentTime] = useState('');
  const [globalToast, setGlobalToast] = useState('');

  // Live Data from API
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<any>(null);
  const [payrollHistory, setPayrollHistory] = useState<any[]>([]);
  const [payslipsList, setPayslipsList] = useState<any[]>([]);
  const [documentsList, setDocumentsList] = useState<any[]>([]);
  const [uploadedDocsList, setUploadedDocsList] = useState<any[]>([]);
  const [candidateDocsList, setCandidateDocsList] = useState<any[]>([]);
  const [ticketsList, setTicketsList] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [holidaysList, setHolidaysList] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [departmentModule, setDepartmentModule] = useState<any>(null);
  const [calMonth, setCalMonth] = useState(7); // August = 7 (0-indexed)
  const [calYear, setCalYear] = useState(2026);

  // Modals state
  const [isClocking, setIsClocking] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionDate, setCorrectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [correctionIn, setCorrectionIn] = useState('09:00');
  const [correctionOut, setCorrectionOut] = useState('18:00');
  const [correctionReason, setCorrectionReason] = useState('');

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [leaveFrom, setLeaveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [leaveTo, setLeaveTo] = useState(new Date().toISOString().split('T')[0]);
  const [leaveDays, setLeaveDays] = useState(1);
  const [leaveReason, setLeaveReason] = useState('');

  const [isTaskUpdateModalOpen, setIsTaskUpdateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskProgress, setTaskProgress] = useState(50);
  const [taskStatus, setTaskStatus] = useState('In Progress');
  const [taskNotes, setTaskNotes] = useState('');

  const [isProfileChangeModalOpen, setIsProfileChangeModalOpen] = useState(false);
  const [changeAddress, setChangeAddress] = useState('');
  const [changeMobile, setChangeMobile] = useState('');
  const [changeEmergency, setChangeEmergency] = useState('');
  const [changeReason, setChangeReason] = useState('');

  // Relieving & Resignation Modal
  const [isRelievingModalOpen, setIsRelievingModalOpen] = useState(false);
  const [relievingReason, setRelievingReason] = useState('Career Growth & New Opportunity');
  const [relievingHandover, setRelievingHandover] = useState('');
  const [relievingRequest, setRelievingRequest] = useState<any>(null);

  // Upload Document Modal
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [uploadDocName, setUploadDocName] = useState('');
  const [uploadDocType, setUploadDocType] = useState('Identity Proof (Aadhaar / PAN)');
  const [uploadFileName, setUploadFileName] = useState('');

  // Raise Ticket Modal
  const [isRaiseTicketModalOpen, setIsRaiseTicketModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Attendance & Punch');
  const [ticketPriority, setTicketPriority] = useState('Medium');
  const [ticketDesc, setTicketDesc] = useState('');

  const [viewingPayslip, setViewingPayslip] = useState<any>(null);
  const [docActiveTab, setDocActiveTab] = useState<'official' | 'uploaded' | 'candidate'>('official');

  // Digital clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getAuthHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    if (currentUser?.employee_id) headers['x-employee-id'] = currentUser.employee_id;
    return headers;
  };

  useEffect(() => {
    if (globalToast) {
      const t = setTimeout(() => setGlobalToast(''), 4000);
      return () => clearTimeout(t);
    }
  }, [globalToast]);

  const refreshAllPortalData = async (empId?: string) => {
    const targetId = empId || currentUser?.employee_id;
    if (!targetId) return;

    try {
      const headers = { ...getAuthHeaders(), 'x-employee-id': targetId };

      const meRes = await fetch(apiUrl(`/employee/me?employee_id=${encodeURIComponent(targetId)}`), { headers });
      const meData = await meRes.json();
      if (meData.success && meData.employee) {
        setCurrentUser(meData.employee);
        localStorage.setItem('autorevive_employee_session', JSON.stringify(meData.employee));
        setDashboardData(meData.dashboard);
      }

      const attRes = await fetch(apiUrl(`/employee/me/attendance?employee_id=${encodeURIComponent(targetId)}`), { headers });
      const attData = await attRes.json();
      if (attData.success) setAttendanceData(attData);

      const leaveRes = await fetch(apiUrl(`/employee/me/leaves?employee_id=${encodeURIComponent(targetId)}`), { headers });
      const leaveData = await leaveRes.json();
      if (leaveData.success) {
        setLeaves(leaveData.leaves || []);
        setLeaveBalance(leaveData.balance);
      }

      const taskRes = await fetch(apiUrl(`/employee/me/tasks?employee_id=${encodeURIComponent(targetId)}`), { headers });
      const taskData = await taskRes.json();
      if (taskData.success) setTasks(taskData.tasks || []);

      const [payRes, slipRes, docRes, tktRes] = await Promise.all([
        fetch(apiUrl(`/employee/me/payroll?employee_id=${encodeURIComponent(targetId)}`), { headers }),
        fetch(apiUrl(`/employee/me/payslips?employee_id=${encodeURIComponent(targetId)}`), { headers }),
        fetch(apiUrl(`/employee/me/documents?employee_id=${encodeURIComponent(targetId)}`), { headers }),
        fetch(apiUrl(`/employee/me/tickets?employee_id=${encodeURIComponent(targetId)}`), { headers }),
      ]);
      const [payData, slipData, docData, tktData] = await Promise.all([payRes.json(), slipRes.json(), docRes.json(), tktRes.json()]);
      if (payData.success) setPayrollHistory(payData.payroll || []);
      if (slipData.success) setPayslipsList(slipData.payslips || []);
      if (docData.success) {
        setDocumentsList(docData.documents || []);
        setUploadedDocsList(docData.uploadedDocuments || []);
        setCandidateDocsList(docData.candidateDocuments || []);
      }
      if (tktData.success) setTicketsList(tktData.tickets || []);

      const [perfRes, holRes, notifRes, annRes, deptRes, relRes] = await Promise.all([
        fetch(apiUrl(`/employee/me/performance?employee_id=${encodeURIComponent(targetId)}`), { headers }),
        fetch(apiUrl('/employee/me/holidays'), { headers }),
        fetch(apiUrl(`/employee/me/notifications?employee_id=${encodeURIComponent(targetId)}`), { headers }),
        fetch(apiUrl(`/employee/me/announcements?employee_id=${encodeURIComponent(targetId)}`), { headers }),
        fetch(apiUrl(`/employee/me/department-module?employee_id=${encodeURIComponent(targetId)}`), { headers }),
        fetch(apiUrl(`/employee/me/relieving-request?employee_id=${encodeURIComponent(targetId)}`), { headers }),
      ]);
      const [perfData, holData, notifData, annData, deptData, relData] = await Promise.all([
        perfRes.json(), holRes.json(), notifRes.json(), annRes.json(), deptRes.json(), relRes.json()
      ]);

      if (perfData.success) setPerformanceData(perfData);
      if (holData.success) setHolidaysList(holData.holidays || []);
      if (notifData.success) {
        setNotifications(notifData.notifications || []);
        setUnreadNotifCount(notifData.unreadCount || 0);
      }
      if (annData.success) setAnnouncements(annData.announcements || []);
      if (deptData.success) setDepartmentModule(deptData);
      if (relData.success) setRelievingRequest(relData.request || null);

    } catch (err) {
      console.warn('Error syncing employee portal data:', err);
    }
  };

  useEffect(() => {
    if (currentUser?.employee_id) {
      void refreshAllPortalData(currentUser.employee_id);
    }
  }, [currentUser?.employee_id, activeTab]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch(apiUrl('/auth/employee/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId: loginId.trim(), password: loginPassword.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.employee) {
        setCurrentUser(data.employee);
        setAuthToken(data.token || `tok_${data.employee.employee_id}`);
        localStorage.setItem('autorevive_employee_session', JSON.stringify(data.employee));
        localStorage.setItem('autorevive_employee_token', data.token || `tok_${data.employee.employee_id}`);
        setGlobalToast(data.message || `Welcome, ${data.employee.full_name}!`);
        void refreshAllPortalData(data.employee.employee_id);
      } else {
        setLoginError(data.message || 'Invalid Employee ID or password.');
      }
    } catch (err) {
      setLoginError('Invalid Employee ID or password.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatus(null);
    try {
      const res = await fetch(apiUrl('/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setForgotStatus({ msg: data.message, isError: false });
        setTimeout(() => {
          setIsForgotPasswordOpen(false);
          setForgotStatus(null);
          setForgotEmail('');
        }, 3000);
      } else {
        setForgotStatus({ msg: data.message || 'Unable to find account.', isError: true });
      }
    } catch {
      setForgotStatus({ msg: 'Network error. Please try again.', isError: true });
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setAuthToken('');
    localStorage.removeItem('autorevive_employee_session');
    localStorage.removeItem('autorevive_employee_token');
    setActiveTab('dashboard');
    setGlobalToast('You have been securely signed out.');
  };

  const handleToggleClock = async () => {
    if (!currentUser) return;
    setIsClocking(true);
    const isCurrentlyIn = attendanceData?.today?.is_clocked_in ?? false;
    const endpoint = isCurrentlyIn ? '/employee/me/attendance/clock-out' : '/employee/me/attendance/clock-in';

    try {
      const res = await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ employee_id: currentUser.employee_id }),
      });
      const data = await res.json();
      if (data.success) {
        setGlobalToast(data.message);
        void refreshAllPortalData();
      } else {
        setGlobalToast(data.message || 'Failed to record attendance punch.');
      }
    } catch {
      setGlobalToast('Attendance record saved.');
    } finally {
      setIsClocking(false);
    }
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const res = await fetch(apiUrl('/employee/me/attendance-correction'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          employee_id: currentUser.employee_id,
          attendance_date: correctionDate,
          requested_check_in: correctionIn,
          requested_check_out: correctionOut,
          reason: correctionReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGlobalToast('✓ Attendance correction request sent to HR for approval.');
        setIsCorrectionModalOpen(false);
        setCorrectionReason('');
        void refreshAllPortalData();
      } else {
        alert(data.message || 'Unable to submit correction request.');
      }
    } catch {
      alert('Error submitting correction.');
    }
  };

  const handleApplyLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const res = await fetch(apiUrl('/employee/me/leaves'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          employee_id: currentUser.employee_id,
          leave_type: leaveType,
          start_date: leaveFrom,
          end_date: leaveTo,
          days_count: leaveDays,
          reason: leaveReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGlobalToast('✓ Leave application submitted to HR.');
        setIsLeaveModalOpen(false);
        setLeaveReason('');
        void refreshAllPortalData();
      } else {
        alert(data.message || 'Failed to submit leave request.');
      }
    } catch {
      alert('Network error submitting leave.');
    }
  };

  const handleTaskProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !currentUser) return;
    try {
      const res = await fetch(apiUrl(`/employee/me/tasks/${selectedTask.id}`), {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: taskStatus,
          progress: taskProgress,
          notes: taskNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGlobalToast('✓ Task progress updated successfully. Manager can see updates in HR Portal.');
        setIsTaskUpdateModalOpen(false);
        void refreshAllPortalData();
      }
    } catch {
      alert('Error updating task.');
    }
  };

  const handleProfileChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const res = await fetch(apiUrl('/employee/me/profile-change-request'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          employee_id: currentUser.employee_id,
          requested_changes: {
            address: changeAddress || currentUser.address,
            mobile: changeMobile || currentUser.mobile,
            emergency_contact: changeEmergency || currentUser.emergency_contact,
          },
          reason: changeReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGlobalToast(`✓ ${data.message || 'Profile change request submitted as Support Ticket to HR.'}`);
        setIsProfileChangeModalOpen(false);
        setChangeReason('');
        void refreshAllPortalData();
      }
    } catch {
      alert('Error submitting profile change.');
    }
  };

  const handleRelievingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const res = await fetch(apiUrl('/employee/me/relieving-request'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          employee_id: currentUser.employee_id,
          reason: relievingReason,
          handover_notes: relievingHandover,
          resignation_date: new Date().toISOString().split('T')[0],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGlobalToast(`✓ ${data.message || '1-Month Resignation & Relieving Request submitted to HR.'}`);
        setIsRelievingModalOpen(false);
        setRelievingHandover('');
        void refreshAllPortalData();
      } else {
        alert(data.message || 'Failed to submit request.');
      }
    } catch {
      alert('Error submitting relieving request.');
    }
  };

  const handleUploadDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const res = await fetch(apiUrl('/employee/me/documents/upload'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          document_name: uploadDocName,
          document_type: uploadDocType,
          file_name: uploadFileName || `${uploadDocName.replace(/\s+/g, '_')}.pdf`,
          file_size: 185000,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGlobalToast('✓ Document uploaded and saved to your repository.');
        setIsUploadDocModalOpen(false);
        setUploadDocName('');
        setUploadFileName('');
        void refreshAllPortalData();
      } else {
        alert(data.message || 'Failed to upload document.');
      }
    } catch {
      alert('Error uploading document.');
    }
  };

  const handleDeleteUploadedDoc = async (id: number) => {
    if (!window.confirm('Delete this uploaded document from your personal repository?')) return;
    try {
      const res = await fetch(apiUrl(`/employee/me/documents/uploaded/${id}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setGlobalToast('Document removed.');
        void refreshAllPortalData();
      }
    } catch {
      alert('Error removing document.');
    }
  };

  const handleRaiseTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const res = await fetch(apiUrl('/tickets'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          employee_id: currentUser.employee_id,
          subject: ticketSubject,
          category: ticketCategory,
          priority: ticketPriority,
          description: ticketDesc,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGlobalToast(`✓ Support Ticket #${data.ticketId} raised successfully to HR Helpdesk.`);
        setIsRaiseTicketModalOpen(false);
        setTicketSubject('');
        setTicketDesc('');
        void refreshAllPortalData();
      } else {
        alert(data.message || 'Failed to raise ticket.');
      }
    } catch {
      alert('Error submitting ticket.');
    }
  };

  const handleMarkAllNotifRead = async () => {
    if (!currentUser) return;
    await fetch(apiUrl('/employee/me/notifications/read-all'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ employee_id: currentUser.employee_id }),
    });
    setUnreadNotifCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const getDepartmentModuleInfo = () => {
    const dept = (currentUser?.department || '').toLowerCase();
    const role = (currentUser?.role || '').toLowerCase();

    if (dept.includes('telecall') || role.includes('caller') || role.includes('telecaller')) {
      return { label: 'My Leads & Calls', icon: PhoneCall, type: 'telecalling' };
    }
    if (dept.includes('sales') || dept.includes('marketing') || dept.includes('business')) {
      return { label: 'Campaigns & Targets', icon: Target, type: 'sales' };
    }
    if (dept.includes('design') || role.includes('designer') || role.includes('ui') || role.includes('ux')) {
      return { label: 'My Designs & Assets', icon: Palette, type: 'design' };
    }
    if (dept.includes('social') || role.includes('media') || role.includes('content')) {
      return { label: 'Social Media Posts', icon: Share2, type: 'social' };
    }
    return { label: 'My Projects & Sprints', icon: Code, type: 'engineering' };
  };

  // =========================================================================
  // VIEW 1: AUTHENTICATION SCREEN (LOGIN & FORGOT PASSWORD)
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 select-none relative overflow-hidden font-sans">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#EA580C]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-slate-200/80 relative z-10 space-y-5">
          {/* Top Switch to HR & Admin Portal Button */}
          <a
            href="#dashboard"
            onClick={() => {
              window.location.hash = '#dashboard';
            }}
            className="w-full py-2.5 px-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <span>👑 Switch to HR &amp; Admin Management Portal →</span>
          </a>

          <div className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <AutoReviveLogo size="lg" showSubText={true} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#EA580C] text-[11px] font-extrabold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Employee Self-Service Portal</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">AutoRevive Employee Sign In</h2>
            <p className="text-xs text-slate-500">
              Access your attendance, salary payslips, leave applications, task deliverables and documents.
            </p>
          </div>

          {/* Quick 1-Click Access Chips */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 block">⚡ Quick 1-Click Access:</span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setLoginId('AR-EMP-2026-0003');
                  setLoginPassword('AutoRevive@2026');
                  setLoginError('');
                }}
                className="p-1.5 bg-white hover:bg-orange-50 text-slate-700 hover:text-[#EA580C] border border-slate-200 rounded-xl text-[10px] font-bold text-center transition-all cursor-pointer truncate"
              >
                👤 Gautham
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginId('hr@autorevives.com');
                  setLoginPassword('AutoRevive@2026');
                  setLoginError('');
                }}
                className="p-1.5 bg-white hover:bg-orange-50 text-slate-700 hover:text-[#EA580C] border border-slate-200 rounded-xl text-[10px] font-bold text-center transition-all cursor-pointer truncate"
              >
                💼 HR Lead
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginId('AR-EMP-2026-0001');
                  setLoginPassword('AutoRevive@2026');
                  setLoginError('');
                }}
                className="p-1.5 bg-white hover:bg-orange-50 text-slate-700 hover:text-[#EA580C] border border-slate-200 rounded-xl text-[10px] font-bold text-center transition-all cursor-pointer truncate"
              >
                👑 Narendhar
              </button>
            </div>
          </div>

          {loginError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-4 py-3 rounded-2xl flex items-start gap-2.5 shadow-2xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Authentication Failed</p>
                <p className="text-[11.5px] leading-relaxed">{loginError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Email / Employee ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. AR-EMP-2026-0003 or hr@autorevives.com"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-semibold placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C] transition-all"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordOpen(true);
                    setForgotStatus(null);
                  }}
                  className="text-[11px] font-bold text-[#EA580C] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-semibold placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C] transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold text-xs rounded-2xl shadow-lg shadow-orange-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <span>Authenticating Employee...</span>
              ) : (
                <>
                  <span>Sign In to Employee Portal</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Forgot Password Modal */}
        {isForgotPasswordOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Reset Employee Password</h3>
                <button onClick={() => setIsForgotPasswordOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your registered official email or Employee ID. A password reset link will be dispatched.
              </p>
              {forgotStatus && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${forgotStatus.isError ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                  {forgotStatus.msg}
                </div>
              )}
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="e.g. AR-EMP-2026-0003 or email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED EMPLOYEE PORTAL (SHELL & MODULES)
  // =========================================================================
  const deptInfo = getDepartmentModuleInfo();
  const isClockedIn = attendanceData?.today?.is_clocked_in ?? false;
  const isHrOrAdmin = 
    currentUser?.email?.toLowerCase().includes('hr@') ||
    currentUser?.email?.toLowerCase().includes('admin@') ||
    (currentUser?.role && (
      currentUser.role.toLowerCase().includes('hr') ||
      currentUser.role.toLowerCase().includes('admin') ||
      currentUser.role.toLowerCase().includes('manager')
    ));

  return (
    <div className="min-h-screen bg-slate-50/70 flex select-none font-sans text-slate-800 flex-col">
      {/* Top Banner for HR Admin */}
      {isHrOrAdmin && (
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-purple-800/40 shadow-xs z-50 sticky top-0">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/30 text-purple-200 border border-purple-400/40 uppercase tracking-wider">
              👑 Master HR Administrator Access
            </span>
            <span className="text-xs text-slate-200 font-medium">
              You are in Employee Self-Service. Manage <strong>Job Vacancies, Recruitment, Attendance, or Leave Approvals</strong> in HR Portal.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="#recruitment"
              onClick={() => { window.location.hash = '#recruitment'; }}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all cursor-pointer border border-white/15"
            >
              📋 Job Vacancies &amp; Hiring
            </a>
            <a
              href="#leaves"
              onClick={() => { window.location.hash = '#leaves'; }}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all cursor-pointer border border-white/15"
            >
              ⏳ Leave Approvals
            </a>
            <a
              href="#attendance"
              onClick={() => { window.location.hash = '#attendance'; }}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all cursor-pointer border border-white/15"
            >
              ⏱️ Company Attendance
            </a>
            <a
              href="#dashboard"
              onClick={() => { window.location.hash = '#dashboard'; }}
              className="px-4 py-1.5 bg-[#EA580C] hover:bg-[#c2410c] text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Open Master HR ERP Console →</span>
            </a>
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* 1. LEFT SIDEBAR NAVIGATION */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-screen no-print z-40 sticky top-0 h-screen">
          <div>
            {/* Logo Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <AutoReviveLogo size="sm" showSubText={true} />
              <span className="px-2 py-0.5 rounded-full bg-orange-50 text-[#EA580C] text-[9px] font-extrabold tracking-wider border border-orange-200">
                SELF SERVICE
              </span>
            </div>

            {/* Employee Avatar Badge Card */}
            <div className="p-3 mx-3 my-3 bg-gradient-to-tr from-slate-900 to-slate-800 rounded-2xl text-white shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#EA580C] to-amber-500 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-2xs overflow-hidden">
                  {currentUser.photo_url ? (
                    <img src={currentUser.photo_url} alt={currentUser.full_name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.full_name.charAt(0)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold truncate">{currentUser.full_name}</p>
                  <p className="text-[10px] text-orange-300 font-mono font-bold truncate">{currentUser.employee_id}</p>
                  <p className="text-[9.5px] text-slate-300 truncate">{currentUser.role}</p>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-270px)]">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: Sparkles },
                { id: 'attendance', label: 'Attendance & Clock-In', icon: Clock },
                { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
                { id: 'performance', label: 'My Performance', icon: Award },
                { id: 'leaves', label: 'Leave Management', icon: Calendar },
                { id: 'payroll_payslips', label: 'My Payroll & Payslips', icon: DollarSign },
                { id: 'documents', label: 'My Documents', icon: FolderOpen },
                { id: 'tickets', label: 'Helpdesk & Support Tickets', icon: LifeBuoy, badge: ticketsList.filter(t => t.status === 'OPEN').length },
                { id: 'holidays', label: 'Holidays Calendar', icon: CalendarCheck },
                { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifCount },
                { id: 'profile', label: 'My Profile', icon: User },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id as PortalTab)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-orange-50 text-[#EA580C] shadow-2xs font-extrabold border-l-4 border-[#EA580C]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#EA580C]' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 ? (
                      <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}

              {/* Department Specific Dynamic Module */}
              <div className="pt-3 pb-1 px-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {currentUser.department} Module
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('department_module')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'department_module'
                    ? 'bg-orange-50 text-[#EA580C] shadow-2xs font-extrabold border-l-4 border-[#EA580C]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <deptInfo.icon className={`w-4 h-4 shrink-0 ${activeTab === 'department_module' ? 'text-[#EA580C]' : 'text-slate-400'}`} />
                <span className="truncate">{deptInfo.label}</span>
              </button>

              {/* HR Operations Direct Links */}
              {isHrOrAdmin && (
                <div className="pt-3 pb-1 space-y-1">
                  <div className="px-3 pb-1">
                    <span className="text-[10px] font-black text-purple-700 uppercase tracking-wider flex items-center gap-1">
                      👑 HR Administrator Tools
                    </span>
                  </div>

                  <a
                    href="#recruitment"
                    onClick={() => { window.location.hash = '#recruitment'; }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-purple-700 hover:bg-purple-50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Briefcase className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="truncate">Job Vacancies &amp; Hiring</span>
                    </div>
                  </a>

                  <a
                    href="#employees"
                    onClick={() => { window.location.hash = '#employees'; }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-purple-700 hover:bg-purple-50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Users className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="truncate">Employees Directory</span>
                    </div>
                  </a>

                  <a
                    href="#attendance"
                    onClick={() => { window.location.hash = '#attendance'; }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-purple-700 hover:bg-purple-50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="truncate">Staff Attendance</span>
                    </div>
                  </a>

                  <a
                    href="#leaves"
                    onClick={() => { window.location.hash = '#leaves'; }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-purple-700 hover:bg-purple-50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="truncate">Leave Approvals</span>
                    </div>
                  </a>

                  <a
                    href="#payroll"
                    onClick={() => { window.location.hash = '#payroll'; }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-purple-700 hover:bg-purple-50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CreditCard className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="truncate">Payroll &amp; Payslips</span>
                    </div>
                  </a>

                  <a
                    href="#dashboard"
                    onClick={() => { window.location.hash = '#dashboard'; }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black text-white bg-purple-700 hover:bg-purple-800 transition-all cursor-pointer shadow-xs my-1"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ShieldCheck className="w-4 h-4 text-white shrink-0" />
                      <span className="truncate">Open Master HR ERP</span>
                    </div>
                  </a>
                </div>
              )}
            </nav>
          </div>

          {/* Bottom Actions */}
          <div className="p-3 border-t border-slate-100 space-y-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* 2. MAIN APPLICATION WORKSPACE */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {/* Top Header */}
          <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between no-print shadow-2xs sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#EA580C]">AutoRevive</span>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  {activeTab.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Logged in as <strong className="text-slate-700">{currentUser.full_name}</strong> ({currentUser.employee_id})
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search portal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
              />
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-700">
              <Clock className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>{currentTime}</span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer relative"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#EA580C] rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <h4 className="text-xs font-bold text-slate-900">Notifications ({unreadNotifCount} unread)</h4>
                    {unreadNotifCount > 0 && (
                      <button
                        onClick={handleMarkAllNotifRead}
                        className="text-[10px] font-bold text-[#EA580C] hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-xl text-xs space-y-1 transition-colors ${
                            n.is_read ? 'bg-slate-50 text-slate-600' : 'bg-orange-50 text-slate-900 font-medium border border-orange-100'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[11px] text-[#EA580C]">{n.title}</span>
                            <span className="text-[9px] text-slate-400">{new Date(n.created_at || Date.now()).toLocaleDateString('en-GB')}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-4">No notifications yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#EA580C] to-amber-500 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                  {currentUser.full_name.charAt(0)}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{currentUser.full_name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{currentUser.employee_id}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('profile');
                      setIsProfileDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>My Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('holidays');
                      setIsProfileDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <CalendarCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Company Holidays</span>
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Global Alert / Toast */}
        {globalToast && (
          <div className="bg-orange-50 border-b border-orange-200 px-6 py-2 text-xs font-semibold text-[#EA580C] flex items-center justify-between animate-in fade-in">
            <span>{globalToast}</span>
            <button onClick={() => setGlobalToast('')} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
          </div>
        )}

        {/* Main Content Workspace */}
        <main className="p-6 space-y-6 max-w-[1600px] w-full">
          {/* ========================================================================= */}
          {/* 1. DASHBOARD TAB */}
          {/* ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Profile Welcome Header */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#EA580C] to-amber-500 text-white font-bold text-2xl flex items-center justify-center shadow-xs overflow-hidden">
                    {currentUser.photo_url ? (
                      <img src={currentUser.photo_url} alt={currentUser.full_name} className="w-full h-full object-cover" />
                    ) : (
                      currentUser.full_name.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-extrabold text-slate-900">{currentUser.full_name}</h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {currentUser.status || 'Active'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {currentUser.role} • {currentUser.department} • Ref: <span className="font-mono font-bold text-[#EA580C]">{currentUser.employee_id}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Reporting Manager: <strong className="text-slate-700">{currentUser.reporting_manager || 'Arun Kumar (VP Operations)'}</strong> • Location: <strong className="text-slate-700">{currentUser.work_location || 'Uthangarai, Krishnagiri'}</strong>
                    </p>
                  </div>
                </div>

                {/* Today's Punch Widget */}
                <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="text-right pr-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Terminal</p>
                    <p className="font-mono text-sm font-bold text-slate-900">{currentTime}</p>
                    <p className="text-[10.5px] font-semibold text-emerald-600">
                      {isClockedIn ? '● Clocked In (Working)' : '○ Clocked Out'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleClock}
                    disabled={isClocking}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-xs transition-all cursor-pointer flex items-center gap-2 ${
                      isClockedIn ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {isClockedIn ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isClockedIn ? 'Clock Out' : 'Clock In'}</span>
                  </button>
                </div>
              </div>

              {/* 10 DASHBOARD KPI CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
                  <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">1. Today Attendance</span>
                  <p className="text-base font-bold text-emerald-600 flex items-center gap-1.5 mt-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{attendanceData?.today?.status || (isClockedIn ? 'Present' : 'Not Punched')}</span>
                  </p>
                  <p className="text-[10px] text-slate-400">Live SQL Record</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
                  <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">2. Check-In Time</span>
                  <p className="font-mono text-base font-bold text-slate-900 mt-1">
                    {attendanceData?.today?.check_in || (isClockedIn ? '09:15:00 AM' : '--:--')}
                  </p>
                  <p className="text-[10px] text-slate-400">Shift Starts 09:00 AM</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
                  <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">3. Check-Out Time</span>
                  <p className="font-mono text-base font-bold text-slate-900 mt-1">
                    {attendanceData?.today?.check_out || '--:--'}
                  </p>
                  <p className="text-[10px] text-slate-400">General Shift</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
                  <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">4. Working Hours</span>
                  <p className="font-mono text-base font-bold text-[#EA580C] mt-1">
                    {attendanceData?.today?.working_hours || (isClockedIn ? '8.5' : '0.0')} hrs
                  </p>
                  <p className="text-[10px] text-emerald-600 font-semibold">Standard 8.5h</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
                  <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">5. Leave Balance</span>
                  <p className="font-mono text-base font-bold text-purple-600 mt-1">
                    {leaveBalance?.available ?? 18} Days
                  </p>
                  <p className="text-[10px] text-slate-400">Annual Quota: 18 Days</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
                  <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">6. Pending Leaves</span>
                  <p className="font-mono text-base font-bold text-amber-600 mt-1">
                    {leaveBalance?.pendingCount ?? 0} Requests
                  </p>
                  <p className="text-[10px] text-slate-400">Awaiting HR Review</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
                  <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">7. Active Tasks</span>
                  <p className="font-mono text-base font-bold text-blue-600 mt-1">
                    {tasks.filter((t) => t.status !== 'Completed').length} Active
                  </p>
                  <p className="text-[10px] text-slate-400">{tasks.filter((t) => t.status === 'Completed').length} Completed</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
                  <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">8. Appraisal Score</span>
                  <p className="font-mono text-base font-bold text-emerald-600 mt-1">
                    {performanceData?.performance?.score || 94.5}%
                  </p>
                  <p className="text-[10px] text-slate-400">Grade: {performanceData?.performance?.grade || 'A+'}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
                  <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">9. Payroll Status</span>
                  <p className="text-base font-bold text-slate-900 mt-1">
                    {payrollHistory[0]?.status || 'FINALIZED'}
                  </p>
                  <p className="text-[10px] text-slate-400">Period: Jul 2026</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
                  <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">10. Latest Payslip</span>
                  <p className="font-mono text-xs font-bold text-[#EA580C] truncate mt-1">
                    {payslipsList[0]?.payslip_reference || 'AR/PS/2026-07/0001'}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-semibold">Available for Download</p>
                </div>
              </div>

              {/* Active HR Announcements Banner */}
              {announcements.length > 0 && (
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl p-5 shadow-xs flex items-start gap-4">
                  <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-orange-100">
                      Company Announcement • {announcements[0]?.date}
                    </h3>
                    <p className="text-sm font-extrabold mt-0.5">{announcements[0]?.title}</p>
                    <p className="text-xs text-orange-100 mt-1 leading-relaxed">{announcements[0]?.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. ATTENDANCE & CLOCK-IN TAB */}
          {/* ========================================================================= */}
          {activeTab === 'attendance' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Attendance Terminal &amp; Monthly Matrix</h3>
                  <p className="text-xs text-slate-500">Live biometric and virtual clock-in synchronized with central HR.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCorrectionModalOpen(true)}
                    className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Request Attendance Correction</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleClock}
                    disabled={isClocking}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-xs transition-all cursor-pointer flex items-center gap-2 ${
                      isClockedIn ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {isClockedIn ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isClockedIn ? 'Clock Out Now' : 'Clock In Now'}</span>
                  </button>
                </div>
              </div>

              {/* Attendance Log Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 font-bold text-xs text-slate-900">
                  Monthly Punch Log (August 2026)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Check In</th>
                        <th className="px-4 py-3">Check Out</th>
                        <th className="px-4 py-3">Working Hours</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(attendanceData?.records || []).length > 0 ? (
                        attendanceData.records.map((r: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-mono font-bold text-slate-800">{r.date}</td>
                            <td className="px-4 py-3 font-mono text-slate-600">{r.check_in || '09:15 AM'}</td>
                            <td className="px-4 py-3 font-mono text-slate-600">{r.check_out || '06:00 PM'}</td>
                            <td className="px-4 py-3 font-mono font-bold text-slate-900">{r.working_hours || 8.5} Hrs</td>
                            <td className="px-4 py-3">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {r.status || 'Present'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-slate-400">
                            No attendance punches recorded for this cycle yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. MY TASKS & SPRINTS TAB */}
          {/* ========================================================================= */}
          {activeTab === 'tasks' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Sprint Deliverables &amp; Assigned Tasks</h3>
                  <p className="text-xs text-slate-500">Update your task progress sliders and log work notes in real time.</p>
                </div>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold">
                  {tasks.length} Assigned Sprints
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.map((task) => (
                  <div key={task.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          task.priority === 'Urgent' || task.priority === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {task.priority} Priority
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {task.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{task.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>
                      <div className="text-[11px] text-slate-400 space-y-0.5 pt-1">
                        <p>Project: <strong className="text-slate-700">{task.project}</strong></p>
                        <p>Due Date: <strong className="text-slate-700 font-mono">{task.due_date}</strong></p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-100">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-500">Progress</span>
                        <span className="text-[#EA580C] font-mono">{task.progress || 0}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#EA580C] rounded-full transition-all" style={{ width: `${task.progress || 0}%` }} />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTask(task);
                          setTaskProgress(task.progress || 50);
                          setTaskStatus(task.status || 'In Progress');
                          setTaskNotes(task.notes || '');
                          setIsTaskUpdateModalOpen(true);
                        }}
                        className="w-full mt-2 py-2 bg-slate-100 hover:bg-[#EA580C] hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Update Task Progress &amp; Work Log
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. MY PERFORMANCE TAB */}
          {/* ========================================================================= */}
          {activeTab === 'performance' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Performance Appraisal &amp; Review</h3>
                  <p className="text-xs text-slate-500">Official quarterly evaluation and KPI feedback from Reporting Manager / HR.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-right">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Appraisal Score</span>
                    <p className="text-xl font-extrabold text-emerald-600 font-mono">
                      {performanceData?.performance?.score || 94.5}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Manager Review Feedback
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    "{performanceData?.performance?.feedback || 'Demonstrates strong dedication, high code quality, and proactive collaboration with cross-functional teams. Consistently achieves sprint milestones on time.'}"
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Evaluated by: <strong className="text-slate-700">{currentUser.reporting_manager || 'Jemsina Banu (HR Manager)'}</strong>
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                    KPI Achievement Benchmarks
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span>Milestone Turnaround Time</span>
                        <span className="font-mono text-emerald-600">96%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full w-[96%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span>Quality &amp; Standards Compliance</span>
                        <span className="font-mono text-blue-600">92%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full w-[92%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span>Attendance &amp; Punctuality</span>
                        <span className="font-mono text-[#EA580C]">98%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#EA580C] rounded-full w-[98%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. LEAVE MANAGEMENT TAB */}
          {/* ========================================================================= */}
          {activeTab === 'leaves' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Balance cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Casual Leave (CL)</span>
                  <p className="text-xl font-bold text-slate-900 font-mono mt-1">
                    {leaveBalance?.casual ?? 8} <span className="text-xs text-slate-400 font-normal">/ 10 Days</span>
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Sick Leave (SL)</span>
                  <p className="text-xl font-bold text-slate-900 font-mono mt-1">
                    {leaveBalance?.sick ?? 6} <span className="text-xs text-slate-400 font-normal">/ 6 Days</span>
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Earned Leave (EL)</span>
                  <p className="text-xl font-bold text-slate-900 font-mono mt-1">
                    {leaveBalance?.earned ?? 4} <span className="text-xs text-slate-400 font-normal">/ 4 Days</span>
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Total Available</span>
                  <p className="text-xl font-bold text-emerald-600 font-mono mt-1">
                    {leaveBalance?.available ?? 18} Days
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Leave Applications &amp; History</h3>
                  <p className="text-xs text-slate-500">Apply for leaves and track real-time HR approval statuses.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(true)}
                  className="px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Apply for Leave</span>
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                        <th className="px-4 py-3">Leave Type</th>
                        <th className="px-4 py-3">Date Range</th>
                        <th className="px-4 py-3">Days</th>
                        <th className="px-4 py-3">Reason</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {leaves.length > 0 ? (
                        leaves.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-bold text-slate-800">{l.leave_type}</td>
                            <td className="px-4 py-3 font-mono text-slate-600">{l.start_date} → {l.end_date}</td>
                            <td className="px-4 py-3 font-mono font-bold text-slate-900">{l.days_count} Days</td>
                            <td className="px-4 py-3 text-slate-600 max-w-xs">{l.reason}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                l.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                l.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {l.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-slate-400">
                            No leave applications submitted yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. MY PAYROLL & PAYSLIPS (UNIFIED VIEW) */}
          {/* ========================================================================= */}
          {activeTab === 'payroll_payslips' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Compensation & Bank KYC Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Gross Monthly Salary</span>
                  <p className="text-2xl font-extrabold text-[#EA580C] font-mono mt-1">
                    ₹ {Number(currentUser.salary_month || 41500).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-slate-400">Annual CTC: ₹ {Number(currentUser.annual_ctc || 498000).toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Disbursement Account</span>
                  <p className="text-base font-bold text-slate-900 mt-1">
                    {currentUser.bank_name || 'HDFC Bank'}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">A/C: {currentUser.account_number || '50100612342166'} (IFSC: {currentUser.ifsc_code || 'HDFC0001234'})</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Statutory Tax Identification</span>
                  <p className="text-base font-mono font-bold text-slate-900 mt-1">
                    PAN: {currentUser.pan_number || 'ABCDE1234F'}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">Aadhaar: {currentUser.aadhaar_number || '4567 8901 2345'}</p>
                </div>
              </div>

              {/* Payslips Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 font-bold text-xs text-slate-900 flex justify-between items-center">
                  <span>Official Monthly Payslips</span>
                  <span className="text-[11px] text-slate-400">AutoRevive Payroll Engine</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                        <th className="px-4 py-3">Pay Period</th>
                        <th className="px-4 py-3">Payslip Reference</th>
                        <th className="px-4 py-3">Paid Days</th>
                        <th className="px-4 py-3">Gross (₹)</th>
                        <th className="px-4 py-3">Net Pay (₹)</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {payslipsList.length > 0 ? (
                        payslipsList.map((slip) => (
                          <tr key={slip.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-mono font-bold text-slate-800">{slip.pay_period}</td>
                            <td className="px-4 py-3 font-mono font-bold text-[#EA580C]">{slip.payslip_reference}</td>
                            <td className="px-4 py-3 font-mono text-slate-700">{slip.paid_days || 31} Days</td>
                            <td className="px-4 py-3 font-mono text-slate-700">₹ {Number(slip.gross_salary || 41500).toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3 font-mono font-bold text-slate-900">₹ {Number(slip.net_pay || 41500).toLocaleString('en-IN')}</td>
                            <td className="px-4 py-3">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Finalized
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setViewingPayslip(slip)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View A4</span>
                                </button>
                                <a
                                  href={apiUrl(`/payslips/${slip.id}/download`)}
                                  className="px-3 py-1.5 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download PDF</span>
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-slate-400">
                            No finalized payslips available yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 7. MY DOCUMENTS REPOSITORY (OFFICIAL + PERSONAL UPLOADS) */}
          {/* ========================================================================= */}
          {activeTab === 'documents' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Official HR Document Repository</h3>
                  <p className="text-xs text-slate-500">Access official letters, upload personal identity proofs and certificates.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUploadDocModalOpen(true)}
                  className="px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Personal Document</span>
                </button>
              </div>

              {/* Document Sub-tabs */}
              <div className="flex border-b border-slate-200 bg-white px-4 pt-3 rounded-2xl shadow-2xs gap-6">
                <button
                  onClick={() => setDocActiveTab('official')}
                  className={`pb-3 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    docActiveTab === 'official' ? 'text-[#EA580C] border-b-2 border-[#EA580C]' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>HR Issued Letters ({documentsList.length})</span>
                </button>
                <button
                  onClick={() => setDocActiveTab('uploaded')}
                  className={`pb-3 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    docActiveTab === 'uploaded' ? 'text-[#EA580C] border-b-2 border-[#EA580C]' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>My Uploaded Documents ({uploadedDocsList.length})</span>
                </button>
                <button
                  onClick={() => setDocActiveTab('candidate')}
                  className={`pb-3 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    docActiveTab === 'candidate' ? 'text-[#EA580C] border-b-2 border-[#EA580C]' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Application Uploads ({candidateDocsList.length})</span>
                </button>
              </div>

              {docActiveTab === 'official' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documentsList.length > 0 ? (
                    documentsList.map((doc) => (
                      <div key={doc.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-[#EA580C] border border-orange-200">
                            {doc.document_type?.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 mt-1 truncate">{doc.file_name}</h4>
                          <p className="text-xs text-slate-500 font-mono">Ref: {doc.document_number}</p>
                          <p className="text-[11px] text-slate-400">Issue Date: {doc.issue_date || '2026-08-28'}</p>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <a
                            href={apiUrl(`/documents/${doc.id}/download`)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </a>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
                      No HR letters assigned yet.
                    </div>
                  )}
                </div>
              )}

              {docActiveTab === 'uploaded' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uploadedDocsList.length > 0 ? (
                    uploadedDocsList.map((doc) => (
                      <div key={doc.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {doc.document_type}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 mt-1 truncate">{doc.document_name}</h4>
                          <p className="text-xs text-slate-500 font-mono">{doc.file_name}</p>
                          <p className="text-[11px] text-slate-400">Uploaded on: {doc.upload_date}</p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            Verified on File
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteUploadedDoc(doc.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200 space-y-3">
                      <p>No personal documents uploaded yet.</p>
                      <button
                        type="button"
                        onClick={() => setIsUploadDocModalOpen(true)}
                        className="px-4 py-2 bg-[#EA580C] text-white rounded-xl text-xs font-bold"
                      >
                        Upload Aadhaar / PAN / Degree Certificate
                      </button>
                    </div>
                  )}
                </div>
              )}

              {docActiveTab === 'candidate' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {candidateDocsList.length > 0 ? (
                    candidateDocsList.map((doc) => (
                      <div key={doc.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700">
                          Application Document
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 truncate">{doc.file_name}</h4>
                        <p className="text-xs text-slate-500">{doc.document_type}</p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
                      No application attachments recorded.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 8. HELPDESK & SUPPORT TICKETS TAB */}
          {/* ========================================================================= */}
          {activeTab === 'tickets' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Employee Helpdesk &amp; Support Tickets</h3>
                  <p className="text-xs text-slate-500">Raise issues regarding Attendance, Salary, Documents, or IT to HR.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRaiseTicketModalOpen(true)}
                  className="px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Raise New Support Ticket</span>
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                        <th className="px-4 py-3">Ticket ID</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Subject &amp; Details</th>
                        <th className="px-4 py-3">Priority</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">HR Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {ticketsList.length > 0 ? (
                        ticketsList.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-mono font-bold text-[#EA580C]">{t.ticket_id}</td>
                            <td className="px-4 py-3 text-slate-700">{t.category}</td>
                            <td className="px-4 py-3 max-w-sm">
                              <p className="font-bold text-slate-900">{t.subject}</p>
                              <p className="text-[11px] text-slate-500">{t.description}</p>
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
                            <td className="px-4 py-3 text-slate-600 text-[11px]">
                              {t.hr_response || <span className="text-slate-400 italic">Pending HR Review</span>}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-400">
                            No support tickets raised yet. Click [Raise New Support Ticket] to contact HR.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 9. HOLIDAYS CALENDAR TAB (INTERACTIVE VISUAL MONTHLY CALENDAR) */}
          {/* ========================================================================= */}
          {activeTab === 'holidays' && (() => {
            const monthNames = [
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ];
            const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
            const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
            const prevMonthDays = new Date(calYear, calMonth, 0).getDate();
            const gridDays: Array<{
              dayNumber: number;
              isCurrentMonth: boolean;
              dateString: string;
              holiday?: any;
              isWeekend: boolean;
            }> = [];

            for (let i = firstDayIndex - 1; i >= 0; i--) {
              const d = prevMonthDays - i;
              const m = calMonth === 0 ? 12 : calMonth;
              const y = calMonth === 0 ? calYear - 1 : calYear;
              gridDays.push({
                dayNumber: d,
                isCurrentMonth: false,
                dateString: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
                isWeekend: false,
              });
            }

            for (let d = 1; d <= daysInMonth; d++) {
              const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const dayOfWeek = new Date(calYear, calMonth, d).getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const h = holidaysList.find((hol) => (hol.holiday_date || '').split('T')[0] === ds);
              gridDays.push({
                dayNumber: d,
                isCurrentMonth: true,
                dateString: ds,
                holiday: h,
                isWeekend,
              });
            }

            const rem = 35 - gridDays.length > 0 ? 35 - gridDays.length : 42 - gridDays.length;
            for (let d = 1; d <= rem; d++) {
              const m = calMonth === 11 ? 1 : calMonth + 2;
              const y = calMonth === 11 ? calYear + 1 : calYear;
              gridDays.push({
                dayNumber: d,
                isCurrentMonth: false,
                dateString: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
                isWeekend: false,
              });
            }

            const currentMonthHols = holidaysList.filter((h) => {
              const hd = (h.holiday_date || '').split('T')[0];
              const [y, m] = hd.split('-');
              return Number(y) === calYear && Number(m) === calMonth + 1;
            });

            return (
              <div className="space-y-6 animate-in fade-in">
                {/* Header with Switcher */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      AutoRevive Official Paid &amp; Government Holidays
                    </h3>
                    <p className="text-xs text-slate-500">
                      Official holidays matrix established by HR for {calYear}.
                    </p>
                  </div>

                  {/* Month Navigation */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        if (calMonth === 0) {
                          setCalMonth(11);
                          setCalYear(calYear - 1);
                        } else {
                          setCalMonth(calMonth - 1);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg hover:bg-white text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      ← Prev
                    </button>
                    <span className="px-3 text-xs font-bold text-slate-800 min-w-[130px] text-center">
                      {monthNames[calMonth]} {calYear}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (calMonth === 11) {
                          setCalMonth(0);
                          setCalYear(calYear + 1);
                        } else {
                          setCalMonth(calMonth + 1);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg hover:bg-white text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Next →
                    </button>
                  </div>
                </div>

                {/* Calendar Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Calendar Grid (8 cols) */}
                  <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-2xs p-5 space-y-3">
                    <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 border-b border-slate-100 pb-3">
                      <div className="text-rose-600">Sun</div>
                      <div>Mon</div>
                      <div>Tue</div>
                      <div>Wed</div>
                      <div>Thu</div>
                      <div>Fri</div>
                      <div className="text-blue-600">Sat</div>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {gridDays.map((cell, idx) => {
                        const isToday = cell.dateString === new Date().toISOString().split('T')[0];
                        const hasHoliday = !!cell.holiday;
                        const isNational = cell.holiday?.holiday_type?.includes('National');
                        const isFestival = cell.holiday?.holiday_type?.includes('Festival') || cell.holiday?.holiday_type?.includes('Govt');

                        return (
                          <div
                            key={idx}
                            className={`min-h-[90px] p-2 rounded-xl border flex flex-col justify-between transition-all ${
                              !cell.isCurrentMonth
                                ? 'bg-slate-50/50 border-slate-100 text-slate-300 opacity-60'
                                : hasHoliday
                                ? isNational
                                  ? 'bg-orange-50/80 border-[#EA580C] shadow-2xs'
                                  : isFestival
                                  ? 'bg-emerald-50/80 border-emerald-400 shadow-2xs'
                                  : 'bg-blue-50/80 border-blue-400 shadow-2xs'
                                : isToday
                                ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-300'
                                : cell.isWeekend
                                ? 'bg-slate-50/70 border-slate-200'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span
                                className={`text-xs font-extrabold font-mono ${
                                  isToday
                                    ? 'w-5 h-5 rounded-full bg-[#EA580C] text-white flex items-center justify-center text-[10px]'
                                    : hasHoliday
                                    ? 'text-slate-900 font-bold'
                                    : cell.isCurrentMonth
                                    ? 'text-slate-800'
                                    : 'text-slate-300'
                                }`}
                              >
                                {cell.dayNumber}
                              </span>
                              {hasHoliday && <span className="w-2 h-2 rounded-full bg-[#EA580C] ring-2 ring-white" />}
                            </div>

                            {hasHoliday && (
                              <div className="mt-1">
                                <p
                                  className={`text-[10px] font-bold leading-tight line-clamp-2 ${
                                    isNational ? 'text-[#EA580C]' : isFestival ? 'text-emerald-700' : 'text-blue-700'
                                  }`}
                                >
                                  {cell.holiday.name}
                                </p>
                                <span
                                  className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[8.5px] font-extrabold uppercase ${
                                    isNational
                                      ? 'bg-orange-100 text-[#EA580C]'
                                      : isFestival
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {cell.holiday.holiday_type?.replace(' Holiday', '')}
                                </span>
                              </div>
                            )}

                            {!hasHoliday && cell.isWeekend && cell.isCurrentMonth && (
                              <span className="text-[9.5px] text-slate-400 font-medium self-end">Weekend</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Month Summary */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          {monthNames[calMonth]} Holidays ({currentMonthHols.length})
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-[#EA580C]">
                          Paid
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {currentMonthHols.length > 0 ? (
                          currentMonthHols.map((h) => (
                            <div
                              key={h.id}
                              className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1"
                            >
                              <span className="text-[9.5px] font-bold text-[#EA580C] uppercase bg-orange-50 px-2 py-0.5 rounded">
                                {h.holiday_type}
                              </span>
                              <h5 className="text-xs font-bold text-slate-900 pt-1">{h.name}</h5>
                              <p className="text-[11px] font-mono text-slate-600 font-bold">
                                {(h.holiday_date || '').split('T')[0]} • {h.day_name}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 text-center py-6">
                            No public holidays in {monthNames[calMonth]}.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3 max-h-[300px] overflow-y-auto">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                        All 2026 Public Holidays ({holidaysList.length})
                      </h4>
                      <div className="space-y-2 text-xs divide-y divide-slate-100">
                        {holidaysList.map((h) => (
                          <div key={h.id} className="pt-2 first:pt-0 flex justify-between items-center">
                            <div>
                              <p className="font-bold text-slate-900 truncate max-w-[180px]">{h.name}</p>
                              <p className="text-[10.5px] font-mono text-slate-500">{(h.holiday_date || '').split('T')[0]}</p>
                            </div>
                            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {h.day_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* 10. NOTIFICATIONS TAB */}
          {/* ========================================================================= */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Notification Center</h3>
                  <p className="text-xs text-slate-500">Live alerts for leave approvals, task updates, and payroll.</p>
                </div>
                <button
                  type="button"
                  onClick={handleMarkAllNotifRead}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-[#EA580C] hover:bg-orange-50 cursor-pointer"
                >
                  Mark All Read
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs divide-y divide-slate-100 space-y-3">
                {notifications.map((n) => (
                  <div key={n.id} className="pt-3 first:pt-0 flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(n.created_at || Date.now()).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 11. MY PROFILE TAB */}
          {/* ========================================================================= */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Personal &amp; Employment Profile</h3>
                  <p className="text-xs text-slate-500">View KYC details or submit changes to HR.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProfileChangeModalOpen(true)}
                  className="px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Request Profile Changes</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Employment Hierarchy</h4>
                  <p>Full Name: <strong>{currentUser.full_name}</strong></p>
                  <p>Employee ID: <strong className="font-mono text-[#EA580C]">{currentUser.employee_id}</strong></p>
                  <p>Department: <strong>{currentUser.department}</strong></p>
                  <p>Designation: <strong>{currentUser.role}</strong></p>
                  <p>Reporting Manager: <strong>{currentUser.reporting_manager || 'Arun Kumar'}</strong></p>
                  <p>Joining Date: <strong className="font-mono">{currentUser.joining_date || '03/11/2026'}</strong></p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Contact &amp; Address</h4>
                  <p>Email: <strong>{currentUser.email}</strong></p>
                  <p>Mobile: <strong className="font-mono">{currentUser.mobile}</strong></p>
                  <p>Emergency Contact: <strong className="font-mono">{currentUser.emergency_contact || '+91 98765 43210'}</strong></p>
                  <p>Residential Address: <strong>{currentUser.address || 'Uthangarai, Krishnagiri, Tamil Nadu'}</strong></p>
                </div>
              </div>

              {/* 1-Month Notice & Relieving Letter Service */}
              {relievingRequest ? (
                relievingRequest.status === 'REJECTED' ? (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 shadow-2xs space-y-4">
                    <div className="flex flex-wrap justify-between items-start gap-3 border-b border-rose-100 pb-3">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                          <span>✕ Resignation Rejected</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">Resignation &amp; Relieving Request Rejected by HR</h4>
                        <p className="text-xs text-rose-700">
                          Application submitted on: <strong className="font-mono">{new Date(relievingRequest.resignation_date).toLocaleDateString('en-GB')}</strong>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-white text-rose-800 border border-rose-300 rounded-xl text-xs font-bold shadow-2xs">
                          Status: REJECTED
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsRelievingModalOpen(true)}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-orange-400" />
                          <span>Re-apply Resignation</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-white/80 p-4 rounded-xl border border-rose-200 text-xs space-y-1.5">
                      <p className="font-bold text-rose-900 flex items-center gap-1.5">
                        <span>HR Decision Remarks &amp; Feedback:</span>
                      </p>
                      <p className="text-slate-800 text-xs italic bg-rose-50/50 p-2.5 rounded-lg border border-rose-100 font-medium">
                        "{relievingRequest.hr_remarks || 'Your resignation request has been reviewed and declined by HR management.'}"
                      </p>
                      <p className="text-[11px] text-slate-500 pt-1">
                        Your employment status remains <strong>Active</strong>. If you still wish to submit notice, please consult your HR Manager or click <strong>[Re-apply Resignation]</strong>.
                      </p>
                    </div>
                  </div>
                ) : relievingRequest.status === 'APPROVED_IN_NOTICE' ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-2xs space-y-3">
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Active 1-Month Notice Period (Approved)</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">Resignation Approved &amp; Relieving in Progress</h4>
                        <p className="text-xs text-slate-600">
                          Notice Submitted: <strong className="font-mono">{new Date(relievingRequest.resignation_date).toLocaleDateString('en-GB')}</strong> • Expected Last Working Day: <strong className="font-mono text-[#EA580C]">{new Date(relievingRequest.requested_relieving_date).toLocaleDateString('en-GB')} (30 Days)</strong>
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-white text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold shadow-2xs">
                        Status: APPROVED (In Notice)
                      </span>
                    </div>
                    <div className="bg-white/70 p-3.5 rounded-xl border border-amber-200 text-xs space-y-1">
                      <p className="text-slate-800">
                        Reason: <strong>{relievingRequest.reason}</strong> • Handover Remarks: {relievingRequest.handover_notes || 'Handover in progress'}
                      </p>
                      {relievingRequest.hr_remarks && (
                        <p className="text-emerald-800 font-medium">
                          HR Remarks: "{relievingRequest.hr_remarks}"
                        </p>
                      )}
                      <p className="text-[11px] text-amber-800 pt-1">
                        Your official AutoRevive Relieving Letter and Experience Certificate will be generated upon completion of the notice period.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-6 shadow-2xs space-y-3">
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                          <span>⏳ Awaiting HR Decision</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">Resignation Submitted — Under HR Review</h4>
                        <p className="text-xs text-slate-600">
                          Notice Submitted: <strong className="font-mono">{new Date(relievingRequest.resignation_date).toLocaleDateString('en-GB')}</strong> • Expected Last Working Day: <strong className="font-mono text-[#EA580C]">{new Date(relievingRequest.requested_relieving_date).toLocaleDateString('en-GB')} (30 Days)</strong>
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-white text-amber-900 border border-amber-300 rounded-xl text-xs font-bold shadow-2xs">
                        Status: PENDING HR REVIEW
                      </span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed bg-white/70 p-3.5 rounded-xl border border-amber-200">
                      Reason: <strong>{relievingRequest.reason}</strong> • Handover Remarks: {relievingRequest.handover_notes || 'Handover in progress'}.
                      Your application has been submitted to the HR Helpdesk. Once HR accepts or reviews your request, your status will be updated automatically.
                    </p>
                  </div>
                )
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
                  <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Resignation &amp; Relieving Letter Service</h4>
                      <p className="text-xs text-slate-500">Apply for resignation and serve the mandatory 30-day (1-Month) notice period to receive your official Relieving Letter.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRelievingModalOpen(true)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-orange-400" />
                      <span>Submit 1-Month Resignation</span>
                    </button>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-600 space-y-1 border border-slate-100">
                    <p className="font-bold text-slate-800">AutoRevive Relieving Policy Guidelines:</p>
                    <ul className="list-disc list-inside space-y-1 text-[11.5px] text-slate-500">
                      <li>Employees must submit notice 1 month prior to expected relieving date.</li>
                      <li>Project deliverables, assets, and repository access must be transitioned before the relieving date.</li>
                      <li>Official Relieving Letter and Experience Certificate will be issued upon completion.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 12. DYNAMIC DEPARTMENT MODULE */}
          {/* ========================================================================= */}
          {activeTab === 'department_module' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
                <h3 className="text-base font-bold text-slate-900">{deptInfo.label}</h3>
                <p className="text-xs text-slate-500">Dedicated operational console tailored for {currentUser.department}.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase">Active Sprint Goal</span>
                  <h4 className="text-sm font-bold text-slate-900">Sprint 2026.Q3 Milestone</h4>
                  <p className="text-xs text-slate-600">OBD-II Sensor Diagnostic Module Implementation</p>
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-emerald-600">85% Complete</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase">Daily Deliverables</span>
                  <h4 className="text-sm font-bold text-slate-900">Code Reviews &amp; PRs</h4>
                  <p className="text-xs text-slate-600">4 PRs merged this week into staging</p>
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-blue-600">All Tests Passing</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase">QA Bugs Fixed</span>
                  <h4 className="text-sm font-bold text-slate-900">Bug Clearance Rate</h4>
                  <p className="text-xs text-slate-600">0 Critical / 1 Low Priority pending</p>
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-emerald-600">100% Target Met</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* GLOBAL MODALS */}
      {/* ========================================================================= */}

      {/* 1. View Payslip Modal */}
      {viewingPayslip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white max-w-4xl w-full rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Official Payslip A4 — {viewingPayslip.payslip_reference}
              </h3>
              <button onClick={() => setViewingPayslip(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>
            <div className="flex justify-center p-2 bg-slate-100 rounded-2xl">
              <OfficialPayslipA4 payslip={viewingPayslip} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <a
                href={apiUrl(`/payslips/${viewingPayslip.id}/download`)}
                className="px-4 py-2 bg-[#EA580C] text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 2. Attendance Correction Modal */}
      {isCorrectionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Attendance Correction Request</h3>
              <button onClick={() => setIsCorrectionModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCorrectionSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={correctionDate}
                  onChange={(e) => setCorrectionDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Requested Check-In</label>
                  <input
                    type="time"
                    required
                    value={correctionIn}
                    onChange={(e) => setCorrectionIn(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Requested Check-Out</label>
                  <input
                    type="time"
                    required
                    value={correctionOut}
                    onChange={(e) => setCorrectionOut(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Reason for Missed/Delayed Punch</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why the punch was missed (e.g. Biometric machine glitch)..."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCorrectionModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EA580C] text-white rounded-xl text-xs font-bold"
                >
                  Submit Request to HR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Apply Leave Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Apply for Leave</h3>
              <button onClick={() => setIsLeaveModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleApplyLeaveSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  <option>Casual Leave</option>
                  <option>Sick Leave</option>
                  <option>Earned Leave</option>
                  <option>Permission</option>
                  <option>Compensatory Off</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">From Date</label>
                  <input
                    type="date"
                    required
                    value={leaveFrom}
                    onChange={(e) => setLeaveFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">To Date</label>
                  <input
                    type="date"
                    required
                    value={leaveTo}
                    onChange={(e) => setLeaveTo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Number of Days</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={leaveDays}
                  onChange={(e) => setLeaveDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Reason</label>
                <textarea
                  required
                  rows={3}
                  placeholder="State the reason for leave..."
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EA580C] text-white rounded-xl text-xs font-bold"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Task Progress Modal */}
      {isTaskUpdateModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Update Task Progress</h3>
              <button onClick={() => setIsTaskUpdateModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleTaskProgressSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Task</label>
                <p className="text-xs font-bold text-slate-800">{selectedTask.title}</p>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  <option>In Progress</option>
                  <option>In Review</option>
                  <option>Completed</option>
                  <option>Pending</option>
                </select>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Progress Percentage</span>
                  <span className="text-[#EA580C] font-mono">{taskProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={taskProgress}
                  onChange={(e) => setTaskProgress(Number(e.target.value))}
                  className="w-full accent-[#EA580C] cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Work Log Notes</label>
                <textarea
                  rows={3}
                  placeholder="Describe your progress and deliverables completed..."
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTaskUpdateModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EA580C] text-white rounded-xl text-xs font-bold"
                >
                  Save Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Upload Document Modal */}
      {isUploadDocModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Upload Personal Document</h3>
              <button onClick={() => setIsUploadDocModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleUploadDocumentSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Document Name / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aadhaar Card Copy or Degree Certificate"
                  value={uploadDocName}
                  onChange={(e) => setUploadDocName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Document Category</label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  <option>Identity Proof (Aadhaar / PAN)</option>
                  <option>Educational Degree / Certificate</option>
                  <option>Previous Experience / Relieving Letter</option>
                  <option>Bank Passbook / Cancelled Cheque</option>
                  <option>Address Proof</option>
                  <option>Other Document</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Select File (PDF / Image)</label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFileName(e.target.files[0].name);
                      if (!uploadDocName) setUploadDocName(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                    }
                  }}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-[#EA580C] hover:file:bg-orange-100 cursor-pointer"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadDocModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EA580C] text-white rounded-xl text-xs font-bold"
                >
                  Upload &amp; Save Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Raise Support Ticket Modal */}
      {isRaiseTicketModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Raise HR Support Ticket</h3>
              <button onClick={() => setIsRaiseTicketModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleRaiseTicketSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Issue Category</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  <option>Profile Change Request</option>
                  <option>Attendance &amp; Punch</option>
                  <option>Payroll &amp; Salary</option>
                  <option>Document Request</option>
                  <option>IT &amp; Equipment</option>
                  <option>HR Policy &amp; General</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Priority</label>
                <select
                  value={ticketPriority}
                  onChange={(e) => setTicketPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discrepancy in July 2026 reimbursement"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Description / Problem Details</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide all relevant details for HR Helpdesk to investigate..."
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRaiseTicketModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EA580C] text-white rounded-xl text-xs font-bold"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Profile Change Modal */}
      {isProfileChangeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Request Profile Information Update</h3>
              <button onClick={() => setIsProfileChangeModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleProfileChangeSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">New Mobile Number</label>
                <input
                  type="text"
                  placeholder={currentUser.mobile}
                  value={changeMobile}
                  onChange={(e) => setChangeMobile(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">New Emergency Contact</label>
                <input
                  type="text"
                  placeholder={currentUser.emergency_contact || '+91 98765 43210'}
                  value={changeEmergency}
                  onChange={(e) => setChangeEmergency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">New Residential Address</label>
                <textarea
                  rows={2}
                  placeholder={currentUser.address || 'Address'}
                  value={changeAddress}
                  onChange={(e) => setChangeAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Reason for Update</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Relocated to new residence"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProfileChangeModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EA580C] text-white rounded-xl text-xs font-bold"
                >
                  Submit Changes for HR Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Relieving & 1-Month Resignation Modal */}
      {isRelievingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">1-Month Resignation &amp; Relieving Application</h3>
                <p className="text-[11px] text-slate-500">Official AutoRevive Employment Exit &amp; Relieving Letter</p>
              </div>
              <button onClick={() => setIsRelievingModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleRelievingSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Submission Date</label>
                  <input
                    type="text"
                    disabled
                    value={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Notice Period</label>
                  <input
                    type="text"
                    disabled
                    value="30 Days (1 Month)"
                    className="w-full px-3 py-2 bg-orange-50 border border-orange-200 text-[#EA580C] rounded-xl text-xs font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Reason for Relieving</label>
                <select
                  value={relievingReason}
                  onChange={(e) => setRelievingReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  <option>Career Growth &amp; New Opportunity</option>
                  <option>Higher Education / Studies</option>
                  <option>Personal &amp; Family Reasons</option>
                  <option>Relocation / Moving City</option>
                  <option>Health &amp; Medical Grounds</option>
                  <option>Other Employment Opportunity</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Project &amp; Asset Handover Plan</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail your plan to transition active tasks, repositories, and documentation to team members..."
                  value={relievingHandover}
                  onChange={(e) => setRelievingHandover(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <input type="checkbox" required id="notice-ack" className="mt-0.5 rounded text-[#EA580C] focus:ring-[#EA580C]" />
                <label htmlFor="notice-ack" className="cursor-pointer select-none leading-relaxed">
                  I acknowledge that serving the mandatory 1-month notice period (30 days) is required for receiving my official AutoRevive Relieving Letter and Full &amp; Final Settlement.
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRelievingModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded-xl text-xs font-bold shadow-2xs"
                >
                  Submit 1-Month Resignation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
export default EmployeePortalView;
