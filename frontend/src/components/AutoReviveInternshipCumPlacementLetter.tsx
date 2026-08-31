import React from 'react';
import { DocumentData, SignatureData } from '../types';
import { OfficialLetterhead } from './OfficialLetterhead';
import { Watermark } from './Watermark';
import { DocumentFooter } from './DocumentFooter';
import { Award, CheckCircle2 } from 'lucide-react';

interface Props {
  data: DocumentData;
  signature: SignatureData;
  onOpenSignModal?: () => void;
  spacingLevel?: number;
}

export const AutoReviveInternshipCumPlacementLetter: React.FC<Props> = ({
  data,
  signature,
  onOpenSignModal,
  spacingLevel = 5,
}) => {
  const stipendAmount = data.salary.totalCTCMonthly || 15000;
  const annualCTCAmount = data.salary.totalCTCAnnual || 503688;
  const proposedSalaryMonthly = Math.round(annualCTCAmount / 12);
  const formattedStipend = `₹${Number(stipendAmount).toLocaleString('en-IN')}`;
  const formattedAnnualCTC = `₹${Number(annualCTCAmount).toLocaleString('en-IN')}`;
  const formattedMonthlyCTC = `₹${Number(proposedSalaryMonthly).toLocaleString('en-IN')}`;
  const duration = data.internshipDuration || '3 Months';
  const startDate = data.internshipStartDate || data.joiningDate || '03 November 2026';
  const endDate = data.internshipEndDate || '03 February 2027';
  const workModel = data.workModel || 'On-site';
  const workLocation = data.workLocation || data.baseLocation || 'Uthangarai, Krishnagiri';

  return (
    <div className="print-container flex flex-col items-center gap-8 w-full font-serif text-slate-950">
      {/* ========================================================================= */}
      {/* PAGE 1: INTERNSHIP-CUM-PLACEMENT OVERVIEW & PROGRAM STRUCTURE */}
      {/* ========================================================================= */}
      <div id="autorevive-internship-placement-page-1" className="a4-page">
        <Watermark />

        <div className="content-layer flex flex-col justify-between h-full">
          <div>
            <OfficialLetterhead
              refNo={data.refNo}
              issueDate={data.issueDate}
              isFirstPage={true}
            />

            {/* Recipient Details */}
            <div className="my-1.5 text-[10px] leading-[1.5] text-slate-900 font-sans">
              <p className="font-semibold text-slate-500 text-[9px] uppercase tracking-wider">To,</p>
              <p className="font-bold text-[12px] text-slate-950 font-serif mt-0.5">{data.candidateName}</p>
              <p className="text-slate-700 max-w-lg mt-0.5">{data.candidateAddress || 'Krishnagiri, Tamil Nadu, India'}</p>
              <p className="text-slate-600 font-medium">Tamil Nadu, India</p>
            </div>

            {/* Subject Banner */}
            <div className="my-2 py-1 border-y-2 border-slate-900 bg-slate-50/70 text-center">
              <h1 className="text-[11px] font-bold uppercase tracking-wider text-slate-950 font-sans">
                SUBJECT: OFFER OF INTERNSHIP CUM PRE-PLACEMENT OPPORTUNITY
              </h1>
            </div>

            {/* Salutation & Opening Paragraph */}
            <div className="space-y-1.5 text-[10px] leading-[1.65] text-slate-950 my-1.5 text-justify">
              <p>
                Dear <strong>{data.candidateSalutation || 'Mr./Ms.'} {data.candidateName}</strong>,
              </p>
              <p>
                Following your technical assessment and interview discussions with our leadership team, we are pleased to offer you an <strong>Internship Cum Pre-Placement Opportunity</strong> as <strong>{data.jobTitle || 'Sales & Business Development Specialist'}</strong> in the <strong>{data.department || 'Sales & Business Development'}</strong> department at <strong>AutoRevive</strong>.
              </p>
              <p className="text-slate-800">
                This program is structured to impart intensive real-world training, followed by transition into full-time permanent employment upon successful performance evaluation against established company standards.
              </p>
            </div>

            {/* Program Structure Table */}
            <div className="border border-slate-300 rounded-sm my-2 overflow-hidden text-[10px] font-sans shadow-2xs">
              <div className="bg-[#EA580C] text-white px-3 py-1 font-bold uppercase text-[9.5px] tracking-wider flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  Program Structure &amp; Dual-Phase Remuneration
                </span>
                <span className="text-[8.5px] font-normal text-orange-100 uppercase tracking-widest">Confidential</span>
              </div>
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="w-2/5 px-3 py-1 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">
                      Training Role / Domain
                    </td>
                    <td className="px-3 py-1 text-slate-950 font-bold">
                      {data.jobTitle}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="px-3 py-1 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">
                      Department / Function
                    </td>
                    <td className="px-3 py-1 text-slate-900 font-medium">
                      {data.department}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="px-3 py-1 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">
                      Internship Duration &amp; Dates
                    </td>
                    <td className="px-3 py-1 text-slate-950 font-medium">
                      <strong>{duration}</strong> ({startDate} to {endDate})
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="px-3 py-1 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">
                      Monthly Internship Stipend
                    </td>
                    <td className="px-3 py-1 text-[#EA580C] font-bold font-mono">
                      {formattedStipend} / month
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-orange-50/50">
                    <td className="px-3 py-1 font-semibold text-orange-950 border-r border-slate-200">
                      Proposed Full-Time Designation
                    </td>
                    <td className="px-3 py-1 text-slate-950 font-bold">
                      {data.proposedDesignation || data.jobTitle}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-orange-50/50">
                    <td className="px-3 py-1 font-semibold text-orange-950 border-r border-slate-200">
                      Proposed Regularization CTC
                    </td>
                    <td className="px-3 py-1 text-slate-950 font-bold font-mono">
                      {formattedAnnualCTC} per annum <span className="font-normal text-slate-700 font-sans">({formattedMonthlyCTC} / month)</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1 bg-slate-50 font-semibold text-slate-700 border-r border-slate-200">
                      Work Location &amp; Model
                    </td>
                    <td className="px-3 py-1 text-slate-800">
                      {workLocation} • <span className="font-semibold text-slate-900">{workModel}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Clauses 1 to 3 */}
            <div className="space-y-2 text-[9.5px] text-slate-900 text-justify my-1.5">
              <div>
                <h2 className="font-bold text-[10px] uppercase tracking-wide text-slate-950 font-sans mb-0.5">
                  1. Training Scope, Mentorship &amp; Deliverables
                </h2>
                <p className="leading-[1.6] text-slate-800">
                  During the {duration} internship, you will receive hands-on mentorship from senior leaders in automotive auction technology, client coordination, inventory assessment, and sales operations. You are expected to dedicate your full attention and effort to achieving assigned milestone deliverables.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-[10px] uppercase tracking-wide text-slate-950 font-sans mb-0.5">
                  2. Pre-Placement Transition — Performance-Based, Not Automatic
                </h2>
                <p className="leading-[1.6] text-slate-800">
                  Transition into full-time permanent employment is <strong>strictly contingent upon satisfactory completion of the internship, meeting or exceeding performance benchmarks (minimum 80% evaluation score), and company business requirements</strong>. This offer represents an opportunity for placement; regular employment is <strong>performance-based and not automatic or guaranteed</strong>.
                </p>
              </div>

              <div>
                <h2 className="font-bold text-[10px] uppercase tracking-wide text-slate-950 font-sans mb-0.5">
                  3. Workplace Conduct, Attendance &amp; Operating Standards
                </h2>
                <p className="leading-[1.6] text-slate-800">
                  You shall maintain punctuality and professional decorum in accordance with AutoRevive workplace guidelines. Unexcused absence or lack of commitment during the training period will lead to discontinuation of the internship and forfeiture of pre-placement eligibility.
                </p>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-200 mt-1">
              <p className="text-[8.5px] text-slate-500 italic">
                * Continued on <strong>Page 2</strong> for Performance Evaluation Criteria, Placement Terms, Intellectual Property, and Acceptance Signatures.
              </p>
            </div>
          </div>

          <DocumentFooter
            currentPage={1}
            totalPages={2}
            companyAddress={data.companyAddress}
            companyWebsite={data.companyWebsite}
            companyEmail={data.companyEmail}
            companyPhone={data.companyPhone}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 2: EVALUATION CRITERIA, PLACEMENT TERMS & SIGNATURES */}
      {/* ========================================================================= */}
      <div id="autorevive-internship-placement-page-2" className="a4-page">
        <Watermark />

        <div className="content-layer flex flex-col justify-between h-full">
          <div>
            <OfficialLetterhead
              refNo={data.refNo}
              issueDate={data.issueDate}
              isFirstPage={false}
              candidateName={data.candidateName}
            />

            <div className="my-1.5 border-b-2 border-slate-900 pb-1 text-center">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-950 font-sans">
                Evaluation Criteria, Placement Terms &amp; Execution
              </h2>
            </div>

            {/* Performance Evaluation Criteria Box */}
            <div className="my-2 bg-[#FFF7ED] border border-[#FED7AA] p-2 font-sans rounded-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#EA580C] mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Performance Evaluation &amp; Regularization Criteria
              </h3>
              <p className="text-[9px] text-slate-800 mb-1.5 leading-tight">
                Placement eligibility is evaluated across 4 core benchmarks at the end of the internship:
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] leading-snug">
                <div className="flex items-start gap-1">
                  <span className="font-bold text-[#EA580C]">A.</span>
                  <span><strong>Core Role Competence:</strong> Quality of execution, technical speed, and domain grasp (weightage: 40%).</span>
                </div>
                <div className="flex items-start gap-1">
                  <span className="font-bold text-[#EA580C]">B.</span>
                  <span><strong>Productivity &amp; Ownership:</strong> Completion of tasks and proactive issue resolution (weightage: 25%).</span>
                </div>
                <div className="flex items-start gap-1">
                  <span className="font-bold text-[#EA580C]">C.</span>
                  <span><strong>Collaboration &amp; Culture:</strong> Team communication, client interaction, and adherence to company ethics (weightage: 20%).</span>
                </div>
                <div className="flex items-start gap-1">
                  <span className="font-bold text-[#EA580C]">D.</span>
                  <span><strong>Attendance &amp; Discipline:</strong> Minimum 95% logged attendance and adherence to schedules (weightage: 15%).</span>
                </div>
              </div>
            </div>

            {/* Clauses 4 to 6 */}
            <div className="space-y-2 text-[9.5px] text-slate-900 text-justify my-1.5">
              <div>
                <h3 className="font-bold text-[10px] uppercase tracking-wide text-slate-950 font-sans mb-0.5">
                  4. Full-Time Regularization Terms &amp; Conditions
                </h3>
                <p className="leading-[1.6] text-slate-800">
                  Upon recommendation by the department head and formal confirmation by HR, an official <strong>Appointment Letter</strong> will be issued with the proposed CTC of <strong>{formattedAnnualCTC}</strong> per annum. The candidate will undergo a standard 6-month probationary review in the permanent role.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[10px] uppercase tracking-wide text-slate-950 font-sans mb-0.5">
                  5. Non-Disclosure, Trade Secrets &amp; Intellectual Property
                </h3>
                <p className="leading-[1.6] text-slate-800">
                  All auction data, vehicle catalogues, dealer lists, algorithms, source codes, and documentation accessed during the internship are confidential proprietary property of AutoRevive. Disclosing or misusing company data will result in immediate termination, forfeiture of certificates, and legal action.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[10px] uppercase tracking-wide text-slate-950 font-sans mb-0.5">
                  6. Notice Period &amp; Separation Protocol
                </h3>
                <p className="leading-[1.6] text-slate-800">
                  During the internship phase, either party may terminate the engagement with <strong>7 days written notice</strong>. Post confirmation into permanent employment, the notice period shall be 30 days. All company assets and access badges must be returned upon separation.
                </p>
              </div>
            </div>

            {/* Formal Closing Wish */}
            <div className="my-2 p-2 bg-slate-50 border border-slate-200 text-[9px] text-slate-700 italic rounded-sm">
              We look forward to your energetic contribution and hope to see you develop into a key long-term member of the AutoRevive leadership team.
            </div>

            {/* Company Authority Signature Block */}
            <div className="mt-2 pt-1 flex justify-between items-end font-sans">
              <div>
                <p className="text-[9.5px] font-bold text-slate-950">Yours sincerely,</p>
                <p className="text-[10px] font-bold text-[#EA580C] mb-0.5">For AutoRevive</p>
                <div className="h-6 flex items-end pb-0.5 font-signature text-2xl text-slate-950">
                  {data.hrName || 'Jemsina Banu'}
                </div>
                <div className="border-b border-slate-700 w-44 mb-0.5"></div>
                <p className="font-bold text-[9.5px] text-slate-950">{data.hrName || 'Jemsina Banu'}</p>
                <p className="text-[8.5px] text-slate-700">{data.hrTitle || 'Human Resources Manager'}</p>
                <p className="text-[8px] text-slate-500">AutoRevive • Krishnagiri – 635207, Tamil Nadu</p>
              </div>

              <div className="text-right">
                <p className="text-[8.5px] text-slate-600">Ref: <span className="font-mono font-bold text-slate-900">{data.refNo}</span></p>
                <p className="text-[8.5px] text-slate-600">Issue Date: {data.issueDate}</p>
              </div>
            </div>

            {/* Candidate Acceptance Block */}
            <div className="mt-2 border border-slate-300 bg-slate-50/70 p-2 rounded-sm font-sans">
              <div className="border-b border-slate-300 pb-0.5 mb-1 flex justify-between items-center">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-950">
                  Candidate Acceptance &amp; Undertaking
                </span>
                <span className="text-[8px] text-slate-500 font-medium">To be signed by intern upon acceptance</span>
              </div>
              <p className="text-[8.5px] leading-tight text-slate-800 mb-1 font-serif">
                I, <strong>{data.candidateName}</strong>, accept the terms of this Internship Cum Pre-Placement Opportunity. I understand that transition to regular employment is performance-based and subject to formal evaluation.
              </p>
              <div className="grid grid-cols-2 gap-4 items-end pt-1">
                <div>
                  <div className="min-h-[18px] flex items-end pb-0.5">
                    <span className="text-[8.5px] text-slate-400 italic">Signature of Intern</span>
                  </div>
                  <div className="border-b border-slate-700 mb-0.5"></div>
                  <p className="text-[8.5px] font-bold text-slate-950">{data.candidateName}</p>
                  <p className="text-[7.5px] text-slate-600">Candidate Signature</p>
                </div>
                <div className="text-right">
                  <div className="min-h-[18px] flex items-end justify-end pb-0.5">
                    <span className="text-[8.5px] font-medium text-slate-800">Date: ____ / ____ / 20____</span>
                  </div>
                  <div className="border-b border-slate-700 mb-0.5"></div>
                  <p className="text-[8.5px] font-bold text-slate-950">Date &amp; Place</p>
                  <p className="text-[7.5px] text-slate-600">Place: {workLocation}</p>
                </div>
              </div>
            </div>
          </div>

          <DocumentFooter
            currentPage={2}
            totalPages={2}
            companyAddress={data.companyAddress}
            companyWebsite={data.companyWebsite}
            companyEmail={data.companyEmail}
            companyPhone={data.companyPhone}
          />
        </div>
      </div>
    </div>
  );
};
