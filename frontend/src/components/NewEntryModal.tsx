import React, { useState } from 'react';
import { DocumentType, DocumentData } from '../types';
import { 
  X, 
  User, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  GraduationCap, 
  FileText, 
  Sparkles,
  AlertCircle,
  Building,
  MapPin,
  Clock,
  ShieldCheck
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newDocData: DocumentData, docType: DocumentType) => Promise<void>;
  defaultDocType?: DocumentType;
}

export const NewEntryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCreate,
  defaultDocType = 'offer_letter',
}) => {
  const [docType, setDocType] = useState<DocumentType>(defaultDocType);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [candidateAddress, setCandidateAddress] = useState('Krishnagiri, Tamil Nadu, India');

  // Position Details
  const [jobTitle, setJobTitle] = useState('Sales & Business Development Specialist');
  const [department, setDepartment] = useState('Sales & Business Development');
  const [reportingManager, setReportingManager] = useState('Narendhar Dhandapani');
  const [workLocation, setWorkLocation] = useState('Uthangarai, Krishnagiri');
  const [workModel, setWorkModel] = useState<'On-site' | 'Remote' | 'Hybrid'>('On-site');
  const [workingHours, setWorkingHours] = useState('9:30 AM to 6:30 PM (Monday to Saturday)');

  // Document Details
  const [refNo, setRefNo] = useState('');
  const [autoGenRef, setAutoGenRef] = useState(true);
  const [issueDate, setIssueDate] = useState(
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  );
  const [joiningDate, setJoiningDate] = useState('03 November 2026');
  const [offerValidityDays, setOfferValidityDays] = useState(15);
  const [probationPeriod, setProbationPeriod] = useState('6 Months');
  const [noticePeriod, setNoticePeriod] = useState('30 Days');

  // Compensation
  const [annualCTC, setAnnualCTC] = useState<number>(503688);
  const [monthlyStipend, setMonthlyStipend] = useState<number>(15000);

  // Internship-specific
  const [internshipPosition, setInternshipPosition] = useState('Graduate Trainee / Intern');
  const [internshipStartDate, setInternshipStartDate] = useState('03 November 2026');
  const [internshipDuration, setInternshipDuration] = useState('3 Months');
  const [internshipWorkModel, setInternshipWorkModel] = useState<'On-site' | 'Remote' | 'Hybrid'>('On-site');
  const [proposedDesignation, setProposedDesignation] = useState('Sales & Business Development Specialist');
  const [proposedSalary, setProposedSalary] = useState<number>(503688);

  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isInternship = docType === 'internship_letter' || docType === 'autorevive_internship';
  const isCumPlacement = docType === 'internship_cum_placement';
  const isOffer = docType === 'offer_letter' || docType === 'autorevive_offer';
  const isAppointment = docType === 'appointment_letter' || docType === 'autorevive_appointment';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validation
    if (!candidateName.trim()) {
      setValidationError('Candidate Full Name is mandatory.');
      return;
    }
    if (!employeeId.trim()) {
      setValidationError('Employee ID / Candidate ID is mandatory.');
      return;
    }
    if (!department.trim()) {
      setValidationError('Department is mandatory.');
      return;
    }
    if (!jobTitle.trim() && !isInternship) {
      setValidationError('Designation / Role Title is mandatory.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate salary structure
      const monthlyTotal = isInternship 
        ? monthlyStipend 
        : Math.round(annualCTC / 12);
      const basic = Math.round(monthlyTotal * 0.5);
      const hra = Math.round(monthlyTotal * 0.25);
      const special = Math.round(monthlyTotal * 0.17);
      const gross = basic + hra + special;
      const pf = Math.round(basic * 0.12);
      const esic = Math.round(gross * 0.0075);
      const pt = 208;
      const net = gross - pf - esic - pt;

      const generatedRef = autoGenRef || !refNo.trim()
        ? `AR/${isOffer ? 'HR' : isAppointment ? 'APT' : 'INT'}/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`
        : refNo.trim();

      const newDoc: DocumentData = {
        refNo: generatedRef,
        issueDate,
        candidateSalutation: 'Mr./Ms.',
        candidateName: candidateName.trim(),
        candidateEmail: candidateEmail.trim(),
        candidatePhone: candidatePhone.trim(),
        candidateAddress: candidateAddress.trim(),
        employeeId: employeeId.trim(),
        jobTitle: isInternship ? internshipPosition : jobTitle.trim(),
        department: department.trim(),
        employmentType: isInternship ? 'Internship / Training' : 'Full-Time (Regular)',
        workModel: isInternship || isCumPlacement ? internshipWorkModel : workModel,
        workLocation: workLocation.trim(),
        baseLocation: workLocation.trim(),
        postingLocation: workLocation.trim(),
        reportingManager: reportingManager.trim(),
        probationPeriod,
        noticePeriod,
        workingHours,
        joiningDate,
        offerValidityDays,
        offerValidityDate: new Date(Date.now() + offerValidityDays * 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
        stipendAmount: `${monthlyStipend}`,
        internshipStartDate,
        internshipEndDate: new Date(Date.now() + 90 * 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
        internshipDuration,
        placementEligibility: 'Eligible for permanent regularization based on 80% benchmark performance score',
        proposedDesignation,
        proposedSalary,
        placementConditions: 'Performance-based transition upon formal evaluation; not automatic or guaranteed.',
        status: 'Created',
        hrName: 'Jemsina Banu',
        hrTitle: 'Human Resources Manager',
        companyName: 'AutoRevive',
        companyAddress: '999, Kuppusamyreddy Street, Uthangarai, Krishnagiri – 635207, Tamil Nadu, India.',
        companyWebsite: 'www.autorevives.com',
        companyEmail: 'hr@autorevives.com',
        companyPhone: '+91 9442693306',
        salary: {
          basicMonthly: basic,
          hraMonthly: hra,
          specialAllowanceMonthly: special,
          grossPayMonthly: gross,
          employeePFMonthly: pf,
          employeeESICMonthly: esic,
          employeeLWFMonthly: 10,
          professionalTaxMonthly: pt,
          netTakeHomeMonthly: net,
          employerPFMonthly: pf,
          employerPFAdminMonthly: 100,
          employerESICMonthly: Math.round(gross * 0.0325),
          employerLWFMonthly: 20,
          employerGMCMonthly: 250,
          employerGPAMonthly: 50,
          employerGTLMonthly: 50,
          totalCTCMonthly: monthlyTotal,
          totalCTCAnnual: isInternship ? monthlyStipend * 12 : annualCTC,
        },
      };

      await onCreate(newDoc, docType);
      onClose();
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to create document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#EA580C] text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Create New Employee Document</h2>
              <p className="text-xs text-slate-400">Fill details to generate official AutoRevive HR document</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Alert */}
        {validationError && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleCreate} className="p-6 space-y-5 text-xs max-h-[calc(85vh-120px)] overflow-y-auto">
          {/* Document Type Selector Banner */}
          <div>
            <label className="block font-bold text-slate-800 uppercase tracking-wide text-[11px] mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#EA580C]" />
              Select Document Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { id: 'offer_letter' as DocumentType, label: 'Offer Letter', desc: 'Employment Offer' },
                { id: 'internship_letter' as DocumentType, label: 'Letter of Internship', desc: 'Training & Mentorship' },
                { id: 'internship_cum_placement' as DocumentType, label: 'Internship Cum Placement', desc: 'Pre-Placement Opportunity' },
                { id: 'appointment_letter' as DocumentType, label: 'Appointment Letter', desc: 'Formal Service Contract' },
                { id: 'internship_completion_certificate' as DocumentType, label: 'Completion Certificate', desc: 'Training Completion' },
                { id: 'appreciation_certificate' as DocumentType, label: 'Appreciation Certificate', desc: 'Performance Merit' },
                { id: 'relieving_letter' as DocumentType, label: 'Relieving Letter', desc: 'Service Separation' },
                { id: 'stipend_certificate' as DocumentType, label: 'Stipend Certificate', desc: 'Stipend Proof' },
                { id: 'employment_certificate' as DocumentType, label: 'Employment Certificate', desc: 'Active Service Proof' },
              ].map(t => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setDocType(t.id)}
                  className={`p-2.5 text-left rounded-lg border transition-all cursor-pointer ${
                    docType === t.id
                      ? 'border-[#EA580C] bg-orange-50/80 ring-1 ring-[#EA580C]'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <p className={`font-bold text-xs ${docType === t.id ? 'text-[#EA580C]' : 'text-slate-900'}`}>{t.label}</p>
                  <p className="text-[9.5px] text-slate-500 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: Candidate Information */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <User className="w-3.5 h-3.5 text-[#EA580C]" />
              1. Candidate Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Candidate Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mr. Narendhar Dhandapani"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Employee ID / Candidate ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AR3136"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#EA580C] focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. candidate@example.com"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mobile Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +91 9597969650"
                  value={candidatePhone}
                  onChange={(e) => setCandidatePhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">Postal Address</label>
                <input
                  type="text"
                  placeholder="Street, City, State, PIN"
                  value={candidateAddress}
                  onChange={(e) => setCandidateAddress(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Position Details */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#EA580C]" />
              2. Position &amp; Posting Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Designation / Role Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales & Business Development Specialist"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales & Business Development"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reporting Manager</label>
                <input
                  type="text"
                  value={reportingManager}
                  onChange={(e) => setReportingManager(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Work Location</label>
                <input
                  type="text"
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Work Model</label>
                <select
                  value={workModel}
                  onChange={(e: any) => setWorkModel(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#EA580C] focus:outline-none font-medium"
                >
                  <option value="On-site">On-site (Office)</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Working Hours</label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Document Details & Dates */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#EA580C]" />
              3. Document Details &amp; Key Dates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Document Reference Number
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    disabled={autoGenRef}
                    placeholder="Auto-generated on creation"
                    value={autoGenRef ? 'Auto-generated (e.g. AR/HR/2026/0020)' : refNo}
                    onChange={(e) => setRefNo(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#EA580C] focus:outline-none font-mono disabled:bg-slate-100 disabled:text-slate-500"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 shrink-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoGenRef}
                      onChange={(e) => setAutoGenRef(e.target.checked)}
                      className="accent-[#EA580C] rounded"
                    />
                    <span>Auto Generate</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Issue Date</label>
                <input
                  type="text"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                />
              </div>

              {!isInternship && (
                <>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Date of Joining</label>
                    <input
                      type="text"
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Probation Period</label>
                    <input
                      type="text"
                      value={probationPeriod}
                      onChange={(e) => setProbationPeriod(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Offer Validity (Days)</label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={offerValidityDays}
                      onChange={(e) => setOfferValidityDays(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 4: Compensation & Remuneration */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#EA580C]" />
              4. Compensation Structure
            </h3>

            {!isInternship ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Annual CTC (₹)</label>
                  <input
                    type="number"
                    value={annualCTC}
                    onChange={(e) => setAnnualCTC(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900 focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Monthly Gross: ₹{Math.round(annualCTC / 12).toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Notice Period</label>
                  <input
                    type="text"
                    value={noticePeriod}
                    onChange={(e) => setNoticePeriod(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Monthly Stipend (₹)</label>
                <input
                  type="number"
                  value={monthlyStipend}
                  onChange={(e) => setMonthlyStipend(Number(e.target.value))}
                  className="w-full max-w-xs px-3 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900 focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Section 5: Internship Specific Fields (Shown conditionally) */}
          {(isInternship || isCumPlacement) && (
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50/50 space-y-3">
              <h3 className="font-bold text-orange-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-orange-200 pb-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[#EA580C]" />
                5. Internship &amp; Pre-Placement Specific Fields
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Internship Position</label>
                  <input
                    type="text"
                    value={internshipPosition}
                    onChange={(e) => setInternshipPosition(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Internship Duration</label>
                  <input
                    type="text"
                    value={internshipDuration}
                    onChange={(e) => setInternshipDuration(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Internship Start Date</label>
                  <input
                    type="text"
                    value={internshipStartDate}
                    onChange={(e) => setInternshipStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Internship Work Model</label>
                  <select
                    value={internshipWorkModel}
                    onChange={(e: any) => setInternshipWorkModel(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                  >
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                {isCumPlacement && (
                  <>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        Proposed Full-Time Designation
                      </label>
                      <input
                        type="text"
                        value={proposedDesignation}
                        onChange={(e) => setProposedDesignation(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        Proposed Full-Time Regularization CTC (₹)
                      </label>
                      <input
                        type="number"
                        value={proposedSalary}
                        onChange={(e) => setProposedSalary(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900 focus:ring-1 focus:ring-[#EA580C] focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2 p-2.5 bg-orange-100/60 rounded border border-orange-300 text-orange-950 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-tight">
                        <strong>Performance Evaluation Note:</strong> The generated document will clearly specify that full-time transition into the proposed role is <strong>performance-based and not automatic or guaranteed</strong>.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-md font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating Document...' : 'Create Document'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
