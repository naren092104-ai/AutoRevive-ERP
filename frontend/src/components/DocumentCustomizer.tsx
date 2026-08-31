import React from 'react';
import { DocumentData } from '../types';
import { calculateSalaryBreakdown, initialAutoReviveOffer, initialInternshipOffer } from '../data/initialData';
import { DatePickerField } from './DatePickerField';
import { Sliders, RefreshCw, Sparkles, User, Briefcase, Calendar, DollarSign, Building } from 'lucide-react';

interface Props {
  data: DocumentData;
  onChange: (updated: DocumentData) => void;
  onReset: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentCustomizer: React.FC<Props> = ({
  data,
  onChange,
  onReset,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleFieldChange = (field: keyof DocumentData, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handleSalaryChange = (monthlyGross: number) => {
    const updatedSalary = calculateSalaryBreakdown(monthlyGross);
    onChange({
      ...data,
      salary: updatedSalary,
    });
  };

  const loadPreset = (presetType: 'narendhar' | 'senior_lead' | 'intern') => {
    if (presetType === 'narendhar') {
      onChange({ ...initialAutoReviveOffer, candidateName: 'Mr. Narendhar Dhandapani' });
    } else if (presetType === 'intern') {
      onChange({ ...initialInternshipOffer });
    } else if (presetType === 'senior_lead') {
      onChange({
        ...initialAutoReviveOffer,
        candidateName: 'Mr. Rajesh Kanna',
        jobTitle: 'Senior Diagnostic Systems Engineer',
        department: 'Advanced Vehicle Diagnostics & EV Systems',
        employeeId: 'AR2045',
        salary: calculateSalaryBreakdown(65000),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto flex flex-col border-l border-slate-200">
        {/* Drawer Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 px-6 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#EA580C]" />
            <h3 className="font-bold text-slate-900 text-base">AutoRevive Document Editor</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 text-sm font-semibold"
          >
            ✕ Close
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 space-y-6 flex-grow">
          {/* Quick Presets */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ff7f11]" />
              AutoRevive Role Presets
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => loadPreset('narendhar')}
                className="p-2 text-left rounded border border-orange-200 bg-orange-50/60 hover:bg-orange-100/80 text-xs text-orange-950 font-medium transition-colors"
              >
                <strong>Narendhar D.</strong>
                <span className="block text-[10px] text-orange-700">Sales Specialist</span>
              </button>
              <button
                onClick={() => loadPreset('senior_lead')}
                className="p-2 text-left rounded border border-slate-200 hover:bg-slate-50 text-xs text-slate-800 font-medium transition-colors"
              >
                <strong>Rajesh Kanna</strong>
                <span className="block text-[10px] text-slate-500">Sr. Diagnostic Eng</span>
              </button>
              <button
                onClick={() => loadPreset('intern')}
                className="p-2 text-left rounded border border-slate-200 hover:bg-slate-50 text-xs text-slate-800 font-medium transition-colors"
              >
                <strong>Alex Mercer</strong>
                <span className="block text-[10px] text-slate-500">Engineering Intern</span>
              </button>
            </div>
          </div>

          {/* Section 1: Candidate Details */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-600" />
              Candidate Profile
            </span>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Candidate Full Name</label>
                <input
                  type="text"
                  value={data.candidateName}
                  onChange={(e) => handleFieldChange('candidateName', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address / Location</label>
                <input
                  type="text"
                  value={data.candidateAddress}
                  onChange={(e) => handleFieldChange('candidateAddress', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={data.candidateEmail}
                    onChange={(e) => handleFieldChange('candidateEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={data.candidatePhone}
                    onChange={(e) => handleFieldChange('candidatePhone', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Position & Department */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-600" />
              Role &amp; Deployment
            </span>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation / Role</label>
                  <input
                    type="text"
                    value={data.jobTitle}
                    onChange={(e) => handleFieldChange('jobTitle', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={data.department}
                    onChange={(e) => handleFieldChange('department', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={data.employeeId}
                    onChange={(e) => handleFieldChange('employeeId', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reference No.</label>
                  <input
                    type="text"
                    value={data.refNo}
                    onChange={(e) => handleFieldChange('refNo', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employment Type</label>
                  <select
                    value={data.employmentType || 'Full-Time (Regular)'}
                    onChange={(e) => handleFieldChange('employmentType', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none bg-white"
                  >
                    <option value="Full-Time (Regular)">Full-Time (Regular)</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contractual">Contractual</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reporting Manager</label>
                  <input
                    type="text"
                    value={data.reportingManager}
                    onChange={(e) => handleFieldChange('reportingManager', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Probation Period</label>
                  <input
                    type="text"
                    value={data.probationPeriod}
                    onChange={(e) => handleFieldChange('probationPeriod', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Notice Period</label>
                  <input
                    type="text"
                    value={data.noticePeriod}
                    onChange={(e) => handleFieldChange('noticePeriod', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Key Dates */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-600" />
              Dates &amp; Validity
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <DatePickerField
                label="Date of Issuance"
                value={data.issueDate}
                onChange={(val) => handleFieldChange('issueDate', val)}
                placeholder="e.g. 03 November 2026"
              />
              <DatePickerField
                label="Date of Joining"
                value={data.joiningDate}
                onChange={(val) => handleFieldChange('joiningDate', val)}
                placeholder="e.g. 03 November 2026"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <DatePickerField
                label="Offer Validity Deadline"
                value={data.offerValidityDate}
                onChange={(val) => handleFieldChange('offerValidityDate', val)}
                placeholder="e.g. 06 November 2026"
              />
              {data.internshipStartDate !== undefined && (
                <DatePickerField
                  label="Internship Start Date"
                  value={data.internshipStartDate}
                  onChange={(val) => handleFieldChange('internshipStartDate', val)}
                  placeholder="e.g. 03 November 2026"
                />
              )}
            </div>
          </div>

          {/* Section 4: Live Salary Calculator */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              Salary &amp; In-Hand Calculator (Annexure A)
            </span>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-800">Monthly CTC Target</label>
                  <span className="font-bold font-mono text-[#EA580C] text-sm">
                    ₹{(data.salary.totalCTCMonthly || 0).toLocaleString('en-IN')} / mo
                  </span>
                </div>
                <input
                  type="range"
                  min="15000"
                  max="150000"
                  step="1000"
                  value={data.salary.totalCTCMonthly || 42000}
                  onChange={(e) => handleSalaryChange(Number(e.target.value))}
                  className="w-full accent-[#EA580C] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>₹15,000</span>
                  <span>₹75,000</span>
                  <span>₹1,50,000</span>
                </div>
              </div>

              {/* Calculated Outputs Summary */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Estimated Take-Home</span>
                  <span className="text-emerald-700 font-bold font-mono text-sm">
                    ₹{(data.salary.netTakeHomeMonthly || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-500 block">per month (in-hand)</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Annual CTC</span>
                  <span className="text-slate-900 font-bold font-mono text-sm">
                    ₹{(data.salary.totalCTCAnnual || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-500 block">per annum (12 mos)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Company & Signatory */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-600" />
              AutoRevive Signatory &amp; Contact
            </span>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">HR Signatory Name</label>
                  <input
                    type="text"
                    value={data.hrName}
                    onChange={(e) => handleFieldChange('hrName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Signatory Title</label>
                  <input
                    type="text"
                    value={data.hrTitle}
                    onChange={(e) => handleFieldChange('hrTitle', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Website</label>
                  <input
                    type="text"
                    value={data.companyWebsite}
                    onChange={(e) => handleFieldChange('companyWebsite', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="text"
                    value={data.companyEmail}
                    onChange={(e) => handleFieldChange('companyEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={data.companyPhone}
                    onChange={(e) => handleFieldChange('companyPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-4 px-6 flex justify-between items-center z-10">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded text-slate-600 hover:bg-slate-200 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded bg-[#EA580C] hover:bg-[#743500] text-white text-xs font-bold shadow-xs transition-colors"
          >
            Done &amp; Update Document
          </button>
        </div>
      </div>
    </div>
  );
};
