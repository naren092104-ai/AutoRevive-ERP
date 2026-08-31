import React from 'react';
import { DocumentData, SignatureData } from '../types';
import { OfficialLetterhead } from './OfficialLetterhead';
import { Watermark } from './Watermark';
import { DocumentFooter } from './DocumentFooter';

interface Props {
  data: DocumentData;
  signature: SignatureData;
  onOpenSignModal?: () => void;
  spacingLevel?: number;
}

export const AutoReviveOfferLetter: React.FC<Props> = ({
  data,
  signature,
  onOpenSignModal,
  spacingLevel = 5,
}) => {
  const annualCTCAmount = data.salary.totalCTCAnnual || 503688;
  const monthlyCTCAmount = data.salary.totalCTCMonthly || 41974;
  const formattedMonthlyCTC = `₹${monthlyCTCAmount.toLocaleString('en-IN')}`;
  const formattedAnnualCTC = `₹${annualCTCAmount.toLocaleString('en-IN')}`;

  // Dynamic spacing styles based on Spacing Slider Bar (Level 1 to 5)
  const level = spacingLevel ?? 3;
  const clauseSpace =
    level === 1 ? 'space-y-1' :
    level === 2 ? 'space-y-1.5' :
    level === 3 ? 'space-y-2' :
    level === 4 ? 'space-y-2.5' :
    'space-y-3';

  const clauseLeading =
    level === 1 ? 'leading-[1.45]' :
    level === 2 ? 'leading-[1.5]' :
    level === 3 ? 'leading-[1.55]' :
    level === 4 ? 'leading-[1.6]' :
    'leading-[1.65]';

  const clauseHeadingMb =
    level === 1 ? 'mb-0' :
    level === 2 ? 'mb-0.5' :
    level === 3 ? 'mb-0.5' :
    level === 4 ? 'mb-1' :
    'mb-1';

  const recipientMargin =
    level === 1 ? 'mt-1 mb-1' :
    level === 2 ? 'mt-1.5 mb-1' :
    level === 3 ? 'mt-2 mb-1.5' :
    level === 4 ? 'mt-2.5 mb-1.5' :
    'mt-3 mb-2';

  const tablePadding =
    level === 1 ? 'py-0.5 px-3' :
    level === 2 ? 'py-1 px-3' :
    level === 3 ? 'py-1 px-3.5' :
    level === 4 ? 'py-1.5 px-3.5' :
    'py-1.5 px-3.5';

  // Key required documents on joining
  const checklistItems = [
    'Passport-size colour photographs (4 copies)',
    'Aadhaar Card (Self-attested copy)',
    'PAN Card (Permanent Account Number)',
    'Current & Permanent Address Proof',
    'Educational Degree Certificates & Marksheets',
    'Previous Employment Relieving & Experience Letters',
    'Updated Resume / Curriculum Vitae',
    'Bank Account Details / Cancelled Cheque',
    'Signed duplicate copy of this Offer Letter',
    'PF & ESI Nomination / Form 11 Declaration',
  ];

  return (
    <div className="print-container flex flex-col items-center gap-8 w-full font-serif text-slate-950">
      {/* ========================================================================= */}
      {/* PAGE 1 — LETTER OF OFFER OF EMPLOYMENT (CLEAN, SPACIOUS & PROFESSIONAL) */}
      {/* ========================================================================= */}
      <div id="autorevive-offer-page-1" className="a4-page">
        <Watermark />
        
        <div className="content-layer flex flex-col justify-between h-full">
          <div>
            {/* Upper Letterhead & Particulars */}
            <div>
              <OfficialLetterhead
                refNo={data.refNo}
                issueDate={data.issueDate}
                isFirstPage={true}
              />

              {/* Recipient Details with generous breathing room */}
              <div className={`${recipientMargin} text-[10px] leading-[1.6] text-slate-900 font-sans`}>
                <p className="font-semibold text-slate-500 text-[9.5px] uppercase tracking-wider">To,</p>
                <p className="font-bold text-[12px] text-slate-950 font-serif mt-0.5">{data.candidateName}</p>
                <p className="text-slate-800 max-w-lg mt-0.5 leading-[1.5]">{data.candidateAddress}</p>
                <p className="text-slate-700 font-medium">Tamil Nadu, India</p>
              </div>

              {/* Formal Subject Line */}
              <div className="my-2 py-1 border-y-2 border-slate-900 bg-slate-50/50">
                <p className="font-bold text-[10.5px] text-slate-950 uppercase tracking-wider font-sans text-center">
                  SUBJECT: LETTER OF OFFER OF EMPLOYMENT
                </p>
              </div>

              {/* Salutation & Opening Paragraph */}
              <div className="space-y-1.5 text-[10px] leading-[1.65] text-slate-950 my-2 text-justify">
                <p>
                  Dear <strong>{data.candidateSalutation || 'Mr./Ms.'} {data.candidateName}</strong>,
                </p>
                <p className="leading-[1.65]">
                  With reference to your application, technical assessment, and subsequent interview discussions with us, we are pleased to offer you employment with <strong>AutoRevive</strong> on the terms and conditions outlined below.
                </p>
              </div>

              {/* Core Employment Details Grid with comfortable padding */}
              <div className="border border-slate-300 rounded-sm my-2.5 overflow-hidden text-[10.5px] font-sans shadow-xs">
                <div className="bg-[#EA580C] text-white px-3.5 py-1.5 font-bold uppercase text-[10px] tracking-wider flex justify-between items-center">
                  <span>Summary of Offer Terms</span>
                  <span className="text-[9px] font-normal text-orange-100">Confidential</span>
                </div>
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className={`w-1/3 ${tablePadding} bg-slate-50 font-semibold text-slate-700 border-r border-slate-200`}>
                        Designation / Role
                      </td>
                      <td className={`${tablePadding} text-slate-950 font-bold`}>
                        {data.jobTitle}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className={`px-3.5 ${tablePadding} bg-slate-50 font-semibold text-slate-700 border-r border-slate-200`}>
                        Department
                      </td>
                      <td className={`${tablePadding} text-slate-900 font-medium`}>
                        {data.department}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className={`px-3.5 ${tablePadding} bg-slate-50 font-semibold text-slate-700 border-r border-slate-200`}>
                        Place of Posting / Location
                      </td>
                      <td className={`${tablePadding} text-slate-900`}>
                        {data.workLocation || data.baseLocation}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className={`px-3.5 ${tablePadding} bg-slate-50 font-semibold text-slate-700 border-r border-slate-200`}>
                        Total Remuneration (CTC)
                      </td>
                      <td className={`${tablePadding} text-slate-950 font-bold font-mono`}>
                        {formattedAnnualCTC} per annum <span className="font-normal text-slate-700 font-sans">({formattedMonthlyCTC} / month)</span>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className={`px-3.5 ${tablePadding} bg-slate-50 font-semibold text-slate-700 border-r border-slate-200`}>
                        Target Date of Joining
                      </td>
                      <td className={`${tablePadding} text-slate-950 font-bold`}>
                        {data.joiningDate}
                      </td>
                    </tr>
                    <tr>
                      <td className={`px-3.5 ${tablePadding} bg-slate-50 font-semibold text-slate-700 border-r border-slate-200`}>
                        Offer Validity Period
                      </td>
                      <td className={`${tablePadding} text-slate-900 font-medium`}>
                        {data.offerValidityDays || '15'} Days (Valid until {data.offerValidityDate})
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Terms Highlights on Page 1 (Sections 1 through 5) */}
            <div className={`${clauseSpace} text-[9.5px] text-slate-900 text-justify my-1.5`}>
              <div>
                <h3 className={`font-bold text-[10px] uppercase tracking-wide text-slate-950 ${clauseHeadingMb}`}>
                  1. Role, Core Duties &amp; Operating Standards
                </h3>
                <p className={`${clauseLeading} text-slate-800 text-[9.5px]`}>
                  You will be expected to perform the duties and responsibilities associated with your position in accordance with the professional standards, operational directives, and priorities communicated by your reporting manager and the leadership of AutoRevive. You will dedicate your entire working time, skill, and attention exclusively to the business of the Company.
                </p>
              </div>

              <div>
                <h3 className={`font-bold text-[10px] uppercase tracking-wide text-slate-950 ${clauseHeadingMb}`}>
                  2. Probation Period, Performance Review &amp; Confirmation
                </h3>
                <p className={`${clauseLeading} text-slate-800 text-[9.5px]`}>
                  You shall undergo an initial probationary period of <strong>{data.probationPeriod || '6 (Six) Months'}</strong> from your confirmed date of joining. During this period, your professional conduct, output quality, and suitability will be reviewed periodically. Confirmation of employment is subject to a formal, satisfactory performance evaluation.
                </p>
              </div>

              <div>
                <h3 className={`font-bold text-[10px] uppercase tracking-wide text-slate-950 ${clauseHeadingMb}`}>
                  3. Working Hours, Shift Schedules &amp; Attendance
                </h3>
                <p className={`${clauseLeading} text-slate-800 text-[9.5px]`}>
                  You will adhere to the official business hours, operating shifts, and attendance logging protocols established by the company. Based on vehicle auction schedules, dealer coordination, and client business contingencies, operational support may be scheduled on rotational basis in accordance with applicable service policies.
                </p>
              </div>

              <div>
                <h3 className={`font-bold text-[10px] uppercase tracking-wide text-slate-950 ${clauseHeadingMb}`}>
                  4. Background Verification &amp; Credential Due Diligence
                </h3>
                <p className={`${clauseLeading} text-slate-800 text-[9.5px]`}>
                  This offer is strictly contingent upon satisfactory background screening, verification of educational qualifications, identity credentials, past employment records, and reference checks. AutoRevive reserves the right to withdraw this offer if any submitted detail is found to be misrepresented, falsified, or inaccurate.
                </p>
              </div>

              <div>
                <h3 className={`font-bold text-[10px] uppercase tracking-wide text-slate-950 ${clauseHeadingMb}`}>
                  5. Place of Posting, Transferability &amp; Travel Mobility
                </h3>
                <p className={`${clauseLeading} text-slate-800 text-[9.5px]`}>
                  Your initial place of posting will be at our office in <strong>{data.workLocation || data.baseLocation || 'Uthangarai, Krishnagiri'}</strong>. However, depending on business expansion, client auctions, and organizational requirements, the company may depute or transfer you to other branches, subsidiaries, or field partner locations across India.
                </p>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-200 mt-1 mb-1">
              <p className="text-[9px] text-slate-500 italic">
                * Continued on <strong>Page 2</strong> for Employment Governance, Code of Conduct, Document Checklist &amp; Acceptance. Remuneration schedule is in <strong>Annexure A (Page 3)</strong>.
              </p>
            </div>
          </div>

          {/* Page 1 Footer */}
          <DocumentFooter
            currentPage={1}
            totalPages={3}
            companyAddress={data.companyAddress}
            companyWebsite={data.companyWebsite}
            companyEmail={data.companyEmail}
            companyPhone={data.companyPhone}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 2 — TERMS & CONDITIONS + CHECKLIST + CLEAN SIGNATURES + ACCEPTANCE */}
      {/* ========================================================================= */}
      <div id="autorevive-offer-page-2" className="a4-page">
        <Watermark />

        <div className="content-layer flex flex-col justify-between h-full">
          <div>
            {/* Page 2 Header */}
            <OfficialLetterhead
              refNo={data.refNo}
              issueDate={data.issueDate}
              isFirstPage={false}
              candidateName={data.candidateName}
            />

            {/* Document Section Heading */}
            <div className="text-center my-1.5 border-b-2 border-slate-900 pb-1">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-950 font-sans">
                Terms and Conditions of Employment (Continued)
              </h2>
            </div>

            {/* Governance Clauses (Sections 6 through 10) */}
            <div className="space-y-2.5 my-2 text-[9.5px] text-slate-900 text-justify">
              <div>
                <h3 className="font-bold text-[10px] uppercase tracking-wide text-slate-950 font-sans mb-0.5">
                  6. Remuneration, Payroll Processing &amp; Statutory Deductions
                </h3>
                <p className="leading-[1.6] text-slate-800">
                  Salary will be disbursed on the last working day of each calendar month via direct bank transfer. All statutory deductions including Provident Fund (PF), ESIC, Professional Tax, and TDS will be deducted at source per prevailing statutory labor laws and income tax rules.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[10px] uppercase tracking-wide text-slate-950 font-sans mb-0.5">
                  7. Confidentiality, Trade Secrets &amp; Non-Disclosure
                </h3>
                <p className="leading-[1.6] text-slate-800">
                  You shall maintain absolute confidentiality regarding AutoRevive&apos;s trade secrets, vehicle bidding algorithms, inventory data, customer and dealer contacts, pricing methodologies, and portal software. Any breach will invite immediate termination and legal action.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[10px] uppercase tracking-wide text-slate-950 font-sans mb-0.5">
                  8. Non-Solicitation &amp; Exclusive Service
                </h3>
                <p className="leading-[1.6] text-slate-800">
                  You agree not to solicit or engage with AutoRevive&apos;s clients, dealers, or employees for any competing venture during your tenure and for twelve (12) months following separation. Dual employment or freelancing without prior written consent is strictly prohibited.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[10px] uppercase tracking-wide text-slate-950 font-sans mb-0.5">
                  9. Company Policies, Code of Conduct &amp; POSH Compliance
                </h3>
                <p className="leading-[1.6] text-slate-800">
                  Your employment will be governed by company standing orders, Information Security Standards, and Prevention of Sexual Harassment (POSH) guidelines. You agree to uphold the highest standards of integrity and professional ethics.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[10px] uppercase tracking-wide text-slate-950 font-sans mb-0.5">
                  10. Notice Period, Resignation Protocol &amp; Asset Handover
                </h3>
                <p className="leading-[1.6] text-slate-800">
                  During probation, either party may terminate employment with 15 days written notice or gross pay in lieu. Post confirmation, notice period shall be 30 days. Upon exit, all company records, hardware, and access keys must be properly surrendered.
                </p>
              </div>
            </div>

            {/* Documents Required on Joining — 10 Items Checklist */}
            <div className="my-2 bg-slate-50 border border-slate-300 p-2 font-sans rounded-sm">
              <div className="flex items-center justify-between border-b border-slate-300 pb-0.5 mb-1.5">
                <h3 className="font-bold text-[9.5px] uppercase tracking-wider text-slate-950">
                  Documents Required on or Before Joining
                </h3>
                <span className="text-[8.5px] text-[#EA580C] font-semibold italic">Self-attested copies</span>
              </div>
              
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[8.5px] leading-[1.5] text-slate-900">
                {checklistItems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="font-bold text-[#EA580C] w-3.5 flex-shrink-0">{idx + 1}.</span>
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-2 pt-1 border-t border-slate-200 text-center">
              <p className="text-[9px] text-slate-500 italic">
                * Continued on <strong>Page 3</strong> for Annexure A (Remuneration Breakdown) and Formal Offer Acceptance.
              </p>
            </div>
          </div>

          {/* Page 2 Footer */}
          <DocumentFooter
            currentPage={2}
            totalPages={3}
            companyAddress={data.companyAddress}
            companyWebsite={data.companyWebsite}
            companyEmail={data.companyEmail}
            companyPhone={data.companyPhone}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 3 — ANNEXURE A: REMUNERATION STRUCTURE & POLICY */}
      {/* ========================================================================= */}
      <div id="autorevive-offer-page-3" className="a4-page">
        <Watermark />

        <div className="content-layer flex flex-col justify-between h-full">
          <div>
            {/* Page 3 Header */}
            <OfficialLetterhead
              refNo={data.refNo}
              issueDate={data.issueDate}
              isFirstPage={false}
              candidateName={data.candidateName}
            />

            {/* Annexure Heading */}
            <div className="text-center mt-2.5 mb-2 border-b-2 border-slate-900 pb-1">
              <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-950 font-sans">
                Annexure &apos;A&apos; — Remuneration Breakdown &amp; Compensation Policy
              </h2>
              <p className="text-[9px] text-slate-600 font-sans mt-0.5">
                Confidential Salary Annexure • All Amounts in Indian Rupees (INR)
              </p>
            </div>

            {/* Candidate Metadata Strip with Highlighted CTC */}
            <div className="border border-orange-300 bg-orange-50/70 p-2.5 mb-3 grid grid-cols-4 gap-2 text-[10px] font-sans rounded-sm shadow-2xs">
              <div>
                <span className="text-slate-500 block text-[8.5px] uppercase font-semibold">Employee Name</span>
                <strong className="text-slate-950 text-[11px]">{data.candidateName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[8.5px] uppercase font-semibold">Designation</span>
                <strong className="text-slate-950 text-[11px]">{data.jobTitle}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[8.5px] uppercase font-semibold">Department</span>
                <strong className="text-slate-950 text-[11px]">{data.department}</strong>
              </div>
              <div className="bg-white px-2.5 py-1 rounded border-2 border-[#EA580C] shadow-xs">
                <span className="text-[#EA580C] block text-[8px] uppercase font-bold tracking-wider">Annual Total CTC</span>
                <strong className="text-[#EA580C] font-black text-[12.5px] font-mono">{formattedAnnualCTC}</strong>
              </div>
            </div>

            {/* Comprehensive Salary Table */}
            <div className="border border-slate-300 mb-2.5 overflow-hidden text-[9.5px] font-sans rounded-sm shadow-xs">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#EA580C] text-white font-bold text-[9.5px]">
                    <th className="px-3 py-1.5 text-left border-r border-[#F97316] w-12">S.No</th>
                    <th className="px-3 py-1.5 text-left border-r border-[#F97316]">Salary Component</th>
                    <th className="px-3 py-1.5 text-right border-r border-[#F97316] w-28">Monthly (₹)</th>
                    <th className="px-3 py-1.5 text-right w-28">Annual (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-slate-100 font-bold text-slate-900 text-[9px]">
                    <td colSpan={4} className="px-3 py-1 tracking-wider uppercase text-[#EA580C]">
                      PART A: Direct Earnings / Fixed Cash Components
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1 text-center border-r border-slate-200 font-medium text-slate-600">1</td>
                    <td className="px-3 py-1 border-r border-slate-200 font-medium text-slate-950">Basic Salary (50% of Fixed CTC)</td>
                    <td className="px-3 py-1 text-right border-r border-slate-200 font-mono">₹{(data.salary.basicMonthly || 0).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-1 text-right font-mono">₹{((data.salary.basicMonthly || 0) * 12).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="bg-slate-50/60">
                    <td className="px-3 py-1 text-center border-r border-slate-200 font-medium text-slate-600">2</td>
                    <td className="px-3 py-1 border-r border-slate-200 font-medium text-slate-950">House Rent Allowance (HRA - 25%)</td>
                    <td className="px-3 py-1 text-right border-r border-slate-200 font-mono">₹{(data.salary.hraMonthly || 0).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-1 text-right font-mono">₹{((data.salary.hraMonthly || 0) * 12).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1 text-center border-r border-slate-200 font-medium text-slate-600">3</td>
                    <td className="px-3 py-1 border-r border-slate-200 font-medium text-slate-950">Special &amp; Performance Allowance</td>
                    <td className="px-3 py-1 text-right border-r border-slate-200 font-mono">₹{(data.salary.specialAllowanceMonthly || 0).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-1 text-right font-mono">₹{((data.salary.specialAllowanceMonthly || 0) * 12).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="bg-slate-50/60">
                    <td className="px-3 py-1 text-center border-r border-slate-200 font-medium text-slate-600">4</td>
                    <td className="px-3 py-1 border-r border-slate-200 font-medium text-slate-950">Group Medical &amp; Insurance Premium Cover</td>
                    <td className="px-3 py-1 text-right border-r border-slate-200 font-mono">₹{((data.salary.employerGMCMonthly || 0) + (data.salary.employerGPAMonthly || 0) + (data.salary.employerGTLMonthly || 0) || 350).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-1 text-right font-mono">₹{(((data.salary.employerGMCMonthly || 0) + (data.salary.employerGPAMonthly || 0) + (data.salary.employerGTLMonthly || 0) || 350) * 12).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="bg-[#FFF7ED] font-semibold text-slate-950 border-t border-b border-slate-300">
                    <td colSpan={2} className="px-3 py-1 border-r border-slate-300 font-bold text-[#EA580C]">Total Gross Salary (A)</td>
                    <td className="px-3 py-1 text-right border-r border-slate-300 font-mono font-bold text-[#EA580C]">₹{(data.salary.grossPayMonthly || (data.salary.basicMonthly + data.salary.hraMonthly + data.salary.specialAllowanceMonthly) || 0).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-1 text-right font-mono font-bold text-[#EA580C]">₹{((data.salary.grossPayMonthly || (data.salary.basicMonthly + data.salary.hraMonthly + data.salary.specialAllowanceMonthly) || 0) * 12).toLocaleString('en-IN')}</td>
                  </tr>

                  <tr className="bg-slate-100 font-bold text-slate-900 text-[9px]">
                    <td colSpan={4} className="px-3 py-1 tracking-wider uppercase text-slate-700">
                      PART B: Retirals &amp; Employer Statutory Benefits
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1 text-center border-r border-slate-200 font-medium text-slate-600">5</td>
                    <td className="px-3 py-1 border-r border-slate-200 font-medium text-slate-950">Employer Provident Fund (PF - 12%)</td>
                    <td className="px-3 py-1 text-right border-r border-slate-200 font-mono">₹{(data.salary.employerPFMonthly || 0).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-1 text-right font-mono">₹{((data.salary.employerPFMonthly || 0) * 12).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="bg-slate-50/60">
                    <td className="px-3 py-1 text-center border-r border-slate-200 font-medium text-slate-600">6</td>
                    <td className="px-3 py-1 border-r border-slate-200 font-medium text-slate-950">Employer ESIC / Medical Insurance</td>
                    <td className="px-3 py-1 text-right border-r border-slate-200 font-mono">₹{(data.salary.employerESICMonthly || 0).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-1 text-right font-mono">₹{((data.salary.employerESICMonthly || 0) * 12).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1 text-center border-r border-slate-200 font-medium text-slate-600">7</td>
                    <td className="px-3 py-1 border-r border-slate-200 font-medium text-slate-950">Statutory Gratuity / Retirals (4.81% of Basic)</td>
                    <td className="px-3 py-1 text-right border-r border-slate-200 font-mono">₹{Math.round((data.salary.basicMonthly || 0) * 0.0481).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-1 text-right font-mono">₹{(Math.round((data.salary.basicMonthly || 0) * 0.0481) * 12).toLocaleString('en-IN')}</td>
                  </tr>

                  <tr className="bg-[#EA580C] text-white font-bold text-[10px]">
                    <td colSpan={2} className="px-3 py-1.5 tracking-wide uppercase">
                      Total Cost to Company (CTC = A + B)
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono border-l border-orange-400">
                      {formattedMonthlyCTC}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono border-l border-orange-400">
                      {formattedAnnualCTC}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            {/* Comprehensive Statutory Notes & Compensation Policies */}
            <div className="border border-slate-200 bg-slate-50 p-3 text-[9px] leading-[1.8] space-y-2 text-slate-800 font-sans mb-3 rounded-sm">
              <h3 className="font-bold text-slate-950 uppercase tracking-wide text-[9.5px] mb-1">
                Statutory Guidelines &amp; Compensation Policies
              </h3>
              <p className="leading-[1.8]">• <strong>Statutory Withholdings:</strong> Income Tax (TDS), Professional Tax, PF, and ESIC will be deducted per prevailing government legislation. Submission of IT declarations is mandatory.</p>
              <p className="leading-[1.8]">• <strong>Retiral Benefits:</strong> Gratuity is payable per the Payment of Gratuity Act, 1972 upon completion of 5 continuous years of service or on separation as eligible.</p>
              <p className="leading-[1.8]">• <strong>Health &amp; Life Coverage:</strong> Group Medical Insurance covers the employee and family floater per company policy, effective from date of onboarding.</p>
              <p className="leading-[1.8]">• <strong>Annual Appraisal &amp; Revisions:</strong> Salary revisions and performance increments are assessed annually in April based on individual KPIs and company performance.</p>
            </div>

            {/* Company Authority Signature Block */}
            <div className="pt-2 flex justify-between items-end font-sans">
              <div>
                <p className="text-[9.5px] font-bold text-slate-950">Yours sincerely,</p>
                <p className="text-[10px] font-bold text-[#EA580C] mb-0.5">For AutoRevive</p>
                
                <div className="h-6 flex items-end pb-0.5 font-signature text-2xl text-slate-900">
                  {data.hrName || 'Jemsina Banu'}
                </div>
                <div className="border-b border-slate-700 w-44 mb-0.5"></div>
                <p className="font-bold text-[10px] text-slate-950">{data.hrName || 'Jemsina Banu'}</p>
                <p className="font-medium text-[8.5px] text-slate-800">{data.hrTitle || 'Human Resources Manager'}</p>
                <p className="text-[8px] text-slate-500">AutoRevive • Krishnagiri – 635207, Tamil Nadu</p>
              </div>

              <div className="text-right">
                <p className="text-[8.5px] text-slate-600">Ref: <span className="font-mono font-bold text-slate-900">{data.refNo}</span></p>
                <p className="text-[8.5px] text-slate-600">Issue Date: {data.issueDate}</p>
              </div>
            </div>

            {/* Employee Acceptance Block */}
            <div className="mt-2 border border-slate-400 bg-slate-50/70 p-2 rounded-sm">
              <div className="border-b border-slate-300 pb-1 mb-1 flex justify-between items-center">
                <h3 className="text-[9.5px] font-bold uppercase tracking-wider text-slate-950 font-sans">
                  Acceptance of Offer by Employee
                </h3>
                <span className="text-[8px] text-slate-500 font-sans font-medium">To be signed by candidate upon acceptance</span>
              </div>

              <p className="text-[9px] leading-snug text-slate-900 mb-1 font-serif">
                I, <strong className="text-slate-950">{data.candidateName}</strong>, hereby accept this Offer of Employment and agree to abide by all the terms, conditions, and company policies referenced herein.
              </p>

              <div className="flex items-center gap-2 text-[8.5px] text-slate-900 mb-1 font-sans">
                <span className="font-semibold">Confirmed Reporting Date:</span>
                <span className="font-bold text-slate-950 underline decoration-slate-400 underline-offset-2">
                  {data.joiningDate || '____ / ____ / 20____'}
                </span>
              </div>

              {/* Physical Signature lines */}
              <div className="grid grid-cols-2 gap-6 items-end pt-0.5 font-sans">
                <div>
                  <div className="min-h-[18px] flex items-end pb-0.5">
                    <span className="text-[8.5px] text-slate-400 italic">Signature of Candidate</span>
                  </div>
                  <div className="border-b border-slate-700 mb-0.5"></div>
                  <p className="text-[8.5px] font-bold text-slate-950">{data.candidateName}</p>
                  <p className="text-[7.5px] text-slate-600">Employee Signature</p>
                </div>

                <div className="text-right">
                  <div className="min-h-[18px] flex items-end justify-end pb-0.5">
                    <span className="text-[8.5px] font-medium text-slate-800">
                      Date: ____ / ____ / 20____
                    </span>
                  </div>
                  <div className="border-b border-slate-700 mb-0.5"></div>
                  <p className="text-[8.5px] font-bold text-slate-950">Date &amp; Place</p>
                  <p className="text-[7.5px] text-slate-600">Place: {data.workLocation || data.baseLocation || 'Uthangarai, Krishnagiri'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Page 3 Footer */}
          <DocumentFooter
            currentPage={3}
            totalPages={3}
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
