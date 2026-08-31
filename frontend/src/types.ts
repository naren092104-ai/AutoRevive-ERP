export type DocumentType = 
  | 'offer_letter'
  | 'appointment_letter'
  | 'internship_letter'
  | 'internship_cum_placement'
  | 'internship_completion_certificate'
  | 'appreciation_certificate'
  | 'relieving_letter'
  | 'stipend_certificate'
  | 'employment_certificate'
  | 'autorevive_offer' 
  | 'autorevive_appointment' 
  | 'autorevive_internship';

export type DocumentStatus = 
  | 'Draft'
  | 'Created'
  | 'PDF Generated'
  | 'Sent'
  | 'Accepted'
  | 'Rejected'
  | 'Expired';

export interface StoredDocument {
  id: number;
  document_number: string;
  employee_id: string;
  full_name?: string;
  email?: string;
  mobile?: string;
  role?: string;
  department?: string;
  document_type: string;
  status?: DocumentStatus;
  issue_date: string;
  file_name: string;
  file_path: string;
  file_size?: number | null;
  document_data?: any;
  email_status: 'NOT_SENT' | 'SENT' | 'FAILED';
  email_sent_at?: string | null;
  email_error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalaryBreakdown {
  basicMonthly: number;
  hraMonthly: number;
  specialAllowanceMonthly: number;
  grossPayMonthly: number;
  // Deductions
  employeePFMonthly: number;
  employeeESICMonthly: number;
  employeeLWFMonthly: number;
  professionalTaxMonthly: number;
  netTakeHomeMonthly: number;
  // Employer contributions
  employerPFMonthly: number;
  employerPFAdminMonthly: number;
  employerESICMonthly: number;
  employerLWFMonthly: number;
  employerGMCMonthly: number; // Group Medical
  employerGPAMonthly: number; // Group Personal Accident
  employerGTLMonthly: number; // Group Term Life
  totalCTCMonthly: number;
  totalCTCAnnual: number;
}

export interface DocumentData {
  refNo: string;
  issueDate: string;
  candidateSalutation?: string;
  candidateName: string;
  candidateAddress: string;
  candidateEmail: string;
  candidatePhone: string;
  jobTitle: string;
  department: string;
  employeeId: string;
  employmentType?: string;
  workModel?: 'On-site' | 'Remote' | 'Hybrid' | string;
  workLocation?: string;
  baseLocation: string;
  postingLocation: string;
  reportingManager: string;
  probationPeriod: string;
  noticePeriod: string;
  workingHours?: string;
  workType?: string;
  joiningDate: string;
  offerValidityDate: string;
  offerValidityDays?: string | number;
  stipendAmount?: string;
  collegeUniversity?: string;
  internshipStartDate?: string;
  internshipEndDate?: string;
  internshipDuration?: string;
  placementEligibility?: string;
  proposedDesignation?: string;
  proposedSalary?: string | number;
  placementConditions?: string;
  status?: DocumentStatus;
  hrName: string;
  hrTitle: string;
  companyName: string;
  companyAddress?: string;
  companyWebsite: string;
  companyEmail: string;
  companyPhone: string;
  salary: SalaryBreakdown;
}

export interface SignatureData {
  isSigned: boolean;
  signatureType: 'draw' | 'type';
  signatureContent: string; // data URL or typed text
  signedAt: string | null;
  accepted: boolean;
  declinedReason?: string;
}

export interface EvaluationItem {
  category: string;
  autoreviveVal: string;
  teamspaceVal: string;
  marketStandard: string;
  verdict: 'favorable' | 'moderate' | 'strict' | 'neutral';
  analysis: string;
}
