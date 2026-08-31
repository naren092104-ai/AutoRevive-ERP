import nodemailer from 'nodemailer';
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

export interface EmployeeRecord {
  employee_id: string;
  full_name: string;
  email: string | null;
  mobile: string | null;
  department: string;
  role: string;
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

export interface DocumentRecord {
  id: number;
  document_number: string;
  employee_id: string;
  document_type: string;
  issue_date: string;
  file_name: string;
  file_path: string;
  file_size?: number | null;
  email_status: 'NOT_SENT' | 'SENT' | 'FAILED';
  email_sent_at?: Date | string | null;
  email_error?: string | null;
}

export interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Returns document-specific subject and plain-text body with sanitized dynamic variables
 */
export function getEmailContent(docType: string, employee: EmployeeRecord, _doc?: DocumentRecord): { subject: string; bodyParagraphs: string[]; documentLabel: string } {
  const fullName = employee.full_name?.trim() || 'Valued Colleague';

  switch (docType) {
    case 'offer_letter':
    case 'autorevive_offer':
      return {
        subject: `AutoRevive – Offer Letter – ${fullName}`,
        documentLabel: 'Offer Letter',
        bodyParagraphs: [
          'Please find attached your Offer Letter issued by the Human Resources department of AutoRevive.',
          'We request you to review the document and retain it for your records.',
          'For any clarification, please contact the HR department at hr@autorevives.com or 9597969650.',
        ],
      };

    case 'internship_letter':
    case 'autorevive_internship':
      return {
        subject: `AutoRevive – Internship Letter – ${fullName}`,
        documentLabel: 'Internship Letter',
        bodyParagraphs: [
          'Please find attached your Internship Letter issued by the Human Resources department of AutoRevive.',
          'We request you to review the document and retain it for your records.',
          'For any clarification, please contact the HR department at hr@autorevives.com or 9597969650.',
        ],
      };

    case 'internship_cum_placement':
      return {
        subject: `AutoRevive – Internship Cum Placement Letter – ${fullName}`,
        documentLabel: 'Internship Cum Placement Letter',
        bodyParagraphs: [
          'Please find attached your Internship Cum Placement Letter issued by the Human Resources department of AutoRevive.',
          'We request you to review the document and retain it for your records.',
          'For any clarification, please contact the HR department at hr@autorevives.com or 9597969650.',
        ],
      };

    case 'appointment_letter':
    case 'autorevive_appointment':
    default:
      return {
        subject: `AutoRevive – Appointment Letter – ${fullName}`,
        documentLabel: 'Appointment Letter',
        bodyParagraphs: [
          'Please find attached your Appointment Letter issued by the Human Resources department of AutoRevive.',
          'We request you to review the document and retain it for your records.',
          'For any clarification, please contact the HR department at hr@autorevives.com or 9597969650.',
        ],
      };
  }
}

/**
 * Builds the complete plain text and MNC-standard HTML email
 */
export function buildEmail(docType: string, employee: EmployeeRecord, doc: DocumentRecord): EmailContent {
  const fullName = employee.full_name?.trim() || 'Valued Colleague';
  const { subject, bodyParagraphs } = getEmailContent(docType, employee, doc);

  const textLines: string[] = [
    `Dear ${fullName},`,
    '',
    `Greetings from AutoRevive.`,
    '',
    ...bodyParagraphs.flatMap(p => [p, '']),
    `Regards,`,
    `Jemsina Banu`,
    `Human Resources`,
    `AutoRevive`,
    `hr@autorevives.com`,
    `9597969650`,
    `autorevives.com`,
  ];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14.5px; line-height: 1.65; color: #1e293b; background-color: #ffffff;">
  <div style="max-width: 650px; margin: 0;">
    <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #0f172a;">Dear ${fullName},</p>

    <p style="margin: 0 0 16px 0; color: #334155; font-weight: 500;">Greetings from AutoRevive.</p>

    ${bodyParagraphs.map(p => `<p style="margin: 0 0 16px 0;">${p}</p>`).join('\n    ')}

    <p style="margin: 20px 0 24px 0; padding: 12px 16px; background-color: #fff7ed; border-left: 4px solid #EA580C; border-radius: 4px; color: #9a3412; font-size: 13.5px;">
      📎 <strong>Attached Document:</strong> ${doc.file_name}
    </p>

    <div style="margin-top: 24px;">
      <p style="margin: 0 0 4px 0; font-size: 14px; color: #475569;">Regards,</p>
      <p style="margin: 0; font-size: 15px; font-weight: bold; color: #0f172a;">Jemsina Banu</p>
      <p style="margin: 2px 0; font-size: 13px; font-weight: 600; color: #EA580C;">Human Resources</p>
      <p style="margin: 2px 0 6px 0; font-size: 13px; font-weight: bold; color: #1e293b;">AutoRevive</p>
      <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
        Email: <a href="mailto:hr@autorevives.com" style="color: #EA580C; text-decoration: none;">hr@autorevives.com</a><br>
        Phone: +91 9597969650<br>
        Website: <a href="https://autorevives.com" target="_blank" style="color: #EA580C; text-decoration: none;">autorevives.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  return {
    subject,
    text: textLines.join('\n'),
    html,
  };
}

/**
 * Creates nodemailer transporter from environment variables
 */
export function getMailTransporter() {
  const host = process.env.MAIL_SERVER || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.MAIL_PORT || process.env.SMTP_PORT || 587);
  const secure = process.env.MAIL_USE_TLS === 'false'
    ? false
    : (process.env.SMTP_SECURE === 'true' || port === 465);
  const user = process.env.MAIL_USERNAME || process.env.SMTP_USER;
  const pass = process.env.MAIL_PASSWORD || process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error('SMTP credentials are not configured in .env (MAIL_USERNAME and MAIL_PASSWORD).');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Sends professional HR email with stored PDF attachment and records delivery status
 */
export async function sendDocumentEmail(
  employee: EmployeeRecord, 
  doc: DocumentRecord,
  customOptions?: { subject?: string; text?: string; html?: string }
): Promise<{ success: boolean; message: string }> {
  if (!employee.email || !isValidEmail(employee.email)) {
    throw new Error('Employee email address is required to send this document.');
  }

  if (!fs.existsSync(doc.file_path)) {
    throw new Error(`Stored PDF not found at path: ${doc.file_path}`);
  }

  const defaultContent = buildEmail(doc.document_type, employee, doc);
  const subject = customOptions?.subject?.trim() || defaultContent.subject;
  const text = customOptions?.text?.trim() || defaultContent.text;
  const html = customOptions?.html || (customOptions?.text ? `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;"><p>${customOptions.text.replace(/\n/g, '<br/>')}</p></div>` : defaultContent.html);

  const transporter = getMailTransporter();
  const mailFrom = process.env.MAIL_FROM || process.env.SMTP_FROM || 'AutoRevive HR <hr@autorevives.com>';

  const mailOptions = {
    from: mailFrom,
    to: employee.email,
    subject,
    text,
    html,
    attachments: [
      {
        filename: doc.file_name,
        path: doc.file_path,
        contentType: 'application/pdf',
      },
    ],
  };

  await transporter.sendMail(mailOptions);
  return {
    success: true,
    message: `Document successfully emailed to ${employee.email}.`,
  };
}

/**
 * Dispatches official OTP authentication code to registered admin email
 */
export async function sendOtpEmail(email: string, otp: string, adminName: string): Promise<void> {
  try {
    const transporter = getMailTransporter();
    const fromEmail = process.env.MAIL_FROM || process.env.SMTP_FROM || 'hr@autorevives.com';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #EA580C; margin: 0; font-size: 24px; font-weight: 800;">AutoRevive</h2>
          <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Official Administrator Authentication</p>
        </div>
        <div style="padding: 20px; background: #f8fafc; border-radius: 8px; text-align: center;">
          <p style="color: #334155; font-size: 14px; margin: 0 0 12px 0;">Hello <strong>${adminName}</strong>,</p>
          <p style="color: #475569; font-size: 13px; margin: 0 0 16px 0;">Use the following One-Time Password (OTP) to securely access your AutoRevive Admin Portal:</p>
          <div style="display: inline-block; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #EA580C; background: #fff; padding: 12px 28px; border: 2px dashed #EA580C; border-radius: 8px; margin-bottom: 12px;">
            ${otp}
          </div>
          <p style="color: #ef4444; font-size: 11.5px; font-weight: 600; margin: 8px 0 0 0;">⏱ This OTP is valid for 10 minutes. Do not share it with anyone.</p>
        </div>
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 20px;">If you did not request this login code, please contact your Super Administrator immediately.</p>
      </div>
    `;
    await transporter.sendMail({
      from: `"AutoRevive Security" <${fromEmail}>`,
      to: email,
      subject: `AutoRevive Admin Login OTP: ${otp}`,
      text: `Your AutoRevive Admin Login OTP is: ${otp}. Valid for 10 minutes.`,
      html,
    });
  } catch (err) {
    console.warn('Could not dispatch OTP email via SMTP:', err);
  }
}

