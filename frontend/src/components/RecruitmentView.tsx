import React, { useEffect, useState } from 'react';
import { 
  Briefcase, 
  UserPlus, 
  FileText, 
  CheckCircle2, 
  Calendar, 
  Plus, 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  Clock, 
  Award,
  Send,
  Loader2,
  Eye,
  Download,
  FileCheck,
  FileSpreadsheet,
  MessageSquarePlus,
  Filter,
  UserCheck,
  XCircle,
  FolderOpen,
  Trash2,
  PlusCircle,
  X
} from 'lucide-react';
import { apiUrl } from '../api/client';

export const RecruitmentView: React.FC<{ 
  onTransitionToOffer?: (candidate: any) => void;
  onTransitionToAppointment?: (candidate: any) => void;
  onNavigateToEmployees?: (employeeId?: string) => void;
}> = ({ onTransitionToOffer, onTransitionToAppointment, onNavigateToEmployees }) => {
  const [activeTab, setActiveTab] = useState<'applications' | 'vacancies'>('applications');
  const [pipelineSegment, setPipelineSegment] = useState<'all' | 'active' | 'onboarded'>('all');
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isVacancyModalOpen, setIsVacancyModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

  // Selected records
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [selectedAppDocuments, setSelectedAppDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{
    isOpen: boolean;
    title: string;
    url: string;
    rawUrl: string;
    isPdf: boolean;
    loading: boolean;
    error: string | null;
  }>({
    isOpen: false,
    title: '',
    url: '',
    rawUrl: '',
    isPdf: false,
    loading: false,
    error: null,
  });
  const [screenNotes, setScreenNotes] = useState('');
  const [recruiterNote, setRecruiterNote] = useState('');

  // New Vacancy Form with HR Mandatory Field Configuration
  const [vacancyModalTab, setVacancyModalTab] = useState<'basics' | 'criteria' | 'rounds' | 'documents'>('basics');
  const [newVac, setNewVac] = useState({
    title: '',
    department: 'Engineering',
    employment_type: 'Full Time',
    openings: 2,
    location: 'Uthangarai, Krishnagiri',
    work_model: 'On-site',
    salary_range: '₹ 5.0 - 8.0 LPA',
    experience_required: '1 - 3 Years',
    experience_level: 'Both',
    qualification: 'B.E / B.Tech / Any Graduate',
    skills: 'Vehicle Inspection, Diagnostic Scanning, Maintenance Protocols',
    description: 'AutoRevive is expanding its core engineering and operations workforce. You will be responsible for diagnostic workflows, platform reliability, client systems integration, and automotive technical evaluations.',
    mandatory_fields: ['full_name', 'email', 'mobile', 'dob', 'gender', 'current_address', 'qualification', 'expected_salary'],
    mandatory_documents: [
      'Current Resume / CV (PDF or Word)',
      'Highest Degree / Provisional Certificate',
      'Government ID Proof (Aadhaar / PAN Card)',
      'Experience Letter & Recent Payslip (If Experienced)'
    ],
    interview_rounds: [
      { round: 1, title: 'Round 1: Document Screening & Profile Verification', description: 'HR verifies basic eligibility, academic percentages, ID proofs, and experience match. Once passed, candidate status transitions to Screening Completed.' },
      { round: 2, title: 'Round 2: Technical Competency & Diagnostic Assessment', description: 'Conducted via Google Meet or on-site by technical leads. In-depth questions on core domain skills, diagnostics, and problem solving.' },
      { round: 3, title: 'Round 3: Final Leadership & Shortlist Approval', description: 'Interview completion review with HR Manager and Leadership. When both screening and interview rounds are passed, candidate is officially marked SHORTLISTED.' },
      { round: 4, title: 'Round 4: Offer Letter & Employee Enrollment', description: 'Official employment offer generated with digital acceptance link and Appointment Letter.' }
    ],
    deadline: '30/11/2026',
  });

  // Interview state
  const [interviewForm, setInterviewForm] = useState({
    round: 'Technical Round 1',
    interviewer: 'Jemsina Banu (HR)',
    date: '30/08/2026',
    time: '11:00 AM',
    mode: 'Online',
    meeting_link: 'https://meet.google.com/xyz-auto-revive',
    notes: 'Evaluate vehicle diagnostic fundamentals, OBD-II knowledge, and communications.',
  });

  const loadData = async () => {
    try {
      const [vacRes, appRes] = await Promise.all([
        fetch(apiUrl('/recruitment/vacancies')),
        fetch(apiUrl('/recruitment/applications')),
      ]);
      const [vacData, appData] = await Promise.all([vacRes.json(), appRes.json()]);
      if (vacData.success) setVacancies(vacData.vacancies || []);
      if (appData.success) setApplications(appData.applications || []);
    } catch (err) {
      console.warn('Could not load recruitment data:', err);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCopyLink = (token: string) => {
    const fullUrl = `${window.location.origin}/apply/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleCreateVacancy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/recruitment/vacancies'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVac),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage('Job Vacancy published with candidate application link.');
        setIsVacancyModalOpen(false);
        void loadData();
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Failed to create vacancy.');
    }
  };

  const handleOpenDocumentsModal = async (app: any) => {
    setSelectedApp(app);
    try {
      const res = await fetch(apiUrl(`/recruitment/applications/${app.id}/documents`));
      const data = await res.json();
      if (data.success) {
        setSelectedAppDocuments(data.documents || []);
      }
    } catch (err) {
      console.warn(err);
    }
    setIsDocumentsModalOpen(true);
  };

  const handleScreenCandidate = async (appId: number, status: 'PASSED' | 'COMPLETED' | 'REJECTED') => {
    try {
      const res = await fetch(apiUrl(`/recruitment/applications/${appId}/screen`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screening_status: status, notes: screenNotes }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Candidate marked ${status === 'REJECTED' ? 'Screening Rejected' : 'Screening Completed (Shortlisted)'}.`);
        setIsScreenModalOpen(false);
        setScreenNotes('');
        void loadData();
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Screening update failed.');
    }
  };

  const handleCompleteInterview = async (app: any) => {
    try {
      const res = await fetch(apiUrl(`/recruitment/applications/${app.id}/complete-interview`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: 'Candidate successfully cleared technical evaluation round.' }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(data.message || 'Interview marked COMPLETED. Candidate Shortlisted!');
        void loadData();
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Failed to complete interview.');
    }
  };

  const handleConvertEmployee = async (app: any) => {
    try {
      const res = await fetch(apiUrl(`/recruitment/applications/${app.id}/convert-employee`), {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(data.message || `${app.full_name} enrolled into Employee Master!`);
        void loadData();
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Failed to convert candidate to employee.');
    }
  };

  const handleAddNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    try {
      const res = await fetch(apiUrl(`/recruitment/applications/${selectedApp.id}/notes`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: recruiterNote }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage('Recruiter notes recorded.');
        setIsNotesModalOpen(false);
        setRecruiterNote('');
        void loadData();
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Failed to add notes.');
    }
  };

  const handleUpdateStatus = async (appId: number, status: string) => {
    try {
      const res = await fetch(apiUrl(`/recruitment/applications/${appId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(data.message || `Status updated to ${status}.`);
        void loadData();
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Status update failed.');
    }
  };

  const handleGenerateOffer = (app: any) => {
    setStatusMessage(`Preparing official Offer Letter for ${app.full_name}. Transitioning to Document Center.`);
    if (onTransitionToOffer) {
      onTransitionToOffer(app);
    }
  };

  const handleIssueAppointment = (app: any) => {
    setStatusMessage(`Preparing official Appointment Letter for ${app.full_name}. Transitioning to Document Center.`);
    if (onTransitionToAppointment) {
      onTransitionToAppointment(app);
    }
  };

  const handleDeleteApplication = async (id: number, appId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete application ${appId} for candidate ${name}? All associated documents will be removed.`)) return;
    try {
      const res = await fetch(apiUrl(`/recruitment/applications/${id}`), { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Application ${appId} for ${name} has been deleted.`);
        void loadData();
      } else {
        setStatusMessage(data.message || 'Failed to delete application.');
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'Network error deleting application.');
    }
  };

  const handleOpenDocuments = async (app: any) => {
    setSelectedApp(app);
    setIsDocumentsModalOpen(true);
    setSelectedAppDocuments([]);
    setLoadingDocuments(true);
    try {
      const res = await fetch(apiUrl(`/recruitment/applications/${app.id}/documents`));
      const data = await res.json();
      if (data.success && Array.isArray(data.documents)) {
        setSelectedAppDocuments(data.documents);
      }
    } catch (err) {
      console.warn('Failed to load application documents:', err);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleOpenDocPreview = async (title: string, url: string, filename: string) => {
    const isPdf = filename.toLowerCase().endsWith('.pdf');
    setPreviewDoc({
      isOpen: true,
      title: `${title} — ${filename}`,
      url: '',
      rawUrl: url,
      isPdf,
      loading: true,
      error: null,
    });

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load file`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      setPreviewDoc((prev) => ({
        ...prev,
        url: blobUrl,
        loading: false,
      }));
    } catch (err: any) {
      console.warn('Failed to load blob preview, falling back to direct URL:', err);
      setPreviewDoc((prev) => ({
        ...prev,
        url: url,
        loading: false,
        error: err.message || null,
      }));
    }
  };

  const onboardedCount = applications.filter((a) => a.status === 'JOINED' || a.final_status === 'JOINED' || !!a.employee_id).length;
  const activeCount = applications.filter((a) => a.status !== 'JOINED' && a.final_status !== 'JOINED' && !a.employee_id && a.status !== 'REJECTED').length;
  const allCount = applications.length;

  const filteredApplications = applications.filter((a) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      a.full_name?.toLowerCase().includes(term) ||
      a.application_id?.toLowerCase().includes(term) ||
      a.email?.toLowerCase().includes(term) ||
      a.job_title?.toLowerCase().includes(term) ||
      a.employee_id?.toLowerCase().includes(term);

    // Segment Filter (Active Pipeline vs Onboarded to Employee Master)
    const isJoined = a.status === 'JOINED' || a.final_status === 'JOINED' || !!a.employee_id;
    if (pipelineSegment === 'active' && isJoined) return false;
    if (pipelineSegment === 'onboarded' && !isJoined) return false;

    if (statusFilter === 'ACTIVE_PIPELINE') {
      if (isJoined || a.status === 'REJECTED') return false;
    } else if (statusFilter === 'JOINED') {
      if (!isJoined) return false;
    } else if (statusFilter !== 'ALL') {
      const matchesStatus = a.final_status === statusFilter || a.status === statusFilter;
      if (!matchesStatus) return false;
    }

    return matchesSearch;
  });

  return (
    <div className="space-y-5 select-none font-sans">
      {/* Toast */}
      {statusMessage && (
        <div className="bg-orange-50 border border-orange-200 text-slate-800 text-xs px-4 py-2.5 rounded-xl flex justify-between items-center shadow-2xs">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
        </div>
      )}

      {/* Navigation Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {/* Active In-Progress Candidates */}
          <button
            onClick={() => { setActiveTab('applications'); setPipelineSegment('active'); }}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'applications' && pipelineSegment === 'active'
                ? 'bg-white text-[#EA580C] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Active Pipeline</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-orange-100 text-[#EA580C] font-mono font-bold">
              {activeCount}
            </span>
          </button>

          {/* Already Onboarded Permanent Employees */}
          <button
            onClick={() => { setActiveTab('applications'); setPipelineSegment('onboarded'); }}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'applications' && pipelineSegment === 'onboarded'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Onboarded Employees</span>
            </span>
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-700 font-mono font-bold">
              {onboardedCount}
            </span>
          </button>

          {/* All Applications History */}
          <button
            onClick={() => { setActiveTab('applications'); setPipelineSegment('all'); }}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'applications' && pipelineSegment === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>All History</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-200 text-slate-700 font-mono font-bold">
              {allCount}
            </span>
          </button>

          {/* Vacancies Tab */}
          <button
            onClick={() => setActiveTab('vacancies')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'vacancies' ? 'bg-white text-[#EA580C] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Job Vacancies ({vacancies.length})
          </button>
        </div>

        {activeTab === 'vacancies' ? (
          <button
            onClick={() => setIsVacancyModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Create Vacancy</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search candidates, ID, role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#EA580C] w-60"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#EA580C]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE_PIPELINE">Active Pipeline (In-Progress)</option>
              <option value="JOINED">Hired &amp; Onboarded to Employees</option>
              <option value="APPLIED">Applied (New)</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
              <option value="OFFER_SENT">Offer Sent</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        )}
      </div>

      {/* =========================================================================
          1. CANDIDATE APPLICATIONS PIPELINE (ALL 13 COLUMNS & ACTIONS)
         ========================================================================= */}
      {activeTab === 'applications' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-3">Application ID</th>
                  <th className="px-3.5 py-3">Candidate Name</th>
                  <th className="px-3.5 py-3">Applied Position</th>
                  <th className="px-3.5 py-3">Email</th>
                  <th className="px-3.5 py-3">Mobile</th>
                  <th className="px-3.5 py-3">Qualification</th>
                  <th className="px-3.5 py-3">Experience</th>
                  <th className="px-3.5 py-3">Expected CTC</th>
                  <th className="px-3.5 py-3">Applied Date</th>
                  <th className="px-3.5 py-3">Recruiter</th>
                  <th className="px-3.5 py-3">Screening</th>
                  <th className="px-3.5 py-3">Interview</th>
                  <th className="px-3.5 py-3">Final Status</th>
                  <th className="px-3.5 py-3 text-right sticky right-0 bg-slate-50 z-10">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredApplications.map((app) => {
                  const isJoined = app.status === 'JOINED' || app.final_status === 'JOINED' || !!app.employee_id;
                  return (
                    <tr
                      key={app.id}
                      className={
                        isJoined
                          ? 'bg-emerald-50/25 border-l-4 border-emerald-500 hover:bg-emerald-50/40 transition-colors'
                          : 'hover:bg-slate-50/90 transition-colors'
                      }
                    >
                      {/* 1. Application ID */}
                      <td className="px-3.5 py-3 font-mono font-bold text-[#EA580C] text-[11px]">
                        {app.application_id}
                      </td>

                      {/* 2. Candidate Name */}
                      <td className="px-3.5 py-3 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{app.full_name}</span>
                          {isJoined && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              <span>EMPLOYEE</span>
                            </span>
                          )}
                        </div>
                        {isJoined && app.employee_id && (
                          <div className="text-[10px] font-mono font-bold text-emerald-700 mt-0.5">
                            EMP ID: {app.employee_id}
                          </div>
                        )}
                      </td>

                    {/* 3. Applied Position */}
                    <td className="px-3.5 py-3 font-medium text-slate-800 whitespace-nowrap">
                      {app.job_title}
                    </td>

                    {/* 4. Email */}
                    <td className="px-3.5 py-3 text-slate-600 text-[11px] truncate max-w-[150px]">
                      {app.email}
                    </td>

                    {/* 5. Mobile */}
                    <td className="px-3.5 py-3 text-slate-700 font-mono text-[11px] whitespace-nowrap">
                      {app.mobile}
                    </td>

                    {/* 6. Qualification */}
                    <td className="px-3.5 py-3 text-slate-600 text-[11px] whitespace-nowrap">
                      {app.highest_qualification || 'Graduate'}
                    </td>

                    {/* 7. Experience */}
                    <td className="px-3.5 py-3 text-slate-700 text-[11px] whitespace-nowrap">
                      {app.total_experience || 'Fresher'}
                    </td>

                    {/* 8. Expected CTC */}
                    <td className="px-3.5 py-3 font-mono font-bold text-slate-800 text-[11px] whitespace-nowrap">
                      {app.expected_salary || '₹ 4.5 LPA'}
                    </td>

                    {/* 9. Applied Date */}
                    <td className="px-3.5 py-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(app.created_at).toLocaleDateString('en-GB')}
                    </td>

                    {/* 10. Recruiter */}
                    <td className="px-3.5 py-3 text-slate-700 text-[11px] whitespace-nowrap">
                      {app.recruiter_name || 'Jemsina Banu (HR)'}
                    </td>

                    {/* 11. Screening Status */}
                    <td className="px-3.5 py-3">
                      {app.screening_status === 'COMPLETED' || app.screening_status === 'PASSED' || app.status === 'SHORTLISTED' || app.status === 'SELECTED' || app.status === 'INTERVIEW_SCHEDULED' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          COMPLETED
                        </span>
                      ) : app.screening_status === 'REJECTED' || app.status === 'REJECTED' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          REJECTED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          PENDING
                        </span>
                      )}
                    </td>

                    {/* 12. Interview Status */}
                    <td className="px-3.5 py-3">
                      {app.interview_status === 'COMPLETED' || app.status === 'SHORTLISTED' || app.status === 'SELECTED' || app.status === 'JOINED' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          COMPLETED
                        </span>
                      ) : app.interview_status === 'SCHEDULED' || app.status === 'INTERVIEW_SCHEDULED' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          SCHEDULED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          NOT_SCHEDULED
                        </span>
                      )}
                    </td>

                    {/* 13. Final Status */}
                    <td className="px-3.5 py-3">
                      {isJoined ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs whitespace-nowrap">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>ONBOARDED TO EMPLOYEES</span>
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          app.appointment_status === 'SENT' || app.status === 'APPOINTMENT_ISSUED' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                          app.offer_status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          app.offer_status === 'SENT' || app.status === 'OFFER_SENT' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          app.status === 'SELECTED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          app.status === 'SHORTLISTED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          app.status === 'INTERVIEW_SCHEDULED' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          app.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {app.appointment_status === 'SENT' || app.status === 'APPOINTMENT_ISSUED' ? 'APPOINTMENT ISSUED' :
                           app.offer_status === 'ACCEPTED' ? 'OFFER ACCEPTED' :
                           app.offer_status === 'SENT' || app.status === 'OFFER_SENT' ? 'OFFER SENT' :
                           (app.status || 'APPLIED')}
                        </span>
                      )}
                    </td>

                    {/* ACTIONS BAR (CLEAN, CONTEXTUAL & UNCLUTTERED) */}
                    <td className="px-3.5 py-3 text-right whitespace-nowrap sticky right-0 bg-white shadow-[-4px_0px_8px_rgba(0,0,0,0.03)]">
                      <div className="inline-flex items-center gap-1.5">
                        {/* 1. View Profile (Always Visible) */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedApp(app);
                            setIsViewModalOpen(true);
                          }}
                          className="p-1 rounded text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="View Candidate Full Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* 2. View Documents & Verification (Always Visible) */}
                        <button
                          type="button"
                          onClick={() => void handleOpenDocuments(app)}
                          className="p-1 rounded text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="View All Uploaded KYC & Supporting Documents"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                        </button>

                        {/* 3. Download Resume (If Present) */}
                        {app.resume_path && (
                          <a
                            href={apiUrl(`/recruitment/applications/${app.id}/resume`)}
                            download={app.resume_name || 'Resume.pdf'}
                            className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer inline-flex items-center"
                            title="Download Primary Resume"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* 4. Schedule Interview (Removed once interview is scheduled or completed) */}
                        {app.interview_status !== 'SCHEDULED' && app.interview_status !== 'COMPLETED' && app.status !== 'SHORTLISTED' && app.status !== 'SELECTED' && app.status !== 'JOINED' && !app.employee_id && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedApp(app);
                              setIsInterviewModalOpen(true);
                            }}
                            className="p-1 rounded text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                            title="Schedule Interview"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* 5. Complete / Pass Interview (Visible when interview is scheduled) */}
                        {(app.interview_status === 'SCHEDULED' || app.status === 'INTERVIEW_SCHEDULED') && app.status !== 'SHORTLISTED' && app.status !== 'SELECTED' && app.status !== 'JOINED' && (
                          <button
                            type="button"
                            onClick={() => handleCompleteInterview(app)}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded text-[10px] font-bold cursor-pointer transition-colors"
                            title="Mark Interview Passed -> Shortlist Candidate"
                          >
                            ✓ Pass Interview
                          </button>
                        )}

                        {/* 6. Generate Offer (Visible when SHORTLISTED or SELECTED and offer not yet sent/accepted) */}
                        {(app.status === 'SHORTLISTED' || app.status === 'SELECTED') && app.offer_status !== 'SENT' && app.offer_status !== 'ACCEPTED' && app.status !== 'JOINED' && !app.employee_id && (
                          <button
                            type="button"
                            onClick={() => handleGenerateOffer(app)}
                            className="px-2.5 py-1 bg-[#EA580C] hover:bg-[#c2410c] text-white rounded text-[10px] font-bold cursor-pointer shadow-2xs whitespace-nowrap transition-colors"
                          >
                            Generate Offer
                          </button>
                        )}

                        {/* 7. Issue Appointment Letter (Enabled when candidate has accepted the offer, before appointment letter sent) */}
                        {app.offer_status === 'ACCEPTED' && app.appointment_status !== 'SENT' && app.status !== 'JOINED' && !app.employee_id && (
                          <button
                            type="button"
                            onClick={() => handleIssueAppointment(app)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold cursor-pointer shadow-2xs whitespace-nowrap transition-colors"
                          >
                            Issue Appointment Letter
                          </button>
                        )}

                        {/* Awaiting Portal Login Indicator (Only before candidate logs into Employee Portal) */}
                        {app.appointment_status === 'SENT' && !isJoined && (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-semibold whitespace-nowrap">
                            Awaiting Portal Login
                          </span>
                        )}

                        {/* Go to Employee Directory Profile button for onboarded employees */}
                        {isJoined && (
                          <button
                            type="button"
                            onClick={() => onNavigateToEmployees ? onNavigateToEmployees(app.employee_id) : null}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
                            title="View in Employee Master Directory"
                          >
                            <span>Go to Employees</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}

                        {/* 8. Add Notes */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedApp(app);
                            setIsNotesModalOpen(true);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Add Recruiter Notes"
                        >
                          <MessageSquarePlus className="w-3.5 h-3.5" />
                        </button>

                        {/* 9. Reject (Do NOT show if rejected, joined, or after appointment letter has been sent) */}
                        {app.status !== 'REJECTED' && !isJoined && app.appointment_status !== 'SENT' && app.status !== 'APPOINTMENT_ISSUED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
                            className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Reject Candidate"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* 10. Delete Application (Added per user request) */}
                        <button
                          type="button"
                          onClick={() => handleDeleteApplication(app.id, app.application_id, app.full_name)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Empty state per segment */}
              {filteredApplications.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-6 py-12 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                        <Briefcase className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        {pipelineSegment === 'active' ? 'No Active Pipeline Candidates' :
                         pipelineSegment === 'onboarded' ? 'No Onboarded Employees Found' :
                         'No Applications Found'}
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {pipelineSegment === 'active'
                          ? 'All current applicants have either joined as permanent employees or been archived. When new candidates apply through the job portal, they will automatically appear here!'
                          : pipelineSegment === 'onboarded'
                          ? 'Candidates who complete KYC, accept the offer, and sign into the employee portal will appear here with permanent Employee IDs.'
                          : 'No candidate applications match the selected criteria.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )}

      {/* =========================================================================
          2. JOB VACANCIES DIRECTORY
         ========================================================================= */}
      {activeTab === 'vacancies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vacancies.map((v) => (
            <div key={v.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{v.title}</h3>
                    <p className="text-xs text-slate-500">{v.department} • {v.location}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    {v.status}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Job ID:</span>
                    <span className="font-mono font-bold text-slate-800">{v.job_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Track Required:</span>
                    <span className="font-bold text-slate-800">{v.experience_level || 'Both'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Openings:</span>
                    <span className="font-bold text-slate-800">{v.openings} Positions</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Salary Range:</span>
                    <span className="font-semibold text-[#EA580C]">{v.salary_range}</span>
                  </div>
                </div>
              </div>

              {/* Public Apply Link Box */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Candidate Portal Link</p>
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/apply/${v.public_token}`}
                    className="bg-transparent text-[10.5px] font-mono text-slate-600 w-full outline-none truncate"
                  />
                  <button
                    onClick={() => handleCopyLink(v.public_token)}
                    className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 shrink-0 cursor-pointer"
                    title="Copy Public Apply Link"
                  >
                    {copiedToken === v.public_token ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={`/apply/${v.public_token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded bg-orange-50 hover:bg-orange-100 text-[#EA580C] shrink-0"
                    title="Open application page"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =========================================================================
          MODAL: VIEW FULL 10-SECTION CANDIDATE APPLICATION PROFILE
         ========================================================================= */}
      {isViewModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedApp.full_name} — Application Profile</h3>
                <p className="text-[11px] font-mono text-[#EA580C] font-bold">{selectedApp.application_id} • {selectedApp.candidate_id}</p>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-base">✕</button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 font-sans divide-y divide-slate-100">
              {/* Section 1: Personal & Contact */}
              <div className="space-y-2 pt-1">
                <p className="font-bold text-slate-900 uppercase text-[11px] text-[#EA580C]">1. Personal &amp; Contact</p>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <p><strong>Email:</strong> {selectedApp.email}</p>
                  <p><strong>Mobile:</strong> {selectedApp.mobile}</p>
                  <p><strong>DOB:</strong> {selectedApp.dob || 'Not provided'}</p>
                  <p><strong>Gender:</strong> {selectedApp.gender || 'Not specified'}</p>
                  <p><strong>Blood Group:</strong> {selectedApp.blood_group || 'O+'}</p>
                  <p><strong>Marital Status:</strong> {selectedApp.marital_status || 'Single'}</p>
                </div>
              </div>

              {/* Section 2: Address */}
              <div className="space-y-2 pt-3">
                <p className="font-bold text-slate-900 uppercase text-[11px] text-[#EA580C]">2. Address</p>
                <p className="text-slate-700"><strong>Current:</strong> {selectedApp.current_address || '—'}, {selectedApp.city}, {selectedApp.state} - {selectedApp.pincode}</p>
                <p className="text-slate-700"><strong>Permanent:</strong> {selectedApp.permanent_address || selectedApp.current_address || 'Same as current'}</p>
              </div>

              {/* Section 3: Education */}
              <div className="space-y-2 pt-3">
                <p className="font-bold text-slate-900 uppercase text-[11px] text-[#EA580C]">3. Education</p>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <p><strong>Degree:</strong> {selectedApp.highest_qualification} ({selectedApp.course || 'Automobile'})</p>
                  <p><strong>Passing Year:</strong> {selectedApp.passing_year}</p>
                  <p><strong>Percentage / CGPA:</strong> {selectedApp.percentage_cgpa || '8.2 CGPA'}</p>
                  <p><strong>Institution:</strong> {selectedApp.institution || 'State University'}</p>
                </div>
              </div>

              {/* Section 4: Experience */}
              <div className="space-y-2 pt-3">
                <p className="font-bold text-slate-900 uppercase text-[11px] text-[#EA580C]">4. Experience Track</p>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <p><strong>Track:</strong> <span className="font-bold">{selectedApp.experience_type || 'Fresher'}</span></p>
                  <p><strong>Total Experience:</strong> {selectedApp.total_experience || '0 Years'}</p>
                  <p><strong>Current Company:</strong> {selectedApp.current_company || 'N/A'}</p>
                  <p><strong>Current Designation:</strong> {selectedApp.current_designation || 'N/A'}</p>
                  <p><strong>Expected CTC:</strong> <span className="font-bold text-[#EA580C]">{selectedApp.expected_salary || '₹ 4.5 LPA'}</span></p>
                  <p><strong>Notice Period:</strong> {selectedApp.notice_period || 'Immediate'}</p>
                </div>
              </div>

              {/* Section 5: Skills */}
              <div className="space-y-2 pt-3">
                <p className="font-bold text-slate-900 uppercase text-[11px] text-[#EA580C]">5. Skills &amp; Languages</p>
                <p className="text-slate-700"><strong>Primary Skills:</strong> {selectedApp.primary_skills || 'Vehicle Diagnostics, OBD-II Scanning'}</p>
                <p className="text-slate-700"><strong>Secondary / Tools:</strong> {selectedApp.secondary_skills || selectedApp.technical_tools || 'MS Excel, SAP'}</p>
                <p className="text-slate-700"><strong>Languages:</strong> {selectedApp.languages || 'English, Tamil'}</p>
              </div>

              {/* Section 6: Statutory KYC & Payroll Bank Credentials */}
              <div className="space-y-2 pt-3">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900 uppercase text-[11px] text-[#EA580C]">
                    6. Statutory KYC &amp; Payroll Bank Credentials
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      void handleOpenDocuments(selectedApp);
                    }}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10.5px] font-bold cursor-pointer transition-colors"
                  >
                    📁 View All Uploaded KYC Files
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p><strong>PAN Number:</strong> <span className="font-mono font-bold text-slate-900">{selectedApp.pan_number || 'Pending'}</span></p>
                  <p><strong>Aadhaar Number:</strong> <span className="font-mono font-bold text-slate-900">{selectedApp.aadhaar_number || 'Pending'}</span></p>
                  <p><strong>Salary Bank:</strong> <span className="font-semibold text-slate-900">{selectedApp.bank_name || 'HDFC Bank'}</span></p>
                  <p><strong>Account Number:</strong> <span className="font-mono text-slate-900">{selectedApp.account_number || 'Pending'}</span></p>
                  <p><strong>IFSC Code:</strong> <span className="font-mono font-bold text-slate-900">{selectedApp.ifsc_code || 'Pending'}</span></p>
                  <p><strong>Joining Date:</strong> <span className="font-mono font-bold text-slate-900">{selectedApp.expected_joining_date || '03/11/2026'}</span></p>
                </div>
              </div>

              {/* Recruiter Notes */}
              {selectedApp.notes && (
                <div className="space-y-1 pt-3 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <p className="font-bold text-amber-900 uppercase text-[10.5px]">Recruiter Notes</p>
                  <p className="text-slate-700 whitespace-pre-wrap font-mono text-[11px]">{selectedApp.notes}</p>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleOpenDocPreview('Official Resume', apiUrl(`/recruitment/applications/${selectedApp.id}/resume/preview`), selectedApp.resume_name || 'Resume.pdf')}
                className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg border border-blue-200 cursor-pointer"
              >
                👁️ Preview Resume
              </button>
              <a
                href={apiUrl(`/recruitment/applications/${selectedApp.id}/resume`)}
                download
                className="px-4 py-1.5 bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold text-xs rounded-lg"
              >
                Download Resume
              </a>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: VIEW SUPPORTING DOCUMENTS & STATUTORY KYC FILES
         ========================================================================= */}
      {isDocumentsModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Candidate Documents &amp; KYC Verification</h3>
                <p className="text-[11px] text-slate-500">{selectedApp.full_name} • {selectedApp.application_id}</p>
              </div>
              <button onClick={() => setIsDocumentsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            {loadingDocuments && (
              <p className="text-center py-6 text-slate-500">Loading submitted documents...</p>
            )}

            {!loadingDocuments && (
              <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                {/* Primary Resume Entry */}
                <div className="p-3 bg-orange-50/50 border border-orange-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl">📄</span>
                    <div className="truncate">
                      <p className="font-bold text-slate-900">Official Resume / Curriculum Vitae</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{selectedApp.resume_name || 'Resume.pdf'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => handleOpenDocPreview('Official Resume', apiUrl(`/recruitment/applications/${selectedApp.id}/resume/preview`), selectedApp.resume_name || 'Resume.pdf')}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-700 border border-blue-200 font-bold text-[10.5px] rounded-lg cursor-pointer"
                    >
                      👁️ Preview
                    </button>
                    <a
                      href={apiUrl(`/recruitment/applications/${selectedApp.id}/resume`)}
                      download
                      className="px-2.5 py-1 bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold text-[10.5px] rounded-lg shadow-2xs cursor-pointer"
                    >
                      Download
                    </a>
                  </div>
                </div>

                {/* Uploaded KYC & Supporting Documents */}
                {selectedAppDocuments.map((d) => {
                  let docTitle = d.document_type.replace(/_/g, ' ');
                  let icon = '📄';
                  let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';

                  if (d.document_type === 'PAN_CARD') {
                    docTitle = 'PAN Card Identity Copy';
                    icon = '🪪';
                    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  } else if (d.document_type === 'AADHAAR_CARD') {
                    docTitle = 'Aadhaar Card Copy (UIDAI)';
                    icon = '🪪';
                    badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
                  } else if (d.document_type === 'PASSBOOK_CHEQUE') {
                    docTitle = 'Bank Passbook / Cancelled Cheque';
                    icon = '🏦';
                    badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
                  } else if (d.document_type === 'EXPERIENCE_LETTER') {
                    docTitle = 'Previous Relieving / Experience Letter';
                    icon = '📜';
                    badgeColor = 'bg-purple-100 text-purple-800 border-purple-300';
                  } else if (d.document_type === 'PREVIOUS_PAYSLIPS') {
                    docTitle = 'Previous Company Old Payslips';
                    icon = '💵';
                    badgeColor = 'bg-indigo-100 text-indigo-800 border-indigo-300';
                  }

                  return (
                    <div key={d.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl">{icon}</span>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-900">{docTitle}</p>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${badgeColor}`}>
                              KYC VERIFIED
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono truncate max-w-xs">{d.file_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDocPreview(docTitle, apiUrl(`/recruitment/documents/${d.id}/preview`), d.file_name)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-700 border border-blue-200 font-bold text-[10.5px] rounded-lg cursor-pointer"
                        >
                          👁️ Preview
                        </button>
                        <a
                          href={apiUrl(`/recruitment/documents/${d.id}/download`)}
                          download
                          className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[10.5px] rounded-lg cursor-pointer"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  );
                })}

                {selectedAppDocuments.length === 0 && (
                  <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-1">
                    <p className="text-slate-500 font-semibold">No statutory KYC documents uploaded yet.</p>
                    <p className="text-[11px] text-slate-400">
                      When candidate accepts the offer and attaches PAN, Aadhaar, Passbook, and Experience letters, they will appear here.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDocumentsModalOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: SCREEN CANDIDATE
         ========================================================================= */}
      {isScreenModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Screen Candidate</h3>
                <p className="text-xs text-slate-500">{selectedApp.full_name} • {selectedApp.job_title}</p>
              </div>
              <button onClick={() => setIsScreenModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Recruiter Screening Evaluation Notes</label>
              <textarea
                rows={3}
                placeholder="Candidate has good communication skills, meets educational criteria, and aligns with shift requirements."
                value={screenNotes}
                onChange={(e) => setScreenNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleScreenCandidate(selectedApp.id, 'REJECTED')}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg cursor-pointer"
              >
                Reject Screening
              </button>

              <button
                type="button"
                onClick={() => handleScreenCandidate(selectedApp.id, 'COMPLETED')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer shadow-2xs"
              >
                Pass Screening &amp; Shortlist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD RECRUITER NOTES
         ========================================================================= */}
      {isNotesModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Add Recruiter Notes</h3>
                <p className="text-xs text-slate-500">{selectedApp.full_name} • {selectedApp.application_id}</p>
              </div>
              <button onClick={() => setIsNotesModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddNotes} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">New Note Entry</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter observation, interview feedback, or salary discussion..."
                  value={recruiterNote}
                  onChange={(e) => setRecruiterNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNotesModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold rounded-lg shadow-2xs"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: SCHEDULE INTERVIEW
         ========================================================================= */}
      {isInterviewModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Schedule Interview Round</h3>
                <p className="text-xs text-slate-500">{selectedApp.full_name} • {selectedApp.job_title}</p>
              </div>
              <button onClick={() => setIsInterviewModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Interview Round</label>
                <input
                  type="text"
                  value={interviewForm.round}
                  onChange={(e) => setInterviewForm({ ...interviewForm, round: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date</label>
                  <input
                    type="text"
                    value={interviewForm.date}
                    onChange={(e) => setInterviewForm({ ...interviewForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Time</label>
                  <input
                    type="text"
                    value={interviewForm.time}
                    onChange={(e) => setInterviewForm({ ...interviewForm, time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Google Meet Link</label>
                <input
                  type="text"
                  value={interviewForm.meeting_link}
                  onChange={(e) => setInterviewForm({ ...interviewForm, meeting_link: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInterviewModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedApp) return;
                    try {
                      const res = await fetch(apiUrl(`/recruitment/applications/${selectedApp.id}/schedule-interview`), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(interviewForm),
                      });
                      const data = await res.json();
                      if (data.success) {
                        setStatusMessage(`Interview scheduled for ${selectedApp.full_name} and invitation email dispatched to ${selectedApp.email}!`);
                        setIsInterviewModalOpen(false);
                        void loadData();
                      }
                    } catch (err: any) {
                      setStatusMessage(err?.message || 'Failed to schedule interview.');
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-2xs"
                >
                  Confirm &amp; Send Invitation Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CREATE JOB VACANCY WITH FULL REQUISITION & ROUNDS SETUP
         ========================================================================= */}
      {isVacancyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Create Vacancy &amp; Configure Application Page</h3>
                <p className="text-[11px] text-slate-500">Configure job details, eligibility criteria, interview rounds, and required documents seen by applicants.</p>
              </div>
              <button onClick={() => setIsVacancyModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setVacancyModalTab('basics')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${vacancyModalTab === 'basics' ? 'bg-white text-[#EA580C] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                1. Role &amp; Terms
              </button>
              <button
                type="button"
                onClick={() => setVacancyModalTab('criteria')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${vacancyModalTab === 'criteria' ? 'bg-white text-[#EA580C] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                2. Eligibility &amp; Skills
              </button>
              <button
                type="button"
                onClick={() => setVacancyModalTab('rounds')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${vacancyModalTab === 'rounds' ? 'bg-white text-[#EA580C] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                3. Interview Rounds (4 Steps)
              </button>
              <button
                type="button"
                onClick={() => setVacancyModalTab('documents')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${vacancyModalTab === 'documents' ? 'bg-white text-[#EA580C] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                4. Required Documents
              </button>
            </div>

            <form onSubmit={handleCreateVacancy} className="space-y-4">
              {/* TAB 1: BASICS & COMPENSATION */}
              {vacancyModalTab === 'basics' && (
                <div className="space-y-3 animate-in fade-in">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Job Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Graduate Automobile Engineering Intern"
                      value={newVac.title}
                      onChange={(e) => setNewVac({ ...newVac, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Department</label>
                      <select
                        value={newVac.department}
                        onChange={(e) => setNewVac({ ...newVac, department: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                      >
                        <option value="Engineering">Engineering</option>
                        <option value="Sales & Business Development">Sales &amp; Business Development</option>
                        <option value="Operations">Operations</option>
                        <option value="Human Resources">Human Resources</option>
                        <option value="Quality Assurance">Quality Assurance</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Employment Type</label>
                      <select
                        value={newVac.employment_type}
                        onChange={(e) => setNewVac({ ...newVac, employment_type: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                      >
                        <option value="Full Time">Full Time</option>
                        <option value="Internship">Internship</option>
                        <option value="Placement Trainee">Placement Trainee</option>
                        <option value="Contract">Contract</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Work Model</label>
                      <select
                        value={newVac.work_model}
                        onChange={(e) => setNewVac({ ...newVac, work_model: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="On-site">On-site</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Remote">Remote</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Salary / Stipend</label>
                      <input
                        type="text"
                        placeholder="e.g. ₹ 15,000 / month or ₹ 5.0 - 8.0 LPA"
                        value={newVac.salary_range}
                        onChange={(e) => setNewVac({ ...newVac, salary_range: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Openings</label>
                      <input
                        type="number"
                        min="1"
                        value={newVac.openings}
                        onChange={(e) => setNewVac({ ...newVac, openings: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Work Location</label>
                      <input
                        type="text"
                        value={newVac.location}
                        onChange={(e) => setNewVac({ ...newVac, location: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Application Deadline</label>
                      <input
                        type="text"
                        value={newVac.deadline}
                        onChange={(e) => setNewVac({ ...newVac, deadline: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ELIGIBILITY, SKILLS & RESPONSIBILITIES */}
              {vacancyModalTab === 'criteria' && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target Track</label>
                      <select
                        value={newVac.experience_level}
                        onChange={(e) => setNewVac({ ...newVac, experience_level: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                      >
                        <option value="Both">Both (Fresher &amp; Experienced)</option>
                        <option value="Fresher">Fresher Only</option>
                        <option value="Experienced">Experienced Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Experience Required</label>
                      <input
                        type="text"
                        placeholder="e.g. Fresher or 1 - 3 Years"
                        value={newVac.experience_required}
                        onChange={(e) => setNewVac({ ...newVac, experience_required: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Education Qualification</label>
                      <input
                        type="text"
                        placeholder="e.g. Diploma / B.E Automobile or Any Graduate"
                        value={newVac.qualification}
                        onChange={(e) => setNewVac({ ...newVac, qualification: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Key Skills &amp; Competencies (Comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Vehicle Inspection, Diagnostic Scanning, Maintenance Protocols, React, Node.js"
                      value={newVac.skills}
                      onChange={(e) => setNewVac({ ...newVac, skills: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Role Overview &amp; Responsibilities</label>
                    <textarea
                      rows={4}
                      placeholder="Describe the day-to-day responsibilities, learning outcomes, and expectations..."
                      value={newVac.description}
                      onChange={(e) => setNewVac({ ...newVac, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: CONFIGURE INTERVIEW ROUNDS DYNAMICALLY */}
              {vacancyModalTab === 'rounds' && (
                <div className="space-y-3.5 animate-in fade-in">
                  {/* Step 1: Ask how many rounds of interview */}
                  <div className="p-3.5 bg-orange-50/70 border border-orange-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">How many interview rounds for this vacancy?</h4>
                      <p className="text-[11px] text-slate-600">Select the number of evaluation phases or add/remove them below:</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={newVac.interview_rounds.length}
                        onChange={(e) => {
                          const targetCount = Number(e.target.value);
                          let list = [...newVac.interview_rounds];
                          if (targetCount > list.length) {
                            for (let i = list.length; i < targetCount; i++) {
                              list.push({
                                round: i + 1,
                                title: `Round ${i + 1}: Technical / Leadership Evaluation`,
                                description: 'Evaluation criteria, assessment details, and expectations for this round.'
                              });
                            }
                          } else if (targetCount < list.length) {
                            list = list.slice(0, targetCount);
                          }
                          setNewVac({ ...newVac, interview_rounds: list });
                        }}
                        className="px-3 py-1.5 bg-white border border-orange-300 rounded-lg text-xs font-bold text-[#EA580C] shadow-2xs focus:ring-1 focus:ring-[#EA580C] cursor-pointer"
                      >
                        <option value={1}>1 Evaluation Round</option>
                        <option value={2}>2 Evaluation Rounds</option>
                        <option value={3}>3 Evaluation Rounds</option>
                        <option value={4}>4 Evaluation Rounds (Standard)</option>
                        <option value={5}>5 Evaluation Rounds</option>
                        <option value={6}>6 Evaluation Rounds</option>
                      </select>
                    </div>
                  </div>

                  {/* Template Quick Presets */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-b border-slate-100 pb-2">
                    <span className="text-[11px] font-semibold text-slate-500">Quick Track Templates:</span>
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setNewVac({
                            ...newVac,
                            interview_rounds: [
                              { round: 1, title: 'Round 1: Document Screening & Profile Verification', description: 'HR verifies technical projects, GitHub repositories, academic credentials, and core skill match.' },
                              { round: 2, title: 'Round 2: Technical Assessment & Problem Solving', description: 'Hands-on technical evaluation of code quality, REST APIs, database queries, and architectural problem solving.' },
                              { round: 3, title: 'Round 3: Engineering Lead & System Architecture Discussion', description: 'In-depth discussion on automotive portal scalability, microservices, database design, and sprint collaboration.' },
                              { round: 4, title: 'Round 4: Employment Offer Letter & Team Induction', description: 'Formal employment offer generated with digital acceptance link, compensation breakdown, and Appointment Letter.' }
                            ]
                          });
                        }}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10.5px] font-semibold cursor-pointer"
                      >
                        💻 Tech / Coding
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewVac({
                            ...newVac,
                            interview_rounds: [
                              { round: 1, title: 'Round 1: Profile & Communication Screening', description: 'HR reviews educational background, professional links, verbal fluency, and prior customer interaction experience.' },
                              { round: 2, title: 'Round 2: Sales Pitch & Market Strategy Assessment', description: 'Simulated automotive dealership pitch, pricing negotiation, dealer relationship management, and commercial objection handling.' },
                              { round: 3, title: 'Round 3: Commercial Director & Leadership Discussion', description: 'Strategic discussion on B2B targets, client retention metrics, regional vehicle auctions, and cultural fit.' },
                              { round: 4, title: 'Round 4: Formal Offer Letter & Employee Enrollment', description: 'Formal compensation proposal with digital acceptance link, incentive structure briefing, and Appointment Letter.' }
                            ]
                          });
                        }}
                        className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10.5px] font-semibold cursor-pointer"
                      >
                        💼 Non-Coding (Sales/BD)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewVac({
                            ...newVac,
                            interview_rounds: [
                              { round: 1, title: 'Round 1: Academic Eligibility & Credentials Verification', description: 'Verification of mechanical/automobile diploma/degree coursework, academic percentages, and ID credentials.' },
                              { round: 2, title: 'Round 2: Workshop Rig & Vehicle Systems Assessment', description: 'Evaluation of automotive mechanical systems, OBD-II diagnostic scanning fundamentals, brake/transmission inspection, and vehicle safety protocols.' },
                              { round: 3, title: 'Round 3: Workshop Manager Review & Mentorship Discussion', description: 'Discussion on practical garage training, shift timings, workshop safety standards, and performance-based PPO roadmap.' },
                              { round: 4, title: 'Round 4: Letter of Internship & Placement Stipend Offer', description: 'Official internship cum placement agreement with monthly stipend proposal, digital acceptance, and joining guidelines.' }
                            ]
                          });
                        }}
                        className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10.5px] font-semibold cursor-pointer"
                      >
                        🚗 Auto Workshop / Ops
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewVac({
                            ...newVac,
                            interview_rounds: [
                              { round: 1, title: 'Round 1: Academic Eligibility & Credentials Verification', description: 'Verification of college enrollment, semester marksheets, student ID, and basic communication.' },
                              { round: 2, title: 'Round 2: Foundational Aptitude & Core Domain Knowledge', description: 'Aptitude evaluation, basic technical fundamentals, logic reasoning, and learning agility.' },
                              { round: 3, title: 'Round 3: Department Mentor & HR Alignment', description: 'Discussion on internship duration, mentor allocation, weekly deliverables, and project milestones.' },
                              { round: 4, title: 'Round 4: Internship Offer Letter & Onboarding', description: 'Issuance of official Letter of Internship with stipend terms and reporting schedule.' }
                            ]
                          });
                        }}
                        className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded text-[10.5px] font-semibold cursor-pointer"
                      >
                        🎓 Intern / Trainee
                      </button>
                    </div>
                  </div>

                  {/* List of Configured Rounds */}
                  <div className="space-y-3">
                    {newVac.interview_rounds.map((r, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative group">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#EA580C] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            required
                            placeholder={`e.g. Round ${idx + 1}: Title`}
                            value={r.title}
                            onChange={(e) => {
                              const updated = [...newVac.interview_rounds];
                              updated[idx].title = e.target.value;
                              setNewVac({ ...newVac, interview_rounds: updated });
                            }}
                            className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-800 focus:ring-1 focus:ring-[#EA580C]"
                          />
                          {newVac.interview_rounds.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = newVac.interview_rounds
                                  .filter((_, i) => i !== idx)
                                  .map((item, i) => ({ ...item, round: i + 1 }));
                                setNewVac({ ...newVac, interview_rounds: updated });
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Delete this round"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={2}
                          required
                          placeholder="Describe the candidate evaluation criteria for this round..."
                          value={r.description}
                          onChange={(e) => {
                            const updated = [...newVac.interview_rounds];
                            updated[idx].description = e.target.value;
                            setNewVac({ ...newVac, interview_rounds: updated });
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-[11px] text-slate-600 leading-relaxed focus:ring-1 focus:ring-[#EA580C]"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Add Another Round Button */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const nextRoundNum = newVac.interview_rounds.length + 1;
                        setNewVac({
                          ...newVac,
                          interview_rounds: [
                            ...newVac.interview_rounds,
                            {
                              round: nextRoundNum,
                              title: `Round ${nextRoundNum}: Additional Evaluation Stage`,
                              description: 'Evaluation criteria, assessment details, and expectations for this round.'
                            }
                          ]
                        });
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-[#EA580C]" />
                      <span>+ Add Another Round</span>
                    </button>
                    <span className="text-[11px] text-slate-400 font-medium">Configured: {newVac.interview_rounds.length} Rounds</span>
                  </div>
                </div>
              )}

              {/* TAB 4: MANDATORY DOCUMENTS CHECKLIST */}
              {vacancyModalTab === 'documents' && (
                <div className="space-y-3 animate-in fade-in">
                  <p className="text-[11px] text-slate-500">
                    Select the documents that candidates must have ready to apply for this vacancy:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {[
                      'Current Resume / CV (PDF or Word)',
                      'Highest Degree / Provisional Certificate',
                      'Government ID Proof (Aadhaar / PAN Card)',
                      'Experience Letter & Recent Payslip (If Experienced)',
                      '10th / 12th Academic Marksheets',
                      'Technical / Driving Certifications',
                      'Passport Size Photograph'
                    ].map((docName, idx) => {
                      const isChecked = newVac.mandatory_documents.includes(docName);
                      return (
                        <label
                          key={idx}
                          className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-colors ${isChecked ? 'border-[#EA580C] bg-orange-50/40 text-slate-900 font-semibold' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewVac({ ...newVac, mandatory_documents: [...newVac.mandatory_documents, docName] });
                              } else {
                                setNewVac({ ...newVac, mandatory_documents: newVac.mandatory_documents.filter((d) => d !== docName) });
                              }
                            }}
                            className="w-4 h-4 text-[#EA580C] rounded border-slate-300 focus:ring-[#EA580C]"
                          />
                          <span className="text-xs">{docName}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVacancyModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  {vacancyModalTab !== 'documents' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (vacancyModalTab === 'basics') setVacancyModalTab('criteria');
                        else if (vacancyModalTab === 'criteria') setVacancyModalTab('rounds');
                        else if (vacancyModalTab === 'rounds') setVacancyModalTab('documents');
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs cursor-pointer"
                    >
                      Next Step →
                    </button>
                  ) : null}

                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold rounded-lg text-xs shadow-md cursor-pointer transition-all"
                  >
                    Publish Vacancy &amp; Generate Link
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: INLINE DOCUMENT VIEWER (IMAGES & PDFS FOR HR)
         ========================================================================= */}
      {previewDoc.isOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#EA580C]" />
                <h3 className="text-sm font-bold text-slate-900">{previewDoc.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.open(previewDoc.url || previewDoc.rawUrl, '_blank')}
                  className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Open in Fullscreen Browser Tab"
                >
                  <span>↗ Fullscreen / Tab</span>
                </button>
                <a
                  href={previewDoc.rawUrl || previewDoc.url}
                  download
                  className="px-3 py-1 bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc({ isOpen: false, title: '', url: '', rawUrl: '', isPdf: false, loading: false, error: null })}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-100 min-h-[60vh]">
              {previewDoc.loading ? (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-500 py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#EA580C]" />
                  <p className="font-semibold text-xs">Loading document stream...</p>
                </div>
              ) : previewDoc.isPdf ? (
                <iframe
                  src={previewDoc.url || previewDoc.rawUrl}
                  title="Document Preview"
                  className="w-full h-[70vh] rounded-lg border border-slate-200 bg-white"
                />
              ) : (
                <img
                  src={previewDoc.url || previewDoc.rawUrl}
                  alt={previewDoc.title}
                  className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-md"
                />
              )}
            </div>

            <div className="p-3 border-t border-slate-200 flex justify-end bg-white">
              <button
                type="button"
                onClick={() => setPreviewDoc({ isOpen: false, title: '', url: '', rawUrl: '', isPdf: false, loading: false, error: null })}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
