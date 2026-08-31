import React, { useRef } from 'react';
import { DocumentData, DocumentType, DocumentStatus } from '../types';
import { AutoReviveLogo } from './AutoReviveLogo';
import { 
  Printer, 
  FileText, 
  GraduationCap, 
  Briefcase, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Loader2, 
  Mail, 
  Award,
  Edit3,
  CheckCircle2,
  Sparkles,
  FileCheck,
  DollarSign,
  Building2
} from 'lucide-react';

interface Props {
  activeDoc: DocumentType;
  onSelectDoc: (doc: DocumentType) => void;
  documentData: DocumentData;
  onGeneratePdf: () => Promise<any>;
  onDownloadPdf: () => Promise<void>;
  onPrint: () => void;
  onOpenEmailModal: () => void;
  isGenerating?: boolean;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  spacingLevel?: number;
  onSpacingChange?: (level: number) => void;
  isEditMode?: boolean;
  onToggleEditMode?: () => void;
  docStatus?: DocumentStatus;
}

export const ALL_DOCUMENTS: Array<{ 
  id: DocumentType; 
  label: string; 
  shortLabel: string;
  category: 'core' | 'certificate' | 'letter';
  icon: React.ComponentType<{ className?: string }>; 
}> = [
  // 4 Primary Core Documents (Prominently listed first)
  { id: 'offer_letter',                     label: 'Offer Letter',                         shortLabel: 'Offer Letter',          category: 'core',        icon: FileText },
  { id: 'internship_letter',                label: 'Letter of Internship',                 shortLabel: 'Internship Letter',     category: 'core',        icon: GraduationCap },
  { id: 'internship_cum_placement',         label: 'Internship-Cum-Placement Letter',      shortLabel: 'Internship Cum Placement', category: 'core',     icon: Award },
  { id: 'appointment_letter',               label: 'Appointment Letter',                   shortLabel: 'Appointment Letter',    category: 'core',        icon: Briefcase },
  
  // Official HR Certificates & Secondary Letters (Preserved without removal)
  { id: 'internship_completion_certificate', label: 'Internship Completion Certificate',   shortLabel: 'Completion Cert',       category: 'certificate', icon: CheckCircle2 },
  { id: 'appreciation_certificate',         label: 'Certificate of Appreciation',          shortLabel: 'Appreciation Cert',     category: 'certificate', icon: Sparkles },
  { id: 'relieving_letter',                 label: 'Relieving Letter',                     shortLabel: 'Relieving Letter',      category: 'letter',      icon: FileCheck },
  { id: 'stipend_certificate',              label: 'Stipend Certificate',                  shortLabel: 'Stipend Cert',          category: 'certificate', icon: DollarSign },
  { id: 'employment_certificate',           label: 'Certificate of Employment',            shortLabel: 'Employment Cert',       category: 'certificate', icon: Building2 },
];

export const TopNavBar: React.FC<Props> = ({
  activeDoc,
  onSelectDoc,
  documentData,
  onGeneratePdf,
  onDownloadPdf,
  onPrint,
  onOpenEmailModal,
  isGenerating = false,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  spacingLevel = 5,
  onSpacingChange,
  isEditMode = false,
  onToggleEditMode,
  docStatus = 'Created',
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const currentIndex = ALL_DOCUMENTS.findIndex(d => 
    d.id === activeDoc ||
    (d.id === 'offer_letter' && activeDoc === 'autorevive_offer') ||
    (d.id === 'internship_letter' && activeDoc === 'autorevive_internship') ||
    (d.id === 'appointment_letter' && activeDoc === 'autorevive_appointment')
  );

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handlePrevDoc = () => {
    scrollSlider('left');
    const prevIdx = (currentIndex - 1 + ALL_DOCUMENTS.length) % ALL_DOCUMENTS.length;
    onSelectDoc(ALL_DOCUMENTS[prevIdx].id);
  };

  const handleNextDoc = () => {
    scrollSlider('right');
    const nextIdx = (currentIndex + 1) % ALL_DOCUMENTS.length;
    onSelectDoc(ALL_DOCUMENTS[nextIdx].id);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (sliderRef.current && Math.abs(e.deltaY) > 0) {
      sliderRef.current.scrollLeft += e.deltaY;
    }
  };

  // Scroll active tab into view whenever it changes
  React.useEffect(() => {
    if (sliderRef.current) {
      const activeEl = sliderRef.current.querySelector<HTMLElement>('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeDoc]);

  const isTabActive = (tabId: DocumentType) => {
    return activeDoc === tabId ||
      (tabId === 'offer_letter' && activeDoc === 'autorevive_offer') ||
      (tabId === 'internship_letter' && activeDoc === 'autorevive_internship') ||
      (tabId === 'appointment_letter' && activeDoc === 'autorevive_appointment');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs no-print select-none">
      {/* Upper Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AutoReviveLogo size="sm" showSubText={false} />
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight flex items-center gap-2">
              <span className="text-[#EA580C] font-serif-brand text-lg">AutoRevive HR</span>
              <span className="text-slate-300 font-normal">|</span>
              <span className="text-slate-800">Document Center</span>
            </h1>
            <p className="text-[11px] text-slate-500">
              Document Slider → Live A4 Preview → Generate PDF → Download / Print / Email
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Zoom Controls */}
          <div className="hidden xl:flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200 text-xs">
            <button
              onClick={onZoomOut}
              disabled={zoomLevel <= 70}
              className="p-1.5 rounded hover:bg-white text-slate-700 disabled:opacity-40 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onResetZoom}
              className="px-2 py-1 font-mono font-medium text-slate-700 hover:bg-white rounded cursor-pointer"
              title="Reset Zoom"
            >
              {zoomLevel}%
            </button>
            <button
              onClick={onZoomIn}
              disabled={zoomLevel >= 130}
              className="p-1.5 rounded hover:bg-white text-slate-700 disabled:opacity-40 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Page Spacing Slider Bar */}
          {onSpacingChange && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200 text-xs">
              <span className="text-[11px] font-semibold text-slate-600">Spacing:</span>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={spacingLevel}
                onChange={(e) => onSpacingChange(Number(e.target.value))}
                className="w-16 h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-[#EA580C]"
                title={`Spacing Level: ${spacingLevel}`}
              />
              <span className="font-mono text-[10.5px] font-bold text-[#EA580C]">
                {spacingLevel === 5 ? 'Max' : spacingLevel}
              </span>
            </div>
          )}

          {/* Edit Document Toggle */}
          {onToggleEditMode && (
            <button
              onClick={onToggleEditMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-xs transition-colors shadow-2xs cursor-pointer ${
                isEditMode
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
              }`}
              title="Toggle Edit Document Mode"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditMode ? 'Editing...' : 'Edit Document'}</span>
            </button>
          )}

          {/* 1. Generate PDF Button */}
          <button
            onClick={onGeneratePdf}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-2xs disabled:opacity-60 cursor-pointer"
            title="Generate document PDF"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-orange-400" />
            )}
            <span>Generate PDF</span>
          </button>

          {/* 2. Download PDF Button */}
          <button
            onClick={onDownloadPdf}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold text-xs transition-colors shadow-2xs disabled:opacity-75 cursor-pointer"
            title="Download Stored A4 PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          {/* 3. Print Button */}
          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
            title="Print only the official document"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>

          {/* 4. Email Document Button */}
          <button
            onClick={onOpenEmailModal}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-2xs disabled:opacity-60 cursor-pointer"
            title="Email document with PDF attached"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Document</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HORIZONTAL DOCUMENT SLIDER NAVIGATION BAR (< All 9 Documents >) */}
      {/* ========================================================================= */}
      <div className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2">
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={handlePrevDoc}
            className="p-2 rounded-full text-slate-600 hover:text-slate-950 hover:bg-slate-200 border border-slate-300 bg-white shadow-2xs transition-all cursor-pointer shrink-0"
            title="Slide Left (Previous Document)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Horizontal Slider Track with Overflow and Touch/Mouse Scroll */}
          <div 
            ref={sliderRef}
            onWheel={handleWheel}
            className="flex-1 flex items-center gap-1.5 overflow-x-auto scroll-smooth py-1 px-1 no-scrollbar select-none cursor-grab active:cursor-grabbing"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="flex items-center bg-slate-200/80 rounded-full p-1 gap-1.5 border border-slate-300 shadow-2xs shrink-0">
              {ALL_DOCUMENTS.map(tab => {
                const Icon = tab.icon;
                const active = isTabActive(tab.id);
                return (
                  <button
                    key={tab.id}
                    data-active={active ? 'true' : 'false'}
                    onClick={() => {
                      onSelectDoc(tab.id);
                    }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 ${
                      active
                        ? 'bg-white text-[#EA580C] shadow-sm border border-orange-300 font-bold ring-2 ring-[#EA580C]/20'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-[#EA580C]' : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={handleNextDoc}
            className="p-2 rounded-full text-slate-600 hover:text-slate-950 hover:bg-slate-200 border border-slate-300 bg-white shadow-2xs transition-all cursor-pointer shrink-0"
            title="Slide Right (Next Document)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
