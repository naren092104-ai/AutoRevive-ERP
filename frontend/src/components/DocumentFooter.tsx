import React from 'react';
import { MapPin, Mail, Phone, Globe } from 'lucide-react';

interface Props {
  currentPage: number;
  totalPages: number;
  companyAddress?: string;
  companyWebsite?: string;
  companyEmail?: string;
  companyPhone?: string;
  variant?: 'full' | 'compact';
}

export const DocumentFooter: React.FC<Props> = ({
  currentPage,
  totalPages,
  companyAddress = '999, Kuppusamyreddy Street, Uthangarai, Krishnagiri – 635207, Tamil Nadu, India.',
  companyWebsite = 'www.autorevives.com',
  companyEmail = 'hr@autorevives.com',
  companyPhone = '+91 9442693306',
  variant = 'full',
}) => {
  // Ensure formatted website URL
  let formattedWebsite = companyWebsite.toLowerCase();
  if (formattedWebsite.startsWith('http://') || formattedWebsite.startsWith('https://')) {
    formattedWebsite = formattedWebsite.replace(/^https?:\/\//, '');
  }
  if (!formattedWebsite.startsWith('www.')) {
    formattedWebsite = `www.${formattedWebsite}`;
  }

  const formattedPhone = companyPhone.startsWith('+91') 
    ? companyPhone 
    : `+91 ${companyPhone.replace(/^\+?91[\s-]*/, '')}`;

  if (variant === 'compact') {
    return (
      <footer className="mt-auto pt-2 border-t-2 border-[#EA580C] w-full text-[10px] text-slate-700 font-sans select-none">
        <div className="flex flex-row justify-between items-center gap-3">
          <div className="flex items-center text-left">
            <span className="font-bold text-[11px] text-[#EA580C] font-serif-brand tracking-wide">
              AutoRevive
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-700 font-medium text-[9.5px]">
            <span>{formattedWebsite}</span>
            <span className="text-[#EA580C] font-bold">•</span>
            <span>{companyEmail}</span>
            <span className="text-[#EA580C] font-bold">•</span>
            <span>{formattedPhone}</span>
          </div>
          <div className="flex items-center justify-end">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-slate-800 font-medium text-[9.5px]">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto pt-2 border-t-2 border-[#EA580C] w-full text-[9.5px] text-slate-700 font-sans select-none">
      <div className="flex justify-between items-end gap-3 pb-1">
        {/* Left Side: AutoRevive & Corporate Address */}
        <div className="flex flex-col text-left max-w-[55%]">
          <span className="font-bold text-[11.5px] text-[#EA580C] font-serif-brand tracking-wide leading-none mb-0.5">
            AutoRevive
          </span>
          <div className="flex items-start gap-1 text-[9px] text-slate-600 leading-snug">
            <MapPin className="w-2.5 h-2.5 text-[#EA580C] shrink-0 mt-0.5" />
            <span>{companyAddress}</span>
          </div>
        </div>

        {/* Center / Right: Contact channels */}
        <div className="flex flex-col items-end gap-0.5 text-[9px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-0.5">
              <Mail className="w-2.5 h-2.5 text-[#EA580C]" />
              <span className="text-slate-800 font-medium">{companyEmail}</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-0.5">
              <Phone className="w-2.5 h-2.5 text-[#EA580C]" />
              <span className="text-slate-800 font-medium">{formattedPhone}</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-0.5">
              <Globe className="w-2.5 h-2.5 text-[#EA580C]" />
              <span className="text-slate-800 font-medium">{formattedWebsite}</span>
            </span>
          </div>

          <div className="pt-0.5">
            <span className="px-2 py-0.2 rounded bg-orange-50 border border-orange-200 text-slate-800 font-semibold text-[8.5px]">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};



