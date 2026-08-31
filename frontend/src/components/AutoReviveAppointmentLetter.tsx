import React from 'react';
import { DocumentData, SignatureData } from '../types';
import { OfficialLetterhead } from './OfficialLetterhead';
import { Watermark } from './Watermark';
import { DocumentFooter } from './DocumentFooter';
import { ShieldCheck, UserCheck } from 'lucide-react';

interface Props {
  data: DocumentData;
  signature: SignatureData;
  onOpenSignModal?: () => void;
  spacingLevel?: number;
}

export const AutoReviveAppointmentLetter: React.FC<Props> = ({
  data,
  signature,
  onOpenSignModal,
  spacingLevel = 5,
}) => {
  const TOTAL_PAGES = 5;

  const formattedMonthlyGross = `₹${(data.salary.grossPayMonthly || 39500).toLocaleString('en-IN')}`;
  const formattedMonthlyTakeHome = `₹${(data.salary.netTakeHomeMonthly || 37490).toLocaleString('en-IN')}`;
  const formattedMonthlyCTC = `₹${(data.salary.totalCTCMonthly || 41974).toLocaleString('en-IN')}`;
  const formattedAnnualCTC = `₹${(data.salary.totalCTCAnnual || 503688).toLocaleString('en-IN')}`;
  const employmentType = data.employmentType || 'Full-Time (Regular)';

  return (
    <div className="print-container flex flex-col items-center gap-8 w-full font-serif text-slate-950">
      
      {/* ========================================================================= */}
      {/* PAGE 1: APPOINTMENT OVERVIEW, EMPLOYEE PARTICULARS & CORE APPOINTMENT TERMS */}
      {/* ========================================================================= */}
      <div id="autorevive-appointment-page-1" className="a4-page ">
        <Watermark />

        <div className="content-layer flex flex-col justify-between h-full">
          <div>
            <OfficialLetterhead
              refNo={data.refNo}
              issueDate={data.issueDate}
              isFirstPage={true}
            />

            {/* Document Title */}
            <div className="text-center my-1.5 pb-1 border-b border-[#EA580C]">
              <h1 className="text-[14px] font-bold uppercase tracking-wider text-slate-950 font-serif">
                APPOINTMENT LETTER
              </h1>
              <p className="text-[9.5px] text-slate-600 font-sans tracking-wide uppercase mt-0.5">
                Official Employment Terms &amp; Service Agreement
              </p>
            </div>

            {/* Employee Details Grid */}
            <div className="my-2 bg-[#FFF7ED] border border-[#FED7AA] p-2.5 font-sans">
              <div className="flex items-center justify-between border-b border-[#FED7AA] pb-1 mb-1.5">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#EA580C] flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#EA580C]" />
                  Employee Appointment Particulars
                </span>
                <span className="text-[9.5px] font-mono font-semibold px-2 py-0.5 bg-white border border-[#FDBA74] text-slate-900">
                  EMP ID: {data.employeeId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] leading-tight">
                <div>
                  <span className="text-slate-500 font-medium">Employee Name:</span>{' '}
                  <strong className="text-slate-950 font-semibold">{data.candidateName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Designation:</span>{' '}
                  <strong className="text-slate-950 font-semibold">{data.jobTitle}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Department:</span>{' '}
                  <span className="text-slate-900 font-medium">{data.department}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Employment Type:</span>{' '}
                  <span className="text-slate-900 font-medium">{employmentType}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Reporting Manager:</span>{' '}
                  <span className="text-slate-900 font-medium">{data.reportingManager}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Date of Joining:</span>{' '}
                  <strong className="text-slate-950 font-semibold">{data.joiningDate}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 font-medium">Work Location:</span>{' '}
                  <span className="text-slate-900 font-medium">{data.postingLocation || data.baseLocation}</span>
                </div>
              </div>
            </div>

            {/* Section 1: Appointment Statement */}
            <div className="space-y-3.5 text-[10px] text-slate-950 text-justify">
              <section>
                <h2 className="text-[10.5px] font-bold text-[#EA580C] uppercase tracking-wide mb-1 font-sans">
                  1. Appointment Statement
                </h2>
                <p className="text-slate-900 mb-1 leading-[1.8]">
                  Dear <strong>{data.candidateName}</strong>,
                </p>
                <p className="text-slate-800 leading-[1.8]">
                  We are pleased to appoint you as <strong>{data.jobTitle}</strong> with <strong>AutoRevive</strong>, subject to the terms and conditions contained in this Appointment Letter and the applicable policies and procedures of the Company.
                </p>
                <p className="text-slate-800 mt-1 leading-[1.8]">
                  Your appointment is based on the information and credentials provided by you during the recruitment process. You are expected to perform your duties with utmost professionalism, integrity, and diligence toward achieving the corporate objectives of <strong>AutoRevive</strong>.
                </p>
              </section>

              {/* Section 2: Role & Responsibilities */}
              <section>
                <h2 className="text-[10.5px] font-bold text-[#EA580C] uppercase tracking-wide mb-1 font-sans">
                  2. Role &amp; Responsibilities (Position)
                </h2>
                <p className="text-slate-800 leading-[1.8]">
                  You shall diligently execute the duties, tasks, and responsibilities assigned to your position from time to time by your reporting manager and the leadership team. You may also be required to undertake supplementary duties reasonably associated with business growth, customer support, and operational needs.
                </p>
              </section>

              {/* Section 3: Probation Period & Service Confirmation */}
              <section>
                <h2 className="text-[10.5px] font-bold text-[#EA580C] uppercase tracking-wide mb-1 font-sans">
                  3. Probation Period &amp; Service Confirmation
                </h2>
                <p className="text-slate-800 leading-[1.8]">
                  You will undergo a probation period of <strong>{data.probationPeriod}</strong> commencing from your date of joining. During this period, your professional conduct, performance benchmarks, and overall suitability will be formally evaluated. Confirmation of permanent employment is subject to satisfactory performance and completion of all onboarding requirements.
                </p>
              </section>

              {/* Section 4: Place of Posting & Transferability */}
              <section>
                <h2 className="text-[10.5px] font-bold text-[#EA580C] uppercase tracking-wide mb-1 font-sans">
                  4. Place of Posting &amp; Mobility
                </h2>
                <p className="text-slate-800 leading-[1.8]">
                  Your initial place of posting will be at <strong>{data.postingLocation || data.baseLocation}</strong>. However, given the expanding footprint of AutoRevive, the Company reserves the right to transfer, depute, or assign your services to any existing or future branch, client facility, vehicle yard, or affiliate office across India.
                </p>
              </section>
            </div>
          </div>

          <DocumentFooter
            currentPage={1}
            totalPages={TOTAL_PAGES}
            companyAddress={data.companyAddress}
            companyWebsite={data.companyWebsite}
            companyEmail={data.companyEmail}
            companyPhone={data.companyPhone}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 2: WORKING HOURS, REMUNERATION, LEAVE & STRICT CONFIDENTIALITY */}
      {/* ========================================================================= */}
      <div id="autorevive-appointment-page-2" className="a4-page ">
        <Watermark />

        <div className="content-layer flex flex-col justify-between h-full">
          <div>
            <OfficialLetterhead
              refNo={data.refNo}
              issueDate={data.issueDate}
              isFirstPage={false}
              candidateName={data.candidateName}
            />

            <div className="space-y-2.5 text-[10.5px] leading-relaxed text-slate-950 text-justify">
              {/* Section 5: Working Hours & Attendance */}
              <section>
                <h2 className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wide mb-0.5 font-sans">
                  5. Working Hours &amp; Attendance
                </h2>
                <p className="text-slate-900">
                  You shall observe the official business hours, shifts, and attendance logging protocols established by AutoRevive. Operating hours may vary based on vehicle auction schedules, inspection rosters, and customer requirements. Punctuality and adherence to work schedules are essential conditions of service.
                </p>
              </section>

              {/* Section 6: Compensation & Remuneration Structure */}
              <section>
                <h2 className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wide mb-1 font-sans">
                  6. Compensation &amp; Remuneration Structure
                </h2>
                <p className="text-slate-900 mb-1">
                  Your total Cost to Company (CTC) is structured as follows:
                </p>

                <div className="bg-[#FFF7ED] border border-[#FED7AA] p-2 my-1.5 grid grid-cols-2 gap-4 font-sans">
                  <div>
                    <span className="text-[9.5px] text-slate-500 uppercase tracking-wider block">Monthly Total CTC</span>
                    <span className="text-[13px] font-bold text-[#EA580C] font-mono">{formattedMonthlyCTC}</span>
                    <span className="text-[9px] text-slate-600 block">Gross: {formattedMonthlyGross} | Net Take-Home: {formattedMonthlyTakeHome}</span>
                  </div>
                  <div>
                    <span className="text-[9.5px] text-slate-500 uppercase tracking-wider block">Annualized CTC</span>
                    <span className="text-[13px] font-bold text-slate-950 font-mono">{formattedAnnualCTC}</span>
                    <span className="text-[9px] text-slate-600 block">Detailed component breakdown in Annexure A</span>
                  </div>
                </div>

                <p className="text-slate-900 text-[10px]">
                  All statutory deductions (Provident Fund, ESIC, Professional Tax, TDS) will be deducted at source per prevailing government laws. Remuneration processing is contingent upon prompt submission of tax declarations and banking documents.
                </p>
              </section>

              {/* Section 7: Leave & Absence Policy */}
              <section>
                <h2 className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wide mb-0.5 font-sans">
                  7. Leave &amp; Absence Policy
                </h2>
                <p className="text-slate-900">
                  You shall be entitled to annual earned leaves, casual leaves, and sick leaves in accordance with the <strong>AutoRevive Leave Policy</strong>. Planned leave must be applied for in advance via the HR portal. Unapproved absence for consecutive working days without prior intimation shall be deemed abandonment of service.
                </p>
              </section>

              {/* Section 8: Confidentiality & Non-Disclosure */}
              <section>
                <h2 className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wide mb-0.5 font-sans">
                  8. Confidentiality &amp; Proprietary Information
                </h2>
                <p className="text-slate-900 mb-1">
                  You shall at all times during and following your tenure maintain absolute confidentiality regarding all non-public information of <strong>AutoRevive</strong>, including:
                </p>

                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 bg-slate-50 border border-slate-200 p-2 text-[9.5px] text-slate-800 font-sans">
                  <div>• Customer data &amp; contact directories</div>
                  <div>• Vehicle valuation &amp; pricing models</div>
                  <div>• Vehicle inspection &amp; condition reports</div>
                  <div>• Live auction logs &amp; bidding queues</div>
                  <div>• Software blueprints, source codes &amp; APIs</div>
                  <div>• Financial margins, revenue &amp; trade models</div>
                  <div>• Partner, dealer &amp; vendor terms</div>
                  <div>• Business strategy, growth plans &amp; KPIs</div>
                </div>
                <p className="text-slate-900 text-[9.5px] mt-1">
                  Any unauthorized disclosure, duplication, or transmission of proprietary data is strictly prohibited and constitutes a material breach of contract.
                </p>
              </section>
            </div>
          </div>

          <DocumentFooter
            currentPage={2}
            totalPages={TOTAL_PAGES}
            companyAddress={data.companyAddress}
            companyWebsite={data.companyWebsite}
            companyEmail={data.companyEmail}
            companyPhone={data.companyPhone}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 3: INFORMATION SECURITY, CODE OF CONDUCT & WORKPLACE STANDARDS */}
      {/* ========================================================================= */}
      <div id="autorevive-appointment-page-3" className="a4-page ">
        <Watermark />

        <div className="content-layer flex flex-col justify-between h-full">
          <div>
            <OfficialLetterhead
              refNo={data.refNo}
              issueDate={data.issueDate}
              isFirstPage={false}
              candidateName={data.candidateName}
            />

            <div className="space-y-2 text-[10px] leading-relaxed text-slate-950 text-justify">
              {/* Section 9: Information Security */}
              <section>
                <h2 className="text-[10.5px] font-bold text-[#EA580C] uppercase tracking-wide mb-0.5 font-sans">
                  9. Information Security &amp; Data Protection
                </h2>
                <p className="text-slate-900">
                  You shall protect all company login credentials, access tokens, and enterprise databases. Company computing resources, email accounts, and networks must be used strictly for authorized business duties. Any suspected security incident or data leak must be reported immediately to the IT security officer.
                </p>
              </section>

              {/* Section 10: Code of Conduct */}
              <section>
                <h2 className="text-[10.5px] font-bold text-[#EA580C] uppercase tracking-wide mb-0.5 font-sans">
                  10. Code of Business Conduct &amp; Ethics
                </h2>
                <p className="text-slate-900 mb-1">
                  Employees are expected to uphold the highest standards of integrity, accountability, and ethical governance:
                </p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 bg-white border border-slate-200 p-2 text-[9px] text-slate-900 font-sans">
                  <div>1. Act honestly and with high professional ethics.</div>
                  <div>2. Maintain exemplary workplace discipline.</div>
                  <div>3. Treat all colleagues, partners, and clients with respect.</div>
                  <div>4. Safeguard AutoRevive&apos;s commercial interests.</div>
                  <div>5. Execute leadership directives diligently.</div>
                  <div>6. Disclose and prevent conflicts of interest.</div>
                  <div>7. Protect company property and digital infrastructure.</div>
                  <div>8. Maintain zero tolerance for bribery and corruption.</div>
                </div>
              </section>

              {/* Section 11: Workplace Conduct & Zero Tolerance */}
              <section>
                <h2 className="text-[10.5px] font-bold text-[#EA580C] uppercase tracking-wide mb-0.5 font-sans">
                  11. Workplace Conduct &amp; Zero Tolerance Policy
                </h2>
                <p className="text-slate-900">
                  AutoRevive maintains zero tolerance towards workplace harassment (including POSH guidelines), unlawful discrimination, abusive behavior, substance abuse, data theft, and financial fraud. Violations will result in immediate disciplinary proceedings up to summary dismissal and legal action.
                </p>
              </section>

              {/* Section 12: Company Property & Asset Management */}
              <section>
                <h2 className="text-[10.5px] font-bold text-[#EA580C] uppercase tracking-wide mb-0.5 font-sans">
                  12. Company Property &amp; Asset Management
                </h2>
                <p className="text-slate-900">
                  Any hardware, ID badges, diagnostic equipment, test devices, or access credentials issued to you remain the sole property of AutoRevive. All assets must be maintained in good condition and surrendered immediately upon separation or demand.
                </p>
              </section>

              {/* Section 13: Intellectual Property Rights */}
              <section>
                <h2 className="text-[10.5px] font-bold text-[#EA580C] uppercase tracking-wide mb-0.5 font-sans">
                  13. Intellectual Property Rights (IPR)
                </h2>
                <p className="text-slate-900">
                  All intellectual property, documentation, software programs, workflows, algorithms, or inventions created by you during the term of employment shall be the exclusive property of AutoRevive worldwide in perpetuity.
                </p>
              </section>
            </div>
          </div>

          <DocumentFooter
            currentPage={3}
            totalPages={TOTAL_PAGES}
            companyAddress={data.companyAddress}
            companyWebsite={data.companyWebsite}
            companyEmail={data.companyEmail}
            companyPhone={data.companyPhone}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 4: AUCTION DUTIES, VERIFICATION, NOTICE, SEPARATION & EXECUTION */}
      {/* ========================================================================= */}
      <div id="autorevive-appointment-page-4" className="a4-page ">
        <Watermark />

        <div className="content-layer flex flex-col justify-between h-full">
          <div>
            <OfficialLetterhead
              refNo={data.refNo}
              issueDate={data.issueDate}
              isFirstPage={false}
              candidateName={data.candidateName}
            />

            <div className="space-y-2 text-[9.5px] leading-relaxed text-slate-950 text-justify">
              {/* Section 14: Conflict of Interest & Outside Activities */}
              <section>
                <h2 className="text-[10.5px] font-bold text-[#EA580C] uppercase tracking-wide mb-0.5 font-sans">
                  14. Conflict of Interest &amp; Outside Engagement
                </h2>
                <p className="text-slate-900">
                  You shall devote your whole time and attention exclusively to the business of AutoRevive. You shall not, without prior written approval from the Management, engage directly or indirectly in any other business, trade, commercial activity, or secondary employment.
                </p>
              </section>

              {/* Section 15: Vehicle & Auction Business Responsibilities */}
              <section className="bg-[#FFF7ED] border border-[#FED7AA] p-2 font-sans">
                <h2 className="text-[10px] font-bold text-[#EA580C] uppercase tracking-wide mb-0.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#EA580C]" />
                  <span>15. Automotive &amp; Auction Business Integrity</span>
                </h2>
                <p className="text-slate-900 text-[9px] leading-snug">
                  Because AutoRevive manages vehicle auctions, condition assessments, and repossession inventories, employees handling appraisals, auction lots, bidding queues, and valuations must maintain strict objectivity. Tampering with vehicle data, auction logs, or buyer bids will invite immediate legal prosecution.
                </p>
              </section>

              {/* Section 16 & 17: Verification & Notice Period */}
              <div className="grid grid-cols-2 gap-2 font-sans">
                <div className="bg-white border border-slate-200 p-1.5 text-[9px]">
                  <h3 className="font-bold text-[#EA580C] uppercase text-[9.5px] mb-0.5">
                    16. Document Verification
                  </h3>
                  <p className="text-slate-900 leading-snug">
                    This appointment is subject to satisfactory verification of submitted credentials, address proof, education records, and reference checks.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 p-1.5 text-[9px]">
                  <h3 className="font-bold text-[#EA580C] uppercase text-[9.5px] mb-0.5">
                    17. Notice Period &amp; Separation
                  </h3>
                  <p className="text-slate-900 leading-snug">
                    Either party may terminate employment by giving <strong>{data.noticePeriod}</strong> written notice or gross salary in lieu thereof, subject to complete handover.
                  </p>
                </div>
              </div>

              {/* Section 18: Governing Law */}
              <p className="text-[9px] text-slate-700">
                <strong>18. Governing Law &amp; Jurisdiction:</strong> This Appointment Letter is governed by Indian law and the exclusive jurisdiction of the competent courts in Krishnagiri / Tamil Nadu.
              </p>
            </div>

            {/* Clean Formal Signatures Block (NO STAMP) */}
            <div className="mt-2 pt-1 border-t border-slate-300">
              <div className="flex justify-between items-end font-sans">
                <div className="w-[50%]">
                  <p className="text-[10px] font-bold text-slate-950">Yours faithfully,</p>
                  <p className="text-[10px] font-bold text-[#EA580C] mb-0.5">For AutoRevive</p>
                  <div className="h-6 flex items-end pb-0.5 font-signature text-xl text-slate-950">
                    {data.hrName}
                  </div>
                  <div className="border-b border-slate-800 mb-0.5 w-48"></div>
                  <p className="text-[10px] font-bold text-slate-950">{data.hrName}</p>
                  <p className="text-[9px] text-slate-700">{data.hrTitle}</p>
                  <p className="text-[8.5px] text-slate-500">AutoRevive • Krishnagiri – 635207</p>
                </div>

                <div className="w-[45%] text-right">
                  <p className="text-[9px] text-slate-600">Ref: <span className="font-mono font-bold text-slate-900">{data.refNo}</span></p>
                  <p className="text-[9px] text-slate-600">Date of Issue: {data.issueDate}</p>
                </div>
              </div>

              {/* Employee Acceptance Box */}
              <div 
                onClick={onOpenSignModal}
                className="mt-1.5 border border-[#EA580C] bg-[#FFF7ED] p-2 cursor-pointer transition-colors hover:bg-[#FFEDD5]"
                title="Click to sign or update employee acceptance"
              >
                <div className="border-b border-[#FDBA74] pb-0.5 mb-1 flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#EA580C]">
                    19. Employee Acceptance &amp; Service Undertaking
                  </span>
                  <span className="text-[8.5px] text-[#EA580C] font-semibold italic">Click to sign digitally</span>
                </div>
                
                <p className="text-[9px] text-slate-800 mb-1 leading-snug">
                  I, <strong>{data.candidateName}</strong>, accept this appointment with <strong>AutoRevive</strong> and agree to comply with all terms, policies, and service rules referenced herein.
                </p>

                <div className="grid grid-cols-2 gap-4 items-end pt-0.5 font-sans">
                  <div>
                    <div className="min-h-[20px] flex items-center justify-start pb-0.5">
                      {signature.isSigned ? (
                        signature.signatureType === 'type' ? (
                          <span className="font-signature text-lg text-slate-950">{signature.signatureContent}</span>
                        ) : (
                          <img src={signature.signatureContent} alt="Signature" className="h-5 object-contain" />
                        )
                      ) : (
                        <span className="text-[9px] text-slate-500 italic">Signature of Employee</span>
                      )}
                    </div>
                    <div className="border-b border-slate-700 mb-0.5"></div>
                    <p className="text-[9.5px] font-bold text-slate-950">{data.candidateName}</p>
                    <p className="text-[8.5px] text-slate-600">Employee Signature</p>
                  </div>

                  <div className="text-right">
                    <div className="min-h-[20px] flex items-end justify-end pb-0.5">
                      <span className="text-[9px] font-medium text-slate-950">
                        {signature.signedAt ? signature.signedAt : data.issueDate}
                      </span>
                    </div>
                    <div className="border-b border-slate-700 mb-0.5"></div>
                    <p className="text-[9.5px] font-bold text-slate-950">Date: {signature.signedAt ? signature.signedAt : '____/____/20____'}</p>
                    <p className="text-[8.5px] text-slate-600">Place: Uthangarai, Krishnagiri</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DocumentFooter
            currentPage={4}
            totalPages={TOTAL_PAGES}
            companyAddress={data.companyAddress}
            companyWebsite={data.companyWebsite}
            companyEmail={data.companyEmail}
            companyPhone={data.companyPhone}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 5: ANNEXURE A - DETAILED COMPENSATION & SALARY BREAKDOWN */}
      {/* ========================================================================= */}
      <div id="autorevive-appointment-page-5" className="a4-page ">
        <Watermark />

        <div className="content-layer flex flex-col justify-between h-full">
          <div>
            <OfficialLetterhead
              refNo={data.refNo}
              issueDate={data.issueDate}
              isFirstPage={false}
              candidateName={data.candidateName}
            />

            {/* Annexure A Title */}
            <div className="text-center my-1 pb-1 border-b border-[#EA580C]">
              <h1 className="text-[13.5px] font-bold uppercase tracking-wider text-slate-950 font-serif">
                ANNEXURE A – REMUNERATION STRUCTURE
              </h1>
              <p className="text-[9.5px] text-slate-600 font-sans tracking-wide uppercase mt-0.5">
                Official Element-Wise Compensation Schedule • AutoRevive
              </p>
            </div>

            {/* Summary Banner */}
            <div className="my-1.5 bg-[#FFF7ED] border border-[#FED7AA] p-2 font-sans grid grid-cols-4 gap-2 text-[10px]">
              <div>
                <span className="text-slate-500 block text-[9px]">Employee Name</span>
                <strong className="text-slate-950 text-[10.5px]">{data.candidateName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">Employee ID</span>
                <strong className="text-slate-950 text-[10.5px] font-mono">{data.employeeId}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">Designation</span>
                <strong className="text-slate-950 text-[10.5px]">{data.jobTitle}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">Department</span>
                <strong className="text-slate-950 text-[10.5px]">{data.department}</strong>
              </div>
            </div>

            {/* Salary Breakdown Table */}
            <div className="my-1.5  overflow-hidden font-sans">
              <table className="w-full text-left border-collapse text-[9.5px]">
                <thead>
                  <tr className="bg-[#EA580C] text-white font-semibold">
                    <th className="py-1 px-3 border-r border-[#F97316]">Salary Component / Head</th>
                    <th className="py-1 px-3 text-right border-r border-[#F97316] w-28">Monthly (₹)</th>
                    <th className="py-1 px-3 text-right w-28">Annual (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {/* PART A: Earnings */}
                  <tr className="bg-slate-100/80 font-bold text-slate-950 text-[9px]">
                    <td colSpan={3} className="py-0.5 px-3 uppercase tracking-wider text-[#EA580C]">
                      PART A: Direct Gross Earnings
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-3 text-slate-800">Basic Salary (50% of Fixed)</td>
                    <td className="py-0.5 px-3 text-right font-mono text-slate-900">{data.salary.basicMonthly.toLocaleString('en-IN')}</td>
                    <td className="py-0.5 px-3 text-right font-mono text-slate-900">{(data.salary.basicMonthly * 12).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="py-0.5 px-3 text-slate-800">House Rent Allowance (HRA)</td>
                    <td className="py-0.5 px-3 text-right font-mono text-slate-900">{data.salary.hraMonthly.toLocaleString('en-IN')}</td>
                    <td className="py-0.5 px-3 text-right font-mono text-slate-900">{(data.salary.hraMonthly * 12).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-3 text-slate-800">Special &amp; Performance Allowance</td>
                    <td className="py-0.5 px-3 text-right font-mono text-slate-900">{data.salary.specialAllowanceMonthly.toLocaleString('en-IN')}</td>
                    <td className="py-0.5 px-3 text-right font-mono text-slate-900">{(data.salary.specialAllowanceMonthly * 12).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="bg-[#FFF7ED] font-bold text-slate-950 border-t border-slate-300">
                    <td className="py-0.5 px-3 text-[#EA580C]">TOTAL GROSS SALARY (A)</td>
                    <td className="py-0.5 px-3 text-right font-mono text-[#EA580C]">{data.salary.grossPayMonthly.toLocaleString('en-IN')}</td>
                    <td className="py-0.5 px-3 text-right font-mono text-[#EA580C]">{(data.salary.grossPayMonthly * 12).toLocaleString('en-IN')}</td>
                  </tr>

                  {/* PART B: Employee Deductions */}
                  <tr className="bg-slate-100/80 font-bold text-slate-950 text-[9px]">
                    <td colSpan={3} className="py-0.5 px-3 uppercase tracking-wider text-slate-700">
                      PART B: Employee Statutory Deductions
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-3 text-slate-800">Employee Provident Fund (EPF - 12%)</td>
                    <td className="py-0.5 px-3 text-right font-mono text-slate-900">{data.salary.employeePFMonthly.toLocaleString('en-IN')}</td>
                    <td className="py-0.5 px-3 text-right font-mono text-slate-900">{(data.salary.employeePFMonthly * 12).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="py-0.5 px-3 text-slate-800">Employee State Insurance (ESIC)</td>
                    <td className="py-0.5 px-3 text-right font-mono text-slate-900">{data.salary.employeeESICMonthly.toLocaleString('en-IN')}</td>
                    <td className="py-0.5 px-3 text-right font-mono text-slate-900">{(data.salary.employeeESICMonthly * 12).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-3 text-slate-800">Professional Tax (PT) &amp; Statutory Dues</td>
                    <td className="py-0.5 px-3 text-right font-mono text-slate-900">{data.salary.professionalTaxMonthly.toLocaleString('en-IN')}</td>
                    <td className="py-0.5 px-3 text-right font-mono text-slate-900">{(data.salary.professionalTaxMonthly * 12).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="bg-slate-100 font-semibold text-slate-900">
                    <td className="py-0.5 px-3">NET TAKE-HOME SALARY (A - B)</td>
                    <td className="py-0.5 px-3 text-right font-mono font-bold text-slate-950">{data.salary.netTakeHomeMonthly.toLocaleString('en-IN')}</td>
                    <td className="py-0.5 px-3 text-right font-mono font-bold text-slate-950">{(data.salary.netTakeHomeMonthly * 12).toLocaleString('en-IN')}</td>
                  </tr>

                  {/* PART C: Employer Contributions */}
                  <tr className="bg-slate-100/80 font-bold text-slate-950 text-[9px]">
                    <td colSpan={3} className="py-0.5 px-3 uppercase tracking-wider text-slate-700">
                      PART C: Employer Retirals &amp; Insurance
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-3 text-slate-800">Employer PF Contribution (12%)</td>
                    <td className="py-0.5 px-3 text-right font-mono text-slate-900">{data.salary.employerPFMonthly.toLocaleString('en-IN')}</td>
                    <td className="py-0.5 px-3 text-right font-mono text-slate-900">{(data.salary.employerPFMonthly * 12).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="py-0.5 px-3 text-slate-800">Employer ESIC &amp; Insurance Pool</td>
                    <td className="py-0.5 px-3 text-right font-mono text-slate-900">{data.salary.employerESICMonthly.toLocaleString('en-IN')}</td>
                    <td className="py-0.5 px-3 text-right font-mono text-slate-900">{(data.salary.employerESICMonthly * 12).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-3 text-slate-800">Statutory Gratuity Provision (4.81%)</td>
                    <td className="py-0.5 px-3 text-right font-mono text-slate-900">{Math.round(data.salary.basicMonthly * 0.0481).toLocaleString('en-IN')}</td>
                    <td className="py-0.5 px-3 text-right font-mono text-slate-900">{(Math.round(data.salary.basicMonthly * 0.0481) * 12).toLocaleString('en-IN')}</td>
                  </tr>

                  {/* GRAND TOTAL CTC */}
                  <tr className="bg-[#EA580C] text-white font-bold text-[10px]">
                    <td className="py-1 px-3 uppercase tracking-wider">TOTAL COST TO COMPANY (CTC = A + C)</td>
                    <td className="py-1 px-3 text-right font-mono font-bold text-white">{data.salary.totalCTCMonthly.toLocaleString('en-IN')}</td>
                    <td className="py-1 px-3 text-right font-mono font-bold text-white">{data.salary.totalCTCAnnual.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Notes & Compliance */}
            <div className="bg-slate-50 border border-slate-200 p-1.5 text-[9px] text-slate-700 space-y-0.5 font-sans my-1.5">
              <p><strong>Statutory Compliance Notes:</strong></p>
              <p>• Income Tax (TDS) shall be deducted as per the Income Tax Act 1961 based on tax regime and proof submissions.</p>
              <p>• Gratuity and statutory retirement benefits are payable per the Payment of Gratuity Act upon eligible continuous tenure.</p>
            </div>

            {/* Annexure Signatures (NO STAMP) */}
            <div className="mt-2 flex justify-between items-end gap-6 font-sans">
              <div className="w-1/2">
                <p className="text-[9.5px] font-bold text-slate-950">For AutoRevive</p>
                <div className="h-6 flex items-end pb-0.5 font-signature text-xl text-slate-950">
                  {data.hrName}
                </div>
                <div className="border-b border-slate-700 mb-0.5"></div>
                <p className="text-[9.5px] font-bold text-slate-950">{data.hrName}</p>
                <p className="text-[8.5px] text-slate-600">Authorized HR Signatory</p>
              </div>

              <div className="w-1/2 text-right">
                <p className="text-[9.5px] font-bold text-slate-950">Employee Acceptance</p>
                <div className="h-6 flex items-end justify-end pb-0.5">
                  <span className="text-[9px] text-slate-400 italic">Signature of Employee</span>
                </div>
                <div className="border-b border-slate-700 mb-0.5"></div>
                <p className="text-[9.5px] font-bold text-slate-950">{data.candidateName}</p>
                <p className="text-[8.5px] text-slate-600">Acknowledged &amp; Agreed</p>
              </div>
            </div>
          </div>

          <DocumentFooter
            currentPage={5}
            totalPages={TOTAL_PAGES}
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
