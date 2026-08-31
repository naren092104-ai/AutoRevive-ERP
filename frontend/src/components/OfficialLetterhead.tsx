import React from 'react';
import { AutoReviveLogo } from './AutoReviveLogo';

interface LetterheadProps {
  refNo: string;
  issueDate: string;
  isFirstPage?: boolean;
  candidateName?: string;
}

export const OfficialLetterhead: React.FC<LetterheadProps> = ({
  refNo,
  issueDate,
}) => {
  return (
    <div className="official-letterhead mb-2 font-sans">
      <div className="flex justify-between items-center gap-3 pb-1.5">
        {/* LEFT: Logo & Company Name */}
        <div className="flex items-center gap-3 shrink-0">
          <AutoReviveLogo size="md" />
          <div className="flex flex-col justify-center border-l-2 border-[#EA580C]/30 pl-3">
            <span className="text-[21px] font-black tracking-tight text-[#EA580C] leading-none font-sans">
              AutoRevive
            </span>
            <span className="text-[9px] font-extrabold text-slate-600 tracking-[0.22em] uppercase mt-1">
              UNLOCK. BID. DRIVE.
            </span>
          </div>
        </div>

        {/* RIGHT: Ref No & Date */}
        <div className="text-right shrink-0 space-y-0.5 font-sans">
          <div className="inline-block bg-orange-50 border border-orange-200 px-2 py-0.5 rounded text-[9.5px] text-slate-900 font-mono font-semibold">
            REF: {refNo}
          </div>
          <p className="text-[10px] text-slate-700 leading-tight">
            <span className="font-bold text-slate-900">Date:</span>{' '}
            <span className="font-semibold">{issueDate}</span>
          </p>
        </div>
      </div>

      {/* Orange double divider */}
      <div className="flex flex-col gap-[2px]">
        <div className="h-[2.5px] bg-[#EA580C] w-full" />
        <div className="h-[1px] bg-slate-800 w-full opacity-50" />
      </div>
    </div>
  );
};
