import React from 'react';
import { DocumentData, DocumentType } from '../types';
import { EmployeeOption } from './DocumentForm';
import { Edit3, Calendar, Plus, Check, X } from 'lucide-react';

interface Props {
  activeDoc: DocumentType;
  onSelectDoc: (doc: DocumentType) => void;
  data: DocumentData;
  onChange: (data: DocumentData) => void;
  employees: EmployeeOption[];
  onSelectEmployee: (emp: EmployeeOption) => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onOpenNewEntry: () => void;
  onSaveChanges: () => Promise<void>;
  onCancelEdit: () => void;
  isSaving?: boolean;
}

export const EmployeeDocumentDetailsForm: React.FC<Props> = ({
  activeDoc,
  onSelectDoc,
  data,
  onChange,
  employees,
  onSelectEmployee,
  isEditMode,
  onToggleEditMode,
  onOpenNewEntry,
  onSaveChanges,
  onCancelEdit,
  isSaving = false,
}) => {
  const updateField = (key: keyof DocumentData, value: any) => {
    onChange({ ...data, [key]: value });
  };

  const updateSalaryCTC = (val: number) => {
    const monthly = Math.round(val / 12);
    const basic = Math.round(monthly * 0.5);
    const hra = Math.round(monthly * 0.25);
    const special = Math.round(monthly * 0.17);
    const gross = basic + hra + special;

    onChange({
      ...data,
      salary: {
        ...data.salary,
        totalCTCAnnual: val,
        totalCTCMonthly: monthly,
        basicMonthly: basic,
        hraMonthly: hra,
        specialAllowanceMonthly: special,
        grossPayMonthly: gross,
      },
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-xs font-sans select-none">
      {/* Header with Title and [Edit Mode] Button */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-sm font-bold text-slate-900">
          Employee &amp; Document Details
        </h2>
        <button
          type="button"
          onClick={onToggleEditMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
            isEditMode
              ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-2xs font-bold'
              : 'bg-orange-50/70 border-orange-200 text-[#EA580C] hover:bg-orange-100'
          }`}
          title="Toggle Edit Mode"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Mode</span>
        </button>
      </div>

      {/* SECTION 1: EMPLOYEE INFORMATION */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
          EMPLOYEE INFORMATION
        </h3>

        {/* Employee Dropdown */}
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Employee
          </label>
          <select
            value={data.employeeId}
            onChange={(e) => {
              const emp = employees.find((x) => x.employee_id === e.target.value);
              if (emp) onSelectEmployee(emp);
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#EA580C] text-xs"
          >
            {employees.map((emp) => (
              <option key={emp.employee_id} value={emp.employee_id}>
                {emp.employee_id} - {emp.full_name}
              </option>
            ))}
          </select>
        </div>

        {/* Full Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Full Name
            </label>
            <input
              type="text"
              disabled={!isEditMode}
              value={data.candidateName}
              onChange={(e) => updateField('candidateName', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-50/80 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#EA580C] text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Email
            </label>
            <input
              type="email"
              disabled={!isEditMode}
              value={data.candidateEmail || ''}
              onChange={(e) => updateField('candidateEmail', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-50/80 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#EA580C] text-xs"
            />
          </div>
        </div>

        {/* Mobile */}
        <div className="w-full sm:w-1/2 pr-0 sm:pr-1.5">
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Mobile
          </label>
          <input
            type="text"
            disabled={!isEditMode}
            value={data.candidatePhone || ''}
            onChange={(e) => updateField('candidatePhone', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-50/80 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#EA580C] text-xs"
          />
        </div>
      </div>

      {/* SECTION 2: DOCUMENT DETAILS */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <h3 className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
          DOCUMENT DETAILS
        </h3>

        {/* Document Type & Reference No */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Document Type
            </label>
            <select
              value={activeDoc}
              onChange={(e) => onSelectDoc(e.target.value as DocumentType)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#EA580C] text-xs"
            >
              <option value="offer_letter">Offer Letter</option>
              <option value="internship_letter">Letter of Internship</option>
              <option value="internship_cum_placement">Internship-Cum-Placement</option>
              <option value="appointment_letter">Appointment Letter</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Reference No.
            </label>
            <input
              type="text"
              disabled={!isEditMode}
              value={data.refNo}
              onChange={(e) => updateField('refNo', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-50/80 border border-slate-200 rounded-lg text-slate-900 font-mono font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#EA580C] text-xs"
            />
          </div>
        </div>

        {/* Issue Date & Department */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Issue Date
            </label>
            <div className="relative">
              <input
                type="text"
                disabled={!isEditMode}
                value={data.issueDate}
                onChange={(e) => updateField('issueDate', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-50/80 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#EA580C] text-xs pr-8"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Department
            </label>
            <input
              type="text"
              disabled={!isEditMode}
              value={data.department}
              onChange={(e) => updateField('department', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-50/80 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#EA580C] text-xs"
            />
          </div>
        </div>

        {/* Designation & Work Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Designation
            </label>
            <input
              type="text"
              disabled={!isEditMode}
              value={data.jobTitle}
              onChange={(e) => updateField('jobTitle', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-50/80 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#EA580C] text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Work Location
            </label>
            <input
              type="text"
              disabled={!isEditMode}
              value={data.workLocation || data.baseLocation}
              onChange={(e) => {
                updateField('workLocation', e.target.value);
                updateField('baseLocation', e.target.value);
              }}
              className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-50/80 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#EA580C] text-xs"
            />
          </div>
        </div>

        {/* Work Type / Shift & Joining Date & Offer Validity */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Work Type / Shift
            </label>
            <input
              type="text"
              disabled={!isEditMode}
              placeholder="e.g. General Shift (Full Time)"
              value={data.workType || 'General Shift (Full Time)'}
              onChange={(e) => updateField('workType', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-50/80 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#EA580C] text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Date of Joining
            </label>
            <div className="relative">
              <input
                type="text"
                disabled={!isEditMode}
                value={data.joiningDate}
                onChange={(e) => updateField('joiningDate', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-50/80 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#EA580C] text-xs pr-7"
              />
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Offer Validity
            </label>
            <div className="flex items-center">
              <input
                type="text"
                disabled={!isEditMode}
                value={data.offerValidityDays || 15}
                onChange={(e) => updateField('offerValidityDays', Number(e.target.value.replace(/[^0-9]/g, '')))}
                className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-50/80 border border-slate-200 rounded-l-lg text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#EA580C] text-xs"
              />
              <span className="px-2.5 py-2 bg-slate-100 border border-l-0 border-slate-200 rounded-r-lg text-slate-500 text-xs font-medium">
                Days
              </span>
            </div>
          </div>
        </div>

        {/* CTC (Annual) Highlighted Box */}
        <div className="p-3 bg-orange-50/50 border border-orange-200 rounded-xl space-y-1">
          <label className="block text-[11px] font-bold text-[#EA580C] flex items-center justify-between">
            <span>CTC (Annual) — Editable Package</span>
            <span className="text-[10px] text-slate-500 font-normal">Auto-calculates monthly breakdown</span>
          </label>
          <input
            type="text"
            disabled={!isEditMode}
            value={`₹ ${Number(data.salary.totalCTCAnnual || 563688).toLocaleString('en-IN')}`}
            onChange={(e) => {
              const numeric = Number(e.target.value.replace(/[^0-9]/g, ''));
              if (numeric) updateSalaryCTC(numeric);
            }}
            className="w-full px-3 py-2 bg-white disabled:bg-slate-50/90 border border-orange-300 rounded-lg text-slate-900 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
          />
        </div>
      </div>

      {/* BOTTOM BUTTONS ROW: [+ New Entry] [Cancel] [Save Changes] */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onOpenNewEntry}
          className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-orange-50 border border-[#EA580C]/40 hover:border-[#EA580C] text-[#EA580C] font-bold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ New Entry</span>
        </button>

        <div className="flex items-center gap-2">
          {isEditMode && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={onSaveChanges}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-60"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
