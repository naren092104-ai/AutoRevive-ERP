import React from 'react';
import { DocumentData, DocumentType, SignatureData } from '../types';
import { AutoReviveOfferLetter } from './AutoReviveOfferLetter';
import { AutoReviveInternshipLetter } from './AutoReviveInternshipLetter';
import { AutoReviveInternshipCumPlacementLetter } from './AutoReviveInternshipCumPlacementLetter';
import { AutoReviveAppointmentLetter } from './AutoReviveAppointmentLetter';
import { AutoReviveGenericDocument } from './AutoReviveGenericDocument';

interface Props {
  activeDoc: DocumentType;
  docData: DocumentData;
  internshipData: DocumentData;
  currentActiveData: DocumentData;
  signature: SignatureData;
  spacingLevel: number;
  zoomLevel: number;
  isEditMode: boolean;
  onToggleEditMode: () => void;
}

export const DocumentPreviewPanel: React.FC<Props> = ({
  activeDoc,
  docData,
  internshipData,
  currentActiveData,
  signature,
  spacingLevel,
  zoomLevel,
  isEditMode,
  onToggleEditMode,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col min-w-0">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4 no-print select-none">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900">
            Document Preview
          </h2>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
            Live Preview
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>Ref: <strong className="font-mono text-slate-800">{currentActiveData.refNo}</strong></span>
          <span className="text-slate-300">|</span>
          <span>Date: <strong className="text-slate-800">{currentActiveData.issueDate}</strong></span>
          {!isEditMode && (
            <>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={onToggleEditMode}
                className="text-[#EA580C] hover:underline font-bold cursor-pointer"
              >
                Edit Fields
              </button>
            </>
          )}
        </div>
      </div>

      {/* Framed Document A4 Preview Area with Clean Scroll */}
      <div className="w-full flex-1 overflow-x-auto overflow-y-auto max-h-[780px] bg-slate-100/60 rounded-lg p-4 border border-slate-200/80 flex justify-center shadow-inner">
        <div 
          id="document-print-area"
          className="zoom-wrapper flex justify-center origin-top"
          style={{ zoom: `${zoomLevel}%` }}
        >
          {(activeDoc === 'offer_letter' || activeDoc === 'autorevive_offer') && (
            <AutoReviveOfferLetter
              data={docData}
              signature={signature}
              spacingLevel={spacingLevel}
            />
          )}

          {(activeDoc === 'internship_letter' || activeDoc === 'autorevive_internship') && (
            <AutoReviveInternshipLetter
              data={internshipData}
              signature={signature}
              spacingLevel={spacingLevel}
              isCumPlacement={false}
            />
          )}

          {activeDoc === 'internship_cum_placement' && (
            <AutoReviveInternshipCumPlacementLetter
              data={internshipData}
              signature={signature}
              spacingLevel={spacingLevel}
            />
          )}

          {(activeDoc === 'appointment_letter' || activeDoc === 'autorevive_appointment') && (
            <AutoReviveAppointmentLetter
              data={docData}
              signature={signature}
              spacingLevel={spacingLevel}
            />
          )}

          {(activeDoc === 'internship_completion_certificate' ||
            activeDoc === 'appreciation_certificate' ||
            activeDoc === 'relieving_letter' ||
            activeDoc === 'stipend_certificate' ||
            activeDoc === 'employment_certificate') && (
            <AutoReviveGenericDocument
              docType={activeDoc}
              data={currentActiveData}
              signature={signature}
              spacingLevel={spacingLevel}
            />
          )}
        </div>
      </div>
    </div>
  );
};
