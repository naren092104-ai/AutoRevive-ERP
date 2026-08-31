import React from 'react';
import { DocumentData, DocumentType, SignatureData } from '../types';
import { OfficialLetterhead } from './OfficialLetterhead';
import { Watermark } from './Watermark';
import { DocumentFooter } from './DocumentFooter';

interface Props {
  docType: DocumentType;
  data: DocumentData;
  signature: SignatureData;
  spacingLevel?: number;
}

export const AutoReviveGenericDocument: React.FC<Props> = ({
  docType,
  data,
  signature,
  spacingLevel = 5,
}) => {
  const getDocumentTitle = () => {
    switch (docType) {
      case 'internship_cum_placement':
        return 'INTERNSHIP CUM PLACEMENT OFFER LETTER';
      case 'internship_completion_certificate':
        return 'CERTIFICATE OF INTERNSHIP COMPLETION';
      case 'appreciation_certificate':
        return 'CERTIFICATE OF APPRECIATION';
      case 'relieving_letter':
        return 'RELIEVING LETTER & SERVICE EXPERIENCE CONFIRMATION';
      case 'stipend_certificate':
        return 'CERTIFICATE OF STIPEND & ALLOWANCE DISBURSEMENT';
      case 'employment_certificate':
      default:
        return 'CERTIFICATE OF EMPLOYMENT & SERVICE CONFIRMATION';
    }
  };

  const isCertificate =
    docType === 'internship_completion_certificate' ||
    docType === 'appreciation_certificate';

  return (
    <div className="print-container flex flex-col items-center gap-8 w-full font-serif text-slate-950">
      <div className="a4-page border border-slate-300 relative bg-white">
        <Watermark />

        <div className="content-layer flex flex-col justify-between h-full">
          <div>
            <OfficialLetterhead
              refNo={data.refNo}
              issueDate={data.issueDate}
              isFirstPage={true}
            />

            {/* Recipient Details if letter format */}
            {!isCertificate && (
              <div className="mb-3 text-[11px] leading-snug text-slate-900">
                <p className="font-semibold text-slate-600">TO WHOMSOEVER IT MAY CONCERN,</p>
                <p className="font-bold text-[13px] text-slate-950 mt-1">{data.candidateName}</p>
                <p className="text-slate-800">{data.candidateAddress || 'Tamil Nadu, India'}</p>
                <p className="text-slate-600 text-[10px]">Employee ID: <span className="font-mono font-bold text-slate-900">{data.employeeId}</span></p>
              </div>
            )}

            {/* Subject / Title Header */}
            <div className={`mb-4 border-b border-slate-300 pb-2 ${isCertificate ? 'text-center pt-8' : ''}`}>
              <h1 className={`${isCertificate ? 'text-[18px] text-[#EA580C]' : 'text-[12.5px] text-slate-950'} font-bold uppercase tracking-wide`}>
                {getDocumentTitle()}
              </h1>
              {isCertificate && (
                <div className="w-24 h-0.5 bg-[#EA580C] mx-auto mt-2"></div>
              )}
            </div>

            {/* Dynamic Document Body */}
            {docType === 'internship_completion_certificate' && (
              <div className="text-center py-8 space-y-5 text-slate-800 text-[12px] leading-[1.8]">
                <p className="text-slate-500 uppercase tracking-widest text-[11px] font-sans">This is to certify that</p>
                <p className="text-[22px] font-bold text-slate-950 font-serif">{data.candidateName}</p>
                <p className="max-w-xl mx-auto leading-[1.8]">
                  has successfully completed the graduate internship program as <strong>{data.jobTitle}</strong> in the <strong>{data.department}</strong> at AutoRevive from <strong>{data.internshipStartDate || '01 August 2026'}</strong> to <strong>{data.internshipEndDate || '31 October 2026'}</strong>.
                </p>
                <p className="max-w-lg mx-auto text-slate-700 text-[11px] italic leading-[1.8]">
                  During this tenure, the candidate exhibited exceptional dedication, analytical capabilities, and professional discipline. We commend their performance and wish them great success.
                </p>
              </div>
            )}

            {docType === 'appreciation_certificate' && (
              <div className="text-center py-8 space-y-5 text-slate-800 text-[12px] leading-[1.8]">
                <p className="text-slate-500 uppercase tracking-widest text-[11px] font-sans">Proudly Presented To</p>
                <p className="text-[24px] font-bold text-[#EA580C] font-serif">{data.candidateName}</p>
                <p className="max-w-xl mx-auto leading-[1.8]">
                  in sincere appreciation of outstanding dedication, exceptional contributions, and exemplary performance as <strong>{data.jobTitle}</strong> in the <strong>{data.department}</strong> at AutoRevive.
                </p>
                <p className="max-w-lg mx-auto text-slate-700 text-[11px] italic leading-[1.8]">
                  Your commitment to operational excellence and customer value reflects the highest standards of our organization.
                </p>
              </div>
            )}

            {docType === 'relieving_letter' && (
              <div className="text-[11px] text-slate-900 space-y-4 text-justify">
                <p className="leading-[1.8]">
                  This is to certify that <strong>{data.candidateName}</strong> (Employee ID: <strong>{data.employeeId}</strong>) was employed with AutoRevive as <strong>{data.jobTitle}</strong> in the <strong>{data.department}</strong> from <strong>{data.joiningDate}</strong> to <strong>{data.internshipEndDate || '31 October 2026'}</strong>.
                </p>
                <p className="leading-[1.8]">
                  Pursuant to your formal notice, you have been relieved from your service obligations with AutoRevive effective close of business hours on <strong>{data.internshipEndDate || '31 October 2026'}</strong>.
                </p>
                <p className="leading-[1.8]">
                  We confirm that all company assets, computer hardware, digital access credentials, and operational documentation have been returned in satisfactory condition. There are no outstanding liabilities or dues pending.
                </p>
                <p className="leading-[1.8]">
                  During your tenure, your character and conduct were found to be professional and commendable. We wish you every success in your future endeavors.
                </p>
              </div>
            )}

            {docType === 'stipend_certificate' && (
              <div className="text-[11px] text-slate-900 space-y-4 text-justify">
                <p className="leading-[1.8]">
                  This is to certify that <strong>{data.candidateName}</strong> (Employee/Intern ID: <strong>{data.employeeId}</strong>) was engaged with AutoRevive in the <strong>{data.department}</strong> as <strong>{data.jobTitle}</strong>.
                </p>
                <div className="border border-slate-300 bg-slate-50 p-3 my-3 font-sans text-[11px]">
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-1.5 font-semibold text-slate-600 w-44">Monthly Stipend Amount</td>
                        <td className="py-1.5 font-bold text-slate-900">₹{Number(data.salary?.totalCTCMonthly || 15000).toLocaleString('en-IN')}/- per month</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-semibold text-slate-600">Disbursement Method</td>
                        <td className="py-1.5 text-slate-900">Direct Bank Transfer (NEFT)</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-semibold text-slate-600">Statutory Tax Withholding</td>
                        <td className="py-1.5 text-slate-900">Compliant with Income Tax Regulations</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[10.5px] text-slate-600 leading-[1.8]">
                  This certificate is issued on the request of the individual for official, academic, and banking verification purposes.
                </p>
              </div>
            )}

            {docType === 'employment_certificate' && (
              <div className="text-[11px] text-slate-900 space-y-4 text-justify">
                <p className="leading-[1.8]">
                  This is to confirm that <strong>{data.candidateName}</strong> (Employee ID: <strong>{data.employeeId}</strong>) is a confirmed, full-time employee of AutoRevive holding the position of <strong>{data.jobTitle}</strong> in the <strong>{data.department}</strong> since <strong>{data.joiningDate}</strong>.
                </p>
                <div className="border border-slate-300 bg-slate-50 p-3 my-3 font-sans text-[11px]">
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-1.5 font-semibold text-slate-600 w-44">Employment Status</td>
                        <td className="py-1.5 font-bold text-slate-900">{data.employmentType || 'Full-Time (Regular)'}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-semibold text-slate-600">Work Location</td>
                        <td className="py-1.5 text-slate-900">{data.postingLocation || data.baseLocation}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-semibold text-slate-600">Reporting Authority</td>
                        <td className="py-1.5 text-slate-900">{data.reportingManager || 'Managing Director'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[10.5px] text-slate-600 leading-[1.8]">
                  This certificate is issued at the request of the employee without any financial liability on the part of AutoRevive.
                </p>
              </div>
            )}

            {docType === 'internship_cum_placement' && (
              <div className="text-[11px] leading-relaxed text-slate-900 space-y-3 text-justify">
                <p>
                  Dear <strong>{data.candidateName}</strong>,
                </p>
                <p>
                  We are pleased to offer you an <strong>Internship Cum Placement Opportunity</strong> at AutoRevive for the role of <strong>{data.jobTitle}</strong> in the <strong>{data.department}</strong>.
                </p>
                <p>
                  During the initial internship period, you will receive a monthly stipend of <strong>₹{Number(data.salary?.totalCTCMonthly || 15000).toLocaleString('en-IN')}/-</strong>. Upon successful completion of the training period and performance assessment, you will be transitioned into regular full-time employment with an annual CTC of <strong>₹{Number(data.salary?.totalCTCAnnual || 503688).toLocaleString('en-IN')}/-</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Signatures Block */}
          <div className="pt-6 pb-2">
            <div className="flex justify-between items-end border-t border-slate-200 pt-4">
              <div>
                <p className="text-[10px] text-slate-500 font-sans">Issued by Authorized Signatory</p>
                <p className="font-serif italic text-[16px] text-slate-900 mt-1">Jemsina Banu</p>
                <div className="w-32 h-[1px] bg-slate-600 my-1"></div>
                <p className="font-bold text-[11px] text-slate-950">Jemsina Banu</p>
                <p className="text-[10px] text-[#EA580C] font-semibold">Human Resources</p>
                <p className="text-[9.5px] text-slate-500">AutoRevive • Krishnagiri – 635207</p>
              </div>

              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-sans">Document Verification</p>
                <p className="font-mono text-[11px] font-bold text-slate-800 mt-1">{data.refNo || 'AR/CERT/2026/0001'}</p>
                <p className="text-[10px] text-slate-500">hr@autorevives.com | 9597969650</p>
                <p className="text-[9.5px] text-[#EA580C] font-bold">autorevives.com</p>
              </div>
            </div>
          </div>

          <DocumentFooter />
        </div>
      </div>
    </div>
  );
};
