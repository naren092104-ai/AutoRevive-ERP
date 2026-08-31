import React, { useEffect, useState } from 'react';
import { AutoReviveLogo } from './AutoReviveLogo';
import { CheckCircle2, AlertCircle, Loader2, Upload, X, Briefcase } from 'lucide-react';
import { apiUrl } from '../api/client';

interface UploadedDoc {
  name: string;
  base64: string;
  size: string;
}

export const PublicOfferAcceptPage: React.FC<{ token: string }> = ({ token }) => {
  const [candidate, setCandidate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [joiningDate, setJoiningDate] = useState('03/11/2026');
  
  // KYC & Bank Data Details for Payroll
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  // KYC File Uploads (Images or PDFs)
  const [aadhaarDoc, setAadhaarDoc] = useState<UploadedDoc | null>(null);
  const [panDoc, setPanDoc] = useState<UploadedDoc | null>(null);
  const [passbookDoc, setPassbookDoc] = useState<UploadedDoc | null>(null);

  // Experience Documents (For experienced candidates)
  const [hasExperience, setHasExperience] = useState(false);
  const [experienceLetterDoc, setExperienceLetterDoc] = useState<UploadedDoc | null>(null);
  const [previousPayslipsDoc, setPreviousPayslipsDoc] = useState<UploadedDoc | null>(null);

  // In-Page Document Preview Modal
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    title: string;
    url: string;
    isPdf: boolean;
  }>({
    isOpen: false,
    title: '',
    url: '',
    isPdf: false,
  });

  const [termsAgreed, setTermsAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiUrl(`/offers/accept/${token}`))
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.candidate) {
          setCandidate(d.candidate);
          if (d.candidate.expected_joining_date) {
            setJoiningDate(d.candidate.expected_joining_date);
          }
          if (d.candidate.aadhaar_number) setAadhaarNumber(d.candidate.aadhaar_number);
          if (d.candidate.pan_number) setPanNumber(d.candidate.pan_number);
          if (d.candidate.bank_name) setBankName(d.candidate.bank_name);
          if (d.candidate.account_number) {
            setAccountNumber(d.candidate.account_number);
            setConfirmAccountNumber(d.candidate.account_number);
          }
          if (d.candidate.ifsc_code) setIfscCode(d.candidate.ifsc_code);
          if (d.candidate.offer_status === 'ACCEPTED') {
            setAccepted(true);
          }
          // If candidate marked having prior experience
          if (
            (d.candidate.total_experience && d.candidate.total_experience !== '0 Years' && d.candidate.total_experience !== 'Fresher') ||
            (d.candidate.experience_type && d.candidate.experience_type.toLowerCase().includes('experienced'))
          ) {
            setHasExperience(true);
          }
        } else {
          setError(d.message || 'Offer not found or link has expired.');
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (doc: UploadedDoc | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError(`File ${file.name} exceeds 15MB size limit. Please upload a smaller file.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      setter({
        name: file.name,
        base64: reader.result as string,
        size: sizeStr,
      });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenPreview = (title: string, doc: UploadedDoc | null) => {
    if (!doc) return;
    const isPdf = doc.name.toLowerCase().endsWith('.pdf') || doc.base64.includes('application/pdf');
    let previewUrl = doc.base64;
    try {
      const parts = doc.base64.split(',');
      const base64Str = parts[1] || parts[0];
      const mime = isPdf ? 'application/pdf' : (doc.base64.match(/data:([^;]+);/)?.[1] || 'image/png');
      const binaryStr = atob(base64Str);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mime });
      previewUrl = URL.createObjectURL(blob);
    } catch (e) {
      console.warn('Blob conversion fallback', e);
    }

    setPreviewModal({
      isOpen: true,
      title: `${title} (${doc.name})`,
      url: previewUrl,
      isPdf,
    });
  };

  const handleDecision = async (action: 'ACCEPT' | 'REJECT') => {
    if (action === 'ACCEPT') {
      if (!termsAgreed) {
        setError('Please review and check the confirmation checkbox before accepting.');
        return;
      }
      const cleanAadhaar = aadhaarNumber.replace(/\s+/g, '');
      if (!cleanAadhaar || cleanAadhaar.length < 12) {
        setError('Please provide a valid 12-digit Aadhaar Number.');
        return;
      }
      if (!panNumber.trim() || panNumber.trim().length !== 10) {
        setError('Please provide a valid 10-character PAN Card Number (e.g. ABCDE1234F).');
        return;
      }
      if (!accountNumber.trim()) {
        setError('Please enter your Bank Account Number for salary disbursement.');
        return;
      }
      if (accountNumber.trim() !== confirmAccountNumber.trim()) {
        setError('Bank Account Number and Confirm Account Number do not match.');
        return;
      }
      if (!ifscCode.trim() || ifscCode.trim().length < 10) {
        setError('Please enter a valid 11-character Bank IFSC Code (e.g. HDFC0001234).');
        return;
      }
    }

    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch(apiUrl(`/offers/accept/${token}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action, 
          confirmedJoiningDate: joiningDate,
          aadhaarNumber: aadhaarNumber.trim(),
          panNumber: panNumber.trim().toUpperCase(),
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim().toUpperCase(),
          aadhaarDoc: aadhaarDoc ? { name: aadhaarDoc.name, base64: aadhaarDoc.base64 } : undefined,
          panDoc: panDoc ? { name: panDoc.name, base64: panDoc.base64 } : undefined,
          passbookDoc: passbookDoc ? { name: passbookDoc.name, base64: passbookDoc.base64 } : undefined,
          experienceLetterDoc: (hasExperience && experienceLetterDoc) ? { name: experienceLetterDoc.name, base64: experienceLetterDoc.base64 } : undefined,
          previousPayslipsDoc: (hasExperience && previousPayslipsDoc) ? { name: previousPayslipsDoc.name, base64: previousPayslipsDoc.base64 } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Action failed.');
      if (action === 'ACCEPT') {
        setAccepted(true);
      } else {
        setError('You have declined the employment offer.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to process offer decision.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#EA580C]" />
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg w-full text-center space-y-5 shadow-xs">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Offer Accepted &amp; KYC Submitted!</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Congratulations <strong>{candidate?.full_name}</strong>! You have officially accepted the employment offer for <strong>{candidate?.job_title}</strong> and submitted your verified KYC records.
          </p>
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs text-left">
            <div className="flex justify-between items-center border-b border-emerald-200 pb-1.5">
              <span className="font-semibold text-emerald-800">Confirmed Date of Joining:</span>
              <span className="font-mono font-bold text-emerald-950">{joiningDate}</span>
            </div>
            <div className="flex justify-between items-center border-b border-emerald-200 pb-1.5">
              <span className="font-semibold text-emerald-800">Salary Account Bank:</span>
              <span className="font-mono font-bold text-emerald-950">{bankName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-emerald-200 pb-1.5">
              <span className="font-semibold text-emerald-800">PAN &amp; Aadhaar Verified:</span>
              <span className="font-mono font-bold text-emerald-950">{panNumber}</span>
            </div>
            <div className="flex justify-between items-center pt-0.5">
              <span className="font-semibold text-emerald-800">Reporting Location:</span>
              <span className="font-bold text-emerald-950">{candidate?.preferred_location || 'Uthangarai, Krishnagiri'}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Your bank details, identity cards, and experience documents have been safely registered with the AutoRevive HR &amp; Payroll Master. Our team will generate and email your official <strong>Appointment Letter</strong> containing your <strong>Employee ID</strong> and portal login credentials.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 p-4 sm:p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center justify-between">
          <AutoReviveLogo size="sm" showSubText={true} />
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-[#EA580C] border border-orange-200 uppercase">
            Official Offer Confirmation &amp; KYC
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5 text-xs">
          <div className="border-b border-slate-100 pb-4">
            <h1 className="text-lg font-bold text-slate-900">Employment Offer Confirmation &amp; Mandatory KYC Onboarding</h1>
            <p className="text-xs text-slate-500">AutoRevive • Krishnagiri – 635207, Tamil Nadu</p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 border-b border-slate-200 pb-1.5">1. Proposed Employment Terms</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex justify-between"><span className="text-slate-500">Candidate Name:</span><span className="font-bold text-slate-900">{candidate?.full_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Offered Designation:</span><span className="font-bold text-slate-900">{candidate?.job_title}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Work Location:</span><span className="text-slate-800">{candidate?.preferred_location || 'Uthangarai, Krishnagiri'}</span></div>
              <div className="flex justify-between"><span className="text-slate-700 font-bold">Total Annual CTC:</span><span className="font-mono font-bold text-[#EA580C]">{candidate?.expected_salary || '₹ 5,00,000 / annum'}</span></div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <div>
                <span className="text-slate-700 font-bold block">Confirmed Joining Date:</span>
                <span className="text-[10.5px] text-slate-500">Target date to report for duty at AutoRevive</span>
              </div>
              <input
                type="text"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                placeholder="e.g. 03/11/2026"
                className="w-36 px-2.5 py-1 bg-white border border-slate-300 rounded-md font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#EA580C] text-right font-mono"
              />
            </div>
          </div>

          <div className="bg-orange-50/40 border border-orange-200 rounded-xl p-4 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>2. Statutory KYC Verification &amp; Bank Details (For Payslip Generation)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Please enter your ID numbers and upload clear scans (Image or PDF) of your PAN card, Aadhaar card, and Bank passbook/cancelled cheque.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700">PAN Card (Permanent Account Number) *</label>
                <input
                  type="text"
                  maxLength={10}
                  required
                  placeholder="e.g. ABCDE1234F"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-xs uppercase text-slate-900 focus:ring-1 focus:ring-[#EA580C]"
                />
                {!panDoc ? (
                  <div>
                    <input type="file" id="pan-upload" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => handleFileSelect(e, setPanDoc)} />
                    <label htmlFor="pan-upload" className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-lg cursor-pointer text-[11px] font-semibold text-slate-700 transition-colors">
                      <Upload className="w-3 h-3 text-[#EA580C]" /><span>Upload PAN Card (PDF / Image)</span>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs">
                    <div className="truncate"><p className="font-bold text-emerald-900 text-[10.5px] truncate">✓ {panDoc.name}</p><p className="text-[9.5px] text-emerald-700">{panDoc.size}</p></div>
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <button type="button" onClick={() => handleOpenPreview('PAN Card', panDoc)} className="px-2 py-0.5 bg-white border border-emerald-300 text-emerald-800 rounded text-[10px] font-bold cursor-pointer">View</button>
                      <button type="button" onClick={() => setPanDoc(null)} className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer">✕</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700">Aadhaar Number (12 Digits) *</label>
                <input
                  type="text"
                  maxLength={14}
                  required
                  placeholder="e.g. 4567 8901 2345"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-xs text-slate-900 focus:ring-1 focus:ring-[#EA580C]"
                />
                {!aadhaarDoc ? (
                  <div>
                    <input type="file" id="aadhaar-upload" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => handleFileSelect(e, setAadhaarDoc)} />
                    <label htmlFor="aadhaar-upload" className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-lg cursor-pointer text-[11px] font-semibold text-slate-700 transition-colors">
                      <Upload className="w-3 h-3 text-[#EA580C]" /><span>Upload Aadhaar Card (PDF / Image)</span>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs">
                    <div className="truncate"><p className="font-bold text-emerald-900 text-[10.5px] truncate">✓ {aadhaarDoc.name}</p><p className="text-[9.5px] text-emerald-700">{aadhaarDoc.size}</p></div>
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <button type="button" onClick={() => handleOpenPreview('Aadhaar Card', aadhaarDoc)} className="px-2 py-0.5 bg-white border border-emerald-300 text-emerald-800 rounded text-[10px] font-bold cursor-pointer">View</button>
                      <button type="button" onClick={() => setAadhaarDoc(null)} className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer">✕</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-[11px] font-bold text-slate-800">Bank Salary Account Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">Bank Name *</label>
                  <select value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-xs text-slate-900 focus:ring-1 focus:ring-[#EA580C]">
                    <option value="HDFC Bank">HDFC Bank</option><option value="State Bank of India">State Bank of India (SBI)</option><option value="ICICI Bank">ICICI Bank</option><option value="Axis Bank">Axis Bank</option><option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option><option value="Canara Bank">Canara Bank</option><option value="Punjab National Bank">Punjab National Bank</option><option value="Bank of Baroda">Bank of Baroda</option><option value="Indian Bank">Indian Bank</option><option value="Union Bank of India">Union Bank of India</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">Bank IFSC Code *</label>
                  <input type="text" maxLength={11} required placeholder="e.g. HDFC0001234" value={ifscCode} onChange={(e) => setIfscCode(e.target.value.toUpperCase())} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-xs uppercase text-slate-900 focus:ring-1 focus:ring-[#EA580C]" />
                </div>
                <div>
                  <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">Account Number *</label>
                  <input type="text" required placeholder="Enter Account Number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-xs text-slate-900 focus:ring-1 focus:ring-[#EA580C]" />
                </div>
                <div>
                  <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">Confirm Account Number *</label>
                  <input type="text" required placeholder="Re-enter Account Number" value={confirmAccountNumber} onChange={(e) => setConfirmAccountNumber(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-xs text-slate-900 focus:ring-1 focus:ring-[#EA580C]" />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[10.5px] font-semibold text-slate-700 mb-1.5">Bank Passbook Copy or Cancelled Cheque (Image or PDF)</label>
                {!passbookDoc ? (
                  <div>
                    <input type="file" id="passbook-upload" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => handleFileSelect(e, setPassbookDoc)} />
                    <label htmlFor="passbook-upload" className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-lg cursor-pointer text-xs font-semibold text-slate-700 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-[#EA580C]" /><span>Upload Passbook Front Page or Cancelled Cheque</span>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs">
                    <div className="truncate"><p className="font-bold text-emerald-900 text-[10.5px] truncate">✓ {passbookDoc.name}</p><p className="text-[9.5px] text-emerald-700">{passbookDoc.size}</p></div>
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <button type="button" onClick={() => handleOpenPreview('Bank Passbook / Cheque', passbookDoc)} className="px-2 py-0.5 bg-white border border-emerald-300 text-emerald-800 rounded text-[10px] font-bold cursor-pointer">View</button>
                      <button type="button" onClick={() => setPassbookDoc(null)} className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer">✕</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#EA580C]" />
                <h3 className="text-xs font-bold text-slate-900">3. Previous Work Experience Documents (If Applicable)</h3>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                <input type="checkbox" checked={hasExperience} onChange={(e) => setHasExperience(e.target.checked)} className="rounded border-slate-300 text-[#EA580C] focus:ring-[#EA580C]" />
                <span>I have prior work experience</span>
              </label>
            </div>

            {hasExperience ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-700">Previous Company Experience / Relieving Letter</label>
                  <p className="text-[10px] text-slate-400">Official service certificate from your last employer</p>
                  {!experienceLetterDoc ? (
                    <div>
                      <input type="file" id="exp-upload" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => handleFileSelect(e, setExperienceLetterDoc)} />
                      <label htmlFor="exp-upload" className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-lg cursor-pointer text-[11px] font-semibold text-slate-700 transition-colors">
                        <Upload className="w-3 h-3 text-[#EA580C]" /><span>Upload Relieving Letter (PDF / Image)</span>
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs">
                      <div className="truncate"><p className="font-bold text-emerald-900 text-[10.5px] truncate">✓ {experienceLetterDoc.name}</p><p className="text-[9.5px] text-emerald-700">{experienceLetterDoc.size}</p></div>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <button type="button" onClick={() => handleOpenPreview('Experience Letter', experienceLetterDoc)} className="px-2 py-0.5 bg-white border border-emerald-300 text-emerald-800 rounded text-[10px] font-bold cursor-pointer">View</button>
                        <button type="button" onClick={() => setExperienceLetterDoc(null)} className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer">✕</button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-700">Previous Company Old Payslips (Last 3 Months)</label>
                  <p className="text-[10px] text-slate-400">Previous salary statements for payroll compensation proof</p>
                  {!previousPayslipsDoc ? (
                    <div>
                      <input type="file" id="payslips-upload" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => handleFileSelect(e, setPreviousPayslipsDoc)} />
                      <label htmlFor="payslips-upload" className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-lg cursor-pointer text-[11px] font-semibold text-slate-700 transition-colors">
                        <Upload className="w-3 h-3 text-[#EA580C]" /><span>Upload Old Payslips (PDF / Image)</span>
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs">
                      <div className="truncate"><p className="font-bold text-emerald-900 text-[10.5px] truncate">✓ {previousPayslipsDoc.name}</p><p className="text-[9.5px] text-emerald-700">{previousPayslipsDoc.size}</p></div>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <button type="button" onClick={() => handleOpenPreview('Old Payslips', previousPayslipsDoc)} className="px-2 py-0.5 bg-white border border-emerald-300 text-emerald-800 rounded text-[10px] font-bold cursor-pointer">View</button>
                        <button type="button" onClick={() => setPreviousPayslipsDoc(null)} className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer">✕</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">Fresher candidate: No previous company experience letter or old payslips required.</p>
            )}
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-2.5 p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
              <input type="checkbox" checked={termsAgreed} onChange={(e) => setTermsAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 text-[#EA580C] rounded border-slate-300 focus:ring-[#EA580C]" />
              <span className="text-xs text-slate-700 leading-snug">
                I hereby formally confirm my acceptance of the employment offer with AutoRevive, agreeing to all corporate policies, confidentiality rules, and company bylaws. I solemnly declare that the Aadhaar, PAN, Bank, and Experience documents submitted above are genuine and true.
              </span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button type="button" disabled={isProcessing} onClick={() => handleDecision('REJECT')} className="px-4 py-2.5 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs transition-colors cursor-pointer">Decline Offer</button>
            <button type="button" disabled={isProcessing || !termsAgreed} onClick={() => handleDecision('ACCEPT')} className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50">
              {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Accept Offer &amp; Submit Complete KYC</span>
            </button>
          </div>
        </div>
      </div>

      {previewModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">{previewModal.title}</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.open(previewModal.url, '_blank')}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded text-[11px] cursor-pointer"
                >
                  ↗ Fullscreen / New Tab
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModal({ isOpen: false, title: '', url: '', isPdf: false })}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-100 min-h-[65vh]">
              {previewModal.isPdf ? (
                <iframe
                  src={previewModal.url}
                  title="Document Preview"
                  className="w-full h-[65vh] rounded-lg border border-slate-200 bg-white"
                />
              ) : (
                <img
                  src={previewModal.url}
                  alt={previewModal.title}
                  className="max-h-[65vh] max-w-full rounded-lg object-contain shadow-sm"
                />
              )}
            </div>
            <div className="p-3 border-t border-slate-200 flex justify-end bg-white">
              <button
                type="button"
                onClick={() => setPreviewModal({ isOpen: false, title: '', url: '', isPdf: false })}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
