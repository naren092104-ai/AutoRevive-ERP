import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Mail, 
  Settings, 
  FileText, 
  Paperclip, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Server, 
  ShieldCheck, 
  Key, 
  Eye, 
  EyeOff, 
  History, 
  Sparkles, 
  ExternalLink,
  Info,
  Clock,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DocumentData, DocumentType, SignatureData } from '../types';
import { generatePdfBase64 } from '../utils/pdfExport';
import { apiUrl } from '../api/client';

interface SmtpSettings {
  host: string;
  port: string | number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

interface SentEmailRecord {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  documentType: string;
  status: 'sent' | 'failed';
  messageId?: string;
  error?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  documentData: DocumentData;
  activeDoc: DocumentType;
  signature: SignatureData;
}

export const EmailDispatchSlider: React.FC<Props> = ({
  isOpen,
  onClose,
  documentData,
  activeDoc,
  signature,
}) => {
  const [activeTab, setActiveTab] = useState<'compose' | 'smtp' | 'history'>('compose');
  const [draftTone, setDraftTone] = useState<'official' | 'welcoming' | 'urgent'>('official');
  
  // Email Compose State
  const [toEmail, setToEmail] = useState(documentData.candidateEmail || 'narendhardan@gmail.com');
  const [ccEmail, setCcEmail] = useState('hr@autorevives.com, careers@autorevives.com');
  const [bccEmail, setBccEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // SMTP Settings State
  const [smtpConfig, setSmtpConfig] = useState<SmtpSettings>({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    fromName: 'AutoRevive HR Department',
    fromEmail: 'hr@autorevives.com',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // Sending State
  const [isSending, setIsSending] = useState(false);
  const [sendingStage, setSendingStage] = useState('');
  const [sendSuccess, setSendSuccess] = useState<boolean | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // History State
  const [sentHistory, setSentHistory] = useState<SentEmailRecord[]>([]);

  // Load stored SMTP settings and History from localStorage on mount
  useEffect(() => {
    try {
      const savedSmtp = localStorage.getItem('autorevive_smtp_settings');
      if (savedSmtp) {
        setSmtpConfig(JSON.parse(savedSmtp));
      }
      const savedHistory = localStorage.getItem('autorevive_sent_history');
      if (savedHistory) {
        setSentHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.warn('Error loading localStorage:', e);
    }
  }, []);

  // Save SMTP settings to localStorage whenever changed
  const handleSaveSmtp = (updated: SmtpSettings) => {
    setSmtpConfig(updated);
    try {
      localStorage.setItem('autorevive_smtp_settings', JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving SMTP settings:', e);
    }
  };

  // Sync recipient email if documentData changes
  useEffect(() => {
    if (documentData.candidateEmail) {
      setToEmail(documentData.candidateEmail);
    }
  }, [documentData.candidateEmail]);

  // Document Title formatting
  const getDocName = () => {
    switch (activeDoc) {
      case 'autorevive_offer':
        return 'Offer of Employment Letter';
      case 'autorevive_appointment':
        return 'Official Appointment Letter';
      case 'autorevive_internship':
        return 'Internship Offer Letter';
      default:
        return 'Official Employment Document';
    }
  };

  const getPdfFilename = () => {
    const cleanName = (documentData.candidateName || 'Candidate').replace(/\s+/g, '_');
    switch (activeDoc) {
      case 'autorevive_offer':
        return `AutoRevive_Offer_Letter_${cleanName}.pdf`;
      case 'autorevive_appointment':
        return `AutoRevive_Appointment_Letter_${cleanName}.pdf`;
      case 'autorevive_internship':
        return `AutoRevive_Internship_Letter_${cleanName}.pdf`;
      default:
        return `AutoRevive_Document_${cleanName}.pdf`;
    }
  };

  // Auto-generate high quality Corporate HR email drafts
  const generateDraft = (tone: 'official' | 'welcoming' | 'urgent' = draftTone) => {
    const annualCTC = `₹${(documentData.salary.totalCTCAnnual || 503688).toLocaleString('en-IN')}`;
    const monthlyCTC = `₹${(documentData.salary.totalCTCMonthly || 41974).toLocaleString('en-IN')}`;
    const candidateName = documentData.candidateName || 'Candidate';
    const jobTitle = documentData.jobTitle || 'Executive / Specialist';
    const joiningDate = documentData.joiningDate || 'Immediate';
    const validityDate = documentData.offerValidityDate || 'within 15 days';
    const location = documentData.workLocation || documentData.baseLocation || 'Krishnagiri / Tamil Nadu';
    const hrName = documentData.hrName || 'Jemsina Banu';
    const hrTitle = documentData.hrTitle || 'Head of Human Resources';
    const refNo = documentData.refNo || 'ARV/HR/2026/OFF-8842';

    let draftSubject = '';
    let draftBody = '';

    if (activeDoc === 'autorevive_offer') {
      if (tone === 'official') {
        draftSubject = `Offer of Employment: ${jobTitle} - ${candidateName} | AutoRevive [Ref: ${refNo}]`;
        draftBody = `
<p>Dear <strong>${candidateName}</strong>,</p>

<p>We are pleased to extend this formal offer of employment for the position of <strong>${jobTitle}</strong> with <strong>AutoRevive</strong> (Ref: <code>${refNo}</code>).</p>

<p>Following your technical assessments and subsequent interview discussions, our leadership team was thoroughly impressed with your domain expertise and alignment with our organizational objectives.</p>

<div style="background-color: #FFF7ED; border-left: 4px solid #EA580C; padding: 12px 16px; margin: 16px 0; border-radius: 4px; font-family: sans-serif;">
  <p style="margin: 0 0 6px 0; font-weight: bold; color: #EA580C; font-size: 14px;">Key Offer Summary:</p>
  <ul style="margin: 0; padding-left: 20px; color: #334155; line-height: 1.6; font-size: 13px;">
    <li><strong>Designation:</strong> ${jobTitle}</li>
    <li><strong>Department:</strong> ${documentData.department}</li>
    <li><strong>Place of Posting:</strong> ${location}</li>
    <li><strong>Total Cost to Company (CTC):</strong> <span style="color: #EA580C; font-weight: bold;">${annualCTC} per annum</span> (${monthlyCTC} / month)</li>
    <li><strong>Target Date of Joining:</strong> ${joiningDate}</li>
    <li><strong>Offer Validity:</strong> Valid until ${validityDate}</li>
  </ul>
</div>

<p>Please find attached the official <strong>Letter of Offer of Employment (with complete Remuneration Annexure A)</strong> in PDF format for your review.</p>

<p><strong>Action Required:</strong></p>
<ol style="line-height: 1.6; color: #334155;">
  <li>Carefully review the terms, conditions, and remuneration breakdown outlined in the attached PDF.</li>
  <li>Sign the duplicate copy (digitally or physically) and return the accepted copy by replying to this email on or before <strong>${validityDate}</strong>.</li>
  <li>Keep self-attested copies of the onboarding checklist documents ready for submission prior to your joining date.</li>
</ol>

<p>Should you require any clarifications regarding your compensation structure or onboarding schedule, please do not hesitate to reach out to us.</p>

<p>We look forward to welcoming you to the AutoRevive team and building a mutually rewarding career together.</p>

<br/>
<p style="margin-bottom: 2px;">Yours sincerely,</p>
<p style="margin-top: 0; font-weight: bold; color: #EA580C;">For AutoRevive</p>
<p style="margin: 0; font-weight: bold; color: #0F172A;">${hrName}</p>
<p style="margin: 0; color: #64748B; font-size: 12px;">${hrTitle}</p>
<p style="margin: 0; color: #64748B; font-size: 12px;">AutoRevive • Krishnagiri – 635207, Tamil Nadu, India</p>
<p style="margin: 4px 0 0 0; color: #64748B; font-size: 11px;">🌐 www.autorevives.com | ✉️ hr@autorevives.com | 📞 +91 9442693306</p>
`;
      } else if (tone === 'welcoming') {
        draftSubject = `Welcome to the Team! Offer Letter for ${jobTitle} - ${candidateName} 🎉`;
        draftBody = `
<p>Dear <strong>${candidateName}</strong>,</p>

<p>On behalf of everyone at <strong>AutoRevive</strong>, it gives us immense pleasure to welcome you to our family as our new <strong>${jobTitle}</strong>!</p>

<p>Your passion and vision stood out during our interview rounds, and we are confident that your contributions will play a pivotal role in accelerating our vehicle recovery, auction platforms, and technology operations.</p>

<div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 14px; margin: 16px 0; border-radius: 6px;">
  <p style="margin: 0 0 8px 0; font-weight: bold; color: #0F172A;">Highlights of Your Offer:</p>
  <p style="margin: 4px 0; color: #334155;">💼 <strong>Role:</strong> ${jobTitle} (${documentData.department})</p>
  <p style="margin: 4px 0; color: #334155;">💰 <strong>Annual Remuneration:</strong> <strong style="color: #EA580C;">${annualCTC}</strong></p>
  <p style="margin: 4px 0; color: #334155;">📅 <strong>Date of Joining:</strong> ${joiningDate}</p>
  <p style="margin: 4px 0; color: #334155;">📍 <strong>Office Base:</strong> ${location}</p>
</div>

<p>Your official Offer Letter and Detailed Compensation Schedule (Annexure A) are attached as a PDF with this email.</p>

<p>Please review and sign the document and send us your confirmation at your earliest convenience so our team can prepare your welcome workstation and onboarding kit.</p>

<p>We are thrilled to embark on this journey with you!</p>

<br/>
<p style="margin: 0; font-weight: bold; color: #0F172A;">Warm regards,</p>
<p style="margin: 2px 0 0 0; font-weight: bold; color: #EA580C;">${hrName}</p>
<p style="margin: 0; color: #64748B; font-size: 12px;">${hrTitle} | AutoRevive</p>
`;
      } else {
        // Urgent / expedited
        draftSubject = `ACTION REQUIRED: Offer of Employment - ${jobTitle} | AutoRevive [Expiring ${validityDate}]`;
        draftBody = `
<p>Dear <strong>${candidateName}</strong>,</p>

<p>This is a formal communication regarding your employment offer for the role of <strong>${jobTitle}</strong> at <strong>AutoRevive</strong> (Ref: <code>${refNo}</code>).</p>

<p>Please note that this offer is time-sensitive and stands valid until <strong>${validityDate}</strong> for a planned joining date of <strong>${joiningDate}</strong>.</p>

<p><strong>Offer Highlights:</strong></p>
<ul>
  <li><strong>Designation:</strong> ${jobTitle}</li>
  <li><strong>Annual CTC:</strong> ${annualCTC}</li>
  <li><strong>Location:</strong> ${location}</li>
</ul>

<p>Please find the official offer document attached. Kindly sign and return the acceptance copy immediately to finalize your induction schedule and seat allocation.</p>

<br/>
<p style="margin: 0; font-weight: bold;">HR Department | AutoRevive</p>
<p style="margin: 0; color: #64748B; font-size: 12px;">hr@autorevives.com | +91 9442693306</p>
`;
      }
    } else if (activeDoc === 'autorevive_appointment') {
      draftSubject = `Appointment Letter & Welcome to AutoRevive: ${candidateName} (Emp ID: ${documentData.employeeId || 'ARV-2026-088'})`;
      draftBody = `
<p>Dear <strong>${candidateName}</strong>,</p>

<p>Welcome to <strong>AutoRevive</strong>! We are pleased to formally confirm your appointment as <strong>${jobTitle}</strong> in the <strong>${documentData.department}</strong> department, effective from your date of joining <strong>${joiningDate}</strong>.</p>

<p>Your Employee ID is <strong>${documentData.employeeId || 'ARV-2026-088'}</strong>.</p>

<p>Enclosed with this email is your official <strong>Appointment Letter</strong> detailing your service rules, probation guidelines, compensation breakdown, and standard operating standards.</p>

<p>Please keep a signed copy of this document for your personal records.</p>

<br/>
<p style="margin: 0; font-weight: bold; color: #EA580C;">For AutoRevive</p>
<p style="margin: 0; font-weight: bold;">${hrName}</p>
<p style="margin: 0; color: #64748B; font-size: 12px;">${hrTitle}</p>
`;
    } else {
      // Internship
      draftSubject = `Internship Offer Letter: ${jobTitle} - ${candidateName} | AutoRevive`;
      draftBody = `
<p>Dear <strong>${candidateName}</strong>,</p>

<p>Congratulations! We are delighted to offer you an Internship position as <strong>${jobTitle}</strong> with <strong>AutoRevive</strong>.</p>

<p><strong>Internship Details:</strong></p>
<ul>
  <li><strong>Stipend:</strong> ${documentData.stipendAmount || '₹15,000 / month'}</li>
  <li><strong>Start Date:</strong> ${documentData.internshipStartDate || joiningDate}</li>
  <li><strong>Duration:</strong> ${documentData.internshipEndDate ? `Until ${documentData.internshipEndDate}` : '3 Months'}</li>
  <li><strong>Location:</strong> ${location}</li>
</ul>

<p>Please find attached your official Internship Offer Letter. We look forward to mentoring you and having a productive learning experience together.</p>

<br/>
<p style="margin: 0; font-weight: bold; color: #EA580C;">For AutoRevive</p>
<p style="margin: 0; font-weight: bold;">${hrName}</p>
<p style="margin: 0; color: #64748B; font-size: 12px;">${hrTitle}</p>
`;
    }

    setSubject(draftSubject);
    setBodyHtml(draftBody.trim());
  };

  // Generate initial draft on drawer open or doc switch
  useEffect(() => {
    if (isOpen) {
      generateDraft(draftTone);
      setSendSuccess(null);
      setSendError(null);
    }
  }, [isOpen, activeDoc, documentData, draftTone]);

  // Preset Providers for SMTP
  const handleApplyPreset = (preset: 'gmail' | 'outlook' | 'zoho') => {
    if (preset === 'gmail') {
      const updated = {
        ...smtpConfig,
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
      };
      handleSaveSmtp(updated);
    } else if (preset === 'outlook') {
      const updated = {
        ...smtpConfig,
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
      };
      handleSaveSmtp(updated);
    } else if (preset === 'zoho') {
      const updated = {
        ...smtpConfig,
        host: 'smtp.zoho.com',
        port: 465,
        secure: true,
      };
      handleSaveSmtp(updated);
    }
    setSmtpTestResult(null);
  };

  // Test SMTP Connection API call
  const handleTestSmtpConnection = async () => {
    if (!smtpConfig.user || !smtpConfig.pass) {
      setSmtpTestResult({
        success: false,
        message: 'Please enter your SMTP Username / Email and Password before testing.',
      });
      return;
    }

    setIsTestingSmtp(true);
    setSmtpTestResult(null);

    try {
      const res = await fetch(apiUrl('/email/test-smtp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: smtpConfig.host,
          port: Number(smtpConfig.port),
          secure: smtpConfig.secure,
          user: smtpConfig.user,
          pass: smtpConfig.pass,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSmtpTestResult({
          success: true,
          message: data.message || 'Connected successfully to SMTP server!',
        });
      } else {
        setSmtpTestResult({
          success: false,
          message: data.message || 'Failed to authenticate with SMTP server.',
        });
      }
    } catch (err: any) {
      setSmtpTestResult({
        success: false,
        message: err?.message || 'Network error while contacting backend SMTP test API.',
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  // Dispatch Email with attached PDF
  const handleSendEmail = async () => {
    if (!toEmail) {
      setSendError('Please provide a valid recipient email address.');
      return;
    }
    if (!subject) {
      setSendError('Please provide an email subject line.');
      return;
    }
    if (!smtpConfig.user || !smtpConfig.pass) {
      setSendError('SMTP credentials missing. Please open the "SMTP Server Settings" tab and enter your SMTP User and App Password.');
      setActiveTab('smtp');
      return;
    }

    setIsSending(true);
    setSendSuccess(null);
    setSendError(null);

    try {
      // Step 1: Render high-definition PDF
      setSendingStage('📄 Generating high-resolution A4 PDF document...');
      const pdfBase64 = await generatePdfBase64('document-print-area', (curr, total, msg) => {
        setSendingStage(`📄 ${msg}`);
      });

      if (!pdfBase64) {
        throw new Error('Failed to render PDF document. Please make sure the document preview is loaded.');
      }

      // Step 2: Transmit via SMTP API
      setSendingStage('🔌 Authenticating with SMTP server and transmitting email...');
      const pdfFilename = getPdfFilename();

      const response = await fetch(apiUrl('/email/send'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toEmail,
          cc: ccEmail || undefined,
          bcc: bccEmail || undefined,
          subject,
          html: bodyHtml,
          fromName: smtpConfig.fromName || 'AutoRevive HR Department',
          fromEmail: smtpConfig.fromEmail || smtpConfig.user,
          attachments: [
            {
              filename: pdfFilename,
              content: pdfBase64,
              contentType: 'application/pdf',
            },
          ],
          smtpConfig: {
            host: smtpConfig.host,
            port: Number(smtpConfig.port),
            secure: smtpConfig.secure,
            user: smtpConfig.user,
            pass: smtpConfig.pass,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'SMTP Server rejected the email dispatch request.');
      }

      // Step 3: Success!
      setSendSuccess(true);
      setSendingStage('✅ Email delivered successfully with PDF attachment!');

      // Trigger Confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#EA580C', '#FB923C', '#22C55E', '#0F172A'],
      });

      // Record to history
      const newRecord: SentEmailRecord = {
        id: `send_${Date.now()}`,
        timestamp: new Date().toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        recipient: toEmail,
        subject,
        documentType: getDocName(),
        status: 'sent',
        messageId: result.messageId,
      };

      const updatedHistory = [newRecord, ...sentHistory];
      setSentHistory(updatedHistory);
      localStorage.setItem('autorevive_sent_history', JSON.stringify(updatedHistory));
    } catch (error: any) {
      console.error('Send error:', error);
      setSendSuccess(false);
      setSendError(error?.message || 'Failed to dispatch email. Please check your SMTP settings.');
      
      // Record failed attempt
      const failRecord: SentEmailRecord = {
        id: `send_${Date.now()}`,
        timestamp: new Date().toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        recipient: toEmail,
        subject,
        documentType: getDocName(),
        status: 'failed',
        error: error?.message || 'Unknown error',
      };
      const updatedHistory = [failRecord, ...sentHistory];
      setSentHistory(updatedHistory);
      localStorage.setItem('autorevive_sent_history', JSON.stringify(updatedHistory));
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-Over Drawer Panel */}
      <div className="relative z-10 w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        
        {/* Top Drawer Header */}
        <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EA580C] flex items-center justify-center text-white shadow-md">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-sans">
                  Email &amp; SMTP Dispatcher
                </h2>
                <span className="bg-[#EA580C]/30 text-orange-400 border border-orange-500/40 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  PDF Attached
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auto-draft corporate email &amp; transmit via SMTP with attached A4 PDF
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('compose')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'compose'
                ? 'border-[#EA580C] text-[#EA580C] bg-white rounded-t-md shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Compose &amp; Draft</span>
          </button>

          <button
            onClick={() => setActiveTab('smtp')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'smtp'
                ? 'border-[#EA580C] text-[#EA580C] bg-white rounded-t-md shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>SMTP Server Settings</span>
            {smtpConfig.user ? (
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" title="Configured" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" title="Needs Setup" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-[#EA580C] text-[#EA580C] bg-white rounded-t-md shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Sent History ({sentHistory.length})</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* ============================================================= */}
          {/* TAB 1: COMPOSE & DRAFT */}
          {/* ============================================================= */}
          {activeTab === 'compose' && (
            <div className="space-y-4">
              
              {/* Draft Presets & Quick Re-draft Toolbar */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#EA580C]" />
                  <span className="text-xs font-bold text-slate-800">Auto-Draft Tone:</span>
                  <div className="inline-flex rounded-md shadow-2xs bg-white border border-slate-200 p-0.5">
                    <button
                      onClick={() => { setDraftTone('official'); generateDraft('official'); }}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                        draftTone === 'official'
                          ? 'bg-[#EA580C] text-white'
                          : 'text-slate-600 hover:text-slate-950'
                      }`}
                    >
                      Official Corporate
                    </button>
                    <button
                      onClick={() => { setDraftTone('welcoming'); generateDraft('welcoming'); }}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                        draftTone === 'welcoming'
                          ? 'bg-[#EA580C] text-white'
                          : 'text-slate-600 hover:text-slate-950'
                      }`}
                    >
                      Warm &amp; Welcoming
                    </button>
                    <button
                      onClick={() => { setDraftTone('urgent'); generateDraft('urgent'); }}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded ${
                        draftTone === 'urgent'
                          ? 'bg-[#EA580C] text-white'
                          : 'text-slate-600 hover:text-slate-950'
                      }`}
                    >
                      Urgent Action
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => generateDraft(draftTone)}
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-[#EA580C] font-medium transition-colors"
                  title="Re-generate email draft with current document values"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>
              </div>

              {/* Recipient Fields */}
              <div className="space-y-3 bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
                
                {/* To Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>Recipient Email (To) <span className="text-red-500">*</span></span>
                    <span className="text-[11px] font-normal text-slate-500">Candidate: {documentData.candidateName}</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={toEmail}
                      onChange={(e) => setToEmail(e.target.value)}
                      placeholder="e.g. candidate@example.com"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-[#EA580C] focus:border-[#EA580C] font-mono text-slate-900 bg-white"
                    />
                  </div>
                </div>

                {/* CC & BCC */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      CC Emails
                    </label>
                    <input
                      type="text"
                      value={ccEmail}
                      onChange={(e) => setCcEmail(e.target.value)}
                      placeholder="e.g. hr@autorevives.com"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-[#EA580C] font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      BCC Emails (Optional)
                    </label>
                    <input
                      type="text"
                      value={bccEmail}
                      onChange={(e) => setBccEmail(e.target.value)}
                      placeholder="e.g. archive@autorevives.com"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-[#EA580C] font-mono text-slate-800"
                    />
                  </div>
                </div>

                {/* Subject Line */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Subject Line <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject line..."
                    className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-md focus:ring-2 focus:ring-[#EA580C] text-slate-950 bg-white"
                  />
                </div>
              </div>

              {/* Attached PDF Live File Card */}
              <div className="bg-orange-50/80 border border-orange-200 rounded-lg p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#EA580C] flex items-center justify-center text-white shadow-2xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {getPdfFilename()}
                      </span>
                      <span className="bg-orange-200 text-orange-900 text-[10px] font-bold px-1.5 py-0.2 rounded">
                        Auto Attached
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      High-Definition A4 Vector PDF • Contains full document pages, stamps &amp; digital signatures
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[#EA580C]">
                  <Paperclip className="w-4 h-4" />
                </div>
              </div>

              {/* Email Body Editor / Preview */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Email Body Content (HTML)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="text-xs text-slate-600 hover:text-[#EA580C] font-semibold transition-colors flex items-center gap-1"
                    >
                      {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPreview ? 'Edit Source' : 'Visual Preview'}</span>
                    </button>
                  </div>
                </div>

                {showPreview ? (
                  <div 
                    className="p-4 text-xs text-slate-800 leading-relaxed max-h-72 overflow-y-auto bg-white"
                    dangerouslySetInnerHTML={{ __html: bodyHtml }}
                  />
                ) : (
                  <textarea
                    rows={10}
                    value={bodyHtml}
                    onChange={(e) => setBodyHtml(e.target.value)}
                    className="w-full p-4 text-xs font-mono text-slate-800 focus:ring-0 focus:outline-hidden border-none resize-y"
                    placeholder="Enter email HTML body..."
                  />
                )}
              </div>

              {/* Status or Errors */}
              {sendError && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-lg text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <strong className="font-bold">Error Dispatching Email:</strong>
                    <p className="mt-0.5">{sendError}</p>
                  </div>
                </div>
              )}

              {sendSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-800 p-3.5 rounded-lg text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Email Sent Successfully!</strong>
                    <p className="mt-0.5">
                      The official document PDF was attached and delivered to <strong>{toEmail}</strong> via your SMTP server.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB 2: SMTP SERVER SETTINGS */}
          {/* ============================================================= */}
          {activeTab === 'smtp' && (
            <div className="space-y-4">
              
              {/* Quick Provider Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Quick Provider Presets
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleApplyPreset('gmail')}
                    className={`p-2.5 text-left border rounded-lg transition-all ${
                      smtpConfig.host === 'smtp.gmail.com'
                        ? 'border-[#EA580C] bg-orange-50/50 ring-1 ring-[#EA580C]'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className="font-bold text-xs text-slate-900">Google / Gmail</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">smtp.gmail.com:587</p>
                  </button>

                  <button
                    onClick={() => handleApplyPreset('outlook')}
                    className={`p-2.5 text-left border rounded-lg transition-all ${
                      smtpConfig.host === 'smtp.office365.com'
                        ? 'border-[#EA580C] bg-orange-50/50 ring-1 ring-[#EA580C]'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className="font-bold text-xs text-slate-900">Microsoft 365</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">office365.com:587</p>
                  </button>

                  <button
                    onClick={() => handleApplyPreset('zoho')}
                    className={`p-2.5 text-left border rounded-lg transition-all ${
                      smtpConfig.host === 'smtp.zoho.com'
                        ? 'border-[#EA580C] bg-orange-50/50 ring-1 ring-[#EA580C]'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className="font-bold text-xs text-slate-900">Zoho Mail</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">smtp.zoho.com:465</p>
                  </button>
                </div>
              </div>

              {/* SMTP Credentials Form */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3.5 shadow-2xs">
                
                {/* Host & Port */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      SMTP Host Server <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={smtpConfig.host}
                      onChange={(e) => handleSaveSmtp({ ...smtpConfig, host: e.target.value })}
                      placeholder="smtp.gmail.com"
                      className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-md focus:ring-2 focus:ring-[#EA580C] text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Port <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={smtpConfig.port}
                      onChange={(e) => handleSaveSmtp({ ...smtpConfig, port: e.target.value })}
                      placeholder="587"
                      className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-md focus:ring-2 focus:ring-[#EA580C] text-slate-900"
                    />
                  </div>
                </div>

                {/* Secure SSL/TLS Toggle */}
                <div className="flex items-center justify-between py-1 border-y border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Use Secure SSL / TLS</p>
                    <p className="text-[11px] text-slate-500">Enable for Port 465 (Direct SSL); Disable for Port 587 (STARTTLS)</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={smtpConfig.secure}
                    onChange={(e) => handleSaveSmtp({ ...smtpConfig, secure: e.target.checked })}
                    className="w-4 h-4 text-[#EA580C] rounded focus:ring-[#EA580C]"
                  />
                </div>

                {/* SMTP Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    SMTP Username / Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={smtpConfig.user}
                    onChange={(e) => handleSaveSmtp({ ...smtpConfig, user: e.target.value })}
                    placeholder="e.g. hr@autorevives.com or your email"
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-md focus:ring-2 focus:ring-[#EA580C] text-slate-900"
                  />
                </div>

                {/* SMTP Password / App Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex justify-between">
                    <span>SMTP Password / App Password <span className="text-red-500">*</span></span>
                    <span className="text-[11px] font-normal text-slate-500">16-char App Password recommended</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={smtpConfig.pass}
                      onChange={(e) => handleSaveSmtp({ ...smtpConfig, pass: e.target.value })}
                      placeholder="••••••••••••••••"
                      className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-md focus:ring-2 focus:ring-[#EA580C] pr-9 text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Sender Display Name & From Address */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sender Name
                    </label>
                    <input
                      type="text"
                      value={smtpConfig.fromName}
                      onChange={(e) => handleSaveSmtp({ ...smtpConfig, fromName: e.target.value })}
                      placeholder="AutoRevive HR Department"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-[#EA580C] text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sender Email (From)
                    </label>
                    <input
                      type="email"
                      value={smtpConfig.fromEmail}
                      onChange={(e) => handleSaveSmtp({ ...smtpConfig, fromEmail: e.target.value })}
                      placeholder="hr@autorevives.com"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-[#EA580C] text-slate-900"
                    />
                  </div>
                </div>

                {/* Test Connection Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleTestSmtpConnection}
                    disabled={isTestingSmtp}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-colors"
                  >
                    {isTestingSmtp ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#EA580C]" />
                        <span>Verifying SMTP Credentials...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-green-600" />
                        <span>Test SMTP Connection</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Test Results Banner */}
                {smtpTestResult && (
                  <div className={`p-3 rounded-lg text-xs flex items-start gap-2.5 ${
                    smtpTestResult.success 
                      ? 'bg-green-50 border border-green-200 text-green-800' 
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    {smtpTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <strong className="font-bold">
                        {smtpTestResult.success ? 'SMTP Connection Succeeded!' : 'Connection Test Failed'}
                      </strong>
                      <p className="mt-0.5 text-[11px]">{smtpTestResult.message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Helpful Gmail App Password Guide */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-900">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <Info className="w-4 h-4 text-amber-700" />
                  <span>Using Gmail as your SMTP server?</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  For Google / Gmail accounts, Google requires generating a <strong>16-character App Password</strong> rather than your standard account password:
                </p>
                <ol className="list-decimal pl-4 mt-1 space-y-0.5 text-[11px] text-amber-800">
                  <li>Enable 2-Step Verification on your Google Account.</li>
                  <li>Visit <strong>Google Account &gt; Security &gt; 2-Step Verification &gt; App passwords</strong>.</li>
                  <li>Create a new app password named &quot;AutoRevive HR&quot; and paste the 16 characters above.</li>
                </ol>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB 3: SENT HISTORY */}
          {/* ============================================================= */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {sentHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                  <Mail className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No emails sent yet</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Emails dispatched with PDF attachments will appear in this audit log.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {sentHistory.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-900">
                          {item.recipient}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'sent'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.status === 'sent' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Delivered</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              <span>Failed</span>
                            </>
                          )}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 font-medium truncate mb-1">
                        {item.subject}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.timestamp}
                        </span>
                        <span className="font-semibold text-slate-700">
                          {item.documentType}
                        </span>
                      </div>

                      {item.error && (
                        <p className="mt-1.5 text-[10px] text-red-600 bg-red-50 p-1.5 rounded">
                          {item.error}
                        </p>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => {
                      setSentHistory([]);
                      localStorage.removeItem('autorevive_sent_history');
                    }}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors block mx-auto pt-2"
                  >
                    Clear History Log
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Bottom Bar with Primary Action Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-md transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-3">
            {activeTab !== 'compose' && (
              <button
                onClick={() => setActiveTab('compose')}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                Back to Compose
              </button>
            )}

            <button
              onClick={handleSendEmail}
              disabled={isSending}
              className="px-6 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] disabled:bg-slate-400 text-white text-xs font-bold rounded-md flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{sendingStage || 'Transmitting Email with PDF...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Email with Attached PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
