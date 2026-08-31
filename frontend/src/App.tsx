import React, { useEffect, useState } from 'react';
import { DocumentType, DocumentData, DocumentStatus, SignatureData, StoredDocument } from './types';
import { 
  initialAutoReviveOffer, 
  initialInternshipOffer,
} from './data/initialData';
import { Sidebar, SidebarPage } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DocumentTypeSliderRow } from './components/DocumentTypeSliderRow';
import { EmployeeDocumentDetailsForm } from './components/EmployeeDocumentDetailsForm';
import { DocumentPreviewPanel } from './components/DocumentPreviewPanel';
import { DocumentHistorySection } from './components/DocumentHistorySection';
import { DashboardView } from './components/DashboardView';
import { PayrollView } from './components/PayrollView';
import { PayslipsView } from './components/PayslipsView';
import { EmployeesView, EmployeeProfile } from './components/EmployeesView';
import { RecruitmentView } from './components/RecruitmentView';
import { AttendanceView } from './components/AttendanceView';
import { LeavesView } from './components/LeavesView';
import { AutoReviveLogo } from './components/AutoReviveLogo';
import { PerformanceView } from './components/PerformanceView';
import { TicketsView } from './components/TicketsView';
import { HolidaysView } from './components/HolidaysView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { PublicApplyPage } from './components/PublicApplyPage';
import { PublicOfferAcceptPage } from './components/PublicOfferAcceptPage';
import { EmployeePortalView } from './components/EmployeePortalView';
import { EmployeeOption } from './components/DocumentForm';
import { EmailDocumentModal } from './components/EmailDocumentModal';
import { NewEntryModal } from './components/NewEntryModal';
import { UnsavedChangesModal } from './components/UnsavedChangesModal';
import { AdminManagementView } from './components/AdminManagementView';
import { AuditLogsView } from './components/AuditLogsView';
import { TelecallingAdminView } from './components/TelecallingAdminView';
import { MarketingAdminView } from './components/MarketingAdminView';
import { DesignAdminView } from './components/DesignAdminView';
import { SocialMediaAdminView } from './components/SocialMediaAdminView';
import { apiUrl } from './api/client';
import { 
  ShieldCheck, 
  Sparkles, 
  UserPlus, 
  Key, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Mail,
  Lock,
  Smartphone,
  Send,
  RefreshCw
} from 'lucide-react';

export const App: React.FC = () => {
  // Reactive Location State (Listens to both URL paths and hash changes)
  const [currentLocation, setCurrentLocation] = useState(() => ({
    pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
    hash: typeof window !== 'undefined' ? window.location.hash : '',
  }));

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentLocation({
        pathname: window.location.pathname,
        hash: window.location.hash,
      });
    };
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // 1. Candidate Public Apply Page
  if (currentLocation.pathname.startsWith('/apply/')) {
    const raw = currentLocation.pathname.replace('/apply/', '').split('/')[0];
    const token = decodeURIComponent(raw).trim();
    return <PublicApplyPage token={token} />;
  }

  // 2. Candidate Public Offer Accept Page
  if (currentLocation.pathname.startsWith('/offer/accept/')) {
    const raw = currentLocation.pathname.replace('/offer/accept/', '').split('/')[0];
    const token = decodeURIComponent(raw).trim();
    return <PublicOfferAcceptPage token={token} />;
  }

  // 3. Employee Self-Service Portal (Accessible via URL path or #employee_portal / #portal hash)
  if (
    currentLocation.pathname.startsWith('/employee-portal') ||
    currentLocation.pathname.startsWith('/portal') ||
    currentLocation.hash === '#employee_portal' ||
    currentLocation.hash === '#portal' ||
    currentLocation.hash === '#employee-portal'
  ) {
    return <EmployeePortalView />;
  }

  // Multi-Admin Authentication Session
  const [adminSession, setAdminSession] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('autorevive_admin_session');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      admin_id: 'AR-ADM-2026-0001',
      full_name: 'Narendhar D',
      email: 'admin@autorevives.com',
      role: 'SUPER_ADMIN',
      department: 'Executive Office',
      permissions: ['*'],
      token: 'adm_SUPER_ADMIN_AR-ADM-2026-0001',
    };
  });

  // Strict Login Check: Requires explicit logged in state and active session within 5 mins
  const [isHrLoggedIn, setIsHrLoggedIn] = useState<boolean>(() => {
    try {
      const isLogged = localStorage.getItem('autorevive_hr_logged_in') === 'true';
      const session = localStorage.getItem('autorevive_admin_session');
      const lastActive = Number(localStorage.getItem('autorevive_last_active') || 0);
      const isExpired = !lastActive || (Date.now() - lastActive > 5 * 60 * 1000);
      if (isLogged && session && !isExpired) {
        return true;
      }
      localStorage.setItem('autorevive_hr_logged_in', 'false');
      return false;
    } catch {
      return false;
    }
  });

  // Auth Method: 'PASSWORD' or 'OTP'
  const [authMethod, setAuthMethod] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  const [hrEmail, setHrEmail] = useState('admin@autorevives.com');
  const [hrPassword, setHrPassword] = useState('AutoRevive@2026');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');
  const [hrError, setHrError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Setup / Register Official Admin Modal
  const [showRegisterOfficialModal, setShowRegisterOfficialModal] = useState(false);
  const [officialAdminForm, setOfficialAdminForm] = useState({
    full_name: '',
    email: '',
    mobile: '',
    role: 'SUPER_ADMIN',
    department: 'Executive Office',
    password: 'AutoRevive@2026',
  });
  const [registerNotification, setRegisterNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 5-Minute Inactivity & Page Leave Auto-Logout Effect
  useEffect(() => {
    if (!isHrLoggedIn) return;

    const INACTIVITY_LIMIT_MS = 5 * 60 * 1000; // 5 minutes = 300,000 ms
    let inactivityTimer: any;

    const performAutoLogout = (reason: string) => {
      localStorage.setItem('autorevive_hr_logged_in', 'false');
      localStorage.removeItem('autorevive_admin_session');
      localStorage.removeItem('autorevive_last_active');
      localStorage.removeItem('autorevive_left_at');
      setIsHrLoggedIn(false);
      setHrError(reason || 'Session expired due to 5 minutes of inactivity. Please sign in again.');
    };

    const resetActivityTimer = () => {
      const now = Date.now();
      localStorage.setItem('autorevive_last_active', String(now));
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        performAutoLogout('You were automatically signed out after 5 minutes of inactivity.');
      }, INACTIVITY_LIMIT_MS);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        localStorage.setItem('autorevive_left_at', String(Date.now()));
      } else {
        const leftAt = Number(localStorage.getItem('autorevive_left_at') || 0);
        if (leftAt && Date.now() - leftAt >= INACTIVITY_LIMIT_MS) {
          performAutoLogout('You were automatically signed out after leaving the portal for more than 5 minutes.');
          return;
        }
        resetActivityTimer();
      }
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetActivityTimer, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibilityChange);

    resetActivityTimer();

    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetActivityTimer));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isHrLoggedIn]);

  // Resend OTP Countdown
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hrEmail.trim() || !hrPassword.trim()) {
      setHrError('Please enter valid official admin credentials.');
      return;
    }

    try {
      setIsLoggingIn(true);
      setHrError('');
      const res = await fetch(apiUrl('/auth/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: hrEmail.trim(), password: hrPassword.trim() }),
      });
      let data: any;
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => '');
        throw new Error(text && text.length < 150 && !text.includes('<') ? text : `Server error (${res.status}). Please verify the backend service is running.`);
      }
      if (data.success && data.admin) {
        setAdminSession(data.admin);
        localStorage.setItem('autorevive_admin_session', JSON.stringify(data.admin));
        localStorage.setItem('autorevive_hr_logged_in', 'true');
        localStorage.setItem('autorevive_last_active', String(Date.now()));
        setIsHrLoggedIn(true);

        // Auto navigate to role-specific initial page
        if (data.admin.role === 'TELECALLING_ADMIN') setActiveSidebarPage('telecalling');
        else if (data.admin.role === 'MARKETING_ADMIN') setActiveSidebarPage('marketing');
        else if (data.admin.role === 'DESIGN_ADMIN') setActiveSidebarPage('design');
        else if (data.admin.role === 'SOCIAL_MEDIA_ADMIN') setActiveSidebarPage('social_media');
        else setActiveSidebarPage('dashboard');
      } else {
        setHrError(data.message || 'Invalid admin credentials.');
      }
    } catch (err: any) {
      setHrError(err.message || 'Authentication server unreachable.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!hrEmail.trim()) {
      setHrError('Please enter your registered official work email.');
      return;
    }

    try {
      setIsSendingOtp(true);
      setHrError('');
      setOtpSuccessMessage('');
      const res = await fetch(apiUrl('/auth/admin/send-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: hrEmail.trim() }),
      });
      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server error (${res.status}). Ensure backend is reachable.`);
      }

      if (data.success) {
        setIsOtpSent(true);
        setOtpCountdown(30);
        setOtpCode(''); // Keep OTP blank so user manually enters the 6-digit code received in their email
        setOtpSuccessMessage(data.message || '6-digit OTP code sent successfully to your work email!');
      } else {
        setHrError(data.message || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setHrError(err.message || 'Unable to reach authentication server.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hrEmail.trim() || !otpCode.trim()) {
      setHrError('Please enter your email and the 6-digit OTP code.');
      return;
    }

    try {
      setIsVerifyingOtp(true);
      setHrError('');
      const res = await fetch(apiUrl('/auth/admin/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: hrEmail.trim(), otp: otpCode.trim() }),
      });
      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server error (${res.status}). Ensure backend is reachable.`);
      }

      if (data.success && data.admin) {
        setAdminSession(data.admin);
        localStorage.setItem('autorevive_admin_session', JSON.stringify(data.admin));
        localStorage.setItem('autorevive_hr_logged_in', 'true');
        localStorage.setItem('autorevive_last_active', String(Date.now()));
        setIsHrLoggedIn(true);

        if (data.admin.role === 'TELECALLING_ADMIN') setActiveSidebarPage('telecalling');
        else if (data.admin.role === 'MARKETING_ADMIN') setActiveSidebarPage('marketing');
        else if (data.admin.role === 'DESIGN_ADMIN') setActiveSidebarPage('design');
        else if (data.admin.role === 'SOCIAL_MEDIA_ADMIN') setActiveSidebarPage('social_media');
        else setActiveSidebarPage('dashboard');
      } else {
        setHrError(data.message || 'Invalid or expired OTP code.');
      }
    } catch (err: any) {
      setHrError(err.message || 'Unable to reach authentication server.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleRegisterOfficialAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/auth/admin/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(officialAdminForm),
      });
      let data: any;
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => '');
        throw new Error(text && text.length < 150 && !text.includes('<') ? text : `Server error (${res.status}). Please verify backend is running.`);
      }
      if (data.success && data.admin) {
        setAdminSession(data.admin);
        localStorage.setItem('autorevive_admin_session', JSON.stringify(data.admin));
        localStorage.setItem('autorevive_hr_logged_in', 'true');
        localStorage.setItem('autorevive_last_active', String(Date.now()));
        setIsHrLoggedIn(true);
        setShowRegisterOfficialModal(false);
        setActiveSidebarPage('admin_management');
      } else {
        setRegisterNotification({ type: 'error', message: data.message || 'Unable to register official admin.' });
      }
    } catch (err: any) {
      setRegisterNotification({ type: 'error', message: err.message || 'Server error occurred during registration.' });
    }
  };

  const handleHrLogout = () => {
    localStorage.setItem('autorevive_hr_logged_in', 'false');
    localStorage.removeItem('autorevive_admin_session');
    localStorage.removeItem('autorevive_last_active');
    localStorage.removeItem('autorevive_left_at');
    setIsHrLoggedIn(false);
    setIsOtpSent(false);
    setOtpCode('');
    setOtpSuccessMessage('');
  };

  const getInitialSidebarPage = (): SidebarPage => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '') as SidebarPage;
      const validPages: SidebarPage[] = [
        'dashboard', 'employees', 'recruitment', 'document_center',
        'attendance', 'payroll', 'payslips', 'leaves',
        'performance', 'tickets', 'holidays', 'reports', 'settings',
        'telecalling', 'marketing', 'design', 'social_media',
        'admin_management', 'audit_logs'
      ];
      if (hash && validPages.includes(hash)) return hash;
      const stored = localStorage.getItem('autorevive_active_tab') as SidebarPage;
      if (stored && validPages.includes(stored)) return stored;
    }
    return 'dashboard';
  };

  const [activeSidebarPage, setActiveSidebarPage] = useState<SidebarPage>(getInitialSidebarPage);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('autorevive_active_tab', activeSidebarPage);
      if (window.location.hash !== `#${activeSidebarPage}` && !window.location.hash.includes('portal')) {
        window.history.replaceState(null, '', `#${activeSidebarPage}`);
      }
    }
  }, [activeSidebarPage]);

  const [globalSearch, setGlobalSearch] = useState('');
  const [documentHistory, setDocumentHistory] = useState<StoredDocument[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [activeDoc, setActiveDoc] = useState<DocumentType>('offer_letter');
  const [docData, setDocData] = useState<DocumentData>(initialAutoReviveOffer);
  const [internshipData, setInternshipData] = useState<DocumentData>(initialInternshipOffer);

  // Edit Mode & Form States
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [savedSnapshot, setSavedSnapshot] = useState<DocumentData>(initialAutoReviveOffer);
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState<boolean>(false);
  const [isNewEntryOpen, setIsNewEntryOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [docStatus, setDocStatus] = useState<DocumentStatus>('Created');

  const [signature] = useState<SignatureData>({
    isSigned: false,
    signatureType: 'type',
    signatureContent: '',
    signedAt: null,
    accepted: false,
  });

  const [storedDocId, setStoredDocId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTargetDoc, setEmailTargetDoc] = useState<StoredDocument | null>(null);
  const [zoomLevel] = useState<number>(100);
  const [spacingLevel] = useState<number>(5);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const isInternship = activeDoc === 'internship_letter' || activeDoc === 'autorevive_internship';
  const isCumPlacement = activeDoc === 'internship_cum_placement';
  const currentActiveData = isInternship || isCumPlacement ? internshipData : docData;

  const refreshDocumentHistory = async () => {
    try {
      const response = await fetch(apiUrl('/documents'));
      if (response.ok) {
        const data = await response.json();
        setDocumentHistory(data.documents || []);
      }
    } catch (error) {
      console.warn('Unable to load document history:', error);
    }
  };

  const parseSalaryToNum = (salaryVal?: any): number => {
    if (!salaryVal) return 550000;
    if (typeof salaryVal === 'number') return salaryVal;
    const match = String(salaryVal).match(/(d+(?:\.\d+)?)/);
    if (match) {
      const val = parseFloat(match[1]);
      if (val < 100) return Math.round(val * 100000);
      return Math.round(val);
    }
    return 550000;
  };

  const refreshEmployees = async () => {
    try {
      const [empRes, appRes] = await Promise.all([
        fetch(apiUrl('/employees')),
        fetch(apiUrl('/recruitment/applications')),
      ]);

      let empList: EmployeeOption[] = [];

      if (empRes.ok) {
        const empData = await empRes.json();
        if (empData.success && Array.isArray(empData.employees)) {
          empList = empData.employees.map((e: any) => ({
            employee_id: e.employee_id,
            full_name: e.full_name,
            parent_name: e.parent_name || '',
            email: e.email || '',
            mobile: e.mobile || '',
            college: e.college || '',
            register_no: e.register_no || '',
            department: e.department,
            role: e.role,
            employment_type: e.employment_type || 'Full-Time',
            work_location: e.work_location || 'Uthangarai, Krishnagiri',
            address: e.address || '',
            joining_date: e.joining_date || '',
            start_date: e.start_date || '',
            end_date: e.end_date || '',
            duration_months: Number(e.duration_months || 3),
            stipend_month: Number(e.stipend_month || 15000),
            salary_month: Number(e.salary_month || 41500),
            annual_ctc: Number(e.annual_ctc || 550000),
            placement_status: e.placement_status || 'Eligible',
            is_candidate: false,
          }));
        }
      }

      if (appRes.ok) {
        const appData = await appRes.json();
        if (appData.success && Array.isArray(appData.applications)) {
          const candList: EmployeeOption[] = appData.applications.map((a: any) => {
            const annual = parseSalaryToNum(a.expected_salary);
            const monthly = Math.round(annual / 12);
            const dept = a.job_title?.toLowerCase().includes('developer') || a.job_title?.toLowerCase().includes('engineer')
              ? 'Engineering'
              : (a.job_title?.toLowerCase().includes('sales') ? 'Sales & Business Development' : 'Operations');

            return {
              employee_id: a.application_id,
              full_name: `${a.full_name} (Candidate)`,
              email: a.email || '',
              mobile: a.mobile || '',
              college: a.institution || '',
              register_no: '',
              department: dept,
              role: a.job_title || 'Software Engineer',
              employment_type: 'Full-Time',
              work_location: a.preferred_location || 'Uthangarai, Krishnagiri',
              address: a.current_address || 'Uthangarai, Krishnagiri',
              joining_date: a.expected_joining_date || '03/11/2026',
              start_date: '03/11/2026',
              end_date: '02/11/2027',
              duration_months: 12,
              stipend_month: 20000,
              salary_month: monthly,
              annual_ctc: annual,
              placement_status: 'Eligible',
              is_candidate: true,
            };
          });
          empList = [...empList, ...candList];
        }
      }

      setEmployees(empList);
    } catch (error) {
      console.warn('Unable to load employee database:', error);
    }
  };

  useEffect(() => {
    void refreshDocumentHistory();
    void refreshEmployees();
  }, []);

  const applyEmployee = (emp: EmployeeOption) => {
    const rawSalary = Number(emp.salary_month || 41500);
    const basicPay = Math.round(rawSalary * 0.5);
    const hraPay = Math.round(rawSalary * 0.25);
    const specialPay = rawSalary - basicPay - hraPay;

    if (activeDoc === 'internship_letter' || activeDoc === 'autorevive_internship') {
      setInternshipData((prev) => ({
        ...prev,
        candidateName: emp.full_name,
        candidateEmail: emp.email || prev.candidateEmail,
        employeeId: emp.employee_id,
        department: emp.department,
        designation: emp.role,
        workLocation: emp.work_location || prev.workLocation,
        college: emp.college || prev.college,
        registerNumber: emp.register_no || prev.registerNumber,
        startDate: emp.start_date || prev.startDate,
        endDate: emp.end_date || prev.endDate,
        duration: emp.duration_months ? `${emp.duration_months} Months` : prev.duration,
        stipend: emp.stipend_month ? `₹${Number(emp.stipend_month).toLocaleString('en-IN')}/Month` : prev.stipend,
        refNo: `AR/INT/2026/${emp.employee_id.replace(/[^0-9]/g, '').padStart(4, '0') || '0001'}`,
      }));
    } else if (activeDoc === 'internship_cum_placement') {
      setInternshipData((prev) => ({
        ...prev,
        candidateName: emp.full_name,
        candidateEmail: emp.email || prev.candidateEmail,
        employeeId: emp.employee_id,
        department: emp.department,
        designation: emp.role,
        workLocation: emp.work_location || prev.workLocation,
        college: emp.college || prev.college,
        registerNumber: emp.register_no || prev.registerNumber,
        startDate: emp.start_date || prev.startDate,
        endDate: emp.end_date || prev.endDate,
        duration: emp.duration_months ? `${emp.duration_months} Months` : prev.duration,
        stipend: emp.stipend_month ? `₹${Number(emp.stipend_month).toLocaleString('en-IN')}/Month` : prev.stipend,
        postInternshipCtc: emp.annual_ctc ? `₹ ${(Number(emp.annual_ctc) / 100000).toFixed(1)} LPA` : prev.postInternshipCtc,
        refNo: `AR/ICP/2026/${emp.employee_id.replace(/[^0-9]/g, '').padStart(4, '0') || '0001'}`,
      }));
    } else {
      setDocData((prev) => ({
        ...prev,
        candidateName: emp.full_name,
        candidateEmail: emp.email || prev.candidateEmail,
        employeeId: emp.employee_id,
        department: emp.department,
        designation: emp.role,
        workLocation: emp.work_location || prev.workLocation,
        candidateAddress: emp.address || prev.candidateAddress,
        joiningDate: emp.joining_date || prev.joiningDate,
        annualCtc: emp.annual_ctc ? `₹ ${(Number(emp.annual_ctc) / 100000).toFixed(1)} LPA` : prev.annualCtc,
        monthlySalary: `₹ ${rawSalary.toLocaleString('en-IN')}`,
        basicSalary: `₹ ${basicPay.toLocaleString('en-IN')}`,
        hra: `₹ ${hraPay.toLocaleString('en-IN')}`,
        specialAllowance: `₹ ${specialPay.toLocaleString('en-IN')}`,
        refNo: `AR/HR/2026/${emp.employee_id.replace(/[^0-9]/g, '').padStart(4, '0') || '0001'}`,
      }));
    }
  };

  const getBackendDocumentType = (): string => {
    switch (activeDoc) {
      case 'offer_letter': return 'offer_letter';
      case 'appointment_letter': return 'appointment_letter';
      case 'internship_letter':
      case 'autorevive_internship': return 'internship_letter';
      case 'internship_cum_placement': return 'internship_cum_placement';
      case 'relieving_letter': return 'relieving_letter';
      case 'appreciation_certificate': return 'appreciation_certificate';
      case 'internship_completion_certificate': return 'internship_completion_certificate';
      default: return 'offer_letter';
    }
  };

  const getDocumentLabel = (): string => {
    switch (activeDoc) {
      case 'offer_letter': return 'Offer Letter';
      case 'appointment_letter': return 'Appointment Letter';
      case 'internship_letter':
      case 'autorevive_internship': return 'Internship Letter';
      case 'internship_cum_placement': return 'Internship cum Placement Letter';
      case 'relieving_letter': return 'Relieving Letter';
      case 'appreciation_certificate': return 'Appreciation Certificate';
      case 'internship_completion_certificate': return 'Internship Completion Certificate';
      default: return 'HR Document';
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const payload = {
        document_type: getBackendDocumentType(),
        employee_id: currentActiveData.employeeId,
        issue_date: currentActiveData.issueDate || new Date().toISOString().split('T')[0],
        document_data: currentActiveData,
        employee: {
          employee_id: currentActiveData.employeeId,
          full_name: currentActiveData.candidateName,
          email: currentActiveData.candidateEmail,
          mobile: currentActiveData.candidatePhone || null,
          department: currentActiveData.department,
          role: currentActiveData.designation,
          work_location: currentActiveData.workLocation,
          address: currentActiveData.candidateAddress || null,
          joining_date: currentActiveData.joiningDate || null,
          start_date: currentActiveData.startDate || null,
          end_date: currentActiveData.endDate || null,
          duration_months: currentActiveData.duration ? parseInt(currentActiveData.duration) : null,
          stipend_month: currentActiveData.stipend ? parseFloat(currentActiveData.stipend.replace(/[^0-9.]/g, '')) : null,
          salary_month: currentActiveData.monthlySalary ? parseFloat(currentActiveData.monthlySalary.replace(/[^0-9.]/g, '')) : null,
          annual_ctc: currentActiveData.annualCtc ? parseFloat(currentActiveData.annualCtc.replace(/[^0-9.]/g, '')) * 100000 : null,
        }
      };

      const res = await fetch(apiUrl('/documents'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to save document.');

      setStoredDocId(result.document.id);
      setDocStatus('Approved');
      setSavedSnapshot(currentActiveData);
      setHasUnsavedChanges(false);
      setIsEditMode(false);
      setStatusMessage(`Document ${result.document.document_number} saved & synchronized successfully!`);
      void refreshDocumentHistory();
      void refreshEmployees();
    } catch (err: any) {
      setStatusMessage(err?.message || 'Error saving document.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      setIsUnsavedModalOpen(true);
    } else {
      setIsEditMode(false);
    }
  };

  const handleDiscardChanges = () => {
    if (isInternship || isCumPlacement) {
      setInternshipData(savedSnapshot);
    } else {
      setDocData(savedSnapshot);
    }
    setHasUnsavedChanges(false);
    setIsEditMode(false);
    setIsUnsavedModalOpen(false);
  };

  const handleGeneratePdf = async () => {
    setIsGenerating(true);
    try {
      let docId = storedDocId;
      if (!docId) {
        const payload = {
          document_type: getBackendDocumentType(),
          employee_id: currentActiveData.employeeId,
          issue_date: currentActiveData.issueDate || new Date().toISOString().split('T')[0],
          document_data: currentActiveData,
          employee: {
            employee_id: currentActiveData.employeeId,
            full_name: currentActiveData.candidateName,
            email: currentActiveData.candidateEmail,
            mobile: currentActiveData.candidatePhone || null,
            department: currentActiveData.department,
            role: currentActiveData.designation,
            work_location: currentActiveData.workLocation,
            address: currentActiveData.candidateAddress || null,
            joining_date: currentActiveData.joiningDate || null,
            start_date: currentActiveData.startDate || null,
            end_date: currentActiveData.endDate || null,
            annual_ctc: currentActiveData.annualCtc ? parseFloat(currentActiveData.annualCtc.replace(/[^0-9.]/g, '')) * 100000 : null,
          }
        };
        const createRes = await fetch(apiUrl('/documents'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const createData = await createRes.json();
        if (!createRes.ok) throw new Error(createData.message || 'Failed to initialize document record.');
        docId = createData.document.id;
        setStoredDocId(docId);
      }

      const genRes = await fetch(apiUrl(`/documents/${docId}/generate-pdf`), {
        method: 'POST'
      });
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.message || 'PDF Generation failed.');

      setStatusMessage(`Official PDF generated successfully! Saved to repository as ${genData.document.file_name}`);
      void refreshDocumentHistory();
    } catch (err: any) {
      setStatusMessage(err?.message || 'Error generating PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      if (storedDocId) {
        window.open(apiUrl(`/documents/${storedDocId}/download`), '_blank');
      } else {
        await handleGeneratePdf();
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Error initiating download.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCreateNewDocument = (docType: DocumentType) => {
    setActiveDoc(docType);
    setStoredDocId(null);
    setIsEditMode(true);
    setHasUnsavedChanges(true);
    setIsNewEntryOpen(false);
  };

  const handleViewDocument = (doc: StoredDocument) => {
    setActiveDoc(doc.document_type as DocumentType);
    setStoredDocId(doc.id);
    if (doc.document_data) {
      if (doc.document_type === 'internship_letter' || doc.document_type === 'internship_cum_placement') {
        setInternshipData(doc.document_data);
      } else {
        setDocData(doc.document_data);
      }
      setSavedSnapshot(doc.document_data);
    }
    setIsEditMode(false);
    setHasUnsavedChanges(false);
    setStatusMessage(`Viewing document ${doc.document_number} (${doc.document_type})`);
  };

  const handleEditDocument = (doc: StoredDocument) => {
    handleViewDocument(doc);
    setIsEditMode(true);
  };

  const handleDuplicateDocument = (doc: StoredDocument) => {
    handleViewDocument(doc);
    setStoredDocId(null);
    setIsEditMode(true);
    setHasUnsavedChanges(true);
    setStatusMessage(`Duplicated document ${doc.document_number}. You can now save it under a new ID.`);
  };

  const handlePrintFromId = (docId: number) => {
    window.open(apiUrl(`/documents/${docId}/download`), '_blank');
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!window.confirm('Are you sure you want to delete this document from the official repository?')) return;
    try {
      const res = await fetch(apiUrl(`/documents/${docId}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed.');
      setStatusMessage('Document deleted successfully.');
      if (storedDocId === docId) setStoredDocId(null);
      void refreshDocumentHistory();
    } catch (err: any) {
      setStatusMessage(err?.message || 'Unable to delete document.');
    }
  };

  const [docCenterTab, setDocCenterTab] = useState<'workspace' | 'history'>('workspace');

  const getPageTitle = () => {
    switch (activeSidebarPage) {
      case 'dashboard': return 'Dashboard';
      case 'employees': return 'Employees Directory';
      case 'recruitment': return 'Recruitment & Job Vacancies';
      case 'document_center': return 'Document Center';
      case 'attendance': return 'Attendance & Punch Terminal';
      case 'payroll': return 'Payroll Processing';
      case 'payslips': return 'Payslips & Archive';
      case 'leaves': return 'Leave Management';
      case 'performance': return 'Performance & Appraisals';
      case 'tickets': return 'Helpdesk & Resignations';
      case 'holidays': return 'Holidays Calendar';
      case 'reports': return 'Reports & Intelligence';
      case 'settings': return 'System Settings';
      case 'telecalling': return 'Telecalling CRM Hub';
      case 'marketing': return 'Marketing & Campaigns Hub';
      case 'design': return 'Design & UI/UX Studio';
      case 'social_media': return 'Social Media & Creator Hub';
      case 'admin_management': return 'Admin Management & RBAC';
      case 'audit_logs': return 'System Activity & Audit Logs';
      default: return 'HR ERP Management';
    }
  };

  // If Admin is logged out, render the AutoRevive Multi-Admin Authentication Screen with Demo Quick Switcher & Official Account Registration
  if (!isHrLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 select-none relative overflow-hidden font-sans">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#EA580C]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-xl w-full bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-slate-200/80 relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-3">
              <AutoReviveLogo size="lg" showSubText={true} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#EA580C] text-[11px] font-extrabold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official ERP Administrator Portal</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">AutoRevive Admin Sign In</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Sign in securely using your administrator password or verified Email OTP.
            </p>
          </div>

          {/* Authentication Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('PASSWORD');
                setHrError('');
                setOtpSuccessMessage('');
              }}
              className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                authMethod === 'PASSWORD'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>Login with Password</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('OTP');
                setHrError('');
                setOtpSuccessMessage('');
              }}
              className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                authMethod === 'OTP'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-purple-600" />
              <span>Login with OTP</span>
            </button>
          </div>

          {hrError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-4 py-3 rounded-2xl shadow-2xs animate-in fade-in flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{hrError}</span>
            </div>
          )}

          {otpSuccessMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-2xl shadow-2xs animate-in fade-in flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{otpSuccessMessage}</span>
            </div>
          )}

          {/* 1. PASSWORD LOGIN FORM */}
          {authMethod === 'PASSWORD' && (
            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Admin Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. admin@autorevives.com"
                    value={hrEmail}
                    onChange={(e) => setHrEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={hrPassword}
                    onChange={(e) => setHrPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 bg-[#EA580C] hover:bg-[#c2410c] text-white font-black text-xs rounded-2xl shadow-lg shadow-orange-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isLoggingIn ? 'Verifying Admin Credentials...' : 'Sign In with Password'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* 2. OTP LOGIN FORM */}
          {authMethod === 'OTP' && (
            <div className="space-y-4">
              {!isOtpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Registered Admin Work Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. admin@autorevives.com"
                        value={hrEmail}
                        onChange={(e) => setHrEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      We will send a 6-digit verification code to your official email.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingOtp}
                    className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-2xl shadow-lg shadow-purple-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSendingOtp ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending Verification Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Verification OTP</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">Enter 6-Digit OTP Code</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOtpSent(false);
                          setOtpCode('');
                          setOtpSuccessMessage('');
                        }}
                        className="text-[11px] font-bold text-purple-700 hover:underline cursor-pointer"
                      >
                        Change Email ({hrEmail})
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-3 bg-purple-50/50 border-2 border-purple-300 rounded-2xl text-center text-lg font-black tracking-widest text-purple-900 focus:bg-white focus:border-purple-600 focus:outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otpCode.length < 6}
                    className="w-full py-3 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow-lg shadow-purple-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{isVerifyingOtp ? 'Verifying OTP Code...' : 'Verify OTP & Sign In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      disabled={otpCountdown > 0 || isSendingOtp}
                      onClick={() => handleSendOtp()}
                      className={`text-xs font-bold ${
                        otpCountdown > 0
                          ? 'text-slate-400 cursor-not-allowed'
                          : 'text-purple-700 hover:text-purple-900 cursor-pointer'
                      }`}
                    >
                      {otpCountdown > 0 ? `Resend OTP in ${otpCountdown}s` : 'Didn\'t receive OTP? Resend Code'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">AutoRevive Human Resources Management</span>
            <a
              href="#employee_portal"
              className="font-bold text-slate-600 hover:text-[#EA580C] transition-colors inline-flex items-center gap-1.5"
            >
              <span>Employee Portal →</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex font-sans antialiased">
      {/* 1. LEFT SIDEBAR (Role-Driven Dynamic Menus) */}
      <Sidebar
        activePage={activeSidebarPage}
        onSelectPage={(page) => setActiveSidebarPage(page)}
        onLogout={handleHrLogout}
        adminRole={adminSession?.role || 'SUPER_ADMIN'}
        adminName={adminSession?.full_name}
      />

      {/* 2. MAIN APPLICATION CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header with Breadcrumbs, Search, Bell, Profile & Logout */}
        <TopHeader
          pageTitle={getPageTitle()}
          breadcrumb={
            activeSidebarPage === 'dashboard'
              ? 'Dashboard'
              : `Home > ${adminSession?.department || 'Administration'} > ${getPageTitle()}`
          }
          searchTerm={globalSearch}
          onSearchChange={setGlobalSearch}
          onLogout={handleHrLogout}
          onNavigateSettings={() => setActiveSidebarPage('settings')}
          currentAdmin={adminSession}
        />

        {/* Global Toast Notification */}
        {statusMessage && (
          <div className="bg-orange-50 border-b border-orange-200 px-6 py-2 text-xs font-semibold text-slate-800 flex items-center justify-between no-print animate-in fade-in">
            <span className="truncate max-w-4xl">{statusMessage}</span>
            <button onClick={() => setStatusMessage('')} className="text-slate-400 hover:text-slate-600 ml-2 cursor-pointer">✕</button>
          </div>
        )}

        {/* Page Content View Router */}
        <div className="p-6 space-y-5 max-w-[1600px] w-full">
          {activeSidebarPage === 'dashboard' && (
            <DashboardView onNavigate={(p) => setActiveSidebarPage(p as SidebarPage)} />
          )}

          {activeSidebarPage === 'employees' && (
            <EmployeesView
              onIssueDocument={(emp) => {
                applyEmployee(emp);
                setActiveSidebarPage('document_center');
              }}
            />
          )}

          {activeSidebarPage === 'recruitment' && (
            <RecruitmentView
              onTransitionToOffer={(candidate) => {
                const annual = parseSalaryToNum(candidate.expected_salary);
                const monthly = Math.round(annual / 12);
                const dept = candidate.job_title?.toLowerCase().includes('developer') || candidate.job_title?.toLowerCase().includes('engineer')
                  ? 'Engineering'
                  : (candidate.job_title?.toLowerCase().includes('sales') ? 'Sales & Business Development' : 'Operations');
                const isIntern = candidate.job_title?.toLowerCase().includes('intern');
                const docType: DocumentType = isIntern ? 'internship_letter' : 'offer_letter';

                const candOption: EmployeeOption = {
                  employee_id: candidate.application_id,
                  full_name: `${candidate.full_name} (Candidate)`,
                  email: candidate.email,
                  mobile: candidate.mobile,
                  department: dept,
                  role: candidate.job_title,
                  work_location: candidate.preferred_location || 'Uthangarai, Krishnagiri',
                  address: candidate.current_address || 'Uthangarai, Krishnagiri',
                  joining_date: candidate.expected_joining_date || '03/11/2026',
                  annual_ctc: annual,
                  salary_month: monthly,
                  is_candidate: true,
                };

                setEmployees((prev) => {
                  const exists = prev.some((e) => e.employee_id === candidate.application_id);
                  return exists ? prev : [candOption, ...prev];
                });

                applyEmployee(candOption);
                setActiveDoc(docType);
                setIsEditMode(true);
                setActiveSidebarPage('document_center');
                setStatusMessage(`Candidate ${candidate.full_name} loaded into Document Studio. You can adjust CTC, Location, or Work Type.`);
              }}
              onTransitionToAppointment={(candidate) => {
                const annual = parseSalaryToNum(candidate.expected_salary);
                const monthly = Math.round(annual / 12);
                const dept = candidate.job_title?.toLowerCase().includes('developer') || candidate.job_title?.toLowerCase().includes('engineer')
                  ? 'Engineering'
                  : (candidate.job_title?.toLowerCase().includes('sales') ? 'Sales & Business Development' : 'Operations');

                const candOption: EmployeeOption = {
                  employee_id: candidate.application_id,
                  full_name: `${candidate.full_name} (Candidate)`,
                  email: candidate.email,
                  mobile: candidate.mobile,
                  department: dept,
                  role: candidate.job_title,
                  work_location: candidate.preferred_location || 'Uthangarai, Krishnagiri',
                  address: candidate.current_address || 'Uthangarai, Krishnagiri',
                  joining_date: candidate.expected_joining_date || '03/11/2026',
                  annual_ctc: annual,
                  salary_month: monthly,
                  is_candidate: true,
                };

                setEmployees((prev) => {
                  const exists = prev.some((e) => e.employee_id === candidate.application_id);
                  return exists ? prev : [candOption, ...prev];
                });

                applyEmployee(candOption);
                setActiveDoc('appointment_letter');
                setIsEditMode(true);
                setActiveSidebarPage('document_center');
                setStatusMessage(`Candidate ${candidate.full_name} loaded for Official Appointment Letter.`);
              }}
            />
          )}

          {activeSidebarPage === 'attendance' && (
            <AttendanceView />
          )}

          {activeSidebarPage === 'payroll' && (
            <PayrollView onNavigatePayslips={() => setActiveSidebarPage('payslips')} />
          )}

          {activeSidebarPage === 'payslips' && (
            <PayslipsView />
          )}

          {activeSidebarPage === 'leaves' && (
            <LeavesView />
          )}

          {activeSidebarPage === 'performance' && (
            <PerformanceView />
          )}

          {activeSidebarPage === 'tickets' && (
            <TicketsView />
          )}

          {activeSidebarPage === 'holidays' && (
            <HolidaysView />
          )}

          {activeSidebarPage === 'reports' && (
            <ReportsView />
          )}

          {activeSidebarPage === 'settings' && (
            <SettingsView />
          )}

          {activeSidebarPage === 'telecalling' && (
            <TelecallingAdminView currentAdmin={adminSession} />
          )}

          {activeSidebarPage === 'marketing' && (
            <MarketingAdminView currentAdmin={adminSession} />
          )}

          {activeSidebarPage === 'design' && (
            <DesignAdminView currentAdmin={adminSession} />
          )}

          {activeSidebarPage === 'social_media' && (
            <SocialMediaAdminView currentAdmin={adminSession} />
          )}

          {activeSidebarPage === 'admin_management' && (
            <AdminManagementView currentAdmin={adminSession} />
          )}

          {activeSidebarPage === 'audit_logs' && (
            <AuditLogsView currentAdmin={adminSession} />
          )}

          {activeSidebarPage === 'document_center' && (
            <div className="space-y-5">
              {/* Top View Toggle: Document Studio vs Separate Download History */}
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2 shadow-2xs">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setDocCenterTab('workspace')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      docCenterTab === 'workspace'
                        ? 'bg-white text-[#EA580C] shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Document Studio &amp; Generator
                  </button>
                  <button
                    onClick={() => setDocCenterTab('history')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      docCenterTab === 'history'
                        ? 'bg-white text-[#EA580C] shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Download History &amp; Archive</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      docCenterTab === 'history' ? 'bg-orange-50 text-[#EA580C]' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {documentHistory.length}
                    </span>
                  </button>
                </div>

                <span className="text-[11px] text-slate-400 font-medium pr-3 hidden sm:inline">
                  Official AutoRevive HR Letter &amp; Contract Automation
                </span>
              </div>

              {docCenterTab === 'workspace' ? (
                <>
                  {/* Row 1: Document Type Slider (Left) & 4 Action Buttons (Right) */}
                  <DocumentTypeSliderRow
                    activeDoc={activeDoc}
                    onSelectDoc={(doc) => {
                      setActiveDoc(doc);
                      setStoredDocId(null);
                    }}
                    onGeneratePdf={handleGeneratePdf}
                    onDownloadPdf={handleDownloadPdf}
                    onPrint={handlePrint}
                    onOpenEmailModal={() => {
                      setEmailTargetDoc(null);
                      setIsEmailModalOpen(true);
                    }}
                    isGenerating={isGenerating}
                  />

                  {/* Row 2: Main Split - Left Form (5 cols) & Right Live Preview (7 cols) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Form: Employee & Document Details */}
                    <div className="lg:col-span-5">
                      <EmployeeDocumentDetailsForm
                        activeDoc={activeDoc}
                        onSelectDoc={setActiveDoc}
                        data={currentActiveData}
                        onChange={(updated) => {
                          if (isInternship || isCumPlacement) {
                            setInternshipData(updated);
                          } else {
                            setDocData(updated);
                          }
                          setHasUnsavedChanges(true);
                        }}
                        employees={employees}
                        onSelectEmployee={applyEmployee}
                        isEditMode={isEditMode}
                        onToggleEditMode={() => setIsEditMode(!isEditMode)}
                        onOpenNewEntry={() => setIsNewEntryOpen(true)}
                        onSaveChanges={handleSaveChanges}
                        onCancelEdit={handleCancelEdit}
                        isSaving={isSaving}
                      />
                    </div>

                    {/* Right Panel: Live Document Preview */}
                    <div className="lg:col-span-7">
                      <DocumentPreviewPanel
                        activeDoc={activeDoc}
                        docData={docData}
                        internshipData={internshipData}
                        currentActiveData={currentActiveData}
                        signature={signature}
                        spacingLevel={spacingLevel}
                        zoomLevel={zoomLevel}
                        isEditMode={isEditMode}
                        onToggleEditMode={() => setIsEditMode(!isEditMode)}
                      />
                    </div>
                  </div>

                  {/* Row 3: Bottom Document History Section with Filter Controls & Table */}
                  <DocumentHistorySection
                    documents={documentHistory}
                    onRefresh={refreshDocumentHistory}
                    onViewDocument={handleViewDocument}
                    onEditDocument={handleEditDocument}
                    onDuplicateDocument={handleDuplicateDocument}
                    onDeleteDocument={handleDeleteDocument}
                    onPrintDocument={handlePrintFromId}
                    onEmailDocument={(doc) => {
                      setEmailTargetDoc(doc);
                      setIsEmailModalOpen(true);
                    }}
                    onOpenNewEntry={() => setIsNewEntryOpen(true)}
                  />
                </>
              ) : (
                /* Separate Full-Width Download History & Repository View */
                <div className="space-y-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Official Document Archive &amp; Download History</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Browse all generated Offer Letters, Appointment Letters, and Internship Certificates with permanent SQL references.</p>
                    </div>
                    <button
                      onClick={() => setDocCenterTab('workspace')}
                      className="px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer"
                    >
                      ← Back to Document Studio
                    </button>
                  </div>

                  <DocumentHistorySection
                    documents={documentHistory}
                    onRefresh={refreshDocumentHistory}
                    onViewDocument={(doc) => {
                      handleViewDocument(doc);
                      setDocCenterTab('workspace');
                    }}
                    onEditDocument={(doc) => {
                      handleEditDocument(doc);
                      setDocCenterTab('workspace');
                    }}
                    onDuplicateDocument={(doc) => {
                      handleDuplicateDocument(doc);
                      setDocCenterTab('workspace');
                    }}
                    onDeleteDocument={handleDeleteDocument}
                    onPrintDocument={handlePrintFromId}
                    onEmailDocument={(doc) => {
                      setEmailTargetDoc(doc);
                      setIsEmailModalOpen(true);
                    }}
                    onOpenNewEntry={() => setIsNewEntryOpen(true)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* + New Entry Modal */}
      <NewEntryModal
        isOpen={isNewEntryOpen}
        onClose={() => setIsNewEntryOpen(false)}
        onCreate={handleCreateNewDocument}
        defaultDocType={activeDoc}
      />

      {/* Unsaved Changes Confirmation Modal */}
      <UnsavedChangesModal
        isOpen={isUnsavedModalOpen}
        onContinueEditing={() => setIsUnsavedModalOpen(false)}
        onDiscardChanges={handleDiscardChanges}
      />

      {/* Email Document Confirmation Modal */}
      <EmailDocumentModal
        isOpen={isEmailModalOpen}
        onClose={() => {
          setIsEmailModalOpen(false);
          setEmailTargetDoc(null);
        }}
        employeeId={emailTargetDoc?.employee_id || currentActiveData.employeeId}
        candidateName={emailTargetDoc?.full_name || currentActiveData.candidateName}
        documentType={emailTargetDoc?.document_type || getBackendDocumentType()}
        documentLabel={
          emailTargetDoc 
            ? emailTargetDoc.document_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
            : getDocumentLabel()
        }
        referenceNumber={emailTargetDoc?.document_number || currentActiveData.refNo}
        defaultEmail={emailTargetDoc?.email || currentActiveData.candidateEmail || ''}
        onEmailSent={() => {
          void refreshDocumentHistory();
          void refreshEmployees();
          const curId = emailTargetDoc?.employee_id || currentActiveData.employeeId;
          if (curId.startsWith('AR-APP-') || curId.startsWith('AR-CND-') || activeDoc === 'offer_letter' || activeDoc === 'appointment_letter') {
            setActiveSidebarPage('recruitment');
            setStatusMessage(`Official ${getDocumentLabel()} emailed successfully with PDF attachment! Application status updated.`);
          }
        }}
      />
    </div>
  );
};

export default App;
