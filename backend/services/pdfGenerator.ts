import { jsPDF } from 'jspdf';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function findProjectRoot(startPath: string): string {
  let currentPath = path.resolve(startPath);
  while ((!fs.existsSync(path.join(currentPath, 'package.json')) || !fs.existsSync(path.join(currentPath, 'backend'))) && path.dirname(currentPath) !== currentPath) {
    currentPath = path.dirname(currentPath);
  }
  return currentPath;
}

const projectRoot = findProjectRoot(path.dirname(fileURLToPath(import.meta.url)));

// Load logo base64
let logoDataUri = '';
try {
  const logoPath = path.join(projectRoot, 'frontend', 'public', 'autorevive-logo-tight.png');
  if (fs.existsSync(logoPath)) {
    logoDataUri = 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64');
  }
} catch (err) {
  console.warn('Could not load logo for backend PDF generator:', err);
}

export interface EmployeeData {
  employee_id: string;
  full_name: string;
  parent_name?: string | null;
  email?: string | null;
  mobile?: string | null;
  department: string;
  role: string;
  employment_type?: string | null;
  work_location?: string | null;
  address?: string | null;
  joining_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  duration_months?: number | null;
  stipend_month?: number | string | null;
  salary_month?: number | string | null;
  annual_ctc?: number | string | null;
  placement_status?: string | null;
}

export interface DocumentOptions {
  documentNumber: string;
  issueDate?: string;
  hrName?: string;
  hrTitle?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
}

// =========================================================================
// MNC CORPORATE GEOMETRY & TYPOGRAPHY CONSTANTS (A4: 210mm x 297mm)
// =========================================================================
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 170 mm
const MARGIN_TOP = 18;
const FOOTER_Y = 280;

// Colors
const COLOR_BRAND_ORANGE = [234, 88, 12]; // #EA580C
const COLOR_PRIMARY_SLATE = [15, 23, 42]; // #0F172A
const COLOR_BODY_SLATE = [51, 65, 85]; // #334155
const COLOR_MUTED_SLATE = [100, 116, 139]; // #64748B
const COLOR_BORDER_LINE = [203, 213, 225]; // #CBD5E1
const COLOR_LIGHT_BORDER = [226, 232, 240]; // #E2E8F0
const COLOR_ROW_ALT = [248, 250, 252]; // #F8FAFC

// =========================================================================
// COMMON REUSABLE LAYOUT PRIMITIVES
// =========================================================================

/**
 * Draws the official corporate letterhead, top border accent, and subtle watermark
 */
function drawLetterhead(doc: jsPDF, options: DocumentOptions, pageNum: number, totalPages: number): void {
  // Top Brand Orange Accent Bar (2.5mm)
  doc.setFillColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
  doc.rect(MARGIN_LEFT, MARGIN_TOP - 4.5, CONTENT_WIDTH, 2.5, 'F');

  // Proportional AutoRevive Logo (top-left)
  if (logoDataUri) {
    try {
      doc.addImage(logoDataUri, 'PNG', MARGIN_LEFT, MARGIN_TOP, 42, 10.5);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
      doc.text('AutoRevive', MARGIN_LEFT, MARGIN_TOP + 8);
    }
  }

  // Header Title & Tagline next to Logo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
  doc.text('AutoRevive', MARGIN_LEFT + 46, MARGIN_TOP + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('UNLOCK. BID. DRIVE.', MARGIN_LEFT + 46, MARGIN_TOP + 9.5);

  // Right Side Reference & Issue Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text(`REF: ${options.documentNumber}`, PAGE_WIDTH - MARGIN_RIGHT, MARGIN_TOP + 5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text(`Date: ${options.issueDate || '24 October 2026'}`, PAGE_WIDTH - MARGIN_RIGHT, MARGIN_TOP + 9.5, { align: 'right' });

  // Divider line under header
  doc.setDrawColor(COLOR_LIGHT_BORDER[0], COLOR_LIGHT_BORDER[1], COLOR_LIGHT_BORDER[2]);
  doc.setLineWidth(0.35);
  doc.line(MARGIN_LEFT, MARGIN_TOP + 14, PAGE_WIDTH - MARGIN_RIGHT, MARGIN_TOP + 14);

  // Ultra-subtle Watermark (light opacity, non-intrusive)
  drawWatermark(doc);

  // Bottom Footer
  drawFooter(doc, options, pageNum, totalPages);
}

/**
 * Draws non-intrusive, elegant background watermark
 */
function drawWatermark(doc: jsPDF): void {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(48);
  doc.setTextColor(246, 248, 250); // Very light subtle gray
  doc.text('AUTOREVIVE', PAGE_WIDTH / 2, PAGE_HEIGHT / 2, { align: 'center', angle: 33 });
}

/**
 * Draws executive bottom footer with address, contacts, and page number
 */
function drawFooter(doc: jsPDF, options: DocumentOptions, pageNum: number, totalPages: number): void {
  // Divider line
  doc.setDrawColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_LEFT, FOOTER_Y - 4, PAGE_WIDTH - MARGIN_RIGHT, FOOTER_Y - 4);

  // Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
  doc.text('AutoRevive', MARGIN_LEFT, FOOTER_Y);

  // Address
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('99B Kuppusamy Reddy Street, Uthangarai, Krishnagiri – 635207, Tamil Nadu, India', MARGIN_LEFT, FOOTER_Y + 3.8);

  // Contact details right aligned
  const contactText = 'hr@autorevives.com   |   +91 9597969650   |   autorevives.com';
  doc.text(contactText, PAGE_WIDTH - MARGIN_RIGHT, FOOTER_Y, { align: 'right' });

  // Page counter
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_BODY_SLATE[0], COLOR_BODY_SLATE[1], COLOR_BODY_SLATE[2]);
  doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_WIDTH - MARGIN_RIGHT, FOOTER_Y + 3.8, { align: 'right' });
}

/**
 * Helper to draw wrapped paragraph text with controlled line-height
 */
function drawParagraph(
  doc: jsPDF,
  text: string,
  startY: number,
  fontSize: number = 10,
  linePitch: number = 5.6,
  fontStyle: string = 'normal',
  textColor: number[] = COLOR_BODY_SLATE
): number {
  doc.setFont('helvetica', fontStyle);
  doc.setFontSize(fontSize);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
  doc.text(lines, MARGIN_LEFT, startY);
  return startY + lines.length * linePitch;
}

/**
 * Helper to draw a clean, professional corporate key-value table
 */
function drawKeyValueTable(
  doc: jsPDF,
  rows: Array<[string, string]>,
  startY: number,
  title?: string,
  col1Width: number = 58,
  rowHeight: number = 7
): number {
  let y = startY;

  if (title) {
    doc.setFillColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
    doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(title, MARGIN_LEFT + 4, y + 4);
    doc.text('OFFICIAL RECORD', PAGE_WIDTH - MARGIN_RIGHT - 4, y + 4, { align: 'right' });
    y += 5.5;
  }

  doc.setDrawColor(COLOR_BORDER_LINE[0], COLOR_BORDER_LINE[1], COLOR_BORDER_LINE[2]);
  doc.setLineWidth(0.25);

  rows.forEach(([label, value], idx) => {
    const isAlt = idx % 2 === 1;
    doc.setFillColor(
      isAlt ? COLOR_ROW_ALT[0] : 255,
      isAlt ? COLOR_ROW_ALT[1] : 255,
      isAlt ? COLOR_ROW_ALT[2] : 255
    );
    doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, rowHeight, 'F');
    doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, rowHeight, 'S');

    // Label (Col 1)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(COLOR_BODY_SLATE[0], COLOR_BODY_SLATE[1], COLOR_BODY_SLATE[2]);
    doc.text(label, MARGIN_LEFT + 4, y + rowHeight / 2 + 1.2);

    // Value (Col 2)
    doc.setFont('helvetica', label.includes('CTC') ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);

    const valLines = doc.splitTextToSize(value, CONTENT_WIDTH - col1Width - 6);
    doc.text(valLines[0] || '', MARGIN_LEFT + col1Width + 2, y + rowHeight / 2 + 1.2);

    y += rowHeight;
  });

  return y;
}

/**
 * Draws standard executive signature blocks
 */
function drawSignatures(
  doc: jsPDF,
  startY: number,
  candidateName?: string,
  isDual: boolean = true,
  candidateTitle: string = 'Signature of Candidate / Employee'
): void {
  const y = startY;

  // Left: Company Authority
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text('Yours sincerely,', MARGIN_LEFT, y);
  doc.setTextColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
  doc.text('For AutoRevive', MARGIN_LEFT, y + 4.5);

  // Stylized cursive representation
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text('Jemsina Banu', MARGIN_LEFT, y + 13);

  // Signing line
  doc.setDrawColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_LEFT, y + 16, MARGIN_LEFT + 55, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text('Jemsina Banu', MARGIN_LEFT, y + 20.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('Head of Human Resources', MARGIN_LEFT, y + 24.5);
  doc.text('AutoRevive • Krishnagiri – 635207', MARGIN_LEFT, y + 28.5);

  // Right: Candidate Acceptance Block if applicable
  if (isDual && candidateName) {
    const rightX = PAGE_WIDTH - MARGIN_RIGHT - 75;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
    doc.text('Acknowledged & Accepted By:', rightX, y);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(13);
    doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
    doc.text(candidateName, rightX, y + 13);

    doc.setDrawColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
    doc.line(rightX, y + 16, PAGE_WIDTH - MARGIN_RIGHT, y + 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(candidateName, rightX, y + 20.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
    doc.text(candidateTitle, rightX, y + 24.5);
    doc.text('Date & Place: Uthangarai', rightX, y + 28.5);
  }
}

/**
 * Draws the formal MNC offer acceptance box and company authority signature matching the exact corporate template
 */
function drawOfferAcceptanceBox(doc: jsPDF, y: number, emp: EmployeeData, opt: DocumentOptions): void {
  // Left: Yours sincerely, For AutoRevive
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text('Yours sincerely,', MARGIN_LEFT, y);
  y += 4;
  doc.setTextColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
  doc.text('For AutoRevive', MARGIN_LEFT, y);
  y += 4;

  // Signature script
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(13);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text(opt.hrName || 'Jemsina Banu', MARGIN_LEFT, y + 2);
  doc.setDrawColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.setLineWidth(0.35);
  doc.line(MARGIN_LEFT, y + 4, MARGIN_LEFT + 55, y + 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(opt.hrName || 'Jemsina Banu', MARGIN_LEFT, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text(opt.hrTitle || 'Human Resources Manager', MARGIN_LEFT, y + 11.5);
  doc.text('AutoRevive • Krishnagiri – 635207, Tamil Nadu', MARGIN_LEFT, y + 15);

  // Right side: Ref & Issue Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text(`Ref: ${opt.documentNumber}`, PAGE_WIDTH - MARGIN_RIGHT, y + 8, { align: 'right' });
  doc.text(`Issue Date: ${opt.issueDate || '24 October 2026'}`, PAGE_WIDTH - MARGIN_RIGHT, y + 11.5, { align: 'right' });

  y += 18;

  // Acceptance Box
  const boxHeight = 28;
  doc.setFillColor(COLOR_ROW_ALT[0], COLOR_ROW_ALT[1], COLOR_ROW_ALT[2]);
  doc.setDrawColor(COLOR_BORDER_LINE[0], COLOR_BORDER_LINE[1], COLOR_BORDER_LINE[2]);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, boxHeight, 'FD');

  // Box Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text('ACCEPTANCE OF OFFER BY EMPLOYEE', MARGIN_LEFT + 4, y + 4.5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('To be signed by candidate upon acceptance', PAGE_WIDTH - MARGIN_RIGHT - 4, y + 4.5, { align: 'right' });

  doc.setDrawColor(COLOR_LIGHT_BORDER[0], COLOR_LIGHT_BORDER[1], COLOR_LIGHT_BORDER[2]);
  doc.line(MARGIN_LEFT + 2, y + 6.2, PAGE_WIDTH - MARGIN_RIGHT - 2, y + 6.2);

  // Statement
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(COLOR_BODY_SLATE[0], COLOR_BODY_SLATE[1], COLOR_BODY_SLATE[2]);
  const stmt = `I, ${emp.full_name}, hereby accept this Offer of Employment and agree to abide by all the terms, conditions, and company policies referenced herein.`;
  doc.text(stmt, MARGIN_LEFT + 4, y + 9.8);

  doc.setFont('helvetica', 'bold');
  doc.text(`Confirmed Reporting Date: ${emp.joining_date || '03 November 2026'}`, MARGIN_LEFT + 4, y + 13.5);

  // Candidate Signature line (left)
  const sigY = y + 17;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.8);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('Signature of Candidate', MARGIN_LEFT + 4, sigY + 2.5);
  doc.line(MARGIN_LEFT + 4, sigY + 3.5, MARGIN_LEFT + 65, sigY + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text(emp.full_name, MARGIN_LEFT + 4, sigY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('Employee Signature', MARGIN_LEFT + 4, sigY + 9.8);

  // Date & Place (right)
  const rightX = PAGE_WIDTH - MARGIN_RIGHT - 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text('Date: ____ / ____ / 20____', rightX, sigY + 2.5, { align: 'right' });
  doc.line(PAGE_WIDTH - MARGIN_RIGHT - 65, sigY + 3.5, rightX, sigY + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.text('Date & Place', rightX, sigY + 7, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text(`Place: ${emp.work_location || 'Uthangarai, Krishnagiri'}`, rightX, sigY + 9.8, { align: 'right' });
}

// =========================================================================
// 1. OFFER LETTER (3 Pages, Perfectly Balanced)
// =========================================================================
function generateOfferLetter(doc: jsPDF, emp: EmployeeData, opt: DocumentOptions): void {
  const totalPages = 3;

  // ---------------- PAGE 1 ----------------
  drawLetterhead(doc, opt, 1, totalPages);
  let y = 38;

  // Recipient Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('TO,', MARGIN_LEFT, y);
  y += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text(emp.full_name, MARGIN_LEFT, y);
  y += 4.8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_BODY_SLATE[0], COLOR_BODY_SLATE[1], COLOR_BODY_SLATE[2]);
  doc.text(emp.address || 'Krishnagiri, Tamil Nadu, India', MARGIN_LEFT, y);
  y += 4.2;
  doc.text('Tamil Nadu, India', MARGIN_LEFT, y);
  y += 7;

  // Subject Bar
  doc.setFillColor(COLOR_ROW_ALT[0], COLOR_ROW_ALT[1], COLOR_ROW_ALT[2]);
  doc.setDrawColor(COLOR_BORDER_LINE[0], COLOR_BORDER_LINE[1], COLOR_BORDER_LINE[2]);
  doc.setLineWidth(0.4);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 7, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text(`SUBJECT: FORMAL OFFER OF EMPLOYMENT — ${emp.role.toUpperCase()}`, MARGIN_LEFT + CONTENT_WIDTH / 2, y + 4.8, { align: 'center' });
  y += 12;

  // Salutation & Intro
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text(`Dear ${emp.full_name},`, MARGIN_LEFT, y);
  y += 5.5;

  const introText =
    'With reference to your application, technical assessment, and subsequent interview discussions with us, we are pleased to offer you employment with AutoRevive on the terms and conditions outlined below. We welcome you to our organization and look forward to your valuable contributions.';
  y = drawParagraph(doc, introText, y, 10, 5.2);
  y += 4;

  // Summary Table
  const ctcMonthly = emp.salary_month || emp.stipend_month || 41974;
  const ctcAnnual = emp.annual_ctc || Number(ctcMonthly) * 12 || 503688;
  const formattedMonthly = `Rs. ${Number(ctcMonthly).toLocaleString('en-IN')} / month`;
  const formattedAnnual = `Rs. ${Number(ctcAnnual).toLocaleString('en-IN')} per annum`;

  const summaryRows: Array<[string, string]> = [
    ['Designation / Position', emp.role],
    ['Department / Function', emp.department],
    ['Primary Work Location', emp.work_location || 'Uthangarai, Krishnagiri, Tamil Nadu'],
    ['Total Cost to Company (CTC)', `${formattedAnnual} (${formattedMonthly})`],
    ['Target Reporting Date', emp.joining_date || '03 November 2026'],
    ['Offer Validity Window', '15 Days from the date of issue'],
  ];

  y = drawKeyValueTable(doc, summaryRows, y, 'KEY EMPLOYMENT PARTICULARS', 58, 6.8);
  y += 6;

  // Clauses 1-5 on Page 1 (Fills Page 1 seamlessly to the footer)
  const clausesP1 = [
    {
      num: '1. ROLE, DUTIES & PROFESSIONAL STANDARDS',
      text: 'You will perform all duties associated with your position in accordance with the professional directives and priorities established by your reporting authority and AutoRevive leadership. You agree to devote your whole working time exclusively to company business.',
    },
    {
      num: '2. PROBATION PERIOD & SERVICE CONFIRMATION',
      text: 'You will serve an initial probationary period of six (6) months from your confirmed date of joining. Upon successful evaluation of your performance and professional conduct, your employment will be confirmed in writing.',
    },
    {
      num: '3. WORKING HOURS, ATTENDANCE & SHIFTS',
      text: 'You will observe the official business hours, shift rosters, and attendance systems established by AutoRevive. Operational support may be scheduled during vehicle auction cycles in accordance with business requirements.',
    },
    {
      num: '4. BACKGROUND VERIFICATION & DUE DILIGENCE',
      text: 'This offer is strictly subject to satisfactory background screening, educational credential checks, identity validation, and reference checks. AutoRevive reserves the right to withdraw this offer if any discrepancy is discovered.',
    },
    {
      num: '5. PLACE OF POSTING, TRANSFERABILITY & TRAVEL MOBILITY',
      text: `Your initial place of posting will be at our office in ${emp.work_location || 'Uthangarai, Krishnagiri'}. However, depending on business expansion, client auctions, and organizational requirements, the company may depute or transfer you to other branches, subsidiaries, or field partner locations across India.`,
    },
  ];

  clausesP1.forEach(c => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
    doc.text(c.num, MARGIN_LEFT, y);
    y += 4.5;

    y = drawParagraph(doc, c.text, y, 9, 5.0, 'normal', COLOR_BODY_SLATE);
    y += 3.5;
  });

  // Flow indicator at bottom of page 1
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('* Continued on Page 2 for Governance Clauses, Document Checklist & Formal Acceptance. Annexure A on Page 3.', MARGIN_LEFT, FOOTER_Y - 8);

  // ---------------- PAGE 2 ----------------
  doc.addPage();
  drawLetterhead(doc, opt, 2, totalPages);
  y = 38;

  // Section Heading
  doc.setFillColor(COLOR_ROW_ALT[0], COLOR_ROW_ALT[1], COLOR_ROW_ALT[2]);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text('TERMS AND CONDITIONS OF EMPLOYMENT (CONTINUED)', MARGIN_LEFT + CONTENT_WIDTH / 2, y + 4.5, { align: 'center' });
  y += 11;

  // Clauses 6-10 on Page 2
  const clausesP2 = [
    {
      num: '6. REMUNERATION, PAYROLL & STATUTORY DEDUCTIONS',
      text: 'Remuneration will be disbursed on the final working day of each calendar month via bank transfer. Statutory deductions including Provident Fund (PF), ESIC, Professional Tax, and TDS will be deducted at source per prevailing labor and tax laws.',
    },
    {
      num: '7. CONFIDENTIALITY, TRADE SECRETS & PROPRIETARY RIGHTS',
      text: "You agree to preserve absolute confidentiality regarding AutoRevive's vehicle bidding algorithms, dealer contacts, auction data, customer lists, and proprietary software tools. Breach of confidentiality will lead to immediate termination and legal action.",
    },
    {
      num: '8. NON-SOLICITATION & EXCLUSIVE SERVICE',
      text: 'During your tenure and for twelve (12) months following separation, you agree not to solicit AutoRevive clients, dealers, or personnel. Dual employment or external commercial engagements without prior written authorization are strictly prohibited.',
    },
    {
      num: '9. COMPANY POLICIES, CODE OF CONDUCT & POSH COMPLIANCE',
      text: 'Your employment will be governed by company standing orders, Information Security Standards, and Prevention of Sexual Harassment (POSH) guidelines. You agree to uphold the highest standards of integrity and professional ethics.',
    },
    {
      num: '10. SEPARATION PROTOCOL & NOTICE PERIOD',
      text: 'During probation, either party may terminate employment with 15 days written notice or gross salary in lieu. Post confirmation, notice period shall be 30 days. All company assets, access keys, and files must be formally surrendered upon separation.',
    },
  ];

  clausesP2.forEach(c => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
    doc.text(c.num, MARGIN_LEFT, y);
    y += 4.5;

    y = drawParagraph(doc, c.text, y, 9, 5.0, 'normal', COLOR_BODY_SLATE);
    y += 3.5;
  });

  y += 3;

  // Checklist Card
  doc.setFillColor(COLOR_ROW_ALT[0], COLOR_ROW_ALT[1], COLOR_ROW_ALT[2]);
  doc.setDrawColor(COLOR_BORDER_LINE[0], COLOR_BORDER_LINE[1], COLOR_BORDER_LINE[2]);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 26, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text('MANDATORY DOCUMENTS REQUIRED ON OR BEFORE JOINING', MARGIN_LEFT + 4, y + 4.8);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
  doc.text('Self-attested photocopies', PAGE_WIDTH - MARGIN_RIGHT - 4, y + 4.8, { align: 'right' });

  const checklistItems = [
    '1. Recent passport size photographs (4 copies)',
    '2. Aadhaar Card (Photocopy with original for verification)',
    '3. PAN Card (Permanent Account Number)',
    '4. Current & Permanent Residence Address Proof',
    '5. Highest Educational Degree & Marksheets',
    '6. Past Experience / Relieving Letters (if applicable)',
    '7. Form 16 / Previous Salary Slips (last 3 months)',
    '8. Bank Passbook / Cancelled Cheque for payroll setup',
  ];

  let cy = y + 9.5;
  for (let i = 0; i < 4; i++) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR_BODY_SLATE[0], COLOR_BODY_SLATE[1], COLOR_BODY_SLATE[2]);
    doc.text(checklistItems[i], MARGIN_LEFT + 4, cy);
    doc.text(checklistItems[i + 4], MARGIN_LEFT + CONTENT_WIDTH / 2 + 2, cy);
    cy += 3.8;
  }
  y += 32;

  // Page 2 Bottom Continued Note
  y += 12;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('* Continued on Page 3 for Annexure A (Remuneration Breakdown) and Formal Offer Acceptance.', MARGIN_LEFT + CONTENT_WIDTH / 2, y, { align: 'center' });

  // ---------------- PAGE 3: ANNEXURE A ----------------
  doc.addPage();
  drawLetterhead(doc, opt, 3, totalPages);
  y = 38;

  // Title
  doc.setFillColor(COLOR_ROW_ALT[0], COLOR_ROW_ALT[1], COLOR_ROW_ALT[2]);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 7.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text("ANNEXURE 'A' — COMPENSATION STRUCTURE & SALARY BREAKDOWN", MARGIN_LEFT + CONTENT_WIDTH / 2, y + 5, { align: 'center' });
  y += 12;

  // Employee Metadata Strip
  doc.setFillColor(255, 247, 237); // Light orange tint
  doc.setDrawColor(254, 215, 170);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 10, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('CANDIDATE NAME:', MARGIN_LEFT + 4, y + 4);
  doc.text('DESIGNATION:', MARGIN_LEFT + 55, y + 4);
  doc.text('DEPARTMENT:', MARGIN_LEFT + 105, y + 4);
  doc.text('ANNUAL CTC:', MARGIN_LEFT + 140, y + 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text(emp.full_name, MARGIN_LEFT + 4, y + 8);
  doc.text(emp.role, MARGIN_LEFT + 55, y + 8);
  doc.text(emp.department, MARGIN_LEFT + 105, y + 8);
  doc.setTextColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
  doc.text(formattedAnnual, MARGIN_LEFT + 140, y + 8);
  y += 14;

  // Salary Table
  const basicM = Math.round(Number(ctcMonthly) * 0.5);
  const hraM = Math.round(Number(ctcMonthly) * 0.25);
  const specialM = Math.round(Number(ctcMonthly) * 0.17);
  const medM = 520;
  const grossM = basicM + hraM + specialM + medM;

  const pfM = 1800;
  const esicM = 0;
  const gratuityM = Math.round(basicM * 0.0481);
  const totalM = grossM + pfM + esicM + gratuityM;

  const salaryRows = [
    { type: 'header', title: 'PART A: Direct Earnings / Fixed Cash Components' },
    { s: '1', name: 'Basic Salary (50% of Fixed CTC)', m: basicM, a: basicM * 12 },
    { s: '2', name: 'House Rent Allowance (HRA - 25%)', m: hraM, a: hraM * 12 },
    { s: '3', name: 'Special & Performance Allowance', m: specialM, a: specialM * 12 },
    { s: '4', name: 'Group Medical & Insurance Coverage', m: medM, a: medM * 12 },
    { type: 'subtotal', name: 'Total Gross Cash Remuneration (A)', m: grossM, a: grossM * 12 },
    { type: 'header', title: 'PART B: Retirals & Employer Statutory Contributions' },
    { s: '5', name: 'Employer Provident Fund (PF - 12%)', m: pfM, a: pfM * 12 },
    { s: '6', name: 'Employer ESIC / Medical Care Support', m: esicM, a: esicM * 12 },
    { s: '7', name: 'Statutory Gratuity Benefit (4.81% of Basic)', m: gratuityM, a: gratuityM * 12 },
    { type: 'total', name: 'TOTAL COST TO COMPANY (CTC = A + B)', m: totalM, a: totalM * 12 },
  ];

  // Table Header
  doc.setFillColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('S.No', MARGIN_LEFT + 3, y + 4.2);
  doc.text('Salary Component', MARGIN_LEFT + 16, y + 4.2);
  doc.text('Monthly (Rs.)', MARGIN_LEFT + 125, y + 4.2, { align: 'right' });
  doc.text('Annual (Rs.)', PAGE_WIDTH - MARGIN_RIGHT - 4, y + 4.2, { align: 'right' });
  y += 6;

  salaryRows.forEach(sr => {
    if (sr.type === 'header') {
      doc.setFillColor(241, 245, 249);
      doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.setTextColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
      doc.text(sr.title!, MARGIN_LEFT + 4, y + 3.6);
      y += 5;
    } else if (sr.type === 'subtotal') {
      doc.setFillColor(255, 247, 237);
      doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
      doc.text(sr.name!, MARGIN_LEFT + 4, y + 4.2);
      doc.text(`Rs. ${sr.m!.toLocaleString('en-IN')}`, MARGIN_LEFT + 125, y + 4.2, { align: 'right' });
      doc.text(`Rs. ${sr.a!.toLocaleString('en-IN')}`, PAGE_WIDTH - MARGIN_RIGHT - 4, y + 4.2, { align: 'right' });
      y += 6;
    } else if (sr.type === 'total') {
      doc.setFillColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
      doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(sr.name!, MARGIN_LEFT + 4, y + 4.5);
      doc.text(`Rs. ${sr.m!.toLocaleString('en-IN')}`, MARGIN_LEFT + 125, y + 4.5, { align: 'right' });
      doc.text(`Rs. ${sr.a!.toLocaleString('en-IN')}`, PAGE_WIDTH - MARGIN_RIGHT - 4, y + 4.5, { align: 'right' });
      y += 6.5;
    } else {
      doc.setDrawColor(COLOR_LIGHT_BORDER[0], COLOR_LIGHT_BORDER[1], COLOR_LIGHT_BORDER[2]);
      doc.setLineWidth(0.2);
      doc.line(MARGIN_LEFT, y + 5.5, PAGE_WIDTH - MARGIN_RIGHT, y + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(COLOR_BODY_SLATE[0], COLOR_BODY_SLATE[1], COLOR_BODY_SLATE[2]);
      doc.text(sr.s!, MARGIN_LEFT + 4, y + 4);
      doc.text(sr.name!, MARGIN_LEFT + 16, y + 4);
      doc.text(`Rs. ${sr.m!.toLocaleString('en-IN')}`, MARGIN_LEFT + 125, y + 4, { align: 'right' });
      doc.text(`Rs. ${sr.a!.toLocaleString('en-IN')}`, PAGE_WIDTH - MARGIN_RIGHT - 4, y + 4, { align: 'right' });
      y += 5.5;
    }
  });

  y += 6;

  // Statutory Guidelines & Policy Card
  doc.setFillColor(COLOR_ROW_ALT[0], COLOR_ROW_ALT[1], COLOR_ROW_ALT[2]);
  doc.setDrawColor(COLOR_BORDER_LINE[0], COLOR_BORDER_LINE[1], COLOR_BORDER_LINE[2]);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 26, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text('STATUTORY GUIDELINES & COMPENSATION POLICIES', MARGIN_LEFT + 4, y + 4.8);

  const notes = [
    '• Statutory Withholdings: Income Tax (TDS), Professional Tax, PF, and ESIC will be deducted per prevailing government legislation.',
    '• Retiral Benefits: Gratuity is payable per the Payment of Gratuity Act, 1972 upon completion of continuous statutory service.',
    '• Health & Life Coverage: Group Medical Insurance covers employee and family floater per company policy, effective from onboarding.',
    '• Annual Appraisal & Revisions: Performance increments are assessed annually in April based on individual KPIs and company performance.',
  ];

  let ny = y + 9.5;
  notes.forEach(n => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
    doc.text(n, MARGIN_LEFT + 4, ny);
    ny += 3.8;
  });

  y += 30;

  // Complete Formal Offer Acceptance & Company Signatory on Page 3 (Last Page)
  drawOfferAcceptanceBox(doc, y, emp, opt);
}

// =========================================================================
// 2. APPOINTMENT LETTER (2 Pages, Balanced & Complete)
// =========================================================================
function generateAppointmentLetter(doc: jsPDF, emp: EmployeeData, opt: DocumentOptions): void {
  const totalPages = 2;

  // ---------------- PAGE 1 ----------------
  drawLetterhead(doc, opt, 1, totalPages);
  let y = 38;

  // Recipient Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('TO,', MARGIN_LEFT, y);
  y += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text(emp.full_name, MARGIN_LEFT, y);
  y += 4.8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_BODY_SLATE[0], COLOR_BODY_SLATE[1], COLOR_BODY_SLATE[2]);
  doc.text(emp.address || 'Krishnagiri, Tamil Nadu, India', MARGIN_LEFT, y);
  y += 4.2;
  doc.text('Tamil Nadu, India', MARGIN_LEFT, y);
  y += 7;

  // Subject Bar
  doc.setFillColor(COLOR_ROW_ALT[0], COLOR_ROW_ALT[1], COLOR_ROW_ALT[2]);
  doc.setDrawColor(COLOR_BORDER_LINE[0], COLOR_BORDER_LINE[1], COLOR_BORDER_LINE[2]);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 7, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text(`SUBJECT: FORMAL LETTER OF APPOINTMENT — ${emp.role.toUpperCase()}`, MARGIN_LEFT + CONTENT_WIDTH / 2, y + 4.8, { align: 'center' });
  y += 12;

  // Salutation & Intro
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text(`Dear ${emp.full_name},`, MARGIN_LEFT, y);
  y += 5.5;

  const intro = `We are pleased to formally appoint you to the position of ${emp.role} in the ${emp.department} at AutoRevive, effective from your reporting date of ${emp.joining_date || '03 November 2026'}. This document sets out the comprehensive formal terms governing your appointment with the Company.`;
  y = drawParagraph(doc, intro, y, 10, 5.2);
  y += 4;

  // Core Particulars Table
  const rows: Array<[string, string]> = [
    ['Employee ID', emp.employee_id],
    ['Designation / Position', emp.role],
    ['Department / Function', emp.department],
    ['Effective Date of Appointment', emp.joining_date || '03 November 2026'],
    ['Annual Remuneration (CTC)', `Rs. ${Number(emp.annual_ctc || 503688).toLocaleString('en-IN')} per annum`],
    ['Primary Place of Posting', emp.work_location || 'Uthangarai, Krishnagiri, Tamil Nadu'],
    ['Probation Period', '6 Months (180 Calendar Days)'],
  ];

  y = drawKeyValueTable(doc, rows, y, 'APPOINTMENT SUMMARY & COMPENSATION', 58, 6.8);
  y += 7;

  // Clauses 1-4 on Page 1
  const clausesP1 = [
    {
      num: '1. COMMENCEMENT & PROBATION PERIOD',
      text: 'Your service begins on the date specified. You will remain on probation for six (6) months, during which your output, adaptability, and conduct will be reviewed. Confirmation is subject to formal written intimation.',
    },
    {
      num: '2. DESIGNATION & PROFESSIONAL DUTIES',
      text: 'You will faithfully and diligently execute all operational responsibilities assigned by AutoRevive leadership, upholding the highest standards of automotive business ethics and technical competence.',
    },
    {
      num: '3. WORKING HOURS, ROSTERS & ATTENDANCE',
      text: 'You will adhere to the official business hours, shifts, and attendance systems established by the company. Flexibility may be required to support auction operations and client service deliverables.',
    },
    {
      num: '4. COMPENSATION & STATUTORY WITHHOLDINGS',
      text: 'Your monthly remuneration will be paid directly to your registered bank account on the last working day of each month, subject to standard statutory tax, PF, and ESIC withholdings per government norms.',
    },
  ];

  clausesP1.forEach(c => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
    doc.text(c.num, MARGIN_LEFT, y);
    y += 4.2;

    y = drawParagraph(doc, c.text, y, 9, 4.6, 'normal', COLOR_BODY_SLATE);
    y += 2.5;
  });

  // Flow indicator
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('* Continued on Page 2 for Governance Clauses, Non-Disclosure & Formal Execution.', MARGIN_LEFT, FOOTER_Y - 8);

  // ---------------- PAGE 2 ----------------
  doc.addPage();
  drawLetterhead(doc, opt, 2, totalPages);
  y = 38;

  // Section Heading
  doc.setFillColor(COLOR_ROW_ALT[0], COLOR_ROW_ALT[1], COLOR_ROW_ALT[2]);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text('TERMS OF APPOINTMENT & GOVERNANCE (CONTINUED)', MARGIN_LEFT + CONTENT_WIDTH / 2, y + 4.5, { align: 'center' });
  y += 12;

  const clausesP2 = [
    {
      num: '5. CONFIDENTIALITY & PROPRIETARY RIGHTS',
      text: 'You will preserve strict secrecy concerning vehicle bidding algorithms, dealer contacts, inventory records, financial models, and portal software. All documentation and software created during employment shall remain the exclusive intellectual property of AutoRevive.',
    },
    {
      num: '6. INTELLECTUAL PROPERTY ASSIGNMENT',
      text: 'All patents, designs, copyrights, codebases, workflows, and inventions conceived or produced by you during your employment with AutoRevive are hereby assigned irrevocably and exclusively to the Company.',
    },
    {
      num: '7. NON-SOLICITATION & EXCLUSIVITY',
      text: 'You shall not participate in competing commercial activities or solicit AutoRevive clients or personnel during your tenure and for twelve (12) months thereafter. Dual employment without prior written permission is strictly prohibited.',
    },
    {
      num: '8. TERMINATION PROTOCOL & NOTICE PERIOD',
      text: 'During probation, employment may be terminated by either party with 15 days notice or pay in lieu. Upon confirmation, notice period shall be 30 days. Misconduct, breach of confidentiality, or fraud will invite immediate summary dismissal.',
    },
    {
      num: '9. GOVERNING LAW & JURISDICTION',
      text: 'This appointment is executed under Indian law. The civil courts at Krishnagiri, Tamil Nadu shall have exclusive jurisdiction regarding any claim, dispute, or difference arising under this appointment.',
    },
  ];

  clausesP2.forEach(c => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
    doc.text(c.num, MARGIN_LEFT, y);
    y += 4.2;

    y = drawParagraph(doc, c.text, y, 9, 4.6, 'normal', COLOR_BODY_SLATE);
    y += 3;
  });

  y += 10;

  // Closing greeting
  const closingMsg =
    'We welcome you to the AutoRevive team and look forward to an enriching, successful, and mutually rewarding professional association.';
  y = drawParagraph(doc, closingMsg, y, 9.5, 5, 'italic', COLOR_PRIMARY_SLATE);
  y += 10;

  // Dual Signatures on Page 2
  drawSignatures(doc, y, emp.full_name, true, 'Acceptance & Acknowledgment by Employee');
}

// =========================================================================
// 3. INTERNSHIP LETTER (2 Pages, Balanced & Complete)
// =========================================================================
function generateInternshipLetter(doc: jsPDF, emp: EmployeeData, opt: DocumentOptions): void {
  const totalPages = 2;

  // ---------------- PAGE 1 ----------------
  drawLetterhead(doc, opt, 1, totalPages);
  let y = 38;

  // Recipient Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('TO,', MARGIN_LEFT, y);
  y += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text(emp.full_name, MARGIN_LEFT, y);
  y += 4.8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_BODY_SLATE[0], COLOR_BODY_SLATE[1], COLOR_BODY_SLATE[2]);
  doc.text(emp.address || 'Krishnagiri, Tamil Nadu, India', MARGIN_LEFT, y);
  y += 4.2;
  doc.text('Tamil Nadu, India', MARGIN_LEFT, y);
  y += 7;

  // Subject Bar
  doc.setFillColor(COLOR_ROW_ALT[0], COLOR_ROW_ALT[1], COLOR_ROW_ALT[2]);
  doc.setDrawColor(COLOR_BORDER_LINE[0], COLOR_BORDER_LINE[1], COLOR_BORDER_LINE[2]);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 7, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text(`SUBJECT: OFFER OF INTERNSHIP ENGAGEMENT — ${emp.role.toUpperCase()}`, MARGIN_LEFT + CONTENT_WIDTH / 2, y + 4.8, { align: 'center' });
  y += 12;

  // Salutation & Intro
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text(`Dear ${emp.full_name},`, MARGIN_LEFT, y);
  y += 5.5;

  const intro = `We are pleased to offer you an Internship Engagement at AutoRevive for the role of ${emp.role} in the ${emp.department}. We are confident that this internship will provide you with valuable practical industry exposure, technical mentorship, and professional growth.`;
  y = drawParagraph(doc, intro, y, 10, 5.2);
  y += 5;

  // Internship Particulars Table
  const rows: Array<[string, string]> = [
    ['Internship Role / Domain', emp.role],
    ['Department / Function', emp.department],
    ['Internship Duration', `${emp.duration_months || 3} Months (${emp.start_date || '03 Nov 2026'} to ${emp.end_date || '03 Feb 2027'})`],
    ['Monthly Stipend Amount', `Rs. ${Number(emp.stipend_month || 15000).toLocaleString('en-IN')} / month`],
    ['Primary Location', emp.work_location || 'Uthangarai, Krishnagiri, Tamil Nadu'],
    ['Assigned Mentor', 'Lead Systems Engineer & HR Directorate'],
  ];

  y = drawKeyValueTable(doc, rows, y, 'INTERNSHIP ENGAGEMENT TERMS', 58, 6.8);
  y += 7;

  // Clauses 1-3 on Page 1
  const clauses = [
    {
      num: '1. SCOPE OF TRAINING & PROJECT ASSIGNMENT',
      text: 'You will work on live automotive auction platforms, vehicle inspection algorithms, and diagnostic workflow projects under the direct mentorship of our technical leads, acquiring hands-on industry competencies.',
    },
    {
      num: '2. CODE OF CONDUCT & PROFESSIONAL DISCIPLINE',
      text: 'You are required to observe strict professional discipline, punctual attendance, and complete adherence to company operating procedures and data security protocols throughout your tenure.',
    },
    {
      num: '3. MONTHLY STIPEND DISBURSEMENT',
      text: 'The agreed stipend will be disbursed monthly via direct electronic bank credit, subject to submission of attendance records and timesheets verified by your mentor.',
    },
  ];

  clauses.forEach(c => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
    doc.text(c.num, MARGIN_LEFT, y);
    y += 4.2;

    y = drawParagraph(doc, c.text, y, 9, 4.6, 'normal', COLOR_BODY_SLATE);
    y += 3;
  });

  // Flow indicator
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('* Continued on Page 2 for Confidentiality, Completion Guidelines & Acceptance.', MARGIN_LEFT, FOOTER_Y - 8);

  // ---------------- PAGE 2 ----------------
  doc.addPage();
  drawLetterhead(doc, opt, 2, totalPages);
  y = 38;

  // Section Heading
  doc.setFillColor(COLOR_ROW_ALT[0], COLOR_ROW_ALT[1], COLOR_ROW_ALT[2]);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text('INTERNSHIP TERMS & DECLARATION (CONTINUED)', MARGIN_LEFT + CONTENT_WIDTH / 2, y + 4.5, { align: 'center' });
  y += 12;

  const clausesP2 = [
    {
      num: '4. CONFIDENTIALITY & NON-DISCLOSURE',
      text: 'All software blueprints, client records, pricing algorithms, and vehicle inventories accessible during your internship remain strictly confidential. You shall not download, duplicate, or disclose proprietary information to any external party.',
    },
    {
      num: '5. PROJECT DELIVERABLES & COMPLETION CERTIFICATE',
      text: 'Upon successful completion of the internship duration and satisfactory evaluation of project deliverables, AutoRevive will award you an official Certificate of Internship Completion.',
    },
    {
      num: '6. TERMINATION OF ENGAGEMENT',
      text: 'Either party may terminate this internship engagement with seven (7) days written notice. AutoRevive reserves the right to terminate engagement immediately in the event of gross misconduct, unauthorized absence, or breach of trust.',
    },
  ];

  clausesP2.forEach(c => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
    doc.text(c.num, MARGIN_LEFT, y);
    y += 4.2;

    y = drawParagraph(doc, c.text, y, 9, 4.6, 'normal', COLOR_BODY_SLATE);
    y += 4;
  });

  y += 10;
  const wishMsg =
    'We wish you an enriching and successful internship experience with AutoRevive, and trust this tenure will serve as a strong stepping stone in your professional career.';
  y = drawParagraph(doc, wishMsg, y, 9.5, 5.2, 'italic', COLOR_PRIMARY_SLATE);
  y += 12;

  // Dual Signatures on Page 2
  drawSignatures(doc, y, emp.full_name, true, 'Intern Acceptance & Acknowledgment');
}

// =========================================================================
// 4. INTERNSHIP CUM PLACEMENT LETTER (2 Pages, Balanced & Complete)
// =========================================================================
function generateInternshipCumPlacement(doc: jsPDF, emp: EmployeeData, opt: DocumentOptions): void {
  const totalPages = 2;

  // ---------------- PAGE 1 ----------------
  drawLetterhead(doc, opt, 1, totalPages);
  let y = 38;

  // Recipient Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('TO,', MARGIN_LEFT, y);
  y += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text(emp.full_name, MARGIN_LEFT, y);
  y += 4.8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_BODY_SLATE[0], COLOR_BODY_SLATE[1], COLOR_BODY_SLATE[2]);
  doc.text(emp.address || 'Krishnagiri, Tamil Nadu, India', MARGIN_LEFT, y);
  y += 4.2;
  doc.text('Tamil Nadu, India', MARGIN_LEFT, y);
  y += 7;

  // Subject Bar
  doc.setFillColor(COLOR_ROW_ALT[0], COLOR_ROW_ALT[1], COLOR_ROW_ALT[2]);
  doc.setDrawColor(COLOR_BORDER_LINE[0], COLOR_BORDER_LINE[1], COLOR_BORDER_LINE[2]);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 7, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text(`SUBJECT: OFFER OF INTERNSHIP CUM PRE-PLACEMENT — ${emp.role.toUpperCase()}`, MARGIN_LEFT + CONTENT_WIDTH / 2, y + 4.8, { align: 'center' });
  y += 12;

  // Salutation & Intro
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text(`Dear ${emp.full_name},`, MARGIN_LEFT, y);
  y += 5.5;

  const intro = `We are pleased to offer you an Internship Cum Placement Opportunity for the position of ${emp.role} in the ${emp.department} at AutoRevive. This opportunity is structured to provide you with intensive industry training followed by transition into full-time employment upon successful performance evaluation.`;
  y = drawParagraph(doc, intro, y, 10, 5.2);
  y += 5;

  // Terms Table
  const rows: Array<[string, string]> = [
    ['Role / Domain', emp.role],
    ['Department / Function', emp.department],
    ['Internship Training Period', `${emp.duration_months || 3} Months (${emp.start_date || '03 Nov 2026'} to ${emp.end_date || '03 Feb 2027'})`],
    ['Stipend During Internship', `Rs. ${Number(emp.stipend_month || 15000).toLocaleString('en-IN')} / month`],
    ['Target CTC on Regularization', `Rs. ${Number(emp.annual_ctc || 503688).toLocaleString('en-IN')} per annum`],
    ['Primary Location', emp.work_location || 'Uthangarai, Krishnagiri, Tamil Nadu'],
  ];

  y = drawKeyValueTable(doc, rows, y, 'PROGRAM STRUCTURE & REMUNERATION TERMS', 58, 6.8);
  y += 7;

  // Clauses 1-3
  const clausesP1 = [
    {
      num: '1. INTERNSHIP SCOPE & TECHNICAL EVALUATION',
      text: 'During the internship period, your technical aptitude, problem solving, teamwork, and deliverables will be periodically assessed against designated milestone KPIs.',
    },
    {
      num: '2. PRE-PLACEMENT OFFER (PPO) TRANSITION',
      text: 'Upon satisfactory completion of the internship tenure and recommendation from your department head, you will be formally transitioned into regular permanent employment with the agreed CTC.',
    },
    {
      num: '3. CODE OF CONDUCT & PROFESSIONALISM',
      text: 'You will uphold the highest standards of integrity, punctuality, and professional ethics as prescribed by company standing orders and confidentiality policies.',
    },
  ];

  clausesP1.forEach(c => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
    doc.text(c.num, MARGIN_LEFT, y);
    y += 4.2;

    y = drawParagraph(doc, c.text, y, 9, 4.6, 'normal', COLOR_BODY_SLATE);
    y += 3;
  });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('* Continued on Page 2 for Placement Criteria, Legal Governance & Signatures.', MARGIN_LEFT, FOOTER_Y - 8);

  // ---------------- PAGE 2 ----------------
  doc.addPage();
  drawLetterhead(doc, opt, 2, totalPages);
  y = 38;

  doc.setFillColor(COLOR_ROW_ALT[0], COLOR_ROW_ALT[1], COLOR_ROW_ALT[2]);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text('PLACEMENT TERMS & DECLARATION (CONTINUED)', MARGIN_LEFT + CONTENT_WIDTH / 2, y + 4.5, { align: 'center' });
  y += 12;

  const clausesP2 = [
    {
      num: '4. INTELLECTUAL PROPERTY & TRADE SECRETS',
      text: 'All innovations, systems, databases, and codes developed during your training shall remain the exclusive intellectual property of AutoRevive. Strict non-disclosure obligations apply.',
    },
    {
      num: '5. FINAL PLACEMENT CONDITIONS',
      text: 'Confirmation of full-time placement is contingent upon maintaining a minimum 80% score in technical assessments, clean background verification, and adherence to company policies.',
    },
    {
      num: '6. NOTICE PERIOD & EXIT PROTOCOL',
      text: 'During the internship phase, either party may terminate engagement with 7 days notice. Following permanent placement, notice period shall be 30 days.',
    },
  ];

  clausesP2.forEach(c => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
    doc.text(c.num, MARGIN_LEFT, y);
    y += 4.2;

    y = drawParagraph(doc, c.text, y, 9, 4.6, 'normal', COLOR_BODY_SLATE);
    y += 4;
  });

  y += 10;
  const wishMsg =
    'We wish you all the very best for your journey with AutoRevive and look forward to welcoming you into our permanent leadership pipeline.';
  y = drawParagraph(doc, wishMsg, y, 9.5, 5.2, 'italic', COLOR_PRIMARY_SLATE);
  y += 12;

  drawSignatures(doc, y, emp.full_name, true, 'Intern Acceptance & Declaration');
}

// =========================================================================
// 5. INTERNSHIP COMPLETION CERTIFICATE (Authentic Prestigious Certificate)
// =========================================================================
function generateInternshipCompletionCert(doc: jsPDF, emp: EmployeeData, opt: DocumentOptions): void {
  // Dedicated Certificate Outer & Inner Double Borders
  doc.setDrawColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
  doc.setLineWidth(1.2);
  doc.rect(12, 12, 186, 273, 'S');

  doc.setDrawColor(COLOR_BORDER_LINE[0], COLOR_BORDER_LINE[1], COLOR_BORDER_LINE[2]);
  doc.setLineWidth(0.4);
  doc.rect(15, 15, 180, 267, 'S');

  // Corner Accent Brackets
  const corners = [
    [15, 15],
    [195, 15],
    [15, 282],
    [195, 282],
  ];
  doc.setFillColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
  corners.forEach(([cx, cy]) => {
    doc.circle(cx, cy, 1.8, 'F');
  });

  // Subtle Watermark
  drawWatermark(doc);

  let y = 30;

  // Centered Header Logo & Company
  if (logoDataUri) {
    try {
      doc.addImage(logoDataUri, 'PNG', PAGE_WIDTH / 2 - 25, y, 50, 12.5);
      y += 16;
    } catch {
      y += 5;
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
  doc.text('AutoRevive', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 5.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('UNLOCK. BID. DRIVE. • OFFICIAL HUMAN RESOURCES CREDENTIAL', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 12;

  // Certificate Title with Decorative Line
  doc.setDrawColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
  doc.setLineWidth(0.8);
  doc.line(PAGE_WIDTH / 2 - 45, y, PAGE_WIDTH / 2 + 45, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text('CERTIFICATE OF INTERNSHIP COMPLETION', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 4;

  doc.line(PAGE_WIDTH / 2 - 45, y + 2, PAGE_WIDTH / 2 + 45, y + 2);
  y += 18;

  // Preamble
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('This is to proudly certify that', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 12;

  // Recipient Name Prominently
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
  doc.text(emp.full_name, PAGE_WIDTH / 2, y, { align: 'center' });

  // Underline beneath name
  doc.setDrawColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
  doc.setLineWidth(0.5);
  const nameWidth = doc.getTextWidth(emp.full_name);
  doc.line(PAGE_WIDTH / 2 - nameWidth / 2 - 5, y + 2, PAGE_WIDTH / 2 + nameWidth / 2 + 5, y + 2);
  y += 16;

  // Main Statement
  const statement = `has successfully completed an intensive industry internship program as ${emp.role} in the ${emp.department} at AutoRevive from ${emp.start_date || '01 August 2026'} to ${emp.end_date || '31 October 2026'}.`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  const stLines = doc.splitTextToSize(statement, 150);
  doc.text(stLines, PAGE_WIDTH / 2, y, { align: 'center' });
  y += stLines.length * 6 + 10;

  // Commendation text
  const commendation =
    'During the internship tenure, the candidate demonstrated exemplary diligence, technical aptitude, and commitment towards assigned project deliverables. Their professional conduct and problem-solving drive have been highly appreciated by the mentorship team.';
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_BODY_SLATE[0], COLOR_BODY_SLATE[1], COLOR_BODY_SLATE[2]);
  const comLines = doc.splitTextToSize(commendation, 150);
  doc.text(comLines, PAGE_WIDTH / 2, y, { align: 'center' });
  y += comLines.length * 5.5 + 16;

  // Particulars Grid Box
  doc.setFillColor(COLOR_ROW_ALT[0], COLOR_ROW_ALT[1], COLOR_ROW_ALT[2]);
  doc.setDrawColor(COLOR_BORDER_LINE[0], COLOR_BORDER_LINE[1], COLOR_BORDER_LINE[2]);
  doc.rect(PAGE_WIDTH / 2 - 75, y, 150, 14, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('CERTIFICATE ID', PAGE_WIDTH / 2 - 60, y + 4.5, { align: 'center' });
  doc.text('INTERN ID', PAGE_WIDTH / 2 - 20, y + 4.5, { align: 'center' });
  doc.text('ISSUE DATE', PAGE_WIDTH / 2 + 20, y + 4.5, { align: 'center' });
  doc.text('PERFORMANCE RATING', PAGE_WIDTH / 2 + 60, y + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text(opt.documentNumber, PAGE_WIDTH / 2 - 60, y + 10, { align: 'center' });
  doc.text(emp.employee_id, PAGE_WIDTH / 2 - 20, y + 10, { align: 'center' });
  doc.text(opt.issueDate || '24 October 2026', PAGE_WIDTH / 2 + 20, y + 10, { align: 'center' });
  doc.setTextColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
  doc.text('Grade A+ (Exemplary)', PAGE_WIDTH / 2 + 60, y + 10, { align: 'center' });
  y += 26;

  // Dual Signatures (HR Head & Managing Director)
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text('Jemsina Banu', MARGIN_LEFT + 25, y);
  doc.text('Managing Director', PAGE_WIDTH - MARGIN_RIGHT - 25, y, { align: 'right' });

  doc.setDrawColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_LEFT + 5, y + 3, MARGIN_LEFT + 55, y + 3);
  doc.line(PAGE_WIDTH - MARGIN_RIGHT - 55, y + 3, PAGE_WIDTH - MARGIN_RIGHT - 5, y + 3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text('Jemsina Banu', MARGIN_LEFT + 30, y + 8, { align: 'center' });
  doc.text('Managing Director', PAGE_WIDTH - MARGIN_RIGHT - 30, y + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('Head of Human Resources', MARGIN_LEFT + 30, y + 12, { align: 'center' });
  doc.text('AutoRevive Executive Board', PAGE_WIDTH - MARGIN_RIGHT - 30, y + 12, { align: 'center' });

  // Certificate Footer at bottom
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('AutoRevive • 99B Kuppusamy Reddy Street, Uthangarai, Krishnagiri – 635207, Tamil Nadu, India • autorevives.com', PAGE_WIDTH / 2, 275, { align: 'center' });
}

// =========================================================================
// 6. APPRECIATION CERTIFICATE (Authentic Prestigious Commendation)
// =========================================================================
function generateAppreciationCert(doc: jsPDF, emp: EmployeeData, opt: DocumentOptions): void {
  // Outer & Inner Certificate Framing
  doc.setDrawColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
  doc.setLineWidth(1.2);
  doc.rect(12, 12, 186, 273, 'S');

  doc.setDrawColor(COLOR_BORDER_LINE[0], COLOR_BORDER_LINE[1], COLOR_BORDER_LINE[2]);
  doc.setLineWidth(0.4);
  doc.rect(15, 15, 180, 267, 'S');

  const corners = [
    [15, 15],
    [195, 15],
    [15, 282],
    [195, 282],
  ];
  doc.setFillColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
  corners.forEach(([cx, cy]) => {
    doc.circle(cx, cy, 1.8, 'F');
  });

  drawWatermark(doc);

  let y = 30;

  // Header Logo & Company
  if (logoDataUri) {
    try {
      doc.addImage(logoDataUri, 'PNG', PAGE_WIDTH / 2 - 25, y, 50, 12.5);
      y += 16;
    } catch {
      y += 5;
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
  doc.text('AutoRevive', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 5.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('UNLOCK. BID. DRIVE. • CORPORATE RECOGNITION & EXCELLENCE', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 12;

  // Certificate Title
  doc.setDrawColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
  doc.setLineWidth(0.8);
  doc.line(PAGE_WIDTH / 2 - 45, y, PAGE_WIDTH / 2 + 45, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text('CERTIFICATE OF APPRECIATION', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 4;

  doc.line(PAGE_WIDTH / 2 - 45, y + 2, PAGE_WIDTH / 2 + 45, y + 2);
  y += 18;

  // Preamble
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('PROUDLY PRESENTED TO', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 12;

  // Recipient Name Prominently
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
  doc.text(emp.full_name, PAGE_WIDTH / 2, y, { align: 'center' });

  const nameWidth = doc.getTextWidth(emp.full_name);
  doc.setDrawColor(COLOR_BRAND_ORANGE[0], COLOR_BRAND_ORANGE[1], COLOR_BRAND_ORANGE[2]);
  doc.setLineWidth(0.5);
  doc.line(PAGE_WIDTH / 2 - nameWidth / 2 - 5, y + 2, PAGE_WIDTH / 2 + nameWidth / 2 + 5, y + 2);
  y += 16;

  // Commendation Statement
  const statement = `in sincere recognition and appreciation of outstanding dedication, exceptional leadership, and valuable contributions as ${emp.role} in the ${emp.department} at AutoRevive.`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  const stLines = doc.splitTextToSize(statement, 150);
  doc.text(stLines, PAGE_WIDTH / 2, y, { align: 'center' });
  y += stLines.length * 6 + 10;

  const note =
    'Your pursuit of operational excellence, commitment to customer value, and exemplary teamwork set an inspiring benchmark across the organization. AutoRevive proudly celebrates your achievements and extends best wishes for continued professional milestones.';
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_BODY_SLATE[0], COLOR_BODY_SLATE[1], COLOR_BODY_SLATE[2]);
  const noteLines = doc.splitTextToSize(note, 150);
  doc.text(noteLines, PAGE_WIDTH / 2, y, { align: 'center' });
  y += noteLines.length * 5.5 + 16;

  // Details Badge Box
  doc.setFillColor(COLOR_ROW_ALT[0], COLOR_ROW_ALT[1], COLOR_ROW_ALT[2]);
  doc.setDrawColor(COLOR_BORDER_LINE[0], COLOR_BORDER_LINE[1], COLOR_BORDER_LINE[2]);
  doc.rect(PAGE_WIDTH / 2 - 75, y, 150, 14, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('AWARD REFERENCE', PAGE_WIDTH / 2 - 50, y + 4.5, { align: 'center' });
  doc.text('STAFF ID', PAGE_WIDTH / 2, y + 4.5, { align: 'center' });
  doc.text('ISSUE DATE', PAGE_WIDTH / 2 + 50, y + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text(opt.documentNumber, PAGE_WIDTH / 2 - 50, y + 10, { align: 'center' });
  doc.text(emp.employee_id, PAGE_WIDTH / 2, y + 10, { align: 'center' });
  doc.text(opt.issueDate || '24 October 2026', PAGE_WIDTH / 2 + 50, y + 10, { align: 'center' });
  y += 26;

  // Dual Signatures
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text('Jemsina Banu', MARGIN_LEFT + 25, y);
  doc.text('Executive Board', PAGE_WIDTH - MARGIN_RIGHT - 25, y, { align: 'right' });

  doc.setDrawColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_LEFT + 5, y + 3, MARGIN_LEFT + 55, y + 3);
  doc.line(PAGE_WIDTH - MARGIN_RIGHT - 55, y + 3, PAGE_WIDTH - MARGIN_RIGHT - 5, y + 3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text('Jemsina Banu', MARGIN_LEFT + 30, y + 8, { align: 'center' });
  doc.text('Managing Director', PAGE_WIDTH - MARGIN_RIGHT - 30, y + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('Head of Human Resources', MARGIN_LEFT + 30, y + 12, { align: 'center' });
  doc.text('AutoRevive Executive Board', PAGE_WIDTH - MARGIN_RIGHT - 30, y + 12, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('AutoRevive • 99B Kuppusamy Reddy Street, Uthangarai, Krishnagiri – 635207, Tamil Nadu, India • autorevives.com', PAGE_WIDTH / 2, 275, { align: 'center' });
}

// =========================================================================
// 7. RELIEVING LETTER (1 Page, Balanced & Executive)
// =========================================================================
function generateRelievingLetter(doc: jsPDF, emp: EmployeeData, opt: DocumentOptions): void {
  drawLetterhead(doc, opt, 1, 1);
  let y = 42;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text('RELIEVING LETTER & SERVICE EXPERIENCE CONFIRMATION', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 8;

  // Recipient / Formal Salutation
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('TO WHOMSOEVER IT MAY CONCERN', MARGIN_LEFT, y);
  y += 8;

  // Certification Statement
  const openingCert = `This is to formally certify that ${emp.full_name} (Employee ID: ${emp.employee_id}) was employed with AutoRevive as ${emp.role} in the ${emp.department} from ${emp.joining_date || '01 August 2024'} to ${emp.end_date || '31 October 2026'}.`;
  y = drawParagraph(doc, openingCert, y, 10, 5.5, 'normal', COLOR_PRIMARY_SLATE);
  y += 6;

  // Service Particulars Summary Table
  const tableRows: Array<[string, string]> = [
    ['Employee Full Name', emp.full_name],
    ['Employee Identification ID', emp.employee_id],
    ['Final Designation / Position', emp.role],
    ['Department / Operational Unit', emp.department],
    ['Confirmed Date of Joining', emp.joining_date || '01 August 2024'],
    ['Effective Relieving Date', emp.end_date || '31 October 2026'],
    ['Status of Separation', 'Relieved in Good Standing upon Resignation'],
  ];

  y = drawKeyValueTable(doc, tableRows, y, 'SUMMARY OF EMPLOYMENT & SEPARATION', 58, 6.8);
  y += 8;

  // Detailed Operational Clearance Paragraphs
  const paragraphs = [
    `Pursuant to your resignation dated ${emp.end_date || '31 October 2026'}, you have been formally relieved from your duties and service obligations with AutoRevive at the close of official business hours on ${emp.end_date || '31 October 2026'}.`,
    'We confirm that you have successfully completed the formal handover of all company assets, hardware, digital access credentials, project documentation, and operational files. There are no outstanding financial dues or equipment liabilities pending on your account.',
    'During your tenure with AutoRevive, your conduct, integrity, and performance were found to be professional and commendable. We sincerely appreciate your dedication and contributions to our organization.',
    'We wish you continued professional success and all the very best in your future career endeavors.',
  ];

  paragraphs.forEach(p => {
    y = drawParagraph(doc, p, y, 9.5, 5.2, 'normal', COLOR_BODY_SLATE);
    y += 4;
  });

  y += 6;

  // Signatures
  drawSignatures(doc, y, undefined, false);
}

// =========================================================================
// 8. STIPEND CERTIFICATE (1 Page, Balanced & Executive)
// =========================================================================
function generateStipendCert(doc: jsPDF, emp: EmployeeData, opt: DocumentOptions): void {
  drawLetterhead(doc, opt, 1, 1);
  let y = 42;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text('CERTIFICATE OF STIPEND & ALLOWANCE DISBURSEMENT', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('TO WHOMSOEVER IT MAY CONCERN', MARGIN_LEFT, y);
  y += 8;

  const opening = `This is to formally certify that ${emp.full_name} (Intern / Employee ID: ${emp.employee_id}) has been engaged with AutoRevive as ${emp.role} in the ${emp.department} for the tenure from ${emp.start_date || '01 August 2026'} to ${emp.end_date || '31 October 2026'}.`;
  y = drawParagraph(doc, opening, y, 10, 5.5, 'normal', COLOR_PRIMARY_SLATE);
  y += 6;

  // Particulars Table
  const rows: Array<[string, string]> = [
    ['Candidate Full Name', emp.full_name],
    ['Intern / Staff ID', emp.employee_id],
    ['Designation / Training Domain', emp.role],
    ['Department / Operational Group', emp.department],
    ['Internship Engagement Period', `${emp.start_date || '01 August 2026'} to ${emp.end_date || '31 October 2026'}`],
    ['Monthly Stipend Amount', `Rs. ${Number(emp.stipend_month || 15000).toLocaleString('en-IN')} / month`],
    ['Mode of Disbursement', 'Direct Bank Transfer / Electronic Credit (NEFT)'],
    ['Tax Deduction at Source (TDS)', 'Compliant with Applicable Income Tax Regulations'],
  ];

  y = drawKeyValueTable(doc, rows, y, 'STIPEND DISBURSEMENT RECORD', 58, 6.8);
  y += 8;

  const notes = [
    'We confirm that all stipend installments due for the internship duration have been fully credited to the registered bank account of the candidate without any deduction or liability other than statutory withholdings.',
    'During this engagement, the candidate maintained consistent attendance, demonstrated professional discipline, and complied with all project quality guidelines.',
    'This certificate is issued upon the request of the individual for official, academic, financial, or banking verification purposes without any continuing financial liability on AutoRevive.',
  ];

  notes.forEach(p => {
    y = drawParagraph(doc, p, y, 9.5, 5.2, 'normal', COLOR_BODY_SLATE);
    y += 4;
  });

  y += 8;

  drawSignatures(doc, y, undefined, false);
}

// =========================================================================
// 9. EMPLOYMENT CERTIFICATE (1 Page, Balanced & Executive)
// =========================================================================
function generateEmploymentCert(doc: jsPDF, emp: EmployeeData, opt: DocumentOptions): void {
  drawLetterhead(doc, opt, 1, 1);
  let y = 42;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(COLOR_PRIMARY_SLATE[0], COLOR_PRIMARY_SLATE[1], COLOR_PRIMARY_SLATE[2]);
  doc.text('CERTIFICATE OF EMPLOYMENT & SERVICE CONFIRMATION', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('TO WHOMSOEVER IT MAY CONCERN', MARGIN_LEFT, y);
  y += 8;

  const opening = `This is to formally certify that ${emp.full_name} (Employee ID: ${emp.employee_id}) is a confirmed, full-time employee of AutoRevive, holding the position of ${emp.role} in the ${emp.department} since ${emp.joining_date || '01 August 2024'}.`;
  y = drawParagraph(doc, opening, y, 10, 5.5, 'normal', COLOR_PRIMARY_SLATE);
  y += 6;

  // Employment Particulars Table
  const rows: Array<[string, string]> = [
    ['Employee Full Name', emp.full_name],
    ['Employee Identification ID', emp.employee_id],
    ['Designation / Position', emp.role],
    ['Department / Function', emp.department],
    ['Employment Classification', emp.employment_type || 'Full-Time (Regular & Permanent)'],
    ['Date of Commencement / Joining', emp.joining_date || '01 August 2024'],
    ['Primary Work Location', emp.work_location || 'Uthangarai, Krishnagiri, Tamil Nadu'],
    ['Current Service Status', 'Active Service in Good Standing'],
  ];

  y = drawKeyValueTable(doc, rows, y, 'EMPLOYMENT VERIFICATION PARTICULARS', 58, 6.8);
  y += 8;

  const notes = [
    `As of the date of issuance of this certificate, ${emp.full_name} continues to be in active service with AutoRevive. Their professional performance, character, and conduct have been exemplary.`,
    'This certificate has been issued upon the specific request of the employee for administrative, banking, passport, or official record-keeping purposes.',
    'For any background verification queries, the Human Resources department of AutoRevive may be contacted directly at hr@autorevives.com or +91 9597969650.',
  ];

  notes.forEach(p => {
    y = drawParagraph(doc, p, y, 9.5, 5.2, 'normal', COLOR_BODY_SLATE);
    y += 4;
  });

  y += 8;

  drawSignatures(doc, y, undefined, false);
}

// =========================================================================
// MAIN DISPATCHER
// =========================================================================
export async function generateDocumentPdf(
  docType: string,
  employee: EmployeeData,
  options: DocumentOptions
): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  switch (docType) {
    case 'offer_letter':
      generateOfferLetter(doc, employee, options);
      break;
    case 'appointment_letter':
      generateAppointmentLetter(doc, employee, options);
      break;
    case 'internship_letter':
      generateInternshipLetter(doc, employee, options);
      break;
    case 'internship_cum_placement':
      generateInternshipCumPlacement(doc, employee, options);
      break;
    case 'internship_completion_certificate':
      generateInternshipCompletionCert(doc, employee, options);
      break;
    case 'appreciation_certificate':
      generateAppreciationCert(doc, employee, options);
      break;
    case 'relieving_letter':
      generateRelievingLetter(doc, employee, options);
      break;
    case 'stipend_certificate':
      generateStipendCert(doc, employee, options);
      break;
    case 'employment_certificate':
    default:
      generateEmploymentCert(doc, employee, options);
      break;
  }

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
