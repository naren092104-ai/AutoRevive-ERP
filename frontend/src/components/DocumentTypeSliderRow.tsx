import React from 'react';
import { DocumentType } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Download, 
  Printer, 
  Mail, 
  Loader2 
} from 'lucide-react';

interface Props {
  activeDoc: DocumentType;
  onSelectDoc: (doc: DocumentType) => void;
  onGeneratePdf: () => Promise<any>;
  onDownloadPdf: () => Promise<void>;
  onPrint: () => void;
  onOpenEmailModal: () => void;
  isGenerating?: boolean;
}

export const DocumentTypeSliderRow: React.FC<Props> = ({
  activeDoc,
  onSelectDoc,
  onGeneratePdf,
  onDownloadPdf,
  onPrint,
  onOpenEmailModal,
  isGenerating = false,
}) => {
  const documents: Array<{ id: DocumentType; label: string }> = [
    { id: 'offer_letter',             label: 'Offer Letter' },
    { id: 'internship_letter',        label: 'Letter of Internship' },
    { id: 'internship_cum_placement', label: 'Internship-Cum-Placement' },
    { id: 'appointment_letter',       label: 'Appointment Letter' },
  ];

  const currentIndex = documents.findIndex(d => 
    d.id === activeDoc ||
    (d.id === 'offer_letter' && activeDoc === 'autorevive_offer') ||
    (d.id === 'internship_letter' && activeDoc === 'autorevive_internship') ||
    (d.id === 'appointment_letter' && activeDoc === 'autorevive_appointment')
  );

  const handlePrev = () => {
    const prevIdx = (currentIndex - 1 + documents.length) % documents.length;
    onSelectDoc(documents[prevIdx].id);
  };

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % documents.length;
    onSelectDoc(documents[nextIdx].id);
  };

  const isTabActive = (tabId: DocumentType) => {
    return activeDoc === tabId ||
      (tabId === 'offer_letter' && activeDoc === 'autorevive_offer') ||
      (tabId === 'internship_letter' && activeDoc === 'autorevive_internship') ||
      (tabId === 'appointment_letter' && activeDoc === 'autorevive_appointment');
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 select-none no-print">
      {/* Left: Document Type Slider Box */}
      <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={handlePrev}
          className="p-2 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Previous Document"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* 4 Core Document Buttons */}
        <div className="flex items-center gap-1">
          {documents.map((doc) => {
            const active = isTabActive(doc.id);
            return (
              <button
                key={doc.id}
                onClick={() => onSelectDoc(doc.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#EA580C] text-white font-bold shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {doc.label}
              </button>
            );
          })}
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={handleNext}
          className="p-2 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Next Document"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Right: 4 Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* 1. Generate PDF */}
        <button
          onClick={onGeneratePdf}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-2xs disabled:opacity-60 cursor-pointer"
          title="Generate PDF on server"
        >
          {isGenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-orange-400" />
          )}
          <span>Generate PDF</span>
        </button>

        {/* 2. Download PDF */}
        <button
          onClick={onDownloadPdf}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold text-xs rounded-lg transition-colors shadow-2xs disabled:opacity-70 cursor-pointer"
          title="Download PDF"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download PDF</span>
        </button>

        {/* 3. Print */}
        <button
          onClick={onPrint}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer"
          title="Print Document"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print</span>
        </button>

        {/* 4. Email Document */}
        <button
          onClick={onOpenEmailModal}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs disabled:opacity-60 cursor-pointer"
          title="Email Document to Candidate"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email Document</span>
        </button>
      </div>
    </div>
  );
};
