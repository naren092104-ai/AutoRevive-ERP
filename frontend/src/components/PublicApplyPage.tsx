import React, { useEffect, useState } from 'react';
import { AutoReviveLogo } from './AutoReviveLogo';
import { 
  Briefcase, 
  MapPin, 
  Building, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft,
  User,
  Home,
  GraduationCap,
  Sparkles,
  Link as LinkIcon,
  FileCheck,
  Users2,
  ShieldCheck,
  Check,
  Calendar,
  Phone,
  Mail,
  Printer
} from 'lucide-react';
import { apiUrl } from '../api/client';

export const PublicApplyPage: React.FC<{ token: string; onBackToLogin?: () => void }> = ({ token, onBackToLogin }) => {
  const [vacancy, setVacancy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    applicationId: string;
    candidateId: string;
    jobTitle: string;
    fullName: string;
    appliedDate: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Two-step flow: 1. Overview & Rounds reading -> 2. 10-Section Form
  const [currentStep, setCurrentStep] = useState<'overview' | 'form'>('overview');
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);

  // 1. Personal Information
  const [personal, setPersonal] = useState({
    full_name: '',
    email: '',
    mobile: '+91 ',
    alternate_phone: '',
    dob: '',
    gender: 'Male',
    father_or_spouse_name: '',
    blood_group: 'O+',
    marital_status: 'Single',
  });

  // 2. Address
  const [address, setAddress] = useState({
    current_address: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
    same_as_current: true,
    permanent_address: '',
  });

  // 3. Education
  const [education, setEducation] = useState({
    highest_qualification: 'B.E / B.Tech',
    course: 'Automobile Engineering',
    institution: '',
    passing_year: '2025',
    percentage_cgpa: '8.2 CGPA',
    school_10th: '',
    board_10th: 'State Board',
    year_10th: '2019',
    percentage_10th: '86%',
    institution_12th: '',
    board_12th: 'State Board / Polytechnic',
    year_12th: '2021',
    percentage_12th: '84%',
  });

  // 4. Experience Details (Fresher vs Experienced)
  const [expType, setExpType] = useState<'Fresher' | 'Experienced'>('Fresher');
  const [experience, setExperience] = useState({
    total_experience_years: 0,
    total_experience_months: 0,
    current_company: '',
    current_designation: '',
    current_ctc: '',
    expected_salary: '₹ 4.5 - 5.5 LPA',
    notice_period: 'Immediate',
    reason_for_change: '',
    academic_projects: '',
  });

  // 5. Skills
  const [skills, setSkills] = useState({
    primary_skills: '',
    secondary_skills: '',
    technical_tools: '',
    languages: 'English, Tamil',
  });

  // 6. Job Preferences
  const [preferences, setPreferences] = useState({
    preferred_location: 'Uthangarai, Krishnagiri',
    preferred_shift: 'General Shift (09:15 AM - 06:00 PM)',
    expected_joining_date: '03/11/2026',
    willing_to_relocate: true,
  });

  // 7. Professional Links
  const [links, setLinks] = useState({
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
  });

  // 8. Resume & Supporting Documents (Base64)
  const [docs, setDocs] = useState<{
    resume_name: string;
    resume_base64: string;
    id_proof_name: string;
    id_proof_base64: string;
    marksheet_10th_name: string;
    marksheet_10th_base64: string;
    marksheet_12th_name: string;
    marksheet_12th_base64: string;
    degree_cert_name: string;
    degree_cert_base64: string;
    experience_letter_name: string;
    experience_letter_base64: string;
    payslip_name: string;
    payslip_base64: string;
    photo_name: string;
    photo_base64: string;
  }>({
    resume_name: '',
    resume_base64: '',
    id_proof_name: '',
    id_proof_base64: '',
    marksheet_10th_name: '',
    marksheet_10th_base64: '',
    marksheet_12th_name: '',
    marksheet_12th_base64: '',
    degree_cert_name: '',
    degree_cert_base64: '',
    experience_letter_name: '',
    experience_letter_base64: '',
    payslip_name: '',
    payslip_base64: '',
    photo_name: '',
    photo_base64: '',
  });

  // 9. References (Optional)
  const [references, setReferences] = useState({
    ref1_name: '',
    ref1_designation: '',
    ref1_company: '',
    ref1_phone: '',
    ref1_email: '',
  });

  // 10. Declaration & Consent
  const [declaration, setDeclaration] = useState({
    confirmed: false,
    consent: false,
    signature_name: '',
    date: new Date().toLocaleDateString('en-GB'),
  });

  useEffect(() => {
    fetch(apiUrl(`/recruitment/vacancies/${token}/public`))
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.vacancy) {
          setVacancy(d.vacancy);
          if (d.vacancy.experience_level === 'Experienced') {
            setExpType('Experienced');
          } else if (d.vacancy.experience_level === 'Fresher') {
            setExpType('Fresher');
          }
        } else {
          setError(d.message || 'Job vacancy not found or expired.');
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  const handleFileUpload = (fieldPrefix: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDocs((prev) => ({
        ...prev,
        [`${fieldPrefix}_name`]: file.name,
        [`${fieldPrefix}_base64`]: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declaration.confirmed || !declaration.consent) {
      setError('Please review and check both declaration and consent checkboxes before submitting.');
      return;
    }
    if (!docs.resume_base64) {
      setError('Resume / Curriculum Vitae is required. Please upload your resume.');
      return;
    }
    if (expType === 'Experienced' && !docs.experience_letter_base64 && !docs.payslip_base64) {
      // Prompt if experienced but no proof
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        vacancy_id: vacancy?.id,
        job_title: vacancy?.title || 'Applied Position',
        ...personal,
        ...address,
        permanent_address: address.same_as_current ? address.current_address : address.permanent_address,
        highest_qualification: education.highest_qualification,
        course: education.course,
        institution: education.institution,
        passing_year: education.passing_year,
        percentage_cgpa: education.percentage_cgpa,
        education_records: education,
        experience_type: expType,
        total_experience: expType === 'Fresher' ? '0 Years' : `${experience.total_experience_years} Years ${experience.total_experience_months} Months`,
        total_experience_years: expType === 'Fresher' ? 0 : Number(experience.total_experience_years),
        total_experience_months: expType === 'Fresher' ? 0 : Number(experience.total_experience_months),
        current_company: experience.current_company,
        current_designation: experience.current_designation,
        current_ctc: experience.current_ctc,
        expected_salary: experience.expected_salary,
        notice_period: experience.notice_period,
        reason_for_change: experience.reason_for_change,
        work_history: expType === 'Experienced' ? experience : { academic_projects: experience.academic_projects },
        ...skills,
        ...preferences,
        ...links,
        ...docs,
        references_data: references,
        declaration_confirmed: declaration.confirmed,
        recruitment_consent: declaration.consent,
        signature_name: declaration.signature_name || personal.full_name,
        declaration_date: declaration.date,
      };

      const res = await fetch(apiUrl('/recruitment/apply'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'We could not submit your application. Please verify your form.');
      }

      setSubmissionResult({
        applicationId: data.applicationId,
        candidateId: data.candidateId,
        jobTitle: data.jobTitle || vacancy?.title,
        fullName: data.fullName || personal.full_name,
        appliedDate: data.appliedDate || new Date().toLocaleDateString('en-GB'),
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err?.message || 'Submission failed. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#EA580C]" />
      </div>
    );
  }

  // Success Confirmation Screen
  if (submissionResult) {
    return (
      <div className="min-h-screen bg-slate-100/70 p-4 sm:p-8 font-sans">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center justify-between">
            <AutoReviveLogo size="sm" showSubText={true} />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-8 sm:p-10 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Application Submitted Successfully!</h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Thank you, <strong>{submissionResult.fullName}</strong>. Your application for <strong>{submissionResult.jobTitle}</strong> has been safely recorded in AutoRevive's HR recruitment system.
              </p>
            </div>

            {/* Official Registration Reference Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left space-y-3 font-sans text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <p className="text-[10.5px] font-bold text-slate-400 uppercase">Official Application ID</p>
                  <p className="text-base font-mono font-bold text-[#EA580C] mt-0.5">{submissionResult.applicationId}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <p className="text-[10.5px] font-bold text-slate-400 uppercase">Permanent Candidate ID</p>
                  <p className="text-base font-mono font-bold text-slate-800 mt-0.5">{submissionResult.candidateId}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex flex-wrap justify-between text-[11px] text-slate-600">
                <span>Applied Position: <strong>{submissionResult.jobTitle}</strong></span>
                <span>Submission Date: <strong>{submissionResult.appliedDate}</strong></span>
              </div>
            </div>

            <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
              An acknowledgment confirmation email has been dispatched to <strong>{personal.email}</strong>. Our Talent Acquisition team will review your credentials and reach out for screening and interview scheduling.
            </p>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Application Receipt</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 p-4 sm:p-8 font-sans antialiased text-slate-900">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <AutoReviveLogo size="sm" showSubText={true} />
          <div className="flex items-center gap-3">
            {currentStep === 'form' && (
              <button
                type="button"
                onClick={() => {
                  setCurrentStep('overview');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#EA580C] px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Review Job Details &amp; Rounds</span>
              </button>
            )}
          </div>
        </div>

        {/* Step Indicator */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex items-center justify-between text-xs font-semibold">
          <div className={`flex items-center gap-2 ${currentStep === 'overview' ? 'text-[#EA580C]' : 'text-emerald-600'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${currentStep === 'overview' ? 'bg-[#EA580C] text-white' : 'bg-emerald-100 text-emerald-700'}`}>
              {currentStep === 'form' ? '✓' : '1'}
            </span>
            <span>Step 1: Job Details &amp; Interview Rounds</span>
          </div>

          <div className="h-0.5 w-12 sm:w-24 bg-slate-200 mx-2" />

          <div className={`flex items-center gap-2 ${currentStep === 'form' ? 'text-[#EA580C]' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${currentStep === 'form' ? 'bg-[#EA580C] text-white' : 'bg-slate-200 text-slate-600'}`}>
              2
            </span>
            <span>Step 2: Candidate Profile &amp; Documents</span>
          </div>
        </div>

        {/* =========================================================================
            STEP 1: COMPREHENSIVE JOB OVERVIEW, INTERVIEW ROUNDS & TERMS READING
           ========================================================================= */}
        {currentStep === 'overview' && vacancy && (
          <div className="space-y-6 animate-in fade-in">
            {/* Vacancy Overview Banner */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-[#EA580C] border border-orange-200 uppercase">
                    {vacancy.employment_type || 'Full Time'} Requisition • {vacancy.job_id || 'AR-JOB'}
                  </span>
                  <h1 className="text-2xl font-bold text-slate-900 mt-2">{vacancy.title}</h1>
                  <p className="text-xs text-slate-500 mt-0.5">{vacancy.department} • {vacancy.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-mono font-bold text-[#EA580C]">{vacancy.salary_range}</p>
                  <p className="text-[11px] text-slate-400">Openings: {vacancy.openings} Positions</p>
                </div>
              </div>

              {/* Key Role Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Experience Required</p>
                  <p className="font-bold text-slate-800 mt-0.5">{vacancy.experience_required || '1 - 3 Years'}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Track Accepted</p>
                  <p className="font-bold text-slate-800 mt-0.5">{vacancy.experience_level || 'Fresher & Experienced'}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Education Criteria</p>
                  <p className="font-bold text-slate-800 mt-0.5 truncate">{vacancy.qualification || 'B.E / B.Tech / Graduate'}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Work Model</p>
                  <p className="font-bold text-slate-800 mt-0.5">{vacancy.work_model || 'On-site (Uthangarai HQ)'}</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Role Overview &amp; Responsibilities</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {vacancy.description || 'AutoRevive is expanding its core engineering and operations workforce. You will be responsible for diagnostic workflows, platform reliability, client systems integration, and automotive technical evaluations.'}
                </p>
              </div>

              {vacancy.skills && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Key Skills &amp; Competencies</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {vacancy.skills.split(',').map((s: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Structured Multi-Round Selection & Interview Process */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                  Recruitment Evaluation Roadmap
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-1.5">Selection &amp; Interview Process (What to Expect)</h2>
                <p className="text-xs text-slate-500">Please review each evaluation phase below before proceeding to the application form.</p>
              </div>

              {(() => {
                const defaultRounds = [
                  { round: 1, title: 'Round 1: Document Screening & Profile Verification', description: 'HR verifies basic eligibility, academic percentages, ID proofs, and experience match. Once passed, candidate status transitions to Screening Completed.' },
                  { round: 2, title: 'Round 2: Technical Competency & Diagnostic Assessment', description: 'Conducted via Google Meet or on-site by technical leads. In-depth questions on core domain skills, diagnostics, and problem solving.' },
                  { round: 3, title: 'Round 3: Final Leadership & Shortlist Approval', description: 'Interview completion review with HR Manager and Leadership. When both screening and interview rounds are passed, candidate is officially marked SHORTLISTED.' },
                  { round: 4, title: 'Round 4: Offer Letter & Employee Enrollment', description: 'Official employment offer generated with digital acceptance link and Appointment Letter.' },
                ];

                let roundsToRender = defaultRounds;
                if (vacancy.interview_rounds) {
                  try {
                    const parsed = typeof vacancy.interview_rounds === 'string' ? JSON.parse(vacancy.interview_rounds) : vacancy.interview_rounds;
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      roundsToRender = parsed;
                    }
                  } catch (e) {}
                }

                let docsToRender = [
                  'Current Resume / CV (PDF or Word)',
                  'Highest Degree / Provisional Certificate',
                  'Government ID Proof (Aadhaar / PAN Card)',
                  'Experience Letter & Recent Payslip (If Experienced)'
                ];
                if (vacancy.mandatory_documents) {
                  try {
                    const parsedDocs = typeof vacancy.mandatory_documents === 'string' ? JSON.parse(vacancy.mandatory_documents) : vacancy.mandatory_documents;
                    if (Array.isArray(parsedDocs) && parsedDocs.length > 0) {
                      docsToRender = parsedDocs;
                    }
                  } catch (e) {}
                }

                const colorPalette = [
                  { bg: 'bg-orange-100', text: 'text-[#EA580C]' },
                  { bg: 'bg-purple-100', text: 'text-purple-700' },
                  { bg: 'bg-blue-100', text: 'text-blue-700' },
                  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
                ];

                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {roundsToRender.map((r: any, idx: number) => {
                        const style = colorPalette[idx % colorPalette.length];
                        return (
                          <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-full ${style.bg} ${style.text} font-bold flex items-center justify-center text-xs shrink-0`}>
                                {r.round || idx + 1}
                              </span>
                              <h3 className="font-bold text-slate-900 text-xs">{r.title || `Round ${idx + 1}`}</h3>
                            </div>
                            <p className="text-slate-600 text-[11.5px] pl-8 leading-relaxed">
                              {r.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Documents Checklist Box */}
                    <div className="p-4 bg-orange-50/40 border border-orange-200/80 rounded-xl text-xs space-y-2">
                      <p className="font-bold text-[#EA580C] uppercase text-[11px]">Documents You Must Have Ready to Apply</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                        {docsToRender.map((doc: string, idx: number) => (
                          <p key={idx}>✓ {doc}</p>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Mandatory Agreement Checkbox */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <label className="flex items-start gap-2.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasAgreedToTerms}
                    onChange={(e) => setHasAgreedToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#EA580C] rounded border-slate-300 focus:ring-[#EA580C] cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-800 leading-snug">
                    I have thoroughly read and understood all job requirements, interview rounds, and selection criteria. I confirm that I meet the eligibility conditions and wish to proceed to fill my application.
                  </span>
                </label>

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={!hasAgreedToTerms}
                    onClick={() => {
                      setCurrentStep('form');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-2 px-8 py-3 bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold text-xs rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>Proceed to Fill Application Form</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: COMPREHENSIVE 10-SECTION CANDIDATE APPLICATION FORM
           ========================================================================= */}
        {currentStep === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2.5 shadow-2xs animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* =========================================================================
              SECTION 1: PERSONAL INFORMATION
             ========================================================================= */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-[#EA580C]" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">1. Personal Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Narendhar Dhandapani"
                  value={personal.full_name}
                  onChange={(e) => setPersonal({ ...personal, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-[#EA580C]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. naren@example.com"
                  value={personal.email}
                  onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-[#EA580C]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Primary Mobile Contact *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 94426 93306"
                  value={personal.mobile}
                  onChange={(e) => setPersonal({ ...personal, mobile: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-[#EA580C]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Alternate Phone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98401 23456"
                  value={personal.alternate_phone}
                  onChange={(e) => setPersonal({ ...personal, alternate_phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date of Birth (DOB) *</label>
                <input
                  type="date"
                  required
                  value={personal.dob}
                  onChange={(e) => setPersonal({ ...personal, dob: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Gender *</label>
                <select
                  value={personal.gender}
                  onChange={(e) => setPersonal({ ...personal, gender: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Father's / Spouse's Name</label>
                <input
                  type="text"
                  placeholder="Guardian / Father Name"
                  value={personal.father_or_spouse_name}
                  onChange={(e) => setPersonal({ ...personal, father_or_spouse_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Blood Group</label>
                <select
                  value={personal.blood_group}
                  onChange={(e) => setPersonal({ ...personal, blood_group: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Marital Status</label>
                <select
                  value={personal.marital_status}
                  onChange={(e) => setPersonal({ ...personal, marital_status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                </select>
              </div>
            </div>
          </div>

          {/* =========================================================================
              SECTION 2: ADDRESS
             ========================================================================= */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Home className="w-4 h-4 text-[#EA580C]" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">2. Address &amp; Location</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Current Residential Address *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Door No, Street Name, Locality, Area"
                  value={address.current_address}
                  onChange={(e) => setAddress({ ...address, current_address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">City / District *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Krishnagiri"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    placeholder="635207"
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={address.same_as_current}
                    onChange={(e) => setAddress({ ...address, same_as_current: e.target.checked })}
                    className="w-4 h-4 text-[#EA580C] rounded border-slate-300 focus:ring-[#EA580C]"
                  />
                  <span>Permanent Address is identical to Current Address</span>
                </label>

                {!address.same_as_current && (
                  <div className="mt-3">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Permanent Address *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Permanent family address"
                      value={address.permanent_address}
                      onChange={(e) => setAddress({ ...address, permanent_address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* =========================================================================
              SECTION 3: EDUCATION DETAILS
             ========================================================================= */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <GraduationCap className="w-4 h-4 text-[#EA580C]" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">3. Education &amp; Academic Qualifications</h2>
            </div>

            <div className="space-y-4 text-xs">
              {/* Highest Degree */}
              <div className="p-3.5 bg-orange-50/40 border border-orange-200/70 rounded-xl space-y-3">
                <p className="text-[11px] font-bold text-[#EA580C] uppercase">Highest / Graduation Degree</p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">Degree Level *</label>
                    <input
                      type="text"
                      required
                      value={education.highest_qualification}
                      onChange={(e) => setEducation({ ...education, highest_qualification: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">Branch / Course *</label>
                    <input
                      type="text"
                      required
                      value={education.course}
                      onChange={(e) => setEducation({ ...education, course: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">Passing Year *</label>
                    <input
                      type="text"
                      required
                      value={education.passing_year}
                      onChange={(e) => setEducation({ ...education, passing_year: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">Percentage / CGPA *</label>
                    <input
                      type="text"
                      required
                      value={education.percentage_cgpa}
                      onChange={(e) => setEducation({ ...education, percentage_cgpa: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-[#EA580C]"
                    />
                  </div>
                </div>
              </div>

              {/* 10th & 12th details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <p className="text-[10.5px] font-bold text-slate-700 uppercase">Secondary (10th / SSLC)</p>
                  <input
                    type="text"
                    placeholder="School Name"
                    value={education.school_10th}
                    onChange={(e) => setEducation({ ...education, school_10th: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs mb-1"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Year (e.g. 2019)"
                      value={education.year_10th}
                      onChange={(e) => setEducation({ ...education, year_10th: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Score (e.g. 85%)"
                      value={education.percentage_10th}
                      onChange={(e) => setEducation({ ...education, percentage_10th: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <p className="text-[10.5px] font-bold text-slate-700 uppercase">Higher Secondary (12th / Diploma)</p>
                  <input
                    type="text"
                    placeholder="Junior College / Polytechnic Name"
                    value={education.institution_12th}
                    onChange={(e) => setEducation({ ...education, institution_12th: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs mb-1"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Year (e.g. 2021)"
                      value={education.year_12th}
                      onChange={(e) => setEducation({ ...education, year_12th: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Score (e.g. 82%)"
                      value={education.percentage_12th}
                      onChange={(e) => setEducation({ ...education, percentage_12th: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              SECTION 4: EXPERIENCE DETAILS (DYNAMIC FRESHER / EXPERIENCED)
             ========================================================================= */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#EA580C]" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">4. Work Experience Track</h2>
              </div>

              {/* Track Selector */}
              <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setExpType('Fresher')}
                  className={`px-3.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    expType === 'Fresher' ? 'bg-white text-[#EA580C] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Fresher
                </button>
                <button
                  type="button"
                  onClick={() => setExpType('Experienced')}
                  className={`px-3.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    expType === 'Experienced' ? 'bg-white text-[#EA580C] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Experienced
                </button>
              </div>
            </div>

            {expType === 'Fresher' ? (
              /* Fresher Track */
              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3 text-xs">
                <p className="font-semibold text-blue-900">
                  🎓 You have selected the <strong>Fresher</strong> track. Previous company experience and pay slips are optional.
                </p>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Academic Projects, Capstone Project &amp; Internship Training
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe your final year engineering/diploma project, vehicle teardown labs, or college internship..."
                    value={experience.academic_projects}
                    onChange={(e) => setExperience({ ...experience, academic_projects: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            ) : (
              /* Experienced Track */
              <div className="space-y-4 text-xs animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Total Experience (Years) *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={experience.total_experience_years}
                      onChange={(e) => setExperience({ ...experience, total_experience_years: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Additional Months</label>
                    <input
                      type="number"
                      min="0"
                      max="11"
                      value={experience.total_experience_months}
                      onChange={(e) => setExperience({ ...experience, total_experience_months: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Notice Period *</label>
                    <select
                      value={experience.notice_period}
                      onChange={(e) => setExperience({ ...experience, notice_period: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    >
                      <option value="Immediate">Immediate</option>
                      <option value="15 Days">15 Days</option>
                      <option value="30 Days">30 Days</option>
                      <option value="60 Days">60 Days</option>
                      <option value="90 Days">90 Days</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Current / Most Recent Employer *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mahindra Auto / Bosch Services"
                      value={experience.current_company}
                      onChange={(e) => setExperience({ ...experience, current_company: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Current Designation *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Inspection Specialist / Service Advisor"
                      value={experience.current_designation}
                      onChange={(e) => setExperience({ ...experience, current_designation: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Current Annual CTC (₹)</label>
                    <input
                      type="text"
                      placeholder="e.g. ₹ 4,20,000"
                      value={experience.current_ctc}
                      onChange={(e) => setExperience({ ...experience, current_ctc: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Expected Annual CTC (₹) *</label>
                    <input
                      type="text"
                      required
                      value={experience.expected_salary}
                      onChange={(e) => setExperience({ ...experience, expected_salary: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-[#EA580C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Reason for Change</label>
                  <input
                    type="text"
                    placeholder="Seeking career progression and challenging opportunities"
                    value={experience.reason_for_change}
                    onChange={(e) => setExperience({ ...experience, reason_for_change: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* =========================================================================
              SECTION 5: SKILLS
             ========================================================================= */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-4 h-4 text-[#EA580C]" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">5. Skills &amp; Proficiencies</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Primary Core Skills *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engine Diagnostics, OBD-II Scanning, Vehicle Inspection"
                  value={skills.primary_skills}
                  onChange={(e) => setSkills({ ...skills, primary_skills: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Secondary / Domain Skills</label>
                <input
                  type="text"
                  placeholder="e.g. Paint Thickness Gauge, Customer Relation, Negotiation"
                  value={skills.secondary_skills}
                  onChange={(e) => setSkills({ ...skills, secondary_skills: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Software Tools / Technologies</label>
                <input
                  type="text"
                  placeholder="e.g. MS Excel, SAP, Diagnostic Scanner Pro, AutoCAD"
                  value={skills.technical_tools}
                  onChange={(e) => setSkills({ ...skills, technical_tools: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Languages Known</label>
                <input
                  type="text"
                  value={skills.languages}
                  onChange={(e) => setSkills({ ...skills, languages: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* =========================================================================
              SECTION 6: JOB PREFERENCES
             ========================================================================= */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin className="w-4 h-4 text-[#EA580C]" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">6. Job Preferences</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Preferred Location</label>
                <select
                  value={preferences.preferred_location}
                  onChange={(e) => setPreferences({ ...preferences, preferred_location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Uthangarai, Krishnagiri">Uthangarai, Krishnagiri (HQ)</option>
                  <option value="Krishnagiri / Hybrid">Krishnagiri / Hybrid</option>
                  <option value="Chennai Hub">Chennai Hub</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Preferred Shift</label>
                <select
                  value={preferences.preferred_shift}
                  onChange={(e) => setPreferences({ ...preferences, preferred_shift: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="General Shift (09:15 AM - 06:00 PM)">General Shift (09:15 AM - 06:00 PM)</option>
                  <option value="Morning Shift (07:00 AM - 03:30 PM)">Morning Shift (07:00 AM - 03:30 PM)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Joining Date</label>
                <input
                  type="text"
                  value={preferences.expected_joining_date}
                  onChange={(e) => setPreferences({ ...preferences, expected_joining_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* =========================================================================
              SECTION 7: PROFESSIONAL LINKS
             ========================================================================= */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <LinkIcon className="w-4 h-4 text-[#EA580C]" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">7. Professional Links (Optional)</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">LinkedIn Profile</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={links.linkedin_url}
                  onChange={(e) => setLinks({ ...links, linkedin_url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">GitHub / Code Profile</label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={links.github_url}
                  onChange={(e) => setLinks({ ...links, github_url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Portfolio / Personal Website</label>
                <input
                  type="url"
                  placeholder="https://myportfolio.dev"
                  value={links.portfolio_url}
                  onChange={(e) => setLinks({ ...links, portfolio_url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* =========================================================================
              SECTION 8: RESUME & SUPPORTING DOCUMENTS
             ========================================================================= */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#EA580C]" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">8. Resume &amp; Supporting Documents</h2>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Supported: PDF, DOC, DOCX, PNG (Max 15MB)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Primary Resume Upload */}
              <div className="sm:col-span-2 border-2 border-dashed border-orange-300 bg-orange-50/20 rounded-xl p-5 text-center relative hover:bg-orange-50/40 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload('resume')}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-8 h-8 text-[#EA580C] mx-auto mb-2" />
                <p className="font-bold text-slate-900 text-sm">
                  {docs.resume_name ? docs.resume_name : 'Click or Drag to Upload Official Resume / CV *'}
                </p>
                <p className="text-[10.5px] text-slate-500 mt-1">
                  {docs.resume_name ? '✓ Resume loaded ready for submission' : 'Mandatory document for candidate screening'}
                </p>
              </div>

              {/* ID Proof (Aadhaar / PAN) */}
              <div className="border border-dashed border-slate-300 rounded-xl p-3.5 bg-slate-50/60 relative">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileUpload('id_proof')}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <p className="font-bold text-slate-800 text-xs">Government ID Proof (Aadhaar / PAN)</p>
                <p className="text-[10.5px] text-slate-500 mt-0.5 truncate">
                  {docs.id_proof_name ? `✓ ${docs.id_proof_name}` : 'Click to attach ID Proof (PDF/Image)'}
                </p>
              </div>

              {/* Highest Degree Certificate */}
              <div className="border border-dashed border-slate-300 rounded-xl p-3.5 bg-slate-50/60 relative">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileUpload('degree_cert')}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <p className="font-bold text-slate-800 text-xs">Highest Degree / Provisional Certificate</p>
                <p className="text-[10.5px] text-slate-500 mt-0.5 truncate">
                  {docs.degree_cert_name ? `✓ ${docs.degree_cert_name}` : 'Click to attach Degree Certificate'}
                </p>
              </div>

              {/* If Experienced: Experience Letter & Payslip */}
              {expType === 'Experienced' && (
                <>
                  <div className="border border-dashed border-slate-300 rounded-xl p-3.5 bg-slate-50/60 relative">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileUpload('experience_letter')}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <p className="font-bold text-slate-800 text-xs">Experience / Relieving Letter *</p>
                    <p className="text-[10.5px] text-slate-500 mt-0.5 truncate">
                      {docs.experience_letter_name ? `✓ ${docs.experience_letter_name}` : 'Click to attach Experience Certificate'}
                    </p>
                  </div>

                  <div className="border border-dashed border-slate-300 rounded-xl p-3.5 bg-slate-50/60 relative">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileUpload('payslip')}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <p className="font-bold text-slate-800 text-xs">Recent Salary Payslip *</p>
                    <p className="text-[10.5px] text-slate-500 mt-0.5 truncate">
                      {docs.payslip_name ? `✓ ${docs.payslip_name}` : 'Click to attach Recent Payslip (PDF)'}
                    </p>
                  </div>
                </>
              )}

              {/* Photo */}
              <div className="border border-dashed border-slate-300 rounded-xl p-3.5 bg-slate-50/60 relative">
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={handleFileUpload('photo')}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <p className="font-bold text-slate-800 text-xs">Candidate Passport Photograph</p>
                <p className="text-[10.5px] text-slate-500 mt-0.5 truncate">
                  {docs.photo_name ? `✓ ${docs.photo_name}` : 'Click to attach formal portrait photo'}
                </p>
              </div>
            </div>
          </div>

          {/* =========================================================================
              SECTION 9: REFERENCES (OPTIONAL)
             ========================================================================= */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Users2 className="w-4 h-4 text-[#EA580C]" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">9. Professional References (Optional)</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">Referee Full Name</label>
                <input
                  type="text"
                  placeholder="Manager / Professor Name"
                  value={references.ref1_name}
                  onChange={(e) => setReferences({ ...references, ref1_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">Designation &amp; Organization</label>
                <input
                  type="text"
                  placeholder="Senior Manager, AutoRevive"
                  value={references.ref1_designation}
                  onChange={(e) => setReferences({ ...references, ref1_designation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">Contact Phone / Mobile</label>
                <input
                  type="text"
                  placeholder="+91 94426 93306"
                  value={references.ref1_phone}
                  onChange={(e) => setReferences({ ...references, ref1_phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* =========================================================================
              SECTION 10: DECLARATION & RECRUITMENT CONSENT
             ========================================================================= */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-[#EA580C]" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">10. Declaration &amp; Recruitment Consent</h2>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={declaration.confirmed}
                  onChange={(e) => setDeclaration({ ...declaration, confirmed: e.target.checked })}
                  className="mt-0.5 w-4 h-4 text-[#EA580C] rounded border-slate-300 focus:ring-[#EA580C]"
                />
                <span className="text-slate-700 leading-snug">
                  I hereby solemnly declare that all statements, credentials, and attachments submitted in this application are true, genuine, and complete to the best of my knowledge. I understand that any false representation will result in immediate disqualification or termination of employment.
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={declaration.consent}
                  onChange={(e) => setDeclaration({ ...declaration, consent: e.target.checked })}
                  className="mt-0.5 w-4 h-4 text-[#EA580C] rounded border-slate-300 focus:ring-[#EA580C]"
                />
                <span className="text-slate-700 leading-snug">
                  I consent to AutoRevive collecting, storing, and evaluating my personal data for recruitment screening, aptitude assessments, and official background verification protocols.
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Electronic Signature (Full Name) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Type your full legal name as digital signature"
                    value={declaration.signature_name}
                    onChange={(e) => setDeclaration({ ...declaration, signature_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Submission Date</label>
                  <input
                    type="text"
                    readOnly
                    value={declaration.date}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-600"
                  />
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">All information is securely encrypted and processed by AutoRevive.</span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold text-xs rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Submit Official Application</span>
              </button>
            </div>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
