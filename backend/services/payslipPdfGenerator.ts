import { jsPDF } from 'jspdf';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function findProjectRoot(startPath: string): string {
  let currentPath = path.resolve(startPath);
  while ((!fs.existsSync(path.join(currentPath, 'package.json')) || !fs.existsSync(path.join(currentPath, 'backend')) || !fs.existsSync(path.join(currentPath, 'database'))) && path.dirname(currentPath) !== currentPath) {
    currentPath = path.dirname(currentPath);
  }
  return currentPath;
}

const projectRoot = findProjectRoot(path.dirname(fileURLToPath(import.meta.url)));

let logoDataUri = '';
try {
  const logoPath = path.join(projectRoot, 'frontend', 'public', 'autorevive-logo-tight.png');
  if (fs.existsSync(logoPath)) {
    logoDataUri = 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64');
  }
} catch (err) {
  console.warn('Could not load logo for payslip PDF generator:', err);
}

export interface PayslipData {
  payslipReference: string;
  payPeriod: string; // e.g. "2026-07" or "July 2026"
  monthName: string; // e.g. "JULY 2026"
  employeeId: string;
  employeeName: string;
  designation: string;
  department?: string;
  gender?: string;
  bankName?: string;
  accountNumber?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  ifscCode?: string;
  joiningDate?: string;
  paidDays: number;
  lopDays: number;
  earnings: {
    basic: number;
    hra: number;
    specialAllowance: number;
    otherEarnings?: number;
    incentives?: number;
    bonus?: number;
    overtimePay?: number;
    totalEarnings: number;
  };
  deductions: {
    providentFund?: number;
    esi?: number;
    professionalTax?: number;
    salaryAdvance?: number;
    tds?: number;
    unpaidLeave?: number;
    otherDeduction?: number;
    totalDeductions: number;
  };
  netPay: number;
  netPayInWords?: string;
  generatedOn?: string;
}

export function numberToWords(num: number): string {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if ((num = num.toString().length > 9 ? parseFloat(num.toString()) : num) === 0) return 'Zero Rupees Only';
  const n = ('000000000' + num).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
  return (str.trim() + ' Rupees Only').replace(/\s+/g, ' ');
}

export function maskAccountNumber(acc?: string): string {
  if (!acc) return '5010 06** **** 2166';
  const clean = acc.replace(/\s+/g, '');
  if (clean.length <= 6) return clean;
  const start = clean.slice(0, 4);
  const end = clean.slice(-4);
  return `${start} ** **** ${end}`;
}

export function generatePayslipPdf(data: PayslipData): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Outer Decorative Border
  doc.setDrawColor(220, 226, 232);
  doc.setLineWidth(0.3);
  doc.rect(margin, margin, contentWidth, 269);

  // 1. Brand Header
  let currentY = margin + 5;

  // Logo
  if (logoDataUri) {
    try {
      doc.addImage(logoDataUri, 'PNG', margin + 4, currentY, 38, 14);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(234, 88, 12);
      doc.setFontSize(16);
      doc.text('AutoRevive', margin + 4, currentY + 8);
    }
  }

  // Company Name and Details (Centered)
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.setFontSize(15);
  doc.text('AUTO REVIVE', 105, currentY + 3, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  doc.text('UNLOCK. BID. DRIVE.', 105, currentY + 7, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7.5);
  doc.text('No. 999, Kuppusamy Naidu Street, Uthangarai, Krishnagiri – 635207, Tamil Nadu, India.', 105, currentY + 11, { align: 'center' });
  doc.text('Email: hr@autorevives.com  |  Phone: +91 94426 93306', 105, currentY + 15, { align: 'center' });

  // Top Right Box: Payslip Reference
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(pageWidth - margin - 48, currentY - 1, 44, 16, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Payslip Reference', pageWidth - margin - 26, currentY + 4, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(234, 88, 12);
  doc.text(data.payslipReference, pageWidth - margin - 26, currentY + 10, { align: 'center' });

  currentY += 21;

  // Title Banner: PAYSLIP FOR THE MONTH OF [MONTH YEAR]
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`PAYSLIP FOR THE MONTH OF ${data.monthName.toUpperCase()}`, 105, currentY, { align: 'center' });

  currentY += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  // 2. Employee Details Box (Two Column Box)
  currentY += 4;
  const infoBoxY = currentY;
  const infoBoxHeight = 36;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, infoBoxY, contentWidth, infoBoxHeight, 'D');
  doc.line(105, infoBoxY, 105, infoBoxY + infoBoxHeight);

  // Left Column Details
  const leftX = margin + 4;
  const leftValX = margin + 38;
  doc.setFontSize(8);

  const leftRows = [
    ['Employee ID', `:  ${data.employeeId}`],
    ['Employee Name', `:  ${data.employeeName}`],
    ['Designation', `:  ${data.designation}`],
    ['Gender', `:  ${data.gender || 'Male'}`],
    ['PAN Card', `:  ${data.panNumber || 'ABCDE1234F'}`],
    ['Aadhaar Card', `:  ${data.aadhaarNumber || 'XXXX XXXX 8901'}`],
  ];

  leftRows.forEach((row, i) => {
    const rowY = infoBoxY + 5.5 + i * 5.2;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(row[0], leftX, rowY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(row[1], leftValX, rowY);
  });

  // Right Column Details
  const rightX = 105 + 4;
  const rightValX = 105 + 38;

  const rightRows = [
    ['Bank Name', `:  ${data.bankName || 'HDFC Bank'}`],
    ['A/C #', `:  ${maskAccountNumber(data.accountNumber)}`],
    ['IFSC Code', `:  ${data.ifscCode || 'HDFC0001234'}`],
    ['Date of Joining', `:  ${data.joiningDate || '15/01/2024'}`],
    ['Paid Days / LOP', `:  ${data.paidDays} Days  |  LOP: ${data.lopDays} Days`],
  ];

  rightRows.forEach((row, i) => {
    const rowY = infoBoxY + 5.5 + i * 5.2;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(row[0], rightX, rowY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(row[1], rightValX, rowY);
  });

  currentY += infoBoxHeight + 5;

  // 3. Earnings & Deductions Tables (Side by Side)
  const tableY = currentY;
  const colWidth = contentWidth / 2 - 1.5; // ~89.5mm
  const rightColX = margin + colWidth + 3;

  // Table Headers
  // Left: EARNINGS Header (Orange)
  doc.setFillColor(234, 88, 12);
  doc.rect(margin, tableY, colWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('EARNINGS', margin + 4, tableY + 5);
  doc.text('Amount (₹)', margin + colWidth - 4, tableY + 5, { align: 'right' });

  // Right: DEDUCTIONS Header (Brownish/Dark Orange)
  doc.setFillColor(180, 83, 9);
  doc.rect(rightColX, tableY, colWidth, 7, 'F');
  doc.text('DEDUCTIONS', rightColX + 4, tableY + 5);
  doc.text('Amount (₹)', rightColX + colWidth - 4, tableY + 5, { align: 'right' });

  // Rows Data
  const earningsList: Array<[string, number]> = [
    ['Basic', data.earnings.basic],
    ['HRA', data.earnings.hra],
    ['Special Allowance', data.earnings.specialAllowance],
    ['Other Earnings', data.earnings.otherEarnings || 0],
    ['Incentives', data.earnings.incentives || 0],
    ['Bonus', data.earnings.bonus || 0],
    ['Over Time Pay', data.earnings.overtimePay || 0],
  ];

  const deductionsList: Array<[string, number]> = [
    ['Provident Fund', data.deductions.providentFund || 0],
    ['ESI', data.deductions.esi || 0],
    ['Professional Tax', data.deductions.professionalTax || 0],
    ['Salary Advance', data.deductions.salaryAdvance || 0],
    ['TDS', data.deductions.tds || 0],
    ['Unpaid Leave', data.deductions.unpaidLeave || 0],
    ['Other Deduction', data.deductions.otherDeduction || 0],
  ];

  const maxRows = Math.max(earningsList.length, deductionsList.length);
  let rowY = tableY + 7;
  const rowHeight = 6.5;

  for (let i = 0; i < maxRows; i++) {
    const isEven = i % 2 === 0;
    // Left row background
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(margin, rowY, colWidth, rowHeight, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, rowY, colWidth, rowHeight, 'D');

    // Right row background
    doc.rect(rightColX, rowY, colWidth, rowHeight, 'F');
    doc.rect(rightColX, rowY, colWidth, rowHeight, 'D');

    // Left content
    if (earningsList[i]) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(earningsList[i][0], margin + 4, rowY + 4.5);
      doc.setFont('helvetica', 'bold');
      doc.text(earningsList[i][1].toLocaleString('en-IN', { minimumFractionDigits: 2 }), margin + colWidth - 4, rowY + 4.5, { align: 'right' });
    }

    // Right content
    if (deductionsList[i]) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(deductionsList[i][0], rightColX + 4, rowY + 4.5);
      doc.setFont('helvetica', 'bold');
      doc.text(deductionsList[i][1].toLocaleString('en-IN', { minimumFractionDigits: 2 }), rightColX + colWidth - 4, rowY + 4.5, { align: 'right' });
    }

    rowY += rowHeight;
  }

  // Totals Row
  doc.setFillColor(234, 88, 12);
  doc.rect(margin, rowY, colWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL EARNINGS', margin + 4, rowY + 5);
  doc.text(`₹ ${data.earnings.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, margin + colWidth - 4, rowY + 5, { align: 'right' });

  doc.setFillColor(180, 83, 9);
  doc.rect(rightColX, rowY, colWidth, 7, 'F');
  doc.text('TOTAL DEDUCTIONS', rightColX + 4, rowY + 5);
  doc.text(`₹ ${data.deductions.totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, rightColX + colWidth - 4, rowY + 5, { align: 'right' });

  rowY += 12;

  // 4. NET PAY BANNER (Solid Dark Navy Box)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, rowY, contentWidth, 10, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text('NET PAY', margin + 6, rowY + 6.8);
  doc.text(`INR ${data.netPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - margin - 6, rowY + 6.8, { align: 'right' });

  rowY += 16;

  // Net Pay in Words
  const words = data.netPayInWords || numberToWords(Math.round(data.netPay));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Net Pay in Words :', margin + 2, rowY);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(71, 85, 105);
  doc.text(words, margin + 34, rowY);

  // 5. Footer Notes & Signature Disclaimer
  const footerY = 274;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  const genDate = data.generatedOn || new Date().toLocaleString('en-GB');
  doc.text(`Generated on : ${genDate}`, margin + 2, footerY);
  doc.text('This is a system generated payslip and does not require signature.', pageWidth - margin - 2, footerY, { align: 'right' });

  return Buffer.from(doc.output('arraybuffer'));
}
