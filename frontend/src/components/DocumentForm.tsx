import React from 'react';
import { DocumentType, DocumentData, DocumentStatus } from '../types';
import { 
  UserCheck, 
  Building2, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Briefcase, 
  Edit3, 
  PlusCircle, 
  Check, 
  X, 
  Sparkles, 
  ShieldAlert, 
  FileText, 
  GraduationCap,
  Clock,
  Award
} from 'lucide-react';

export interface EmployeeOption {
  employee_id: string;
  full_name: string;
  parent_name?: string | null;
  email: string | null;
  mobile: string | null;
  college?: string | null;
  register_no?: string | null;
  department: string;
  role: string;
  employment_type?: string | null;
  work_location?: string | null;
  address?: string | null;
  joining_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  duration_months?: number | null;
  stipend_month?: number | null;
  salary_month?: number | null;
  annual_ctc?: number | null;
  placement_status?: string | null;
  is_candidate?: boolean;
}

interface Props {
  activeDoc: DocumentType;
  data: DocumentData;
  onChange: (data: DocumentData) => void;
  employees: EmployeeOption[];
  onSelectEmployee: (emp: EmployeeOption) => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onOpenNewEntry: () => void;
  onSaveChanges: () => Promise<void>;
  onCancelEdit: () => void;
  hasUnsavedChanges?: boolean;
  isSaving?: boolean;
  docStatus?: DocumentStatus;
  onUpdateStatus?: (status: DocumentStatus) => void;
}

export const DocumentForm: React.FC<Props> = ({
  activeDoc,
  data,
  onChange,
  employees,
  onSelectEmployee,
  isEditMode,
  onToggleEditMode,
  onOpenNewEntry,
  onSaveChanges,
  onCancelEdit,
  hasUnsavedChanges = false,
  isSaving = false,
  docStatus = 'Created',
  onUpdateStatus,
}) => {
  const isInternship = activeDoc === 'internship_letter' || activeDoc === 'autorevive_internship';
  const isCumPlacement = activeDoc === 'internship_cum_placement';
  const isOffer = activeDoc === 'offer_letter' || activeDoc === 'autorevive_offer';
  const isAppointment = activeDoc === 'appointment_letter' || activeDoc === 'autorevive_appointment';

  const updateField = (key: keyof DocumentData, value: any) => {
    onChange({ ...data, [key]: value });
  };

  const updateSalary = (key: string, value: number) => {
    const updatedSalary = { ...data.salary, [key]: value };
    if (key === 'totalCTCAnnual') {
      updatedSalary.totalCTCMonthly = Math.round(value / 12);
      updatedSalary.basicMonthly = Math.round(updatedSalary.totalCTCMonthly * 0.5);
      updatedSalary.hraMonthly = Math.round(updatedSalary.totalCTCMonthly * 0.25);
      updatedSalary.specialAllowanceMonthly = Math.round(updatedSalary.totalCTCMonthly * 0.17);
      updatedSalary.grossPayMonthly = updatedSalary.basicMonthly + updatedSalary.hraMonthly + updatedSalary.specialAllowanceMonthly;
    } else if (key === 'totalCTCMonthly') {
      updatedSalary.totalCTCAnnual = value * 12;
      updatedSalary.basicMonthly = Math.round(value * 0.5);
      updatedSalary.hraMonthly = Math.round(value * 0.25);
      updatedSalary.specialAllowanceMonthly = Math.round(value * 0.17);
      updatedSalary.grossPayMonthly = updatedSalary.basicMonthly + updatedSalary.hraMonthly + updatedSalary.specialAllowanceMonthly;
    }
    onChange({ ...data, salary: updatedSalary });
  };

  const regenerateRefNumber = () => {
    const prefix = isOffer ? 'HR' : isAppointment ? 'APT' : 'INT';
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    updateField('refNo', `AR/${prefix}/${year}/${randomNum}`);
  };

  const getDocTypeLabel = () => {
    switch (activeDoc) {
      case 'offer_letter':
      case 'autorevive_offer':
        return 'Offer Letter';
      case 'internship_letter':
      case 'autorevive_internship':
        return 'Letter of Internship';
      case 'internship_cum_placement':
        return 'Internship-Cum-Placement Letter';
      case 'appointment_letter':
      case 'autorevive_appointment':
        return 'Appointment Letter';
      case 'internship_completion_certificate':
        return 'Internship Completion Certificate';
      case 'appreciation_certificate':
        return 'Certificate of Appreciation';
      case 'relieving_letter':
        return 'Relieving Letter';
      case 'stipend_certificate':
        return 'Stipend Certificate';
      case 'employment_certificate':
        return 'Certificate of Employment';
      default:
        return 'Official HR Document';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Sent':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">SENT</span>;
      case 'PDF Generated':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">PDF GENERATED</span>;
      case 'Draft':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">DRAFT</span>;
      case 'Accepted':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">ACCEPTED</span>;
      case 'Rejected':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">REJECTED</span>;
      case 'Expired':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">EXPIRED</span>;
      case 'Created':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-[#EA580C] border border-orange-200">CREATED</span>;
    }
  };

  return (
    <aside className="w-full lg:w-88 xl:w-96 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col shrink-0 no-print transition-all">
      {/* Header */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${
        isEditMode 
          ? 'bg-amber-500/10 border-amber-300' 
          : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${
            isEditMode 
              ? 'bg-amber-500 text-white shadow-xs' 
              : 'bg-orange-100 text-[#EA580C]'
          }`}>
            {isEditMode ? <Edit3 className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
              <span>{isEditMode ? 'Edit Document Mode' : 'Document Details'}</span>
              {hasUnsavedChanges && isEditMode && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Unsaved changes" />
              )}
            </h3>
            <p className="text-[10px] text-slate-500">
              {isEditMode ? 'Live preview synchronized' : 'Select employee or edit details'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {getStatusBadge(docStatus)}
        </div>
      </div>

      {/* Mode Control Bar: [Edit Document] & [+ New Entry] */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
        {!isEditMode ? (
          <button
            type="button"
            onClick={onToggleEditMode}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-orange-400" />
            <span>Edit Document</span>
          </button>
        ) : (
          <div className="flex-1 flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Editing: {data.refNo}</span>
          </div>
        )}

        <button
          type="button"
          onClick={onOpenNewEntry}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
          title="Create brand new document entry"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>+ New Entry</span>
        </button>
      </div>

      {/* Form Content / Viewer */}
      <div className="p-4 space-y-4 text-xs overflow-y-auto max-h-[calc(100vh-250px)]">
        {/* Employee Selector (Always accessible) */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#EA580C]" />
              Select Employee Record
            </span>
            <span className="text-[10px] text-slate-400 font-normal">AutoRevive SQL</span>
          </label>
          <select
            value={data.employeeId}
            onChange={(e) => {
              const selected = employees.find(emp => emp.employee_id === e.target.value);
              if (selected) onSelectEmployee(selected);
            }}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-1 focus:ring-[#EA580C] focus:outline-none text-xs font-medium"
          >
            {employees.map(emp => (
              <option key={emp.employee_id} value={emp.employee_id}>
                {emp.employee_id} — {emp.full_name} ({emp.department})
              </option>
            ))}
          </select>
        </div>

        {/* VIEW MODE SUMMARY CARD */}
        {!isEditMode && (
          <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/70 space-y-2.5 text-xs">
            <div className="flex justify-between items-start border-b border-slate-200 pb-2">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Current Candidate</p>
                <p className="font-bold text-sm text-slate-900">{data.candidateName}</p>
                <p className="text-[11px] text-slate-600">{data.candidateEmail || 'No email specified'}</p>
              </div>
              <span className="font-mono text-[10.5px] px-2 py-0.5 bg-white border border-slate-300 rounded font-semibold text-slate-800">
                {data.employeeId}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[9.5px] uppercase font-semibold">Role</span>
                <span className="font-semibold text-slate-800">{data.jobTitle}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9.5px] uppercase font-semibold">Department</span>
                <span className="font-semibold text-slate-800">{data.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9.5px] uppercase font-semibold">
                  {isInternship ? 'Stipend' : 'Annual CTC'}
                </span>
                <span className="font-bold text-[#EA580C] font-mono">
                  {isInternship 
                    ? `₹${Number(data.salary.totalCTCMonthly || 15000).toLocaleString('en-IN')}/mo` 
                    : `₹${Number(data.salary.totalCTCAnnual || 503688).toLocaleString('en-IN')}`}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9.5px] uppercase font-semibold">
                  {isInternship ? 'Start Date' : 'Joining Date'}
                </span>
                <span className="font-semibold text-slate-800">
                  {isInternship ? data.internshipStartDate : data.joiningDate}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10.5px] text-slate-500">
              <span>Ref: <strong className="font-mono text-slate-700">{data.refNo}</strong></span>
              <span>Issue: <strong>{data.issueDate}</strong></span>
            </div>

            <button
              type="button"
              onClick={onToggleEditMode}
              className="w-full mt-2 py-1.5 bg-orange-50 hover:bg-orange-100 text-[#EA580C] font-bold text-xs rounded border border-orange-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Click to Edit Document Fields</span>
            </button>
          </div>
        )}

        {/* EDIT MODE DYNAMIC FORM FIELDS */}
        {isEditMode && (
          <div className="space-y-4">
            {/* Candidate Information */}
            <div className="border border-slate-200 rounded-lg p-3 space-y-2.5 bg-white">
              <p className="font-bold text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#EA580C]" />
                Candidate Information
              </p>

              <div>
                <label className="block text-slate-600 mb-0.5 font-medium">Candidate Full Name</label>
                <input
                  type="text"
                  value={data.candidateName}
                  onChange={(e) => updateField('candidateName', e.target.value)}
                  className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-0.5 font-medium">Candidate Email</label>
                  <input
                    type="email"
                    value={data.candidateEmail || ''}
                    onChange={(e) => updateField('candidateEmail', e.target.value)}
                    className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-0.5 font-medium">Mobile Phone</label>
                  <input
                    type="text"
                    value={data.candidatePhone || ''}
                    onChange={(e) => updateField('candidatePhone', e.target.value)}
                    className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-0.5 font-medium">Employee / Candidate ID</label>
                  <input
                    type="text"
                    value={data.employeeId}
                    onChange={(e) => updateField('employeeId', e.target.value)}
                    className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 font-mono focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-0.5 font-medium">Salutation</label>
                  <select
                    value={data.candidateSalutation || 'Mr.'}
                    onChange={(e) => updateField('candidateSalutation', e.target.value)}
                    className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#EA580C]"
                  >
                    <option value="Mr.">Mr.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Dr.">Dr.</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-0.5 font-medium">Postal Address</label>
                <input
                  type="text"
                  value={data.candidateAddress}
                  onChange={(e) => updateField('candidateAddress', e.target.value)}
                  className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#EA580C]"
                />
              </div>
            </div>

            {/* Position Details */}
            <div className="border border-slate-200 rounded-lg p-3 space-y-2.5 bg-white">
              <p className="font-bold text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#EA580C]" />
                Position &amp; Posting Details
              </p>

              <div>
                <label className="block text-slate-600 mb-0.5 font-medium">Designation / Role Title</label>
                <input
                  type="text"
                  value={data.jobTitle}
                  onChange={(e) => updateField('jobTitle', e.target.value)}
                  className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-0.5 font-medium">Department</label>
                  <input
                    type="text"
                    value={data.department}
                    onChange={(e) => updateField('department', e.target.value)}
                    className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-0.5 font-medium">Reporting Manager</label>
                  <input
                    type="text"
                    value={data.reportingManager}
                    onChange={(e) => updateField('reportingManager', e.target.value)}
                    className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-0.5 font-medium">Work Location</label>
                  <input
                    type="text"
                    value={data.workLocation || data.baseLocation}
                    onChange={(e) => {
                      updateField('workLocation', e.target.value);
                      updateField('baseLocation', e.target.value);
                      updateField('postingLocation', e.target.value);
                    }}
                    className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-0.5 font-medium">Work Model</label>
                  <select
                    value={data.workModel || 'On-site'}
                    onChange={(e) => updateField('workModel', e.target.value)}
                    className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#EA580C]"
                  >
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Document Details & Key Dates */}
            <div className="border border-slate-200 rounded-lg p-3 space-y-2.5 bg-white">
              <p className="font-bold text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#EA580C]" />
                Document Details &amp; Dates
              </p>

              <div>
                <label className="block text-slate-600 mb-0.5 font-medium flex items-center justify-between">
                  <span>Document Reference Number</span>
                  <button
                    type="button"
                    onClick={regenerateRefNumber}
                    className="text-[10px] text-[#EA580C] hover:underline font-semibold cursor-pointer"
                  >
                    Generate New Ref
                  </button>
                </label>
                <input
                  type="text"
                  value={data.refNo}
                  onChange={(e) => updateField('refNo', e.target.value)}
                  className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 font-mono font-semibold focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-0.5 font-medium">Issue Date</label>
                  <input
                    type="text"
                    value={data.issueDate}
                    onChange={(e) => updateField('issueDate', e.target.value)}
                    className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-0.5 font-medium">Offer Validity</label>
                  <input
                    type="text"
                    value={data.offerValidityDays ? `${data.offerValidityDays} Days` : '15 Days'}
                    onChange={(e) => updateField('offerValidityDays', e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
              </div>

              {!isInternship ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 mb-0.5 font-medium">Joining Date</label>
                    <input
                      type="text"
                      value={data.joiningDate}
                      onChange={(e) => updateField('joiningDate', e.target.value)}
                      className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5 font-medium">Probation Period</label>
                    <input
                      type="text"
                      value={data.probationPeriod}
                      onChange={(e) => updateField('probationPeriod', e.target.value)}
                      className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 mb-0.5 font-medium">Start Date</label>
                    <input
                      type="text"
                      value={data.internshipStartDate || data.joiningDate}
                      onChange={(e) => updateField('internshipStartDate', e.target.value)}
                      className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5 font-medium">Internship Duration</label>
                    <input
                      type="text"
                      value={data.internshipDuration || '3 Months'}
                      onChange={(e) => updateField('internshipDuration', e.target.value)}
                      className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Compensation Details */}
            <div className="border border-slate-200 rounded-lg p-3 space-y-2.5 bg-white">
              <p className="font-bold text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#EA580C]" />
                Compensation Details
              </p>

              {!isInternship ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 mb-0.5 font-medium">Annual CTC (₹)</label>
                      <input
                        type="number"
                        value={data.salary.totalCTCAnnual || 503688}
                        onChange={(e) => updateSalary('totalCTCAnnual', Number(e.target.value))}
                        className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 font-mono font-bold focus:outline-none focus:border-[#EA580C]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-0.5 font-medium">Monthly CTC (₹)</label>
                      <input
                        type="number"
                        value={data.salary.totalCTCMonthly || 41974}
                        onChange={(e) => updateSalary('totalCTCMonthly', Number(e.target.value))}
                        className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 font-mono font-bold focus:outline-none focus:border-[#EA580C]"
                      />
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200 text-[10px] space-y-0.5 text-slate-600">
                    <p>Basic: ₹{(data.salary.basicMonthly || 0).toLocaleString('en-IN')}</p>
                    <p>HRA: ₹{(data.salary.hraMonthly || 0).toLocaleString('en-IN')}</p>
                    <p>Special Allowance: ₹{(data.salary.specialAllowanceMonthly || 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-600 mb-0.5 font-medium">Monthly Stipend (₹)</label>
                  <input
                    type="number"
                    value={data.salary.totalCTCMonthly || 15000}
                    onChange={(e) => updateSalary('totalCTCMonthly', Number(e.target.value))}
                    className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 font-mono font-bold focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
              )}
            </div>

            {/* Internship-Cum-Placement Conditional Fields */}
            {isCumPlacement && (
              <div className="border border-orange-200 rounded-lg p-3 space-y-2.5 bg-orange-50/50">
                <p className="font-bold text-[11px] uppercase tracking-wider text-orange-950 border-b border-orange-200 pb-1 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#EA580C]" />
                  Pre-Placement Terms &amp; Conditions
                </p>

                <div>
                  <label className="block text-slate-700 mb-0.5 font-medium">Proposed Full-Time Designation</label>
                  <input
                    type="text"
                    value={data.proposedDesignation || data.jobTitle}
                    onChange={(e) => updateField('proposedDesignation', e.target.value)}
                    className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 bg-white focus:outline-none focus:border-[#EA580C]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-0.5 font-medium">Proposed Regularization CTC (₹/year)</label>
                  <input
                    type="number"
                    value={data.proposedSalary || 503688}
                    onChange={(e) => updateField('proposedSalary', Number(e.target.value))}
                    className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 bg-white font-mono font-bold focus:outline-none focus:border-[#EA580C]"
                  />
                </div>

                <div className="p-2 bg-white rounded border border-orange-200 text-[10px] text-orange-950">
                  <p className="font-semibold">Placement Evaluation Notice:</p>
                  <p className="mt-0.5 text-slate-700 leading-snug">
                    Placement is contingent upon passing milestone evaluation (≥80% score) and is performance-based, not automatic.
                  </p>
                </div>
              </div>
            )}

            {/* Appointment Letter Specific Fields */}
            {isAppointment && (
              <div className="border border-slate-200 rounded-lg p-3 space-y-2.5 bg-white">
                <p className="font-bold text-[11px] uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#EA580C]" />
                  Appointment Service Terms
                </p>
                <div>
                  <label className="block text-slate-600 mb-0.5 font-medium">Notice Period</label>
                  <input
                    type="text"
                    value={data.noticePeriod || '30 Days'}
                    onChange={(e) => updateField('noticePeriod', e.target.value)}
                    className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-0.5 font-medium">Working Hours</label>
                  <input
                    type="text"
                    value={data.workingHours || '9:30 AM to 6:30 PM'}
                    onChange={(e) => updateField('workingHours', e.target.value)}
                    className="w-full px-2.5 py-1 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
              </div>
            )}

            {/* Bottom Action Controls: Save Changes & Cancel */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onSaveChanges}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-60"
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
