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
  isCumPlacement?: boolean;
}

export const AutoReviveInternshipLetter: React.FC<Props> = ({
  data,
  signature,
  onOpenSignModal,
  spacingLevel = 5,
  isCumPlacement = false,
}) => {
  const stipendAmount = data.salary.totalCTCMonthly || 15000;

  return (
    <div className="print-container flex flex-col items-center gap-8 w-full font-serif text-slate-950">
      {/* SINGLE PAGE INTERNSHIP OFFER */}
      <div id="autorevive-internship-page-1" className="a4-page">
        <Watermark />

        <div className="content-layer flex flex-col justify-between h-full">
          <div>
            {/* Official Letterhead */}
            <OfficialLetterhead
              refNo={data.refNo}
              issueDate={data.issueDate}
              isFirstPage={true}
            />

            {/* Recipient Details */}
            <div className="mb-2 text-[10.5px] leading-snug text-slate-900">
              <p className="font-semibold text-slate-700">To,</p>
              <p className="font-bold text-[12px] text-slate-950">{data.candidateName}</p>
              <p className="text-slate-700">{data.candidateAddress || 'Krishnagiri, Tamil Nadu, India'}</p>
            </div>

            {/* Subject */}
            <div className="mb-2 border-b border-slate-300 pb-1">
              <h1 className="text-[12.5px] font-bold uppercase tracking-wide text-slate-950">
                {isCumPlacement
                  ? 'Subject: Offer of Internship Cum Placement Opportunity'
                  : 'Subject: Offer of Graduate Internship & Practical Training'}
              </h1>
            </div>

            {/* Content */}
            <div className="text-[10.5px] leading-relaxed text-slate-950 text-justify space-y-2">
              <p>
                Dear <strong>{data.candidateName}</strong>,
              </p>

              <p>
                Following your technical assessment and interview discussions with our team, we are pleased to offer you an internship position as <strong>{data.jobTitle || 'Graduate Engineering Intern – Sales & Automotive Solutions'}</strong> {isCumPlacement ? 'with a prospective pre-placement offer' : ''} at <strong>AutoRevive</strong>.
              </p>

              {/* Terms Box */}
              <div className="border border-slate-400 bg-slate-50/70 p-2 text-[10px] font-sans rounded-sm shadow-2xs">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-1 pr-3 font-semibold text-slate-700 w-36">Internship Role</td>
                      <td className="py-1 font-bold text-slate-950">: {data.jobTitle || 'Graduate Trainee / Intern'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-3 font-semibold text-slate-700">Department</td>
                      <td className="py-1 font-bold text-slate-950">: {data.department}</td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-3 font-semibold text-slate-700">Training Location</td>
                      <td className="py-1 text-slate-900">: {data.workLocation || data.baseLocation || 'Uthangarai, Krishnagiri'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-3 font-semibold text-slate-700">Monthly Stipend</td>
                      <td className="py-1 font-bold text-[#EA580C]">: ₹{stipendAmount.toLocaleString('en-IN')}/- per month</td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-3 font-semibold text-slate-700">Commencement Date</td>
                      <td className="py-1 font-bold text-slate-950">: {data.internshipStartDate || data.joiningDate || '03 November 2026'}</td>
                    </tr>
                    {isCumPlacement && (
                      <tr className="bg-orange-50/80">
                        <td className="py-1 pr-3 font-semibold text-orange-950">Placement Opportunity</td>
                        <td className="py-1 font-bold text-orange-950">: Eligible for full-time absorption based on performance evaluation</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <section>
                <h2 className="text-[11px] font-bold text-slate-950 mb-1.5">1. Training Scope &amp; Mentorship</h2>
                <p className="text-slate-800 leading-[1.8]">
                  During your internship, you will receive hands-on training under the mentorship of our technical team. You will be exposed to real-world automotive workflows, business diagnostics, and client service methodologies.
                </p>
              </section>

              <section>
                <h2 className="text-[11px] font-bold text-slate-950 mb-1.5">2. Confidentiality &amp; Code of Conduct</h2>
                <p className="text-slate-800 leading-[1.8]">
                  You agree not to disclose or utilize any proprietary business information, client records, or software tools of AutoRevive. You will adhere to company operating guidelines and safety protocols.
                </p>
              </section>

              <section>
                <h2 className="text-[11px] font-bold text-slate-950 mb-1.5">3. Evaluation &amp; Career Opportunities</h2>
                <p className="text-slate-800 leading-[1.8]">
                  Upon successful completion of the training period and performance evaluation, AutoRevive may consider offering a full-time regular employment role subject to vacancies.
                </p>
              </section>
            </div>

            {/* Clean Signatures Block (NO STAMP) */}
            <div className="mt-3 flex justify-between items-end gap-6 text-[10px] font-sans">
              <div className="w-[45%]">
                <p className="font-bold text-slate-950 mb-0.5">For AutoRevive</p>
                <div className="h-7 flex items-end pb-0.5 font-signature text-2xl text-slate-950">
                  {data.hrName}
                </div>
                <div className="border-b border-slate-700 mb-0.5 w-44"></div>
                <p className="font-bold text-slate-950">{data.hrName}</p>
                <p className="text-slate-700">{data.hrTitle}</p>
                <p className="text-[8.5px] text-slate-500">AutoRevive • Krishnagiri – 635207</p>
              </div>

              <div className="w-[45%] text-right font-sans">
                <p className="font-bold text-slate-950 mb-0.5">Candidate Acceptance</p>
                <div className="h-7 flex items-end justify-end pb-0.5">
                  <span className="text-[9px] text-slate-400 italic">Signature of Intern</span>
                </div>
                <div className="border-b border-slate-700 mb-0.5"></div>
                <p className="font-bold text-slate-950">{data.candidateName}</p>
                <p className="text-slate-700 text-[9px]">Date: ____ / ____ / 20____</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <DocumentFooter
            currentPage={1}
            totalPages={1}
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
