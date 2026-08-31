import express, { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import { checkDatabaseConnection, db, initializeDatabase, nextDocumentNumber } from '../database/database';
import { generateDocumentPdf } from './services/pdfGenerator';
import { sendDocumentEmail, isValidEmail } from './services/emailService';
import { erpRouter } from './routes/erpRoutes';
import { rbacRouter } from './routes/rbacRoutes';

const app = express();
const PORT = Number(process.env.PORT || 4000);
function findProjectRoot(startPath: string): string {
  let currentPath = path.resolve(startPath);
  while ((!fs.existsSync(path.join(currentPath, 'package.json')) || !fs.existsSync(path.join(currentPath, 'backend')) || !fs.existsSync(path.join(currentPath, 'database'))) && path.dirname(currentPath) !== currentPath) {
    currentPath = path.dirname(currentPath);
  }
  return currentPath;
}

const projectRoot = findProjectRoot(path.dirname(fileURLToPath(import.meta.url)));
const generatedDocumentsRoot = path.join(projectRoot, 'backend', 'generated_documents');
fs.mkdirSync(generatedDocumentsRoot, { recursive: true });

const DOCUMENT_TYPES = [
  'offer_letter',
  'internship_letter',
  'internship_cum_placement',
  'appointment_letter',
  'internship_completion_certificate',
  'appreciation_certificate',
  'relieving_letter',
  'stipend_certificate',
  'employment_certificate',
] as const;
type DocumentType = typeof DOCUMENT_TYPES[number];

function cleanFilename(value: string): string {
  return value.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^\.+/, '').slice(0, 150) || 'Document';
}

function documentPrefix(documentType: string): string {
  if (documentType === 'offer_letter') return 'HR';
  if (documentType === 'appointment_letter') return 'APT';
  if (documentType === 'internship_letter' || documentType === 'internship_cum_placement') return 'INT';
  if (documentType === 'relieving_letter') return 'REL';
  if (documentType === 'stipend_certificate') return 'STP';
  if (documentType === 'employment_certificate') return 'EMP';
  return 'CERT';
}

function employeePayload(body: any): Record<string, unknown> {
  return {
    employee_id: body.employee_id,
    full_name: body.full_name,
    parent_name: body.parent_name || null,
    email: body.email || null,
    mobile: body.mobile || null,
    college: body.college || null,
    register_no: body.register_no || null,
    department: body.department,
    role: body.role,
    employment_type: body.employment_type || null,
    work_location: body.work_location || null,
    address: body.address || null,
    joining_date: body.joining_date || null,
    start_date: body.start_date || null,
    end_date: body.end_date || null,
    duration_months: body.duration_months ?? null,
    stipend_month: body.stipend_month ?? null,
    salary_month: body.salary_month ?? null,
    annual_ctc: body.annual_ctc ?? null,
    placement_status: body.placement_status || null,
  };
}

function validateEmployee(body: any): string | null {
  for (const field of ['employee_id', 'full_name', 'department', 'role']) {
    if (typeof body?.[field] !== 'string' || !body[field].trim()) return `${field} is required.`;
  }
  if (body.email && !isValidEmail(body.email)) return 'A valid email address is required.';
  if (body.mobile && !/^[+()\-\s\d]{7,20}$/.test(body.mobile)) return 'A valid phone number is required.';
  if (body.start_date && body.end_date && body.end_date < body.start_date) return 'End date cannot be before start date.';
  for (const field of ['duration_months', 'stipend_month', 'salary_month', 'annual_ctc']) {
    if (body[field] !== undefined && body[field] !== null && (!Number.isFinite(Number(body[field])) || Number(body[field]) < 0)) {
      return `${field} must be a non-negative number.`;
    }
  }
  return null;
}

// High payload limit for receiving base64 PDF attachments and multiple scanned KYC documents
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-id, x-admin-role, x-admin-email, x-admin-name, x-employee-id');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(origin && allowedOrigins.includes(origin) ? 204 : 403);
    return;
  }
  next();
});

app.use('/api', erpRouter);
app.use('/api', rbacRouter);

app.post('/api/employees', async (req: Request, res: Response): Promise<void> => {
  const error = validateEmployee(req.body);
  if (error) {
    res.status(400).json({ success: false, message: error });
    return;
  }
  try {
    const employee = employeePayload(req.body);
    await db.prepare(`
      INSERT INTO employees (${Object.keys(employee).join(', ')}) VALUES (${Object.keys(employee).map((key) => `:${key}`).join(', ')})
      ON DUPLICATE KEY UPDATE ${Object.keys(employee).filter((key) => key !== 'employee_id').map((key) => `${key} = VALUES(${key})`).join(', ')}, updated_at = CURRENT_TIMESTAMP
    `).run(employee);
    const saved = await db.prepare('SELECT * FROM employees WHERE employee_id = ?').get([employee.employee_id]);
    res.status(200).json({ success: true, employee: saved });
  } catch (error) {
    console.error('Employee save error:', error);
    res.status(500).json({ success: false, message: 'Unable to save employee record.' });
  }
});

app.get('/api/employees', async (_req: Request, res: Response): Promise<void> => {
  res.json({ success: true, employees: await db.prepare('SELECT * FROM employees ORDER BY updated_at DESC').all() });
});

app.get('/api/employees/:employeeId', async (req: Request, res: Response): Promise<void> => {
  const employee = await db.prepare('SELECT * FROM employees WHERE employee_id = ?').get([req.params.employeeId]);
  if (!employee) {
    res.status(404).json({ success: false, message: 'Employee not found.' });
    return;
  }
  res.json({ success: true, employee });
});

app.put('/api/employees/:employeeId', async (req: Request, res: Response): Promise<void> => {
  const error = validateEmployee({ ...req.body, employee_id: req.params.employeeId });
  if (error) {
    res.status(400).json({ success: false, message: error });
    return;
  }
  const employee = employeePayload({ ...req.body, employee_id: req.params.employeeId });
  const result = await db.prepare(`UPDATE employees SET ${Object.keys(employee).filter((key) => key !== 'employee_id').map((key) => `${key} = :${key}`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE employee_id = :employee_id`).run(employee);
  if (!result.changes) {
    res.status(404).json({ success: false, message: 'Employee not found.' });
    return;
  }
  res.json({ success: true, employee: await db.prepare('SELECT * FROM employees WHERE employee_id = ?').get([req.params.employeeId]) });
});

app.delete('/api/employees/:employeeId', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.prepare('DELETE FROM employees WHERE employee_id = ?').run([req.params.employeeId]);
    if (!result.changes) {
      res.status(404).json({ success: false, message: 'Employee not found.' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    res.status(409).json({ success: false, message: 'Employee cannot be deleted while documents reference it.' });
  }
});

app.post('/api/documents/generate', async (req: Request, res: Response): Promise<void> => {
  const {
    employee_id: employeeId,
    document_type: documentType,
    pdf_base64: pdfBase64,
    file_name: requestedFilename,
    issue_date: issueDate,
    status: docStatus,
    document_data: documentData,
    document_number: customDocNum,
  } = req.body || {};

  if (!employeeId) {
    res.status(400).json({ success: false, message: 'employee_id is required.' });
    return;
  }
  const employee = await db.prepare('SELECT * FROM employees WHERE employee_id = ?').get([employeeId]) as any;
  if (!employee) {
    res.status(404).json({ success: false, message: 'A saved employee record is required.' });
    return;
  }
  if (!DOCUMENT_TYPES.includes(documentType)) {
    res.status(400).json({ success: false, message: `Unsupported document type: ${documentType}` });
    return;
  }

  try {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const documentNumber = customDocNum || (await nextDocumentNumber(documentPrefix(documentType), year));
    const currentDocumentData = documentData && typeof documentData === 'object' ? documentData : {};
    const salary = currentDocumentData.salary && typeof currentDocumentData.salary === 'object' ? currentDocumentData.salary : {};
    const pdfEmployee = {
      ...employee,
      full_name: currentDocumentData.candidateName || employee.full_name,
      email: currentDocumentData.candidateEmail || employee.email,
      mobile: currentDocumentData.candidatePhone || employee.mobile,
      department: currentDocumentData.department || employee.department,
      role: currentDocumentData.jobTitle || employee.role,
      work_location: currentDocumentData.baseLocation || currentDocumentData.workLocation || employee.work_location,
      address: currentDocumentData.candidateAddress || employee.address,
      joining_date: currentDocumentData.joiningDate || employee.joining_date,
      start_date: currentDocumentData.internshipStartDate || employee.start_date,
      end_date: currentDocumentData.internshipEndDate || employee.end_date,
      stipend_month: salary.totalCTCMonthly ?? employee.stipend_month,
      salary_month: salary.totalCTCMonthly ?? employee.salary_month,
      annual_ctc: salary.totalCTCAnnual ?? employee.annual_ctc,
    };

    // Format human-readable document type for professional filename: [Employee Name]_[Document Type]_[Reference Number].pdf
    const typeLabel =
      documentType === 'internship_cum_placement'
        ? 'Internship_Cum_Placement_Letter'
        : documentType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()).replace(/\s+/g, '_');
    const safeEmpName = employee.full_name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeRef = documentNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = requestedFilename
      ? cleanFilename(requestedFilename).replace(/\.pdf$/, '') + '.pdf'
      : `${safeEmpName}_${typeLabel}_${safeRef}.pdf`;

    const directory = path.join(generatedDocumentsRoot, String(year), month);
    fs.mkdirSync(directory, { recursive: true });
    const filePath = path.join(directory, `${safeRef}_${filename}`);

    let pdfBuffer: Buffer;
    if (typeof pdfBase64 === 'string' && /^data:application\/pdf[^,]*,/i.test(pdfBase64)) {
      pdfBuffer = Buffer.from(pdfBase64.slice(pdfBase64.indexOf(',') + 1), 'base64');
    } else {
      pdfBuffer = await generateDocumentPdf(documentType, pdfEmployee, {
        documentNumber,
        issueDate: issueDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
      });
    }

    fs.writeFileSync(filePath, pdfBuffer);
    const fileSize = pdfBuffer.length;
    const finalStatus = docStatus || 'PDF Generated';
    const jsonDocData = documentData ? JSON.stringify(documentData) : null;

    const result = await db.prepare(`
      INSERT INTO hr_documents (document_number, employee_id, document_type, status, issue_date, file_name, file_path, file_size, document_data, email_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'NOT_SENT')
    `).run([documentNumber, employeeId, documentType, finalStatus, issueDate || new Date().toISOString().slice(0, 10), filename, filePath, fileSize, jsonDocData]);

    const savedDoc = await db.prepare('SELECT d.*, e.full_name, e.email FROM hr_documents d JOIN employees e ON e.employee_id = d.employee_id WHERE d.id = ?').get([result.lastInsertRowid]);
    res.status(201).json({ success: true, document: savedDoc });
  } catch (error) {
    console.error('Document generation error:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Unable to generate and store document.' });
  }
});

app.get('/api/documents', async (req: Request, res: Response): Promise<void> => {
  const search = String(req.query.search || '').trim();
  const type = String(req.query.document_type || '').trim();
  const emailStatus = String(req.query.email_status || '').trim();
  const docStatus = String(req.query.status || '').trim();
  const documents = await db.prepare(`
    SELECT d.*, e.full_name, e.email, e.mobile, e.role, e.department FROM hr_documents d JOIN employees e ON e.employee_id = d.employee_id
    WHERE (? = '' OR e.full_name LIKE '%' || ? || '%' OR e.employee_id LIKE '%' || ? || '%' OR e.email LIKE '%' || ? || '%' OR d.document_number LIKE '%' || ? || '%')
      AND (? = '' OR d.document_type = ?) AND (? = '' OR d.email_status = ?) AND (? = '' OR d.status = ?)
    ORDER BY d.updated_at DESC, d.created_at DESC
  `).all([search, search, search, search, search, type, type, emailStatus, emailStatus, docStatus, docStatus]);
  res.json({ success: true, documents });
});

app.get('/api/documents/employee/:employeeId', async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true, documents: await db.prepare('SELECT * FROM hr_documents WHERE employee_id = ? ORDER BY created_at DESC').all([req.params.employeeId]) });
});

app.get('/api/documents/email-history', async (_req: Request, res: Response): Promise<void> => {
  try {
    const logs = await db.prepare('SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 50').all();
    res.json({ success: true, logs });
  } catch (err) {
    res.json({ success: true, logs: [] });
  }
});

app.get('/api/documents/:id', async (req: Request, res: Response): Promise<void> => {
  const document = await db.prepare('SELECT d.*, e.full_name, e.email FROM hr_documents d JOIN employees e ON e.employee_id = d.employee_id WHERE d.id = ?').get([req.params.id]);
  if (!document) {
    res.status(404).json({ success: false, message: 'Document not found.' });
    return;
  }
  res.json({ success: true, document });
});

app.put('/api/documents/:id', async (req: Request, res: Response): Promise<void> => {
  const { status, issue_date, document_data } = req.body || {};
  try {
    const existing = await db.prepare('SELECT * FROM hr_documents WHERE id = ?').get([req.params.id]) as any;
    if (!existing) {
      res.status(404).json({ success: false, message: 'Document not found.' });
      return;
    }

    const newStatus = status || existing.status || 'Created';
    const newIssueDate = issue_date || existing.issue_date;
    const newDocData = document_data ? JSON.stringify(document_data) : existing.document_data;

    await db.prepare(`
      UPDATE hr_documents
      SET status = ?, issue_date = ?, document_data = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run([newStatus, newIssueDate, newDocData, req.params.id]);

    const updated = await db.prepare(`
      SELECT d.*, e.full_name, e.email FROM hr_documents d JOIN employees e ON e.employee_id = d.employee_id WHERE d.id = ?
    `).get([req.params.id]);

    res.json({ success: true, message: 'Document updated successfully.', document: updated });
  } catch (err: any) {
    console.error('Document update error:', err);
    res.status(500).json({ success: false, message: err?.message || 'Failed to update document.' });
  }
});

app.delete('/api/documents/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await db.prepare('SELECT * FROM hr_documents WHERE id = ?').get([req.params.id]) as any;
    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found.' });
      return;
    }
    if (doc.file_path && fs.existsSync(doc.file_path)) {
      try { fs.unlinkSync(doc.file_path); } catch (e) { console.warn('File unlink error:', e); }
    }
    await db.prepare('DELETE FROM email_logs WHERE document_id = ?').run([req.params.id]);
    await db.prepare('DELETE FROM hr_documents WHERE id = ?').run([req.params.id]);

    res.json({ success: true, message: 'Document deleted successfully.' });
  } catch (err: any) {
    console.error('Document delete error:', err);
    res.status(500).json({ success: false, message: err?.message || 'Failed to delete document.' });
  }
});

app.get('/api/documents/:id/download', async (req: Request, res: Response): Promise<void> => {
  const document = await db.prepare('SELECT d.*, e.full_name FROM hr_documents d JOIN employees e ON e.employee_id = d.employee_id WHERE d.id = ?').get([req.params.id]) as any;
  if (!document || !fs.existsSync(document.file_path)) {
    res.status(404).json({ success: false, message: 'Stored PDF not found.' });
    return;
  }
  const safeEmpName = (document.full_name || 'Employee').replace(/[^a-zA-Z0-9_-]/g, '_');
  const typeLabel = (document.document_type || 'Document').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()).replace(/\s+/g, '_');
  const safeRef = (document.document_number || 'Ref').replace(/[^a-zA-Z0-9_-]/g, '_');
  const downloadName = `${safeEmpName}_${typeLabel}_${safeRef}.pdf`;

  res.download(document.file_path, downloadName);
});

app.get('/api/documents/:id/preview', async (req: Request, res: Response): Promise<void> => {
  const document = await db.prepare('SELECT file_name, file_path FROM hr_documents WHERE id = ?').get([req.params.id]) as { file_name: string; file_path: string } | undefined;
  if (!document || !fs.existsSync(document.file_path)) {
    res.status(404).json({ success: false, message: 'Stored PDF not found.' });
    return;
  }
  res.type('application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${document.file_name.replace(/"/g, '')}"`);
  res.sendFile(document.file_path);
});

app.post('/api/documents/:id/send-email', async (req: Request, res: Response): Promise<void> => {
  const document = await db.prepare('SELECT * FROM hr_documents WHERE id = ?').get([req.params.id]) as any;
  if (!document) {
    res.status(404).json({ success: false, message: 'Document not found.' });
    return;
  }

  const employee = await db.prepare('SELECT * FROM employees WHERE employee_id = ?').get([document.employee_id]) as any;
  if (!employee) {
    res.status(404).json({ success: false, message: 'Employee record not found.' });
    return;
  }

  if (!employee.email || !employee.email.trim()) {
    res.status(400).json({ success: false, message: 'Employee email address is required to send this document.' });
    return;
  }

  if (!isValidEmail(employee.email)) {
    res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    return;
  }

  if (!fs.existsSync(document.file_path)) {
    res.status(404).json({ success: false, message: 'Stored PDF file was not found on disk.' });
    return;
  }

  try {
    const { subject, body, text } = req.body || {};
    const result = await sendDocumentEmail(employee, document, { subject, text: body || text });
    await db.prepare(`
      UPDATE hr_documents
      SET email_status = 'SENT', email_sent_at = CURRENT_TIMESTAMP, status = 'Sent', email_error = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run([req.params.id]);

    await db.prepare(`
      INSERT INTO email_logs (document_id, employee_id, document_type, recipient_email, file_name, status, error_message)
      VALUES (?, ?, ?, ?, ?, 'SENT', NULL)
    `).run([
      document.id,
      employee.employee_id,
      document.document_type,
      employee.email,
      document.file_name,
    ]);

    res.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Document email error:', error);
    const safeError = error instanceof Error ? error.message.slice(0, 500) : 'SMTP delivery failed';
    await db.prepare(`
      UPDATE hr_documents
      SET email_status = 'FAILED', email_error = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run([safeError, req.params.id]);

    await db.prepare(`
      INSERT INTO email_logs (document_id, employee_id, document_type, recipient_email, file_name, status, error_message)
      VALUES (?, ?, ?, ?, ?, 'FAILED', ?)
    `).run([
      document.id,
      employee.employee_id,
      document.document_type,
      employee.email,
      document.file_name,
      safeError,
    ]);

    res.status(502).json({
      success: false,
      message: 'Failed to send email. The PDF remains saved and you can retry sending.',
      error: safeError,
    });
  }
});

app.post('/api/documents/email', async (req: Request, res: Response): Promise<void> => {
  const { employeeId, documentType, recipientEmail, subject, body, text } = req.body || {};

  if (!employeeId || typeof employeeId !== 'string') {
    res.status(400).json({ success: false, message: 'Valid employeeId is required.' });
    return;
  }

  const rawDocType = (documentType || 'offer_letter').toLowerCase();
  const backendDocType =
    rawDocType === 'autorevive_offer' ? 'offer_letter' :
    rawDocType === 'autorevive_internship' ? 'internship_letter' :
    rawDocType === 'autorevive_appointment' ? 'appointment_letter' :
    rawDocType;

  // 1. Validate employee or candidate application
  let employee = await db.prepare('SELECT * FROM employees WHERE employee_id = ?').get([employeeId]) as any;
  let isCandidate = false;
  let candidateApp: any = null;
  let offerToken: string | null = null;

  if (!employee) {
    candidateApp = await db.prepare('SELECT * FROM job_applications WHERE application_id = ? OR candidate_id = ?').get([employeeId, employeeId]) as any;
    if (candidateApp) {
      isCandidate = true;
      offerToken = candidateApp.offer_token || `offer-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;
      employee = {
        employee_id: candidateApp.application_id,
        full_name: candidateApp.full_name,
        email: candidateApp.email,
        mobile: candidateApp.mobile,
        department: candidateApp.job_title?.toLowerCase().includes('sales') ? 'Sales & Business Development' : 'Engineering',
        role: candidateApp.job_title,
        work_location: candidateApp.preferred_location || 'Uthangarai, Krishnagiri',
        address: candidateApp.current_address || 'Uthangarai, Krishnagiri',
        joining_date: candidateApp.expected_joining_date || '03/11/2026',
        salary_month: 41500,
        annual_ctc: 498000,
      };
    }
  }

  if (!employee) {
    res.status(404).json({ success: false, message: `Record with ID ${employeeId} not found.` });
    return;
  }

  // 2. Validate recipient email
  const targetEmail = recipientEmail?.trim() || employee.email?.trim();
  if (!targetEmail || !isValidEmail(targetEmail)) {
    res.status(400).json({ success: false, message: 'A valid recipient email address is required.' });
    return;
  }

  // 3. Generate or retrieve existing saved PDF (Single Generation Rule)
  let document = await db.prepare(
    'SELECT * FROM hr_documents WHERE employee_id = ? AND document_type = ? ORDER BY id DESC LIMIT 1'
  ).get([employeeId, backendDocType]) as any;

  if (!document || !fs.existsSync(document.file_path)) {
    const dateObj = new Date();
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const docNumber = await nextDocumentNumber(documentPrefix(backendDocType), year);
    const typeLabel =
      backendDocType === 'offer_letter' ? 'Offer_Letter' :
      backendDocType === 'appointment_letter' ? 'Appointment_Letter' :
      backendDocType === 'internship_letter' ? 'Internship_Letter' :
      backendDocType === 'internship_cum_placement' ? 'Internship_Cum_Placement_Letter' :
      cleanFilename(backendDocType.replace(/_/g, ' '));
    const safeEmpName = employee.full_name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `AutoRevive_${typeLabel}_${safeEmpName}.pdf`;

    const targetDir = path.join(generatedDocumentsRoot, String(year), month);
    fs.mkdirSync(targetDir, { recursive: true });
    const targetPath = path.join(targetDir, `${docNumber.replace(/\//g, '-')}_${fileName}`);

    const pdfBuffer = await generateDocumentPdf(backendDocType, employee, {
      documentNumber: docNumber,
      issueDate: employee.joining_date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    });
    fs.writeFileSync(targetPath, pdfBuffer);

    const insertResult = await db.prepare(`
      INSERT INTO hr_documents (document_number, employee_id, document_type, issue_date, file_name, file_path, file_size, email_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'NOT_SENT')
    `).run([
      docNumber,
      employee.employee_id,
      backendDocType,
      new Date().toISOString().slice(0, 10),
      fileName,
      targetPath,
      pdfBuffer.length,
    ]);

    document = await db.prepare('SELECT * FROM hr_documents WHERE id = ?').get([insertResult.lastInsertRowid]) as any;
  }

  // 4. Send email using exact HR email content + include Acceptance Link if candidate Offer Letter
  try {
    const updatedEmployee = { ...employee, email: targetEmail };
    let mailContent = body || text || '';
    if (isCandidate && backendDocType === 'offer_letter' && offerToken) {
      const acceptUrl = `${process.env.APP_URL || 'http://localhost:3000'}/offer/accept/${offerToken}`;
      if (!mailContent.includes(offerToken) && !mailContent.includes('/offer/accept/')) {
        mailContent += `\n\nOfficial Digital Offer Review & Acceptance Link:\n${acceptUrl}\n\nPlease click the link above to confirm your joining date and accept your offer online.`;
      }
    }

    if (backendDocType === 'appointment_letter') {
      const portalUrl = `${process.env.APP_URL || 'http://localhost:3000'}/#employee_portal`;
      const empId = employee.employee_id;
      const defaultPassword = 'AutoRevive@2026';

      mailContent += `\n\n=====================================================\nOFFICIAL EMPLOYEE SELF-SERVICE PORTAL ACCESS CREDENTIALS\n=====================================================\nWelcome to the AutoRevive corporate team! Your appointment is formally confirmed. You can now access your Employee Self-Service Portal to log daily attendance, view monthly payslips, and complete assigned tasks.\n\nPortal Login URL: ${portalUrl}\nYour Official Employee ID: ${empId}\nYour Portal Login Password: ${defaultPassword}\n\nEmployee Portal Features Enabled:\n1. 🕒 Attendance & Clock-In Terminal (Daily check-in, check-out, working hours, leave requests)\n2. 💵 Monthly Payslips (PAN & Aadhaar linked salary statements, allowances breakdown, PDF download)\n3. 📋 Task Management (Active sprint deliverables, daily work logs, task status tracking)\n=====================================================`;
    }

    await sendDocumentEmail(updatedEmployee, document, { subject, text: mailContent });

    // 5. If candidate, update job_applications table status
    if (isCandidate && candidateApp) {
      if (backendDocType === 'offer_letter') {
        await db.prepare(`
          UPDATE job_applications 
          SET offer_token = ?, offer_status = 'SENT', status = 'OFFER_SENT' 
          WHERE id = ?
        `).run([offerToken, candidateApp.id]);
      } else if (backendDocType === 'appointment_letter') {
        await db.prepare(`
          UPDATE job_applications 
          SET appointment_status = 'SENT', appointment_sent_at = CURRENT_TIMESTAMP, status = 'APPOINTMENT_ISSUED' 
          WHERE id = ?
        `).run([candidateApp.id]);
      }
    }

    // 6. Update SQL status in hr_documents and log in email_logs
    await db.prepare(`
      UPDATE hr_documents
      SET email_status = 'SENT', email_sent_at = CURRENT_TIMESTAMP, status = 'Sent', email_error = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run([document.id]);

    await db.prepare(`
      INSERT INTO email_logs (document_id, employee_id, document_type, recipient_email, file_name, status, error_message)
      VALUES (?, ?, ?, ?, ?, 'SENT', NULL)
    `).run([
      document.id,
      employee.employee_id,
      backendDocType,
      targetEmail,
      document.file_name,
    ]);

    res.json({
      success: true,
      message: 'Email sent successfully',
      pdfAttached: true,
      isCandidate,
      offerToken,
      recipientEmail: targetEmail,
      fileName: document.file_name,
      documentNumber: document.document_number,
    });
  } catch (error) {
    console.error('Document email error:', error);
    const safeError = error instanceof Error ? error.message.slice(0, 500) : 'SMTP delivery failed';

    await db.prepare(`
      UPDATE hr_documents
      SET email_status = 'FAILED', email_error = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run([safeError, document.id]);

    await db.prepare(`
      INSERT INTO email_logs (document_id, employee_id, document_type, recipient_email, file_name, status, error_message)
      VALUES (?, ?, ?, ?, ?, 'FAILED', ?)
    `).run([
      document.id,
      employee.employee_id,
      backendDocType,
      targetEmail,
      document.file_name,
      safeError,
    ]);
 
     res.status(502).json({
       success: false,
       message: 'Email could not be sent',
       error: safeError,
     });
   }
 });
 
 // Helper to create nodemailer transporter from request body or env
function getTransporter() {
  const host = process.env.MAIL_SERVER || process.env.SMTP_HOST;
  const port = Number(process.env.MAIL_PORT || process.env.SMTP_PORT || 587);
  const secure = process.env.MAIL_USE_TLS === 'false'
    ? false
    : (process.env.SMTP_SECURE === 'true' || port === 465);
  const user = process.env.MAIL_USERNAME || process.env.SMTP_USER;
  const pass = process.env.MAIL_PASSWORD || process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error('SMTP Username and Password/App Password are required.');
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

// ==========================================
// 1. TEST SMTP CONNECTION ENDPOINT
// ==========================================
app.post('/api/email/test-smtp', async (req: Request, res: Response): Promise<void> => {
  try {
    const host = process.env.MAIL_SERVER || process.env.SMTP_HOST;
    const port = Number(process.env.MAIL_PORT || process.env.SMTP_PORT || 587);
    const user = process.env.MAIL_USERNAME || process.env.SMTP_USER;
    const pass = process.env.MAIL_PASSWORD || process.env.SMTP_PASS;

    if (!user || !pass) {
      res.status(400).json({
        success: false,
        message: 'SMTP is not configured on the server.',
      });
      return;
    }

    const transporter = getTransporter();
    
    // Verify SMTP connection
    await transporter.verify();

    res.json({
      success: true,
      message: `SMTP connection established successfully to ${host || 'SMTP Server'}:${port || 587}`,
      host: host || 'smtp.gmail.com',
      port: port || 587,
      user: 'configured',
    });
  } catch (error: any) {
    console.error('SMTP Verification Error:', error);
    res.status(400).json({
      success: false,
      message: error?.message || 'Failed to authenticate with SMTP server. Please check your credentials or App Password.',
      code: error?.code,
    });
  }
});

// ==========================================
// 2. SEND EMAIL WITH PDF ATTACHMENT ENDPOINT
// ==========================================
app.post('/api/email/send', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      to,
      cc,
      bcc,
      subject,
      text,
      html,
      fromName,
      fromEmail,
      replyTo,
      attachments, // Array of { filename, content (base64 or buffer), contentType }
    } = req.body || {};

    if (!to) {
      res.status(400).json({
        success: false,
        message: 'Recipient email address (To) is required.',
      });
      return;
    }

    if (!subject) {
      res.status(400).json({
        success: false,
        message: 'Email subject line is required.',
      });
      return;
    }

    const senderEmail = process.env.MAIL_FROM || process.env.SMTP_FROM || fromEmail || 'hr@autorevives.com';
    const senderName = fromName || 'AutoRevive HR Department';

    const transporter = getTransporter();

    // Format attachments
    const mailAttachments = (attachments || []).map((att: any) => {
      if (typeof att.content === 'string') {
        // Strip data URI header if present
        const base64Data = att.content.replace(/^data:[^;]+;base64,/, '');
        return {
          filename: att.filename || 'Document.pdf',
          content: Buffer.from(base64Data, 'base64'),
          contentType: att.contentType || 'application/pdf',
        };
      }
      return att;
    });

    const mailOptions = {
      from: `"${senderName}" <${senderEmail}>`,
      to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      replyTo: replyTo || senderEmail,
      subject,
      text: text || 'Please find the attached official document from AutoRevive.',
      html: html || undefined,
      attachments: mailAttachments,
    };

    const info = await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Email sent successfully with PDF attachment!',
      messageId: info.messageId,
      accepted: info.accepted,
      response: info.response,
    });
  } catch (error: any) {
    console.error('Email Send Error:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to dispatch email via SMTP server.',
      code: error?.code,
    });
  }
});

// ==========================================
// 3. HEALTH CHECK
// ==========================================
app.get('/api/health', async (_req, res) => {
  const databaseConnected = await checkDatabaseConnection();
  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    service: 'AutoRevive HR Backend',
    database: databaseConnected ? 'connected' : 'disconnected',
  });
});

// ==========================================
// 4. VITE MIDDLEWARE (DEV) & STATIC (PROD)
// ==========================================
async function startServer() {
  console.log('AutoRevive Backend starting...');
  await initializeDatabase();
  const distPath = path.join(projectRoot, 'frontend', 'dist');
  if (fs.existsSync(distPath)) {
    console.log(`AutoRevive serving built frontend from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'));
      } else {
        res.status(404).json({ success: false, message: 'API endpoint not found.' });
      }
    });
  } else {
    console.log(`AutoRevive Backend API running without frontend dist on http://localhost:${PORT}`);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`AutoRevive HR Document Center running on http://localhost:${PORT}`);
  });
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`AutoRevive Server is already running on port ${PORT}. Open http://localhost:${PORT}`);
      process.exit(0);
    }
    console.error('Unable to start server:', error.message);
    process.exit(1);
  });
}

startServer();
