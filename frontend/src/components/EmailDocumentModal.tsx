import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, Loader2, X, Paperclip, Send } from 'lucide-react';
import { apiUrl } from '../api/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  candidateName?: string;
  documentType: string;
  documentLabel: string;
  referenceNumber?: string;
  defaultEmail: string;
  onEmailSent?: () => void;
}

export const EmailDocumentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  employeeId,
  candidateName = 'Valued Candidate',
  documentType,
  documentLabel,
  referenceNumber = 'AR-HR-2026-0001',
  defaultEmail,
  onEmailSent,
}) => {
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail || '');
  const [subject, setSubject] = useState(`AutoRevive – Official ${documentLabel} – ${candidateName}`);
  const [body, setBody] = useState(
    `Dear ${candidateName},\n\nPlease find attached your official ${documentLabel} (Reference: ${referenceNumber}) issued by the Human Resources Department of AutoRevive.\n\nKindly review the document, sign where required, and return a signed copy for our records.\n\nIf you have any questions or require clarification, please contact the HR team at hr@autorevives.com or +91 9442693306.\n\nWarm regards,\nHuman Resources Department\nAutoRevive • Krishnagiri, Tamil Nadu`
  );
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    pdfAttached?: boolean;
    recipientEmail?: string;
  } | null>(null);

  // Attachment name formatted cleanly: [Employee Name]_[Document Type]_[Reference Number].pdf
  const safeName = candidateName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeType = documentLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeRef = referenceNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  const attachmentFilename = `${safeName}_${safeType}_${safeRef}.pdf`;

  useEffect(() => {
    setRecipientEmail(defaultEmail || '');
    setSubject(`AutoRevive – Official ${documentLabel} – ${candidateName}`);
    setBody(
      `Dear ${candidateName},\n\nPlease find attached your official ${documentLabel} (Reference: ${referenceNumber}) issued by the Human Resources Department of AutoRevive.\n\nKindly review the document, sign where required, and return a signed copy for our records.\n\nIf you have any questions or require clarification, please contact the HR team at hr@autorevives.com or +91 9442693306.\n\nWarm regards,\nHuman Resources Department\nAutoRevive • Krishnagiri, Tamil Nadu`
    );
    setResult(null);
  }, [defaultEmail, candidateName, documentLabel, referenceNumber, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !recipientEmail.trim()) {
      setResult({
        success: false,
        message: 'Recipient email address is required.',
      });
      return;
    }
    if (!subject.trim()) {
      setResult({
        success: false,
        message: 'Email subject is required.',
      });
      return;
    }

    setIsSending(true);
    setResult(null);

    try {
      const response = await fetch(apiUrl('/documents/email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          documentType,
          recipientEmail: recipientEmail.trim(),
          subject: subject.trim(),
          body: body.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: 'Document emailed successfully.',
          pdfAttached: true,
          recipientEmail: data.recipientEmail || recipientEmail.trim(),
        });
        onEmailSent?.();
      } else {
        setResult({
          success: false,
          message: data.message || data.error || 'Email could not be sent',
        });
      }
    } catch (err: unknown) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : 'Email dispatch failed.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div 
        className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-[#EA580C] text-white">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">Email Official Document</h3>
              <p className="text-[11px] text-slate-400">AutoRevive Human Resources Department</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSending}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSend} className="p-5 space-y-3.5 text-xs">
          {/* Metadata Summary Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500 block text-[9.5px] uppercase font-semibold">Candidate Name</span>
              <strong className="text-slate-900">{candidateName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[9.5px] uppercase font-semibold">Document Type</span>
              <strong className="text-slate-900">{documentLabel}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[9.5px] uppercase font-semibold">Document Reference</span>
              <strong className="text-slate-900 font-mono">{referenceNumber}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[9.5px] uppercase font-semibold">Attached File</span>
              <div className="flex items-center gap-1 text-[#EA580C] font-semibold truncate" title={attachmentFilename}>
                <Paperclip className="w-3 h-3 shrink-0" />
                <span className="truncate">{attachmentFilename}</span>
              </div>
            </div>
          </div>

          {/* Recipient Email */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Recipient Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              disabled={isSending}
              placeholder="candidate@example.com"
              className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-[#EA580C] font-medium"
            />
          </div>

          {/* Email Subject */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Email Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSending}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-[#EA580C] font-medium"
            />
          </div>

          {/* Email Body */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Email Message Body
            </label>
            <textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={isSending}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-[#EA580C] font-sans leading-relaxed text-xs resize-none"
            />
          </div>

          {/* Result Alert Message */}
          {result && (
            <div
              className={`p-3 rounded-lg border text-xs leading-relaxed ${
                result.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {result.success ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>✓ Document emailed successfully.</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 pl-5">
                    Delivered to: <span className="font-semibold">{result.recipientEmail}</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 pl-5">
                    Status: <span className="font-bold uppercase">SENT</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-red-800">✕ Email could not be sent</div>
                    <div className="text-[11px] text-red-700 mt-0.5">{result.message}</div>
                    <div className="text-[10.5px] text-slate-500 mt-1">Status: <span className="font-bold uppercase text-red-600">FAILED</span></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="bg-slate-50 border-t border-slate-200 -mx-5 -mb-5 px-5 py-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors cursor-pointer"
            >
              {result?.success ? 'Close' : 'Cancel'}
            </button>
            
            {!result?.success && (
              <button
                type="submit"
                disabled={isSending}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#EA580C] hover:bg-[#c2410c] rounded-md transition-colors shadow-xs disabled:opacity-70 cursor-pointer"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending Document...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Document</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
