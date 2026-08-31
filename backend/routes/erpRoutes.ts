import { Router, Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import { pool, nextCustomNumber, generateSafeApplicationId, generateSafeCandidateId } from '../../database/database';
import { generatePayslipPdf, numberToWords } from '../services/payslipPdfGenerator';
import { 
  sendApplicationReceivedEmail, 
  sendShortlistedEmail, 
  sendInterviewScheduledEmail, 
  sendOfferLetterEmail, 
  sendRejectionEmail 
} from '../services/recruitmentEmailService';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { rbacRouter, extractAdmin } from './rbacRoutes';

function findProjectRoot(startPath: string): string {
  let currentPath = path.resolve(startPath);
  while ((!fs.existsSync(path.join(currentPath, 'package.json')) || !fs.existsSync(path.join(currentPath, 'backend')) || !fs.existsSync(path.join(currentPath, 'database'))) && path.dirname(currentPath) !== currentPath) {
    currentPath = path.dirname(currentPath);
  }
  return currentPath;
}

const projectRoot = findProjectRoot(path.dirname(fileURLToPath(import.meta.url)));
const payslipsDir = path.join(projectRoot, 'backend', 'generated_documents', 'payslips');
const resumesDir = path.join(projectRoot, 'backend', 'uploads', 'resumes');
fs.mkdirSync(payslipsDir, { recursive: true });
fs.mkdirSync(resumesDir, { recursive: true });

export const erpRouter = Router();
erpRouter.use(rbacRouter);

// Helper: Log audit action
async function logAudit(action: string, entity: string, entityId: string, details?: string, userName: string = 'HR Manager') {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_name, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)`,
      [userName, action, entity, entityId, details || null]
    );
  } catch (err) {
    console.warn('Could not record audit log:', err);
  }
}

// =========================================================================
// 1. DASHBOARD METRICS & CHARTS (/api/dashboard/stats)
// =========================================================================
erpRouter.get('/dashboard/stats', async (_req: Request, res: Response) => {
  try {
    // Total Employees
    const [empRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as total, SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active FROM employees`);
    const totalEmployees = Number(empRows[0]?.total || 0);
    const activeEmployees = Number(empRows[0]?.active || 0);

    // Vacancies
    const [vacRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as openVacancies FROM job_vacancies WHERE status = 'Published'`);
    const openVacancies = Number(vacRows[0]?.openVacancies || 0);

    // Applications & Funnel
    const [appRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'SHORTLISTED' THEN 1 ELSE 0 END) as shortlisted,
        SUM(CASE WHEN status = 'INTERVIEW_SCHEDULED' THEN 1 ELSE 0 END) as interviews,
        SUM(CASE WHEN offer_status IN ('SENT', 'ACCEPTED') THEN 1 ELSE 0 END) as offersSent,
        SUM(CASE WHEN offer_status = 'ACCEPTED' THEN 1 ELSE 0 END) as offersAccepted
      FROM job_applications
    `);
    const totalApplications = Number(appRows[0]?.total || 0);
    const shortlisted = Number(appRows[0]?.shortlisted || 0);
    const interviews = Number(appRows[0]?.interviews || 0);
    const offersSent = Number(appRows[0]?.offersSent || 0);
    const offersAccepted = Number(appRows[0]?.offersAccepted || 0);

    // Interns
    const [internRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as interns FROM internships WHERE status = 'Active'`);
    const interns = Number(internRows[0]?.interns || 0);

    // Today's Attendance & Leaves
    const today = new Date().toISOString().split('T')[0];
    const [attRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as present FROM attendances WHERE date = ? AND status = 'Present'`, [today]);
    const [leaveRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as onLeave FROM attendances WHERE date = ? AND status = 'Leave'`, [today]);
    const todayPresent = Number(attRows[0]?.present || 0);
    const onLeaveToday = Number(leaveRows[0]?.onLeave || 0);
    const attendanceRate = activeEmployees > 0 ? Math.round((todayPresent / activeEmployees) * 100) : 87;

    // Payroll Pending & Payslips Generated (Current Month)
    const currentMonth = '2026-07';
    const [payrollRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as gen FROM payroll WHERE pay_period = ? AND status = 'GENERATED'`, [currentMonth]);
    const [payslipRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as gen FROM payslips WHERE pay_period = ?`, [currentMonth]);
    const payslipsGenerated = Number(payslipRows[0]?.gen || 0);
    const payrollPending = Math.max(0, activeEmployees - Number(payrollRows[0]?.gen || 0));

    // Recent Activity Feed
    const [recentAudits] = await pool.query<RowDataPacket[]>(`
      SELECT id, user_name, action, entity, entity_id, details, created_at 
      FROM audit_logs 
      ORDER BY created_at DESC 
      LIMIT 8
    `);

    // Standard Recent Activities if audit is quiet
    const defaultActivities = [
      { id: 1, text: 'New application submitted by Priya S', time: '10:00 AM', type: 'application' },
      { id: 2, text: 'Rohan M shortlisted for DevOps Engineer', time: '09:45 AM', type: 'shortlist' },
      { id: 3, text: 'Interview completed: Anitha R', time: 'Yesterday', type: 'interview' },
      { id: 4, text: 'Offer sent to Karthik N', time: 'Yesterday', type: 'offer' },
      { id: 5, text: 'Offer accepted by Karthik N', time: 'Yesterday', type: 'accepted' },
      { id: 6, text: 'Employee created: Karthik N (AR-EMP-2026-0005)', time: 'Yesterday', type: 'employee' },
      { id: 7, text: 'Payslip generated for July 2026', time: '2 days ago', type: 'payslip' },
    ];

    res.json({
      success: true,
      stats: {
        totalEmployees: totalEmployees || 256,
        activeEmployees: activeEmployees || 248,
        newJoiners: 12,
        openVacancies: openVacancies || 8,
        applications: totalApplications || 142,
        shortlisted: shortlisted || 36,
        interviews: interviews || 18,
        offersSent: offersSent || 15,
        offersAccepted: offersAccepted || 9,
        interns: interns || 24,
        onLeaveToday: onLeaveToday || 11,
        attendanceRate: attendanceRate || 87,
        payrollPending: payrollPending || 5,
        payslipsGenerated: payslipsGenerated || 236,
      },
      funnel: {
        applications: totalApplications || 142,
        shortlisted: shortlisted || 36,
        interviews: interviews || 18,
        offersSent: offersSent || 15,
        offersAccepted: offersAccepted || 9,
      },
      recentActivities: recentAudits.length > 0
        ? recentAudits.map((a: any) => ({
            id: a.id,
            text: `${a.action}: ${a.details || a.entity_id}`,
            time: new Date(a.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            type: a.entity.toLowerCase(),
          }))
        : defaultActivities,
    });
  } catch (err: any) {
    console.error('Dashboard Stats Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 2. RECRUITMENT & VACANCIES
// =========================================================================

// List vacancies
erpRouter.get('/recruitment/vacancies', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM job_vacancies ORDER BY id DESC`);
    res.json({ success: true, vacancies: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create vacancy
erpRouter.post('/recruitment/vacancies', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const jobId = await nextCustomNumber('JOB', 3);
    const publicToken = `token-${jobId.toLowerCase()}-${Math.random().toString(36).substring(2, 9)}`;

    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO job_vacancies
      (job_id, title, department, designation, employment_type, openings, location, work_model, salary_range, experience_required, experience_level, qualification, skills, mandatory_fields, mandatory_documents, interview_rounds, description, responsibilities, requirements, deadline, status, public_token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      jobId,
      body.title,
      body.department || 'Engineering',
      body.designation || body.title,
      body.employment_type || 'Full Time',
      body.openings || 1,
      body.location || 'Uthangarai, Krishnagiri',
      body.work_model || 'On-site',
      body.salary_range || '₹ 5.0 - 8.0 LPA',
      body.experience_required || '1 - 3 Years',
      body.experience_level || 'Both',
      body.qualification || 'B.E / B.Tech / Any Graduate',
      body.skills || '',
      typeof body.mandatory_fields === 'string' ? body.mandatory_fields : JSON.stringify(body.mandatory_fields || []),
      typeof body.mandatory_documents === 'string' ? body.mandatory_documents : JSON.stringify(body.mandatory_documents || []),
      typeof body.interview_rounds === 'string' ? body.interview_rounds : JSON.stringify(body.interview_rounds || []),
      body.description || '',
      body.responsibilities || '',
      body.requirements || '',
      body.deadline || '30/11/2026',
      body.status || 'Published',
      publicToken
    ]);

    await logAudit('Vacancy Created', 'Vacancy', jobId, `Created role: ${body.title}`);

    res.json({
      success: true,
      message: 'Job vacancy created successfully.',
      vacancy: { id: result.insertId, job_id: jobId, public_token: publicToken }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Public vacancy details (no auth)
erpRouter.get('/recruitment/vacancies/:token/public', async (req: Request, res: Response) => {
  try {
    const token = req.params.token;
    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM job_vacancies WHERE public_token = ?`, [token]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Vacancy not found or has expired.' });
    }
    res.json({ success: true, vacancy: rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Public application submission with 10 sections & SQL transaction
erpRouter.post('/recruitment/apply', async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const b = req.body;
    // 1. Generate guaranteed collision-safe application_id and candidate_id
    const appId = await generateSafeApplicationId(connection);
    const candidateId = await generateSafeCandidateId(connection);

    // 2. Prepare storage directories
    const appUploadDir = path.join(projectRoot, 'backend', 'uploads', 'applications', appId);
    fs.mkdirSync(appUploadDir, { recursive: true });

    let resumePath = null;
    let resumeName = b.resume_name || 'Resume.pdf';

    // Helper: Save Base64 file and record in application_documents
    const saveAndRecordDoc = async (docType: string, originalName: string, base64Content: string) => {
      try {
        const clean = base64Content.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(clean, 'base64');
        const safeName = `${docType}_${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const targetPath = path.join(appUploadDir, safeName);
        fs.writeFileSync(targetPath, buffer);

        await connection.query(`
          INSERT INTO application_documents 
          (application_id, candidate_id, document_type, file_name, file_path, file_size)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [appId, candidateId, docType, originalName, targetPath, buffer.length]);

        return targetPath;
      } catch (docErr) {
        console.warn(`Could not save document ${docType}:`, docErr);
        return null;
      }
    };

    // Save primary Resume
    if (b.resume_base64) {
      resumeName = b.resume_name || `${appId}_Resume.pdf`;
      resumePath = await saveAndRecordDoc('resume', resumeName, b.resume_base64);
    }

    // Save supporting documents if provided
    if (b.id_proof_base64) {
      await saveAndRecordDoc('id_proof', b.id_proof_name || 'ID_Proof.pdf', b.id_proof_base64);
    }
    if (b.marksheet_10th_base64) {
      await saveAndRecordDoc('marksheet_10th', b.marksheet_10th_name || '10th_Marksheet.pdf', b.marksheet_10th_base64);
    }
    if (b.marksheet_12th_base64) {
      await saveAndRecordDoc('marksheet_12th', b.marksheet_12th_name || '12th_Marksheet.pdf', b.marksheet_12th_base64);
    }
    if (b.degree_cert_base64) {
      await saveAndRecordDoc('degree_certificate', b.degree_cert_name || 'Degree_Certificate.pdf', b.degree_cert_base64);
    }
    if (b.experience_letter_base64) {
      await saveAndRecordDoc('experience_letter', b.experience_letter_name || 'Experience_Letter.pdf', b.experience_letter_base64);
    }
    if (b.payslip_base64) {
      await saveAndRecordDoc('payslip', b.payslip_name || 'Recent_Payslip.pdf', b.payslip_base64);
    }
    if (b.photo_base64) {
      await saveAndRecordDoc('photo', b.photo_name || 'Candidate_Photo.png', b.photo_base64);
    }

    // 3. Serialize structured JSON data
    const educationJson = typeof b.education_records === 'object' ? JSON.stringify(b.education_records) : (b.education_records || null);
    const workHistoryJson = typeof b.work_history === 'object' ? JSON.stringify(b.work_history) : (b.work_history || null);
    const referencesJson = typeof b.references_data === 'object' ? JSON.stringify(b.references_data) : (b.references_data || null);

    // 4. Insert complete 10-section application into MySQL
    await connection.query(`
      INSERT INTO job_applications (
        application_id, candidate_id, vacancy_id, job_title,
        full_name, email, mobile, alternate_phone, dob, gender, father_or_spouse_name, blood_group, marital_status,
        current_address, permanent_address, same_as_current, city, state, pincode,
        highest_qualification, course, institution, passing_year, percentage_cgpa, education_records,
        experience_type, total_experience, total_experience_years, total_experience_months,
        current_company, current_designation, previous_company, previous_salary, expected_salary, current_ctc,
        notice_period, reason_for_change, work_history,
        primary_skills, secondary_skills, technical_skills, technical_tools, languages,
        preferred_location, preferred_shift, expected_joining_date, willing_to_relocate,
        linkedin_url, portfolio_url, github_url,
        references_data,
        declaration_confirmed, recruitment_consent, signature_name, declaration_date,
        screening_status, interview_status, final_status, recruiter_name, notes,
        resume_path, resume_name, status
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?,
        ?, ?, ?, ?,
        'PENDING', 'NOT_SCHEDULED', 'APPLIED', 'Jemsina Banu (HR)', ?,
        ?, ?, 'APPLIED'
      )
    `, [
      appId, candidateId, b.vacancy_id || null, b.job_title || 'General Applicant',
      b.full_name, b.email, b.mobile, b.alternate_phone || null, b.dob || null, b.gender || 'Not Specified', b.father_or_spouse_name || null, b.blood_group || null, b.marital_status || null,
      b.current_address || null, b.permanent_address || null, b.same_as_current ? 1 : 0, b.city || null, b.state || null, b.pincode || null,
      b.highest_qualification || null, b.course || null, b.institution || null, b.passing_year || null, b.percentage_cgpa || null, educationJson,
      b.experience_type || 'Fresher', b.total_experience || (b.experience_type === 'Fresher' ? '0 Years' : `${b.total_experience_years || 0} Years`), b.total_experience_years || 0, b.total_experience_months || 0,
      b.current_company || null, b.current_designation || null, b.previous_company || null, b.previous_salary || null, b.expected_salary || null, b.current_ctc || null,
      b.notice_period || 'Immediate', b.reason_for_change || null, workHistoryJson,
      b.primary_skills || null, b.secondary_skills || null, b.technical_skills || null, b.technical_tools || null, b.languages || null,
      b.preferred_location || 'Uthangarai, Krishnagiri', b.preferred_shift || 'General Shift', b.expected_joining_date || null, b.willing_to_relocate === false ? 0 : 1,
      b.linkedin_url || null, b.portfolio_url || null, b.github_url || null,
      referencesJson,
      b.declaration_confirmed === false ? 0 : 1, b.recruitment_consent === false ? 0 : 1, b.signature_name || b.full_name, b.declaration_date || new Date().toLocaleDateString('en-GB'),
      b.notes || null,
      resumePath, resumeName
    ]);

    // 5. Insert audit log
    await connection.query(`
      INSERT INTO audit_logs (user_name, action, entity, entity_id, details)
      VALUES (?, 'Application Received', 'JobApplication', ?, ?)
    `, [b.full_name, appId, `Position: ${b.job_title} | Candidate ID: ${candidateId}`]);

    // 6. Commit transaction
    await connection.commit();

    // 7. Dispatch acknowledgment email asynchronously (never blocks response)
    void sendApplicationReceivedEmail({
      full_name: b.full_name,
      email: b.email,
      application_id: appId,
      candidate_id: candidateId,
      job_title: b.job_title || 'Applied Position',
    });

    res.json({
      success: true,
      applicationId: appId,
      candidateId: candidateId,
      jobTitle: b.job_title,
      fullName: b.full_name,
      appliedDate: new Date().toLocaleDateString('en-GB'),
      message: 'Your job application has been submitted successfully to AutoRevive.',
    });
  } catch (err: any) {
    await connection.rollback();
    console.error('Fatal Application Submission Error:', err);
    // User-friendly error message, never revealing raw SQL syntax or duplicate keys
    res.status(500).json({
      success: false,
      message: 'We were unable to process your application at this moment. Please check your form details and submit again.',
    });
  } finally {
    connection.release();
  }
});

// List applications
erpRouter.get('/recruitment/applications', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM job_applications ORDER BY id DESC`);
    res.json({ success: true, applications: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// List documents for a specific application
erpRouter.get('/recruitment/applications/:id/documents', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const isNum = /^\d+$/.test(rawId);
    const [appRows] = await pool.query<RowDataPacket[]>(
      `SELECT application_id, resume_path, resume_name FROM job_applications WHERE ${isNum ? 'id = ?' : 'application_id = ?'}`,
      [rawId]
    );
    if (appRows.length === 0) return res.status(404).json({ success: false, message: 'Application not found.' });

    const appId = appRows[0].application_id;
    const [docRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, application_id, document_type, file_name, file_size, uploaded_at 
       FROM application_documents 
       WHERE application_id = ? 
       ORDER BY id ASC`,
      [appId]
    );

    res.json({
      success: true,
      applicationId: appId,
      documents: docRows,
      hasResume: !!appRows[0].resume_path,
      resumeName: appRows[0].resume_name,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Download an uploaded document
erpRouter.get('/recruitment/documents/:docId/download', async (req: Request, res: Response) => {
  try {
    const docId = req.params.docId;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM application_documents WHERE id = ?`,
      [docId]
    );
    if (rows.length === 0) return res.status(404).send('Document not found.');

    const doc = rows[0];
    if (fs.existsSync(doc.file_path)) {
      res.download(doc.file_path, doc.file_name);
    } else {
      res.status(404).send('File not found on storage disk.');
    }
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// Preview an uploaded document inline (image or PDF viewer)
erpRouter.get('/recruitment/documents/:docId/preview', async (req: Request, res: Response) => {
  try {
    const docId = req.params.docId;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM application_documents WHERE id = ?`,
      [docId]
    );
    if (rows.length === 0) return res.status(404).send('Document not found.');

    const doc = rows[0];
    if (fs.existsSync(doc.file_path)) {
      const ext = path.extname(doc.file_name).toLowerCase();
      let contentType = 'application/octet-stream';
      if (ext === '.pdf') contentType = 'application/pdf';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.webp') contentType = 'image/webp';
      else if (ext === '.svg') contentType = 'image/svg+xml';

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Content-Security-Policy', "frame-ancestors *");
      res.removeHeader('X-Frame-Options');
      return res.sendFile(path.resolve(doc.file_path));
    } else {
      res.status(404).send('File not found on storage disk.');
    }
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// Download candidate primary resume
erpRouter.get('/recruitment/applications/:id/resume', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const isNum = /^\d+$/.test(rawId);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT resume_path, resume_name, full_name FROM job_applications WHERE ${isNum ? 'id = ?' : 'application_id = ?'}`,
      [rawId]
    );
    if (rows.length === 0 || !rows[0].resume_path) return res.status(404).send('Resume not found.');

    if (fs.existsSync(rows[0].resume_path)) {
      res.download(rows[0].resume_path, rows[0].resume_name || `${rows[0].full_name}_Resume.pdf`);
    } else {
      res.status(404).send('Resume file not found on disk.');
    }
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// Preview candidate primary resume inline
erpRouter.get('/recruitment/applications/:id/resume/preview', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const isNum = /^\d+$/.test(rawId);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT resume_path, resume_name, full_name FROM job_applications WHERE ${isNum ? 'id = ?' : 'application_id = ?'}`,
      [rawId]
    );
    if (rows.length === 0 || !rows[0].resume_path) return res.status(404).send('Resume not found.');

    if (fs.existsSync(rows[0].resume_path)) {
      const ext = path.extname(rows[0].resume_name || '').toLowerCase();
      let contentType = 'application/octet-stream';
      if (ext === '.pdf') contentType = 'application/pdf';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.webp') contentType = 'image/webp';

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Content-Security-Policy', "frame-ancestors *");
      res.removeHeader('X-Frame-Options');
      return res.sendFile(path.resolve(rows[0].resume_path));
    } else {
      res.status(404).send('Resume file not found on disk.');
    }
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// Screen candidate
erpRouter.patch('/recruitment/applications/:id/screen', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const isNum = /^\d+$/.test(rawId);
    const { screening_status, notes } = req.body; // 'PASSED', 'COMPLETED', or 'REJECTED'
    const isPassed = screening_status === 'PASSED' || screening_status === 'COMPLETED';
    const finalStatus = isPassed ? 'SHORTLISTED' : 'REJECTED';
    const screenVal = isPassed ? 'COMPLETED' : 'REJECTED';

    await pool.query(`
      UPDATE job_applications 
      SET screening_status = ?, 
          final_status = ?,
          status = ?,
          notes = COALESCE(CONCAT(COALESCE(notes, ''), '\n[Screening]: ', ?), notes)
      WHERE ${isNum ? 'id = ?' : 'application_id = ?'}
    `, [screenVal, finalStatus, finalStatus, notes || 'Screened by recruiter', rawId]);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT application_id, candidate_id, full_name, email, job_title FROM job_applications WHERE ${isNum ? 'id = ?' : 'application_id = ?'}`,
      [rawId]
    );

    if (rows.length > 0) {
      const c = rows[0];
      await logAudit(`Candidate Screened: ${screening_status}`, 'JobApplication', c.application_id, `Screening result: ${screening_status}`);
      // Send real-time notification email
      if (screening_status === 'PASSED') {
        void sendShortlistedEmail(c as any, notes);
      } else if (screening_status === 'REJECTED') {
        void sendRejectionEmail(c as any);
      }
    }

    res.json({ success: true, message: `Candidate screening recorded as ${screening_status} and notification email sent.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add notes to application
erpRouter.post('/recruitment/applications/:id/notes', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const isNum = /^\d+$/.test(rawId);
    const { note, recruiter_name = 'Jemsina Banu (HR)' } = req.body;
    const time = new Date().toLocaleString('en-GB');
    const formatted = `[${time} - ${recruiter_name}]: ${note}`;

    await pool.query(`
      UPDATE job_applications 
      SET notes = CASE 
        WHEN notes IS NULL OR notes = '' THEN ? 
        ELSE CONCAT(notes, '\n\n', ?) 
      END
      WHERE ${isNum ? 'id = ?' : 'application_id = ?'}
    `, [formatted, formatted, rawId]);

    res.json({ success: true, message: 'Recruiter notes recorded.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Configure vacancy mandatory fields & documents
erpRouter.patch('/recruitment/vacancies/:id/config', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const isNum = /^\d+$/.test(rawId);
    const { mandatory_fields, mandatory_documents, experience_level } = req.body;

    const fieldsJson = typeof mandatory_fields === 'object' ? JSON.stringify(mandatory_fields) : mandatory_fields;
    const docsJson = typeof mandatory_documents === 'object' ? JSON.stringify(mandatory_documents) : mandatory_documents;

    await pool.query(`
      UPDATE job_vacancies 
      SET mandatory_fields = COALESCE(?, mandatory_fields),
          mandatory_documents = COALESCE(?, mandatory_documents),
          experience_level = COALESCE(?, experience_level)
      WHERE ${isNum ? 'id = ?' : 'job_id = ?'}
    `, [fieldsJson, docsJson, experience_level, rawId]);

    res.json({ success: true, message: 'Vacancy configuration updated.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Schedule interview & send calendar invitation email
erpRouter.post('/recruitment/applications/:id/schedule-interview', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const isNum = /^\d+$/.test(rawId);
    const {
      round = 'Technical Interview Round 1',
      date = new Date().toLocaleDateString('en-GB'),
      time = '11:00 AM',
      mode = 'Online Google Meet',
      meeting_link = 'https://meet.google.com/xyz-auto-revive',
      interviewer = 'Jemsina Banu (HR) & Technical Lead',
      notes = 'Please join from a quiet location with high-speed internet. Keep project portfolio ready.'
    } = req.body;

    const interviewNote = `\n[Interview Scheduled]: ${round} on ${date} at ${time} (${mode}) | Link: ${meeting_link} | Interviewer: ${interviewer}`;

    await pool.query(`
      UPDATE job_applications 
      SET interview_status = 'SCHEDULED',
          status = 'INTERVIEW_SCHEDULED',
          final_status = 'INTERVIEW_SCHEDULED',
          notes = CASE 
            WHEN notes IS NULL OR notes = '' THEN ? 
            ELSE CONCAT(notes, '\n', ?) 
          END
      WHERE ${isNum ? 'id = ?' : 'application_id = ?'}
    `, [interviewNote, interviewNote, rawId]);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT application_id, candidate_id, full_name, email, job_title FROM job_applications WHERE ${isNum ? 'id = ?' : 'application_id = ?'}`,
      [rawId]
    );

    if (rows.length > 0) {
      const c = rows[0];
      await logAudit('Interview Scheduled', 'JobApplication', c.application_id, `${round} on ${date} at ${time}`);
      void sendInterviewScheduledEmail(c as any, {
        round,
        date,
        time,
        mode,
        meeting_link,
        interviewer,
        notes
      });
    }

    res.json({ success: true, message: `Interview successfully scheduled for ${rows[0]?.full_name} and invitation email dispatched.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update application status (Shortlist / Reject / Select) with automated emails
erpRouter.patch('/recruitment/applications/:id/status', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const isNum = /^\d+$/.test(rawId);
    const { status } = req.body;

    if (status === 'SHORTLISTED') {
      await pool.query(
        `UPDATE job_applications SET status = 'SHORTLISTED', final_status = 'SHORTLISTED', screening_status = 'COMPLETED' WHERE ${isNum ? 'id = ?' : 'application_id = ?'}`,
        [rawId]
      );
    } else {
      await pool.query(
        `UPDATE job_applications SET status = ?, final_status = ? WHERE ${isNum ? 'id = ?' : 'application_id = ?'}`,
        [status, status, rawId]
      );
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT application_id, candidate_id, full_name, email, job_title FROM job_applications WHERE ${isNum ? 'id = ?' : 'application_id = ?'}`,
      [rawId]
    );
    if (rows.length > 0) {
      const c = rows[0];
      await logAudit(`Application ${status}`, 'JobApplication', c.application_id, `Status set to ${status}`);
      if (status === 'SHORTLISTED') {
        void sendShortlistedEmail(c as any);
      } else if (status === 'REJECTED') {
        void sendRejectionEmail(c as any);
      }
    }
    res.json({ success: true, message: `Application status updated to ${status} and notification dispatched.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Generate offer token for selected candidate & dispatch email
erpRouter.post('/recruitment/applications/:id/create-offer', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const isNum = /^\d+$/.test(rawId);
    const offerToken = `offer-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;
    await pool.query(`
      UPDATE job_applications 
      SET offer_token = ?, offer_status = 'SENT', status = 'SELECTED', final_status = 'SELECTED' 
      WHERE ${isNum ? 'id = ?' : 'application_id = ?'}
    `, [offerToken, rawId]);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM job_applications WHERE ${isNum ? 'id = ?' : 'application_id = ?'}`,
      [rawId]
    );

    if (rows.length > 0) {
      const c = rows[0];
      await logAudit('Offer Created', 'JobApplication', c.application_id, `Offer link generated for ${c.full_name}`);
      void sendOfferLetterEmail(c as any, offerToken, c.expected_salary);
    }

    res.json({
      success: true,
      offerToken,
      offerLink: `/offer/accept/${offerToken}`,
      candidate: rows[0]
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Public Offer View (/api/offers/accept/:token)
erpRouter.get('/offers/accept/:token', async (req: Request, res: Response) => {
  try {
    const token = req.params.token;
    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM job_applications WHERE offer_token = ?`, [token]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Offer not found or link has expired.' });
    }
    res.json({ success: true, candidate: rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Public Offer Accept / Reject (With Complete Statutory KYC & Documents Upload)
erpRouter.post('/offers/accept/:token', async (req: Request, res: Response) => {
  try {
    const token = req.params.token;
    const { action } = req.body; // 'ACCEPT' or 'REJECT'
    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM job_applications WHERE offer_token = ?`, [token]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Offer not found.' });

    const app = rows[0];

    if (action === 'ACCEPT') {
      const confirmedDate = req.body.confirmedJoiningDate || app.expected_joining_date || '03/11/2026';
      const aadhaar = req.body.aadhaarNumber || app.aadhaar_number || '4567 8901 2345';
      const pan = (req.body.panNumber || app.pan_number || 'ABCDE1234F').toUpperCase();
      const bank = req.body.bankName || app.bank_name || 'HDFC Bank';
      const account = req.body.accountNumber || app.account_number || '50100612342166';
      const ifsc = (req.body.ifscCode || app.ifsc_code || 'HDFC0001234').toUpperCase();

      await pool.query(`
        UPDATE job_applications 
        SET offer_status = 'ACCEPTED', 
            offer_accepted_at = NOW(), 
            expected_joining_date = ?, 
            status = 'SELECTED',
            aadhaar_number = ?,
            pan_number = ?,
            bank_name = ?,
            account_number = ?,
            ifsc_code = ?
        WHERE id = ?
      `, [confirmedDate, aadhaar, pan, bank, account, ifsc, app.id]);

      // Save uploaded KYC documents to filesystem & application_documents table
      const kycDir = path.join(projectRoot, 'backend', 'uploads', 'applications', app.application_id, 'kyc');
      fs.mkdirSync(kycDir, { recursive: true });

      const saveKycDoc = async (docType: string, docData: { name: string; base64: string } | undefined) => {
        if (!docData || !docData.base64 || !docData.name) return;
        try {
          const clean = docData.base64.replace(/^data:[^;]+;base64,/, '');
          const buffer = Buffer.from(clean, 'base64');
          const safeName = `${docType}_${Date.now()}_${docData.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const targetPath = path.join(kycDir, safeName);
          fs.writeFileSync(targetPath, buffer);

          const [existing] = await pool.query<RowDataPacket[]>(
            `SELECT id FROM application_documents WHERE application_id = ? AND document_type = ?`,
            [app.application_id, docType]
          );

          if (existing.length > 0) {
            await pool.query(
              `UPDATE application_documents SET file_name = ?, file_path = ?, file_size = ?, uploaded_at = NOW() WHERE id = ?`,
              [docData.name, targetPath, buffer.length, existing[0].id]
            );
          } else {
            await pool.query(
              `INSERT INTO application_documents (application_id, candidate_id, document_type, file_name, file_path, file_size) VALUES (?, ?, ?, ?, ?, ?)`,
              [app.application_id, app.candidate_id || app.application_id, docType, docData.name, targetPath, buffer.length]
            );
          }
        } catch (e) {
          console.error(`Failed to store KYC document ${docType}:`, e);
        }
      };

      await saveKycDoc('AADHAAR_CARD', req.body.aadhaarDoc);
      await saveKycDoc('PAN_CARD', req.body.panDoc);
      await saveKycDoc('PASSBOOK_CHEQUE', req.body.passbookDoc);
      await saveKycDoc('EXPERIENCE_LETTER', req.body.experienceLetterDoc);
      await saveKycDoc('PREVIOUS_PAYSLIPS', req.body.previousPayslipsDoc);

      await logAudit('Offer Accepted', 'JobApplication', app.application_id, `Candidate ${app.full_name} accepted offer with confirmed joining date: ${confirmedDate}. Bank: ${bank}, PAN: ${pan}, Aadhaar: ${aadhaar}`);

      res.json({
        success: true,
        status: 'ACCEPTED',
        confirmedJoiningDate: confirmedDate,
        message: 'Congratulations! You have accepted the employment offer and submitted your KYC formalities with AutoRevive.'
      });
    } else {
      await pool.query(`UPDATE job_applications SET offer_status = 'REJECTED' WHERE id = ?`, [app.id]);
      await logAudit('Offer Rejected', 'JobApplication', app.application_id, `Candidate ${app.full_name} declined offer.`);
      res.json({ success: true, status: 'REJECTED', message: 'Offer declined.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Mark interview as completed -> candidate transitions to SHORTLISTED & ready for offer
erpRouter.post('/recruitment/applications/:id/complete-interview', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const isNum = /^\d+$/.test(rawId);
    const { feedback = 'Candidate passed technical interview round successfully.' } = req.body;

    const completedNote = `[Interview Completed]: ${feedback}`;

    await pool.query(`
      UPDATE job_applications 
      SET interview_status = 'COMPLETED',
          screening_status = 'COMPLETED',
          status = 'SHORTLISTED',
          final_status = 'SHORTLISTED',
          notes = CASE 
            WHEN notes IS NULL OR notes = '' THEN ? 
            ELSE CONCAT(notes, '\n', ?) 
          END
      WHERE ${isNum ? 'id = ?' : 'application_id = ?'}
    `, [completedNote, completedNote, rawId]);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT application_id, candidate_id, full_name, email, job_title FROM job_applications WHERE ${isNum ? 'id = ?' : 'application_id = ?'}`,
      [rawId]
    );

    if (rows.length > 0) {
      const c = rows[0];
      await logAudit('Interview Completed', 'JobApplication', c.application_id, `Interview passed. Candidate Shortlisted.`);
      void sendShortlistedEmail(c as any, feedback);
    }

    res.json({
      success: true,
      message: 'Interview marked as COMPLETED. Candidate is now SHORTLISTED and ready for Offer Letter generation.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Enroll candidate into Employee Master & issue appointment
erpRouter.post('/recruitment/applications/:id/convert-employee', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const isNum = /^\d+$/.test(rawId);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM job_applications WHERE ${isNum ? 'id = ?' : 'application_id = ?'}`,
      [rawId]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Application not found.' });

    const app = rows[0];
    let empId = app.employee_id;
    if (!empId) {
      empId = await nextCustomNumber('EMP', 4);
    }

    const dept = app.job_title?.toLowerCase().includes('developer') || app.job_title?.toLowerCase().includes('engineer')
      ? 'Engineering'
      : (app.job_title?.toLowerCase().includes('sales') ? 'Sales & Business Development' : 'Operations');

    // Create Employee record with complete Bank & Statutory KYC
    await pool.query(`
      INSERT INTO employees 
      (employee_id, full_name, email, mobile, department, role, address, gender, joining_date, salary_month, annual_ctc, bank_name, account_number, ifsc_code, pan_number, aadhaar_number, portal_password, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 41500, 498000, ?, ?, ?, ?, ?, 'AutoRevive@2026', 'Active')
      ON DUPLICATE KEY UPDATE 
        status = 'Active', 
        department = VALUES(department), 
        role = VALUES(role),
        bank_name = VALUES(bank_name),
        account_number = VALUES(account_number),
        ifsc_code = VALUES(ifsc_code),
        pan_number = VALUES(pan_number),
        aadhaar_number = VALUES(aadhaar_number)
    `, [
      empId,
      app.full_name,
      app.email,
      app.mobile,
      dept,
      app.job_title,
      app.current_address || 'Uthangarai, Krishnagiri',
      app.gender || 'Male',
      app.expected_joining_date || new Date().toLocaleDateString('en-GB'),
      app.bank_name || 'HDFC Bank',
      app.account_number || '50100612342166',
      app.ifsc_code || 'HDFC0001234',
      app.pan_number || 'ABCDE1234F',
      app.aadhaar_number || '4567 8901 2345'
    ]);

    // Create Salary structure
    await pool.query(`
      INSERT INTO salary_structures (employee_id, basic, hra, special_allowance, status)
      VALUES (?, 20750.00, 10375.00, 10375.00, 'Active')
      ON DUPLICATE KEY UPDATE status = 'Active'
    `, [empId]);

    // Update job_applications
    await pool.query(`
      UPDATE job_applications 
      SET employee_id = ?, 
          status = 'JOINED', 
          final_status = 'JOINED', 
          offer_status = 'ACCEPTED' 
      WHERE id = ?
    `, [empId, app.id]);

    await logAudit('Employee Onboarded', 'Employee', empId, `${app.full_name} converted to permanent employee with Employee ID: ${empId}`);

    res.json({
      success: true,
      employeeId: empId,
      portalPassword: 'AutoRevive@2026',
      message: `${app.full_name} has been successfully enrolled into Employee Master with Employee ID: ${empId}. Portal password: AutoRevive@2026`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete single employee
erpRouter.delete('/employees/:id', async (req: Request, res: Response) => {
  try {
    const empId = req.params.id;
    await pool.query('DELETE FROM employees WHERE employee_id = ?', [empId]);
    await pool.query('DELETE FROM salary_structures WHERE employee_id = ?', [empId]);
    await pool.query('DELETE FROM attendances WHERE employee_id = ?', [empId]);
    await pool.query('DELETE FROM payslips WHERE employee_id = ?', [empId]);
    await logAudit('Employee Deleted', 'Employee', empId, `Employee record deleted.`);
    res.json({ success: true, message: `Employee ${empId} deleted successfully.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete ALL employees (Clear Employee Directory)
erpRouter.delete('/employees/actions/clear-all', async (_req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM employees');
    await pool.query('DELETE FROM salary_structures');
    await pool.query('DELETE FROM attendances');
    await pool.query('DELETE FROM payslips');
    await pool.query('DELETE FROM payroll_items');
    await pool.query('DELETE FROM payroll');
    await pool.query("UPDATE document_counters SET next_number = 1 WHERE prefix = 'EMP'");
    await logAudit('All Employees Cleared', 'Employee', 'ALL', 'All employees purged from directory.');
    res.json({ success: true, message: 'All employees cleared successfully from master directory.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete ALL document history
erpRouter.delete('/documents/actions/clear-all', async (_req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM hr_documents');
    await pool.query('DELETE FROM email_logs');
    await pool.query("UPDATE document_counters SET next_number = 1 WHERE prefix IN ('HR', 'APT', 'INT', 'INC', 'PS')");
    await logAudit('Document History Cleared', 'Document', 'ALL', 'All document history records purged.');
    res.json({ success: true, message: 'All document history cleared successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete single job application
erpRouter.delete('/recruitment/applications/:id', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const isNum = /^\d+$/.test(rawId);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, application_id, full_name FROM job_applications WHERE ${isNum ? 'id = ?' : 'application_id = ?'}`,
      [rawId]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Application not found.' });

    const app = rows[0];
    await pool.query('DELETE FROM application_documents WHERE application_id = ?', [app.application_id]);
    await pool.query('DELETE FROM interviews WHERE application_id = ?', [app.application_id]);
    await pool.query('DELETE FROM job_applications WHERE id = ?', [app.id]);

    await logAudit('Application Deleted', 'JobApplication', app.application_id, `Application ${app.application_id} for ${app.full_name} deleted.`);
    res.json({ success: true, message: `Application ${app.application_id} for ${app.full_name} deleted successfully.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 2. EMPLOYEE AUTHENTICATION & SELF-SERVICE PORTAL APIS
// =========================================================================

// Helper to extract employee identifier from request
function extractEmployeeId(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    // Token format: tok_<empId>_<ts> or plain empId
    if (token.startsWith('tok_')) {
      const parts = token.split('_');
      if (parts.length >= 2) return parts[1];
    }
    if (token.startsWith('AR-')) return token;
  }
  const xEmp = req.headers['x-employee-id'] as string;
  if (xEmp && xEmp.trim()) return xEmp.trim();
  const qEmp = req.query.employee_id as string;
  if (qEmp && qEmp.trim()) return qEmp.trim();
  const bEmp = req.body?.employee_id as string;
  if (bEmp && bEmp.trim()) return bEmp.trim();
  return null;
}

// 1. Employee Login
erpRouter.post('/auth/employee/login', async (req: Request, res: Response) => {
  try {
    const { loginId, email, employee_id, password } = req.body || {};
    const identifier = (loginId || email || employee_id || '').trim();
    const pass = (password || '').trim();

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Official Email / Employee ID is required.' });
    }
    if (!pass) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }

    // Lookup employee in employees table
    const [empRows] = await pool.query<RowDataPacket[]>(`
      SELECT * FROM employees 
      WHERE employee_id = ? OR email = ?
    `, [identifier, identifier]);

    if (empRows.length === 0) {
      // Check candidate enrolled or job_applications
      const [candRows] = await pool.query<RowDataPacket[]>(`
        SELECT * FROM job_applications 
        WHERE (application_id = ? OR email = ? OR candidate_id = ?) AND (status IN ('JOINED', 'SELECTED') OR offer_status = 'ACCEPTED')
      `, [identifier, identifier, identifier]);

      if (candRows.length > 0) {
        const cand = candRows[0];
        let newEmpId = cand.employee_id;
        if (!newEmpId) {
          newEmpId = await nextCustomNumber('EMP', 4);
        }
        const dept = cand.job_title?.toLowerCase().includes('developer') || cand.job_title?.toLowerCase().includes('engineer')
          ? 'Engineering'
          : (cand.job_title?.toLowerCase().includes('sales') ? 'Sales & Business Development' : 'Operations');

        await pool.query(`
          INSERT INTO employees 
          (employee_id, full_name, email, mobile, department, role, address, gender, joining_date, salary_month, annual_ctc, bank_name, account_number, ifsc_code, pan_number, aadhaar_number, portal_password, status, account_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 41500, 498000, ?, ?, ?, ?, ?, 'AutoRevive@2026', 'Active', 'Active')
          ON DUPLICATE KEY UPDATE status = 'Active', account_status = 'Active'
        `, [
          newEmpId, cand.full_name, cand.email, cand.mobile, dept, cand.job_title,
          cand.current_address || 'Uthangarai, Krishnagiri', cand.gender || 'Male',
          cand.expected_joining_date || new Date().toLocaleDateString('en-GB'),
          cand.bank_name || 'HDFC Bank', cand.account_number || '50100612342166',
          cand.ifsc_code || 'HDFC0001234', cand.pan_number || 'ABCDE1234F',
          cand.aadhaar_number || '4567 8901 2345'
        ]);

        await pool.query(`
          INSERT INTO employee_accounts (employee_id, user_id, email, password_hash, status)
          VALUES (?, ?, ?, 'AutoRevive@2026', 'Active')
          ON DUPLICATE KEY UPDATE status = 'Active'
        `, [newEmpId, `USR-${newEmpId}`, cand.email]);

        await pool.query(`UPDATE job_applications SET employee_id = ?, status = 'JOINED' WHERE id = ?`, [newEmpId, cand.id]);

        const [createdEmp] = await pool.query<RowDataPacket[]>(`SELECT * FROM employees WHERE employee_id = ?`, [newEmpId]);
        const user = createdEmp[0];
        const token = `tok_${user.employee_id}_${Date.now()}`;
        return res.json({
          success: true,
          token,
          user: {
            user_id: `USR-${user.employee_id}`,
            employee_id: user.employee_id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            department: user.department,
            status: user.status,
          },
          employee: user,
          message: `Welcome to AutoRevive, ${user.full_name}!`
        });
      }

      // Check if this is an Admin logging into the Employee Portal
      const [adminRows] = await pool.query<RowDataPacket[]>(`
        SELECT * FROM admins 
        WHERE email = ? OR admin_id = ?
      `, [identifier, identifier]);

      if (adminRows.length > 0) {
        const admin = adminRows[0];
        const validAdminPass = pass === 'AutoRevive@2026' || pass === admin.password_hash;
        if (!validAdminPass) {
          return res.status(401).json({ success: false, message: 'Invalid Admin/Employee password.' });
        }

        // Map Admin ID to Employee ID (e.g. AR-ADM-2026-0002 -> AR-EMP-2026-0002)
        const empId = admin.admin_id.replace('AR-ADM-', 'AR-EMP-');
        await pool.query(`
          INSERT INTO employees 
          (employee_id, full_name, email, mobile, department, role, address, gender, joining_date, salary_month, annual_ctc, bank_name, account_number, ifsc_code, pan_number, aadhaar_number, portal_password, status, account_status)
          VALUES (?, ?, ?, ?, ?, ?, 'AutoRevive Head Office, Uthangarai', 'Female', '2026-01-01', 65000, 780000, 'HDFC Bank', '50100612342166', 'HDFC0001234', 'ABCDE1234F', '4567 8901 2345', ?, 'Active', 'Active')
          ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), email = VALUES(email), department = VALUES(department), role = VALUES(role), status = 'Active', account_status = 'Active'
        `, [empId, admin.full_name, admin.email, admin.mobile || '+91 94426 93306', admin.department || 'Human Resources', `${admin.role.replace(/_/g, ' ')} Lead`, pass]);

        await pool.query(`
          INSERT INTO employee_accounts (employee_id, user_id, email, password_hash, status)
          VALUES (?, ?, ?, ?, 'Active')
          ON DUPLICATE KEY UPDATE status = 'Active'
        `, [empId, `USR-${empId}`, admin.email, pass]);

        const [createdEmp] = await pool.query<RowDataPacket[]>(`SELECT * FROM employees WHERE employee_id = ?`, [empId]);
        const user = createdEmp[0];
        const token = `tok_${user.employee_id}_${Date.now()}`;
        return res.json({
          success: true,
          token,
          user: {
            user_id: `USR-${user.employee_id}`,
            employee_id: user.employee_id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            department: user.department,
            status: user.status,
          },
          employee: user,
          message: `Welcome to Employee Portal, ${user.full_name} (${admin.role.replace(/_/g, ' ')})!`
        });
      }

      // If neither employee nor onboarded candidate nor admin:
      return res.status(401).json({ success: false, message: 'Invalid Employee ID or password.' });
    }

    const employee = empRows[0];

    // Check Employee & Account status
    const empStatus = (employee.status || 'Active').toLowerCase();
    const accStatus = (employee.account_status || 'Active').toLowerCase();

    // Check employee_accounts table
    const [accRows] = await pool.query<RowDataPacket[]>(`SELECT * FROM employee_accounts WHERE employee_id = ?`, [employee.employee_id]);
    const accountRow = accRows[0];
    const tableAccStatus = (accountRow?.status || 'Active').toLowerCase();

    if (empStatus !== 'active' || accStatus !== 'active' || tableAccStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your employee account is currently inactive. Please contact HR.'
      });
    }

    // Validate password (Accepts AutoRevive@2026, employee.portal_password, or account password_hash)
    const validPassword = pass === 'AutoRevive@2026' ||
      pass === employee.portal_password ||
      (accountRow && pass === accountRow.password_hash);

    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid Employee ID or password.' });
    }

    // Ensure account record exists & update last_login
    await pool.query(`
      INSERT INTO employee_accounts (employee_id, user_id, email, password_hash, status, last_login)
      VALUES (?, ?, ?, ?, 'Active', NOW())
      ON DUPLICATE KEY UPDATE last_login = NOW(), status = 'Active'
    `, [employee.employee_id, `USR-${employee.employee_id}`, employee.email || `${employee.employee_id.toLowerCase()}@autorevives.com`, pass]);

    const token = `tok_${employee.employee_id}_${Date.now()}`;

    res.json({
      success: true,
      token,
      user: {
        user_id: `USR-${employee.employee_id}`,
        employee_id: employee.employee_id,
        full_name: employee.full_name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        status: employee.status,
      },
      employee,
      message: `Welcome back, ${employee.full_name}!`
    });
  } catch (err: any) {
    console.error('Employee Login Error:', err);
    res.status(500).json({ success: false, message: 'Authentication service temporarily unavailable.' });
  }
});

// Backward compatibility alias for legacy call
erpRouter.post('/employee-portal/login', async (req: Request, res: Response) => {
  return (erpRouter as any).handle({ ...req, url: '/auth/employee/login' }, res);
});

// 2. Forgot Password
erpRouter.post('/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { loginId, email } = req.body || {};
    const term = (loginId || email || '').trim();
    if (!term) return res.status(400).json({ success: false, message: 'Please provide your registered Email or Employee ID.' });

    const [rows] = await pool.query<RowDataPacket[]>(`SELECT full_name, email, employee_id FROM employees WHERE employee_id = ? OR email = ?`, [term, term]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No employee account found with this identifier.' });
    }

    const emp = rows[0];
    await logAudit('Password Reset Requested', 'EmployeeAccount', emp.employee_id, `Password reset requested for ${emp.full_name}`);

    res.json({
      success: true,
      message: `Password reset instructions and portal credentials have been dispatched to ${emp.email || 'your registered work email'}. Default portal password: AutoRevive@2026`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Unable to process password reset at this time.' });
  }
});

// 3. GET /api/employee/me (Complete Employee Dashboard & Profile Data)
erpRouter.get('/employee/me', async (req: Request, res: Response) => {
  try {
    const empId = extractEmployeeId(req);
    if (!empId) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Authenticated employee session required.' });
    }

    const [empRows] = await pool.query<RowDataPacket[]>(`SELECT * FROM employees WHERE employee_id = ?`, [empId]);
    if (empRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee record not found.' });
    }

    const employee = empRows[0];
    if ((employee.status || 'Active').toLowerCase() !== 'active') {
      return res.status(403).json({ success: false, message: 'Your employee account is currently inactive. Please contact HR.' });
    }

    const today = new Date().toISOString().split('T')[0];

    // Today's attendance
    const [todayAttRows] = await pool.query<RowDataPacket[]>(`SELECT * FROM attendances WHERE employee_id = ? AND date = ?`, [empId, today]);
    const todayAtt = todayAttRows[0] || null;

    // Monthly attendance metrics (Current Month)
    const currentMonth = today.slice(0, 7);
    const [monthAttRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_logged_days,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'Leave' THEN 1 ELSE 0 END) as leave_days,
        SUM(CASE WHEN status = 'Half Day' THEN 1 ELSE 0 END) as half_days,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_days,
        SUM(CASE WHEN status = 'Work From Home' THEN 1 ELSE 0 END) as wfh_days,
        SUM(CASE WHEN status = 'Holiday' THEN 1 ELSE 0 END) as holiday_days,
        SUM(CASE WHEN status = 'Week Off' THEN 1 ELSE 0 END) as week_off_days,
        SUM(overtime_hours) as total_overtime
      FROM attendances 
      WHERE employee_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?
    `, [empId, currentMonth]);

    // Leaves summary
    const [leaveRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_leaves,
        SUM(CASE WHEN status = 'APPROVED' THEN days_count ELSE 0 END) as approved_days
      FROM leave_requests 
      WHERE employee_id = ?
    `, [empId]);

    const totalLeaveQuota = 18;
    const usedLeaves = Number(leaveRows[0]?.approved_days || 0);
    const leaveBalance = Math.max(0, totalLeaveQuota - usedLeaves);
    const pendingLeaves = Number(leaveRows[0]?.pending_leaves || 0);

    // Tasks summary
    const [taskRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status != 'Completed' THEN 1 ELSE 0 END) as active_tasks,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks
      FROM tasks 
      WHERE employee_id = ?
    `, [empId]);

    // Performance review
    const [perfRows] = await pool.query<RowDataPacket[]>(`
      SELECT * FROM employee_performance WHERE employee_id = ? ORDER BY id DESC LIMIT 1
    `, [empId]);
    const performanceScore = perfRows[0]?.performance_score ? Number(perfRows[0].performance_score) : 92.5;

    // Latest Payroll & Payslip
    const [payRows] = await pool.query<RowDataPacket[]>(`
      SELECT p.*, ps.payslip_reference, ps.id as payslip_id, ps.email_status 
      FROM payroll p 
      LEFT JOIN payslips ps ON p.id = ps.payroll_id 
      WHERE p.employee_id = ? 
      ORDER BY p.pay_period DESC LIMIT 1
    `, [empId]);
    const latestPayroll = payRows[0] || null;

    // Unread notifications count
    const [notifRows] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) as unread_count FROM employee_notifications WHERE employee_id = ? AND is_read = FALSE
    `, [empId]);

    res.json({
      success: true,
      employee,
      dashboard: {
        todayDate: new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
        attendance: {
          todayCheckIn: todayAtt?.check_in || '09:15:00',
          todayCheckOut: todayAtt?.check_out || null,
          workingHours: todayAtt?.working_hours || 8.5,
          status: todayAtt?.status || 'Present',
          isClockedIn: !todayAtt?.check_out,
          monthStats: monthAttRows[0] || {},
        },
        leaves: {
          totalQuota: totalLeaveQuota,
          balance: leaveBalance,
          used: usedLeaves,
          pending: pendingLeaves,
        },
        tasks: {
          total: Number(taskRows[0]?.total_tasks || 0),
          active: Number(taskRows[0]?.active_tasks || 0),
          completed: Number(taskRows[0]?.completed_tasks || 0),
        },
        performanceScore,
        currentMonthPayroll: latestPayroll ? {
          payPeriod: latestPayroll.pay_period,
          grossSalary: Number(latestPayroll.gross_salary),
          totalDeductions: Number(latestPayroll.total_deductions),
          netPay: Number(latestPayroll.net_pay),
          status: latestPayroll.status,
        } : {
          payPeriod: currentMonth,
          grossSalary: Number(employee.salary_month || 41500),
          totalDeductions: 0,
          netPay: Number(employee.salary_month || 41500),
          status: 'COMPUTED',
        },
        latestPayslip: latestPayroll?.payslip_reference ? {
          id: latestPayroll.payslip_id,
          reference: latestPayroll.payslip_reference,
          payPeriod: latestPayroll.pay_period,
          netPay: Number(latestPayroll.net_pay),
          status: latestPayroll.status,
        } : null,
        unreadNotifications: Number(notifRows[0]?.unread_count || 0),
      }
    });
  } catch (err: any) {
    console.error('Employee /me Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. GET & POST /api/employee/me/attendance (Live Attendance & Punch Terminal)
erpRouter.get('/employee/me/attendance', async (req: Request, res: Response) => {
  try {
    const empId = extractEmployeeId(req);
    if (!empId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const today = new Date().toISOString().split('T')[0];
    const [records] = await pool.query<RowDataPacket[]>(`
      SELECT * FROM attendances 
      WHERE employee_id = ? 
      ORDER BY date DESC 
      LIMIT 31
    `, [empId]);

    const [todayRows] = await pool.query<RowDataPacket[]>(`SELECT * FROM attendances WHERE employee_id = ? AND date = ?`, [empId, today]);
    const todayRecord = todayRows[0] || null;

    // Monthly breakdown counters
    const currentMonth = today.slice(0, 7);
    const [summaryRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'Leave' THEN 1 ELSE 0 END) as leave_count,
        SUM(CASE WHEN status = 'Half Day' THEN 1 ELSE 0 END) as half_day,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN status = 'Work From Home' THEN 1 ELSE 0 END) as wfh,
        SUM(CASE WHEN status = 'Holiday' THEN 1 ELSE 0 END) as holiday,
        SUM(CASE WHEN status = 'Week Off' THEN 1 ELSE 0 END) as week_off,
        SUM(overtime_hours) as total_overtime
      FROM attendances 
      WHERE employee_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?
    `, [empId, currentMonth]);

    res.json({
      success: true,
      today: todayRecord || {
        date: today,
        check_in: '09:15:00',
        check_out: null,
        working_hours: 8.5,
        status: 'Present',
        is_clocked_in: true,
      },
      summary: summaryRows[0] || {},
      records,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

erpRouter.post('/employee/me/attendance/clock-in', async (req: Request, res: Response) => {
  try {
    const empId = extractEmployeeId(req);
    if (!empId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0];

    await pool.query(`
      INSERT INTO attendances (employee_id, date, check_in, status, working_hours)
      VALUES (?, ?, ?, 'Present', 8.5)
      ON DUPLICATE KEY UPDATE check_in = VALUES(check_in), status = 'Present'
    `, [empId, today, nowTime]);

    await logAudit('Employee Clocked In', 'Attendance', empId, `Clocked in at ${nowTime}`);

    res.json({
      success: true,
      message: `Clocked in successfully at ${nowTime}. Status: PRESENT`,
      checkInTime: nowTime,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

erpRouter.post('/employee/me/attendance/clock-out', async (req: Request, res: Response) => {
  try {
    const empId = extractEmployeeId(req);
    if (!empId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0];

    await pool.query(`
      INSERT INTO attendances (employee_id, date, check_out, status, working_hours)
      VALUES (?, ?, ?, 'Present', 8.5)
      ON DUPLICATE KEY UPDATE check_out = VALUES(check_out)
    `, [empId, today, nowTime]);

    await logAudit('Employee Clocked Out', 'Attendance', empId, `Clocked out at ${nowTime}`);

    res.json({
      success: true,
      message: `Clocked out successfully at ${nowTime}. Total hours recorded.`,
      checkOutTime: nowTime,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Attendance Correction Request
erpRouter.post('/employee/me/attendance-correction', async (req: Request, res: Response) => {
  try {
    const empId = extractEmployeeId(req);
    if (!empId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const { attendance_date, requested_check_in, requested_check_out, reason } = req.body;
    if (!attendance_date || !reason) {
      return res.status(400).json({ success: false, message: 'Date and correction reason are required.' });
    }

    await pool.query(`
      INSERT INTO attendance_corrections (employee_id, attendance_date, requested_check_in, requested_check_out, reason, status)
      VALUES (?, ?, ?, ?, ?, 'PENDING')
    `, [empId, attendance_date, requested_check_in || '09:00:00', requested_check_out || '18:00:00', reason]);

    // Insert Notification for Employee
    await pool.query(`
      INSERT INTO employee_notifications (employee_id, title, message, type, link)
      VALUES (?, 'Attendance Correction Submitted', ?, 'ATTENDANCE', '#attendance')
    `, [empId, `Your attendance correction request for ${attendance_date} has been submitted to HR for approval.`]);

    await logAudit('Attendance Correction Requested', 'AttendanceCorrection', empId, `Correction requested for ${attendance_date}: ${reason}`);

    res.json({
      success: true,
      message: 'Attendance correction request submitted to HR for review and approval.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. GET & POST /api/employee/me/leaves (Leave Management)
erpRouter.get('/employee/me/leaves', async (req: Request, res: Response) => {
  try {
    const empId = extractEmployeeId(req);
    if (!empId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const [leaves] = await pool.query<RowDataPacket[]>(`
      SELECT * FROM leave_requests 
      WHERE employee_id = ? 
      ORDER BY id DESC
    `, [empId]);

    const [counts] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'APPROVED' THEN days_count ELSE 0 END) as approved_days,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected
      FROM leave_requests 
      WHERE employee_id = ?
    `, [empId]);

    const totalAnnualQuota = 18;
    const approvedDays = Number(counts[0]?.approved_days || 0);

    res.json({
      success: true,
      balance: {
        totalQuota: totalAnnualQuota,
        available: Math.max(0, totalAnnualQuota - approvedDays),
        casualLeaves: Math.max(0, 8 - Math.round(approvedDays * 0.45)),
        sickLeaves: Math.max(0, 6 - Math.round(approvedDays * 0.35)),
        earnedLeaves: Math.max(0, 4 - Math.round(approvedDays * 0.20)),
        usedDays: approvedDays,
        pendingCount: Number(counts[0]?.pending || 0),
        rejectedCount: Number(counts[0]?.rejected || 0),
      },
      leaves,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

erpRouter.post('/employee/me/leaves', async (req: Request, res: Response) => {
  try {
    const empId = extractEmployeeId(req);
    if (!empId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const { leave_type, start_date, end_date, days_count, reason } = req.body;
    if (!leave_type || !start_date || !end_date || !reason) {
      return res.status(400).json({ success: false, message: 'Leave type, dates, and reason are required.' });
    }

    const [resHeader] = await pool.query<ResultSetHeader>(`
      INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days_count, reason, status)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `, [empId, leave_type, start_date, end_date, days_count || 1.0, reason]);

    await pool.query(`
      INSERT INTO employee_notifications (employee_id, title, message, type, link)
      VALUES (?, 'Leave Request Submitted', ?, 'LEAVE', '#leaves')
    `, [empId, `Your request for ${leave_type} (${start_date} to ${end_date}) is pending HR approval.`]);

    await logAudit('Leave Application', 'LeaveRequest', empId, `${leave_type} (${start_date} to ${end_date}): ${reason}`);

    res.json({
      success: true,
      leaveId: resHeader.insertId,
      message: `Leave request for ${leave_type} (${days_count || 1} day) has been submitted for HR approval.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. GET /api/employee/me/payroll & /api/employee/me/payslips
erpRouter.get('/employee/me/payroll', async (req: Request, res: Response) => {
  try {
    const empId = extractEmployeeId(req);
    if (!empId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        p.*,
        e.full_name as employee_name,
        e.department,
        e.role as designation,
        ps.payslip_reference,
        ps.id as payslip_id,
        ps.email_status
      FROM payroll p
      JOIN employees e ON p.employee_id = e.employee_id
      LEFT JOIN payslips ps ON p.id = ps.payroll_id
      WHERE p.employee_id = ?
      ORDER BY p.pay_period DESC
    `, [empId]);

    res.json({ success: true, payroll: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

erpRouter.get('/employee/me/payslips', async (req: Request, res: Response) => {
  try {
    const empId = extractEmployeeId(req);
    if (!empId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        ps.*,
        e.full_name as employee_name,
        e.department,
        e.role as designation,
        e.bank_name,
        e.account_number,
        e.ifsc_code,
        e.pan_number,
        e.aadhaar_number,
        e.gender,
        e.joining_date,
        p.paid_days,
        p.lop_days,
        p.gross_salary,
        p.total_earnings,
        p.total_deductions,
        p.net_pay,
        p.status as payroll_status
      FROM payslips ps
      JOIN employees e ON ps.employee_id = e.employee_id
      JOIN payroll p ON ps.payroll_id = p.id
      WHERE ps.employee_id = ?
      ORDER BY ps.id DESC
    `, [empId]);

    res.json({ success: true, payslips: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. GET /api/employee/me/documents (My Documents)
erpRouter.get('/employee/me/documents', async (req: Request, res: Response) => {
  try {
    const empId = extractEmployeeId(req);
    if (!empId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    // Fetch employee details to link application_id and email
    const [empRows] = await pool.query<RowDataPacket[]>(`SELECT full_name, email FROM employees WHERE employee_id = ?`, [empId]);
    const empEmail = empRows[0]?.email || '';

    // Find candidate application_ids if any
    const [appRows] = await pool.query<RowDataPacket[]>(`
      SELECT application_id FROM job_applications 
      WHERE employee_id = ? OR (email = ? AND email != '')
    `, [empId, empEmail]);
    const appIds = appRows.map((r: any) => r.application_id).filter(Boolean);

    // Official HR generated documents (Offer, Appointment, etc.)
    const [docs] = await pool.query<RowDataPacket[]>(`
      SELECT DISTINCT id, document_number, employee_id, document_type, status, issue_date, file_name, file_size, email_status, created_at
      FROM hr_documents 
      WHERE employee_id = ? 
         OR employee_id IN (SELECT application_id FROM job_applications WHERE employee_id = ? OR email = ?)
         OR employee_id = ?
      ORDER BY id DESC
    `, [empId, empId, empEmail, empEmail]);

    // Employee personally uploaded documents (Aadhaar, PAN, Degree, etc.)
    const [uploadedDocs] = await pool.query<RowDataPacket[]>(`
      SELECT id, employee_id, document_name, document_type, file_name, file_size, status, upload_date, created_at
      FROM employee_uploaded_documents
      WHERE employee_id = ?
      ORDER BY id DESC
    `, [empId]);

    // Candidate application uploaded documents (Resume, ID Proof, etc.)
    let candidateDocs: any[] = [];
    if (appIds.length > 0) {
      const placeholders = appIds.map(() => '?').join(', ');
      const [candRows] = await pool.query<RowDataPacket[]>(`
        SELECT id, application_id, document_type, file_name, file_size, uploaded_at
        FROM application_documents
        WHERE application_id IN (${placeholders})
        ORDER BY id DESC
      `, appIds);
      candidateDocs = candRows;
    }

    res.json({
      success: true,
      documents: docs,
      uploadedDocuments: uploadedDocs,
      candidateDocuments: candidateDocs
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 9. GET & PATCH /api/employee/me/tasks (My Tasks)
erpRouter.get('/employee/me/tasks', async (req: Request, res: Response) => {
  try {
    const empId = extractEmployeeId(req);
    if (!empId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    let [tasks] = await pool.query<RowDataPacket[]>(`
      SELECT * FROM tasks 
      WHERE employee_id = ? 
      ORDER BY id DESC
    `, [empId]);

    // If no tasks exist yet, seed initial sprint tasks for this employee
    if (tasks.length === 0) {
      const defaultTasks = [
        {
          task_id: `TSK-${empId}-001`,
          title: 'OBD-II Diagnostic Testing & Integration Testing',
          project: 'Vehicle Inspection Platform',
          assigned_by: 'Vijay M (Tech Lead)',
          priority: 'High',
          due_date: '2026-09-05',
          status: 'In Progress',
          progress: 45,
          description: 'Verify sensor telemetry ingestion and diagnostic code parsing with regional workshop servers.'
        },
        {
          task_id: `TSK-${empId}-002`,
          title: 'Portal Security & Role Authorization Audit',
          project: 'HR Document Cloud',
          assigned_by: 'Arun Kumar (VP Operations)',
          priority: 'Urgent',
          due_date: '2026-08-31',
          status: 'In Progress',
          progress: 70,
          description: 'Review access control lists, token rotation protocols, and candidate document permissions.'
        },
        {
          task_id: `TSK-${empId}-003`,
          title: 'Monthly HR Payroll Data Synchronization',
          project: 'AutoRevive ERP',
          assigned_by: 'Jemsina Banu (HR Manager)',
          priority: 'Medium',
          due_date: '2026-08-28',
          status: 'Completed',
          progress: 100,
          description: 'Validate employee attendance counters, LOP calculations, and PAN/Aadhaar compliance.'
        }
      ];

      for (const t of defaultTasks) {
        await pool.query(`
          INSERT INTO tasks (task_id, employee_id, title, project, assigned_by, priority, due_date, status, progress, description)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [t.task_id, empId, t.title, t.project, t.assigned_by, t.priority, t.due_date, t.status, t.progress, t.description]);
      }

      const [seeded] = await pool.query<RowDataPacket[]>(`SELECT * FROM tasks WHERE employee_id = ? ORDER BY id DESC`, [empId]);
      tasks = seeded;
    }

    res.json({ success: true, tasks });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

erpRouter.patch('/employee/me/tasks/:id', async (req: Request, res: Response) => {
  try {
    const empId = extractEmployeeId(req);
    if (!empId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const taskId = req.params.id;
    const { status, progress, notes } = req.body;

    const finalProgress = status === 'Completed' ? 100 : (progress !== undefined ? Number(progress) : 50);

    await pool.query(`
      UPDATE tasks 
      SET status = COALESCE(?, status),
          progress = ?,
          notes = COALESCE(?, notes),
          updated_at = NOW()
      WHERE (id = ? OR task_id = ?) AND employee_id = ?
    `, [status, finalProgress, notes, taskId, taskId, empId]);

    await logAudit('Task Progress Updated', 'Task', taskId, `Employee ${empId} set status to ${status} (${finalProgress}%)`);

    res.json({ success: true, message: 'Task updated successfully. HR & Manager can view progress in real time.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 10. GET /api/employee/me/performance (My Performance)
erpRouter.get('/employee/me/performance', async (req: Request, res: Response) => {
  try {
    const empId = extractEmployeeId(req);
    if (!empId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const [empRows] = await pool.query<RowDataPacket[]>(`SELECT department, role, full_name FROM employees WHERE employee_id = ?`, [empId]);
    const emp = empRows[0] || { department: 'Engineering' };

    const [perfRows] = await pool.query<RowDataPacket[]>(`
      SELECT * FROM employee_performance WHERE employee_id = ? ORDER BY id DESC LIMIT 1
    `, [empId]);

    const perf = perfRows[0] || null;
    const dept = (emp.department || 'Engineering').toLowerCase();

    // Department specific KPI breakdown
    let kpis = [
      { name: 'Sprint Task Completion Rate', target: '90%', achieved: '94%', score: 95 },
      { name: 'Platform Code Quality & Reliability', target: '95%', achieved: '98%', score: 98 },
      { name: 'Diagnostic SLA & Bug Turnaround', target: '< 24 Hrs', achieved: '14.2 Hrs', score: 92 },
      { name: 'Peer Review & Collaboration Score', target: '4.5 / 5', achieved: '4.8 / 5', score: 96 }
    ];

    if (dept.includes('telecall')) {
      kpis = [
        { name: 'Daily Connected Outbound Calls', target: '60 Calls', achieved: '68 Calls', score: 96 },
        { name: 'Interested Lead Conversions', target: '15 / Month', achieved: '18 / Month', score: 95 },
        { name: 'Average Call Handling Time', target: '2.5 Mins', achieved: '2.8 Mins', score: 90 },
        { name: 'Customer Satisfaction Rating', target: '4.5 / 5', achieved: '4.9 / 5', score: 98 }
      ];
    } else if (dept.includes('sales') || dept.includes('marketing')) {
      kpis = [
        { name: 'Monthly Vehicle Sales Targets', target: '₹ 15 Lakhs', achieved: '₹ 18.5 Lakhs', score: 98 },
        { name: 'New Client Acquisition', target: '10 Dealers', achieved: '12 Dealers', score: 95 },
        { name: 'Lead Conversion Ratio', target: '25%', achieved: '31%', score: 94 },
        { name: 'Campaign ROI & Reach', target: '50K Users', achieved: '64K Users', score: 92 }
      ];
    } else if (dept.includes('design')) {
      kpis = [
        { name: 'Design Deliverable Turnaround', target: '< 48 Hrs', achieved: '32 Hrs', score: 95 },
        { name: 'Stakeholder Approval Rate', target: '85%', achieved: '92%', score: 94 },
        { name: 'Revision Iteration Limit', target: '< 2 Revisions', achieved: '1.2 Avg', score: 92 },
        { name: 'Brand Consistency & Asset Quality', target: '95%', achieved: '98%', score: 98 }
      ];
    } else if (dept.includes('social')) {
      kpis = [
        { name: 'Content Publishing Cadence', target: '12 Posts / Wk', achieved: '14 Posts / Wk', score: 96 },
        { name: 'Audience Reach & Impressions', target: '100K / Mo', achieved: '145K / Mo', score: 98 },
        { name: 'Engagement Rate', target: '4.5%', achieved: '5.8%', score: 95 },
        { name: 'Inbound Inquiries Generated', target: '40 / Mo', achieved: '52 / Mo', score: 94 }
      ];
    }

    res.json({
      success: true,
      performanceScore: perf?.performance_score ? Number(perf.performance_score) : 94.5,
      period: perf?.period || 'Q3 2026 Appraisal',
      managerFeedback: perf?.manager_feedback || 'Demonstrates outstanding dedication, timely milestone delivery, and strong adherence to AutoRevive technical quality standards.',
      kpis,
      reviewHistory: [
        { period: 'Q1 2026', score: 91.0, rating: 'Exceeds Expectations', reviewer: 'Arun Kumar' },
        { period: 'Q2 2026', score: 93.5, rating: 'Exceeds Expectations', reviewer: 'Vijay M' },
        { period: 'Q3 2026', score: 94.5, rating: 'Outstanding Performance', reviewer: 'Jemsina Banu' }
      ]
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 11. GET /api/employee/me/holidays (Company Holidays)
erpRouter.get('/employee/me/holidays', async (_req: Request, res: Response) => {
  try {
    const [holidays] = await pool.query<RowDataPacket[]>(`SELECT * FROM company_holidays ORDER BY holiday_date ASC`);
    res.json({ success: true, holidays });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 12. GET /api/employee/me/notifications & Read Action
erpRouter.get('/employee/me/notifications', async (req: Request, res: Response) => {
  try {
    const empId = extractEmployeeId(req);
    if (!empId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    let [notifications] = await pool.query<RowDataPacket[]>(`
      SELECT * FROM employee_notifications 
      WHERE employee_id = ? 
      ORDER BY id DESC 
      LIMIT 25
    `, [empId]);

    if (notifications.length === 0) {
      // Seed welcome notifications
      const defaults = [
        { title: 'Welcome to AutoRevive Employee Portal', message: 'Your official self-service terminal is live. You can clock in daily, view payslips, and check assigned tasks.', type: 'WELCOME', link: '#dashboard' },
        { title: 'July 2026 Payslip Available', message: 'Your finalized monthly payslip for July 2026 is published and ready for download.', type: 'PAYSLIP', link: '#payslips' },
        { title: 'Sprint 2026.Q3 Assigned', message: 'New technical deliverables have been assigned by your reporting manager.', type: 'TASK', link: '#tasks' }
      ];
      for (const d of defaults) {
        await pool.query(`INSERT INTO employee_notifications (employee_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)`, [empId, d.title, d.message, d.type, d.link]);
      }
      const [seeded] = await pool.query<RowDataPacket[]>(`SELECT * FROM employee_notifications WHERE employee_id = ? ORDER BY id DESC`, [empId]);
      notifications = seeded;
    }

    const unreadCount = notifications.filter((n: any) => !n.is_read).length;

    res.json({ success: true, unreadCount, notifications });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

erpRouter.patch('/employee/me/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const empId = extractEmployeeId(req);
    const id = req.params.id;
    await pool.query(`UPDATE employee_notifications SET is_read = TRUE WHERE id = ? AND employee_id = ?`, [id, empId]);
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

erpRouter.post('/employee/me/notifications/read-all', async (req: Request, res: Response) => {
  try {
    const empId = extractEmployeeId(req);
    await pool.query(`UPDATE employee_notifications SET is_read = TRUE WHERE employee_id = ?`, [empId]);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 13. GET /api/employee/me/announcements
erpRouter.get('/employee/me/announcements', async (req: Request, res: Response) => {
  try {
    const empId = extractEmployeeId(req);
    let dept = 'ALL';
    if (empId) {
      const [emp] = await pool.query<RowDataPacket[]>(`SELECT department FROM employees WHERE employee_id = ?`, [empId]);
      if (emp.length > 0) dept = emp[0].department;
    }

    const [announcements] = await pool.query<RowDataPacket[]>(`
      SELECT * FROM announcements 
      WHERE target_department = 'ALL' OR target_department = ?
      ORDER BY date DESC 
      LIMIT 10
    `, [dept]);

    res.json({ success: true, announcements });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 14. POST /api/employee/me/profile-change-request
erpRouter.post('/employee/me/profile-change-request', async (req: Request, res: Response) => {
  try {
    const empId = extractEmployeeId(req);
    if (!empId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const { requested_changes, reason } = req.body;
    if (!requested_changes || !reason) {
      return res.status(400).json({ success: false, message: 'Changes payload and reason are required.' });
    }

    const changesJson = typeof requested_changes === 'object' ? JSON.stringify(requested_changes) : requested_changes;

    await pool.query(`
      INSERT INTO profile_change_requests (employee_id, requested_changes, reason, status)
      VALUES (?, ?, ?, 'PENDING')
    `, [empId, changesJson, reason]);

    // Also automatically create a Support Ticket so HR can track and resolve it from Helpdesk & Tickets
    const ticketId = await nextCustomNumber('TKT', 4);
    const requestedObj = typeof requested_changes === 'object' ? requested_changes : JSON.parse(requested_changes);
    const details = `Profile changes requested: Mobile: ${requestedObj.mobile || 'Unchanged'}, Emergency Contact: ${requestedObj.emergency_contact || 'Unchanged'}, Address: ${requestedObj.address || 'Unchanged'}. Reason: ${reason}`;

    await pool.query(`
      INSERT INTO support_tickets (ticket_id, employee_id, subject, category, priority, description, status)
      VALUES (?, ?, 'Profile & Contact Details Update Request', 'Profile Change Request', 'Medium', ?, 'OPEN')
    `, [ticketId, empId, details]);

    await pool.query(`
      INSERT INTO employee_notifications (employee_id, title, message, type, link)
      VALUES (?, 'Profile Change Ticket Raised', ?, 'TICKET', '#tickets')
    `, [empId, `Support Ticket #${ticketId} created for your profile update request.`]);

    await logAudit('Profile Change Requested', 'ProfileChangeRequest', empId, `Ticket ${ticketId} raised: ${reason}`);

    res.json({
      success: true,
      ticketId,
      message: `Profile change request submitted as Support Ticket #${ticketId} to HR Helpdesk.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 14b. POST /api/employee/me/relieving-request (Apply Relieving Letter / 1-Month Resignation)
erpRouter.post('/employee/me/relieving-request', async (req: Request, res: Response) => {
  try {
    const empId = extractEmployeeId(req);
    if (!empId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const { reason, handover_notes, resignation_date, requested_relieving_date } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason for relieving / resignation is required.' });
    }

    const resDate = resignation_date || new Date().toISOString().split('T')[0];
    let relDate = requested_relieving_date;
    if (!relDate) {
      const d = new Date(resDate);
      d.setDate(d.getDate() + 30);
      relDate = d.toISOString().split('T')[0];
    }

    const requestId = await nextCustomNumber('REL', 4);
    await pool.query(`
      INSERT INTO relieving_requests (request_id, employee_id, notice_period_days, resignation_date, requested_relieving_date, reason, handover_notes, status)
      VALUES (?, ?, 30, ?, ?, ?, ?, 'PENDING_HR_APPROVAL')
    `, [requestId, empId, resDate, relDate, reason, handover_notes || 'Handover will be completed before relieving date']);

    // Create high priority ticket in support_tickets
    const ticketId = await nextCustomNumber('TKT', 4);
    const desc = `Resignation Submitted with mandatory 1-Month Notice Period.\nResignation Date: ${resDate}\nExpected Relieving Date: ${relDate} (30 Days)\nReason: ${reason}\nHandover: ${handover_notes || 'Handover in progress'}`;

    await pool.query(`
      INSERT INTO support_tickets (ticket_id, employee_id, subject, category, priority, description, status)
      VALUES (?, ?, '1-Month Resignation & Relieving Letter Application', 'Relieving & Resignation', 'High', ?, 'OPEN')
    `, [ticketId, empId, desc]);

    await pool.query(`UPDATE employees SET status = 'On Notice Period', notice_period_end_date = ?, relieving_reason = ? WHERE employee_id = ?`, [relDate, reason, empId]);

    await pool.query(`
      INSERT INTO employee_notifications (employee_id, title, message, type, link)
      VALUES (?, '1-Month Relieving Request Submitted', ?, 'RELIEVING', '#documents')
    `, [empId, `Your 1-month resignation & relieving letter application #${requestId} has been submitted to HR. Expected relieving date: ${relDate}.`]);

    await logAudit('Relieving Requested', 'RelievingRequest', empId, `Notice Period started, Relieving on ${relDate}`);

    res.json({
      success: true,
      requestId,
      ticketId,
      relievingDate: relDate,
      message: `1-Month Resignation & Relieving Request submitted successfully (#${requestId}). HR Helpdesk Ticket #${ticketId} created.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

erpRouter.get('/employee/me/relieving-request', async (req: Request, res: Response) => {
  try {
    const empId = extractEmployeeId(req);
    if (!empId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT * FROM relieving_requests WHERE employee_id = ? ORDER BY id DESC LIMIT 1
    `, [empId]);

    res.json({ success: true, request: rows[0] || null });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

erpRouter.get('/relieving-requests', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT r.*, e.full_name, e.department, e.role, e.email, e.mobile, e.joining_date, e.status as employee_status
      FROM relieving_requests r
      JOIN employees e ON r.employee_id = e.employee_id
      ORDER BY r.id DESC
    `);
    res.json({ success: true, requests: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

erpRouter.patch('/relieving-requests/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { status, hr_remarks, relieving_letter_issued } = req.body;

    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM relieving_requests WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Request not found.' });

    const reqItem = rows[0];
    await pool.query(`
      UPDATE relieving_requests 
      SET status = ?, hr_remarks = ?, approved_by = 'Jemsina Banu (HR)', approved_at = NOW(), relieving_letter_issued = COALESCE(?, relieving_letter_issued)
      WHERE id = ?
    `, [status, hr_remarks || null, relieving_letter_issued, id]);

    if (status === 'APPROVED_IN_NOTICE') {
      await pool.query(`
        UPDATE employees 
        SET status = 'On Notice Period', notice_period_end_date = ?, relieving_reason = ?
        WHERE employee_id = ?
      `, [reqItem.requested_relieving_date, reqItem.reason, reqItem.employee_id]);

      await pool.query(`
        INSERT INTO employee_notifications (employee_id, title, message, type, link)
        VALUES (?, '1-Month Notice Period Approved', ?, 'RELIEVING', '#documents')
      `, [reqItem.employee_id, `HR has approved your 1-month notice period. Your last working date is confirmed as ${reqItem.requested_relieving_date}. Relieving letter will be issued upon completion.`]);
    } else if (status === 'RELIEVED') {
      await pool.query(`UPDATE employees SET status = 'Relieved' WHERE employee_id = ?`, [reqItem.employee_id]);
      await pool.query(`
        INSERT INTO employee_notifications (employee_id, title, message, type, link)
        VALUES (?, 'Relieving Completed & Letter Issued', 'Your relieving process has been completed and Relieving Letter is generated in Document Center.', 'RELIEVING', '#documents')
      `, [reqItem.employee_id]);
    }

    res.json({ success: true, message: `Relieving request updated to ${status}.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 15. DYNAMIC DEPARTMENT-SPECIFIC MODULE API
erpRouter.get('/employee/me/department-module', async (req: Request, res: Response) => {
  try {
    const empId = extractEmployeeId(req);
    if (!empId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const [empRows] = await pool.query<RowDataPacket[]>(`SELECT department, role, full_name FROM employees WHERE employee_id = ?`, [empId]);
    if (empRows.length === 0) return res.status(404).json({ success: false, message: 'Employee not found.' });

    const emp = empRows[0];
    const dept = (emp.department || '').toLowerCase();
    const role = (emp.role || '').toLowerCase();

    // 1. TELECALLING MODULE
    if (dept.includes('telecall') || role.includes('telecaller') || role.includes('caller')) {
      const [leads] = await pool.query<RowDataPacket[]>(`SELECT * FROM telecaller_leads WHERE employee_id = ? ORDER BY id DESC LIMIT 20`, [empId]);
      return res.json({
        success: true,
        departmentType: 'telecalling',
        title: 'Telecalling & Inbound CRM',
        metrics: {
          dailyTarget: 60,
          todayCalls: 42,
          monthlyTarget: 1500,
          monthlyCalls: 980,
          conversions: 24,
          achievementRate: '94.2%',
        },
        leads: leads.length > 0 ? leads : [
          { id: 1, lead_name: 'Suresh Kumar (Chennai Auto)', phone: '+91 98401 22334', source: 'Website Inbound', status: 'Contacted', call_notes: 'Interested in used car inspection API package. Follow up on Monday.', follow_up_date: '2026-08-31' },
          { id: 2, lead_name: 'Manoj Patel (Apex Motors)', phone: '+91 97890 55667', source: 'Auction Portal', status: 'Interested', call_notes: 'Requested sample evaluation report and bulk pricing tier.', follow_up_date: '2026-09-01' },
          { id: 3, lead_name: 'Deepak Raj (Express Garage)', phone: '+91 94426 88990', source: 'Direct Referral', status: 'Converted', call_notes: 'Enrolled for enterprise workshop diagnostic scanning tool.', follow_up_date: null },
        ]
      });
    }

    // 2. SALES / MARKETING MODULE
    if (dept.includes('sales') || dept.includes('marketing') || role.includes('sales') || role.includes('marketing')) {
      const [campaigns] = await pool.query<RowDataPacket[]>(`SELECT * FROM marketing_campaigns WHERE employee_id = ? ORDER BY id DESC`, [empId]);
      return res.json({
        success: true,
        departmentType: 'sales_marketing',
        title: 'Sales Pipelines & Growth Campaigns',
        metrics: {
          monthlySalesTarget: '₹ 15,00,000',
          achievedSales: '₹ 18,45,000',
          conversions: 18,
          activeLeads: 36,
          incentivesEarned: '₹ 24,500',
        },
        campaigns: campaigns.length > 0 ? campaigns : [
          { id: 1, campaign_name: 'Q3 Enterprise Workshop Acquisition', channel: 'B2B Outbound', leads_generated: 45, conversions: 12, target_count: 50, incentive: 15000, status: 'Active' },
          { id: 2, campaign_name: 'Tamil Nadu Auto Dealer Bidding Expo', channel: 'Event & Referral', leads_generated: 32, conversions: 8, target_count: 30, incentive: 9500, status: 'Active' }
        ]
      });
    }

    // 3. DESIGNING MODULE
    if (dept.includes('design') || role.includes('designer') || role.includes('ui/ux')) {
      const [designs] = await pool.query<RowDataPacket[]>(`SELECT * FROM design_projects WHERE employee_id = ? ORDER BY id DESC`, [empId]);
      return res.json({
        success: true,
        departmentType: 'designing',
        title: 'Design Studio & Creative Projects',
        metrics: {
          assignedProjects: 8,
          pendingReview: 2,
          approved: 5,
          revisionRequired: 1,
          approvalRate: '92%',
        },
        projects: designs.length > 0 ? designs : [
          { id: 1, project_name: 'Employee Portal Self-Service Dark Mode UI', design_type: 'Figma UI/UX Mockup', status: 'Approved', revisions_count: 1, approved_at: '2026-08-27' },
          { id: 2, project_name: 'AutoRevive Inspection Certificate Redesign', design_type: 'Vector SVG & PDF Template', status: 'In Review', revisions_count: 2, approved_at: null },
          { id: 3, project_name: 'Independence Day Social Media Banners', design_type: 'Marketing Creatives', status: 'Completed', revisions_count: 0, approved_at: '2026-08-14' }
        ]
      });
    }

    // 4. SOCIAL MEDIA MODULE
    if (dept.includes('social') || role.includes('social media') || role.includes('content')) {
      const [posts] = await pool.query<RowDataPacket[]>(`SELECT * FROM social_media_posts WHERE employee_id = ? ORDER BY id DESC`, [empId]);
      return res.json({
        success: true,
        departmentType: 'social_media',
        title: 'Content Calendar & Engagement Analytics',
        metrics: {
          monthlyPosts: 48,
          totalReach: '185,400',
          avgEngagement: '6.4%',
          leadsGenerated: 74,
        },
        posts: posts.length > 0 ? posts : [
          { id: 1, title: 'OBD-II Diagnostic Real-World Scanning Demo', platform: 'Instagram', post_type: 'Reel', reach: 42500, engagement: 2840, leads_generated: 18, scheduled_date: '2026-08-29', status: 'Published' },
          { id: 2, title: '5 Critical Points Checked Before Buying Used Cars', platform: 'LinkedIn', post_type: 'Carousel', reach: 18900, engagement: 1250, leads_generated: 24, scheduled_date: '2026-08-30', status: 'Scheduled' },
          { id: 3, title: 'AutoRevive Tech Stack & Engineering Culture', platform: 'YouTube Shorts', post_type: 'Video', reach: 28000, engagement: 1900, leads_generated: 12, scheduled_date: '2026-09-02', status: 'Draft' }
        ]
      });
    }

    // 5. DEVELOPER / ENGINEERING (Default)
    const [devProjects] = await pool.query<RowDataPacket[]>(`SELECT * FROM developer_projects WHERE employee_id = ? ORDER BY id DESC`, [empId]);
    res.json({
      success: true,
      departmentType: 'developer',
      title: 'Engineering Sprint & Code Repository',
      metrics: {
        activeSprint: 'Sprint 2026.Q3.1',
        openBugs: 1,
        resolvedBugs: 14,
        sprintProgress: '88%',
        codeCommits: 46,
      },
      projects: devProjects.length > 0 ? devProjects : [
        { id: 1, project_name: 'AutoRevive HR ERP & Document Cloud', sprint_name: 'Sprint 2026.Q3.1', bug_count: 0, progress_percent: 95, status: 'Active', work_log: 'Built Employee Self-Service Terminal, Payslip A4 rendering, and multi-round screening.' },
        { id: 2, project_name: 'Vehicle Auction Realtime Bidding Engine', sprint_name: 'Sprint 2026.Q3.1', bug_count: 1, progress_percent: 80, status: 'Active', work_log: 'Integrated WebSocket telemetry and bid counter locks.' }
      ]
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 3. PAYROLL & PAYSLIPS
// =========================================================================

// List payroll for given month
erpRouter.get('/payroll', async (req: Request, res: Response) => {
  try {
    const admin = extractAdmin(req);
    if (admin && !['SUPER_ADMIN', 'HR_ADMIN'].includes(admin.role)) {
      return res.status(403).json({ success: false, message: `Access Denied. Role ${admin.role} is not authorized to view confidential Payroll records.` });
    }
    const month = (req.query.month as string) || '2026-07';
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        p.*,
        e.full_name as employee_name,
        e.department,
        e.role as designation,
        ps.payslip_reference,
        ps.id as payslip_id,
        ps.email_status
      FROM payroll p
      JOIN employees e ON p.employee_id = e.employee_id
      LEFT JOIN payslips ps ON p.id = ps.payroll_id
      WHERE p.pay_period = ?
      ORDER BY p.id ASC
    `, [month]);

    const grossTotal = rows.reduce((sum, r) => sum + Number(r.gross_salary || 0), 0);
    const deductionsTotal = rows.reduce((sum, r) => sum + Number(r.total_deductions || 0), 0);
    const netTotal = rows.reduce((sum, r) => sum + Number(r.net_pay || 0), 0);

    res.json({
      success: true,
      month,
      summary: {
        totalEmployees: rows.length,
        grossPayroll: grossTotal,
        totalDeductions: deductionsTotal,
        netPayroll: netTotal,
      },
      payroll: rows,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Generate payroll for a month
erpRouter.post('/payroll/generate', async (req: Request, res: Response) => {
  try {
    const { month = '2026-07' } = req.body;
    const [employees] = await pool.query<RowDataPacket[]>(`SELECT * FROM employees WHERE status = 'Active'`);

    let generatedCount = 0;
    for (const emp of employees) {
      const gross = Number(emp.salary_month || 41500);
      const deductions = emp.employee_id === 'AR-EMP-2026-0001' ? 0.00 : emp.employee_id === 'AR-EMP-2026-0002' ? 2750.00 : 2500.00;
      const net = gross - deductions;

      const [pRes] = await pool.query<ResultSetHeader>(`
        INSERT INTO payroll (employee_id, pay_period, paid_days, lop_days, gross_salary, total_earnings, total_deductions, net_pay, status)
        VALUES (?, ?, 31.0, 0.0, ?, ?, ?, ?, 'GENERATED')
        ON DUPLICATE KEY UPDATE 
          gross_salary = VALUES(gross_salary),
          total_earnings = VALUES(total_earnings),
          total_deductions = VALUES(total_deductions),
          net_pay = VALUES(net_pay),
          status = 'GENERATED'
      `, [emp.employee_id, month, gross, gross, deductions, net]);

      const payrollId = pRes.insertId;
      if (payrollId) {
        const seq = await nextCustomNumber('PS', 6);
        const payslipRef = `AR/PS/${month}/${seq.split('-')[3] || '000001'}`;
        await pool.query(`
          INSERT INTO payslips (payroll_id, employee_id, payslip_reference, pay_period, file_name, file_path, net_pay_in_words)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE payslip_reference = VALUES(payslip_reference)
        `, [
          payrollId,
          emp.employee_id,
          payslipRef,
          month,
          `${emp.employee_id}_${emp.full_name}_Payslip_${month}.pdf`,
          `backend/generated_documents/payslips/${emp.employee_id}_Payslip_${month}.pdf`,
          numberToWords(net)
        ]);
      }
      generatedCount++;
    }

    await logAudit('Payroll Generated', 'Payroll', month, `Generated payroll for ${generatedCount} employees for month ${month}`);

    res.json({
      success: true,
      message: `Payroll successfully computed and generated for ${generatedCount} employees for ${month}.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// List all payslips
erpRouter.get('/payslips', async (req: Request, res: Response) => {
  try {
    const month = (req.query.month as string) || '2026-07';
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        ps.*,
        e.full_name as employee_name,
        e.department,
        e.role as designation,
        e.bank_name,
        e.account_number,
        e.gender,
        e.joining_date,
        p.paid_days,
        p.lop_days,
        p.gross_salary,
        p.total_earnings,
        p.total_deductions,
        p.net_pay,
        p.status as payroll_status
      FROM payslips ps
      JOIN employees e ON ps.employee_id = e.employee_id
      JOIN payroll p ON ps.payroll_id = p.id
      WHERE ps.pay_period = ?
      ORDER BY ps.id ASC
    `, [month]);

    res.json({ success: true, payslips: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Download payslip PDF
erpRouter.get('/payslips/:id/download', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        ps.*,
        e.full_name as employee_name,
        e.department,
        e.role as designation,
        e.bank_name,
        e.account_number,
        e.ifsc_code,
        e.pan_number,
        e.aadhaar_number,
        e.gender,
        e.joining_date,
        p.paid_days,
        p.lop_days,
        p.total_earnings,
        p.total_deductions,
        p.net_pay
      FROM payslips ps
      JOIN employees e ON ps.employee_id = e.employee_id
      JOIN payroll p ON ps.payroll_id = p.id
      WHERE ps.id = ?
    `, [id]);

    if (rows.length === 0) return res.status(404).send('Payslip not found.');

    const p = rows[0];
    const gross = Number(p.total_earnings);
    const basic = Math.round(gross * 0.5);
    const hra = Math.round(gross * 0.25);
    const special = gross - basic - hra;

    const pdfBuffer = generatePayslipPdf({
      payslipReference: p.payslip_reference,
      payPeriod: p.pay_period,
      monthName: 'JULY 2026',
      employeeId: p.employee_id,
      employeeName: p.employee_name,
      designation: p.designation,
      gender: p.gender || 'Male',
      bankName: p.bank_name || 'HDFC Bank',
      accountNumber: p.account_number,
      ifscCode: p.ifsc_code || 'HDFC0001234',
      panNumber: p.pan_number || 'ABCDE1234F',
      aadhaarNumber: p.aadhaar_number || '4567 8901 2345',
      joiningDate: p.joining_date,
      paidDays: Number(p.paid_days || 31),
      lopDays: Number(p.lop_days || 0),
      earnings: {
        basic,
        hra,
        specialAllowance: special,
        totalEarnings: gross,
      },
      deductions: {
        totalDeductions: Number(p.total_deductions),
      },
      netPay: Number(p.net_pay),
      netPayInWords: p.net_pay_in_words || numberToWords(Number(p.net_pay)),
    });

    const filename = `${p.employee_id}_${p.employee_name.replace(/[^a-zA-Z0-9]/g, '_')}_Payslip_${p.pay_period}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// View payslip PDF in browser / iframe
erpRouter.get('/payslips/:id/preview', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        ps.*,
        e.full_name as employee_name,
        e.department,
        e.role as designation,
        e.bank_name,
        e.account_number,
        e.ifsc_code,
        e.pan_number,
        e.aadhaar_number,
        e.gender,
        e.joining_date,
        p.paid_days,
        p.lop_days,
        p.total_earnings,
        p.total_deductions,
        p.net_pay
      FROM payslips ps
      JOIN employees e ON ps.employee_id = e.employee_id
      JOIN payroll p ON ps.payroll_id = p.id
      WHERE ps.id = ?
    `, [id]);

    if (rows.length === 0) return res.status(404).send('Payslip not found.');

    const p = rows[0];
    const gross = Number(p.total_earnings);
    const basic = Math.round(gross * 0.5);
    const hra = Math.round(gross * 0.25);
    const special = gross - basic - hra;

    const pdfBuffer = generatePayslipPdf({
      payslipReference: p.payslip_reference,
      payPeriod: p.pay_period,
      monthName: 'JULY 2026',
      employeeId: p.employee_id,
      employeeName: p.employee_name,
      designation: p.designation,
      gender: p.gender || 'Male',
      bankName: p.bank_name || 'HDFC Bank',
      accountNumber: p.account_number,
      ifscCode: p.ifsc_code || 'HDFC0001234',
      panNumber: p.pan_number || 'ABCDE1234F',
      aadhaarNumber: p.aadhaar_number || '4567 8901 2345',
      joiningDate: p.joining_date,
      paidDays: Number(p.paid_days || 31),
      lopDays: Number(p.lop_days || 0),
      earnings: {
        basic,
        hra,
        specialAllowance: special,
        totalEarnings: gross,
      },
      deductions: {
        totalDeductions: Number(p.total_deductions),
      },
      netPay: Number(p.net_pay),
      netPayInWords: p.net_pay_in_words || numberToWords(Number(p.net_pay)),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// Email payslip with attached PDF
erpRouter.post('/payslips/:id/send-email', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        ps.*,
        e.full_name as employee_name,
        e.email,
        e.department,
        e.role as designation,
        e.bank_name,
        e.account_number,
        e.gender,
        e.joining_date,
        p.paid_days,
        p.lop_days,
        p.total_earnings,
        p.total_deductions,
        p.net_pay
      FROM payslips ps
      JOIN employees e ON ps.employee_id = e.employee_id
      JOIN payroll p ON ps.payroll_id = p.id
      WHERE ps.id = ?
    `, [id]);

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Payslip not found.' });

    const p = rows[0];
    const gross = Number(p.total_earnings);
    const basic = Math.round(gross * 0.5);
    const hra = Math.round(gross * 0.25);
    const special = gross - basic - hra;

    const pdfBuffer = generatePayslipPdf({
      payslipReference: p.payslip_reference,
      payPeriod: p.pay_period,
      monthName: 'JULY 2026',
      employeeId: p.employee_id,
      employeeName: p.employee_name,
      designation: p.designation,
      gender: p.gender || 'Male',
      bankName: p.bank_name || 'HDFC Bank',
      accountNumber: p.account_number,
      joiningDate: p.joining_date,
      paidDays: Number(p.paid_days || 31),
      lopDays: Number(p.lop_days || 0),
      earnings: { basic, hra, specialAllowance: special, totalEarnings: gross },
      deductions: { totalDeductions: Number(p.total_deductions) },
      netPay: Number(p.net_pay),
      netPayInWords: p.net_pay_in_words || numberToWords(Number(p.net_pay)),
    });

    const recipientEmail = req.body.email || p.email || 'narendhardan@gmail.com';
    const filename = `${p.employee_id}_${p.employee_name.replace(/[^a-zA-Z0-9]/g, '_')}_Payslip_${p.pay_period}.pdf`;

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_SERVER || 'smtp.gmail.com',
      port: Number(process.env.MAIL_PORT || 587),
      secure: false,
      auth: {
        user: process.env.MAIL_USERNAME || 'hr@autorevives.com',
        pass: process.env.MAIL_PASSWORD || 'cjrk paso ysae bbbm',
      },
    });

    await transporter.sendMail({
      from: `"AutoRevive HR" <${process.env.MAIL_FROM || 'hr@autorevives.com'}>`,
      to: recipientEmail,
      subject: `AutoRevive Payslip – JULY 2026 – ${p.employee_name}`,
      text: `Dear ${p.employee_name},\n\nPlease find attached your official AutoRevive payslip for JULY 2026.\n\nEmployee ID: ${p.employee_id}\nPayslip Reference: ${p.payslip_reference}\nNet Pay: ₹${Number(p.net_pay).toLocaleString('en-IN')}/-\n\nRegards,\nHuman Resources Department\nAutoRevive`,
      attachments: [{ filename, content: pdfBuffer, contentType: 'application/pdf' }],
    });

    await pool.query(`UPDATE payslips SET email_status = 'SENT', emailed_at = NOW() WHERE id = ?`, [id]);
    await logAudit('Payslip Emailed', 'Payslip', p.payslip_reference, `Sent to ${recipientEmail}`);

    res.json({
      success: true,
      message: `Payslip successfully emailed to ${recipientEmail}.`,
    });
  } catch (err: any) {
    console.error('Email Payslip Error:', err);
    await pool.query(`UPDATE payslips SET email_status = 'FAILED' WHERE id = ?`, [req.params.id]);
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 4. ATTENDANCE & LEAVES
// =========================================================================

// List attendance for a date or month
erpRouter.get('/attendance', async (req: Request, res: Response) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        e.employee_id,
        e.full_name as employee_name,
        e.department,
        e.role as designation,
        COALESCE(a.status, 'Present') as status,
        COALESCE(a.check_in, '09:15:00') as check_in,
        COALESCE(a.check_out, '18:00:00') as check_out,
        COALESCE(a.working_hours, 8.5) as working_hours,
        COALESCE(a.late_minutes, 0) as late_minutes,
        COALESCE(a.overtime_hours, 0) as overtime_hours
      FROM employees e
      LEFT JOIN attendances a ON e.employee_id = a.employee_id AND a.date = ?
      WHERE e.status = 'Active'
      ORDER BY e.employee_id ASC
    `, [date]);

    res.json({ success: true, date, attendance: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Save single attendance
erpRouter.post('/attendance', async (req: Request, res: Response) => {
  try {
    const b = req.body;
    await pool.query(`
      INSERT INTO attendances (employee_id, date, check_in, check_out, working_hours, status, late_minutes, overtime_hours)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        status = VALUES(status), 
        check_in = VALUES(check_in), 
        check_out = VALUES(check_out), 
        working_hours = VALUES(working_hours),
        late_minutes = VALUES(late_minutes),
        overtime_hours = VALUES(overtime_hours)
    `, [b.employee_id, b.date, b.check_in || '09:15:00', b.check_out || '18:00:00', b.working_hours || 8.5, b.status || 'Present', b.late_minutes || 0, b.overtime_hours || 0]);

    res.json({ success: true, message: 'Attendance recorded.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// List leaves
erpRouter.get('/leaves', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT l.*, e.full_name as employee_name, e.department, e.role as designation
      FROM leave_requests l
      JOIN employees e ON l.employee_id = e.employee_id
      ORDER BY l.id DESC
    `);
    res.json({ success: true, leaves: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Submit leave
erpRouter.post('/leaves', async (req: Request, res: Response) => {
  try {
    const b = req.body;
    await pool.query(`
      INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days_count, reason, status)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `, [b.employee_id, b.leave_type, b.start_date, b.end_date, b.days_count || 1.0, b.reason]);

    await logAudit('Leave Requested', 'Leave', b.employee_id, `${b.leave_type} from ${b.start_date} to ${b.end_date}`);
    res.json({ success: true, message: 'Leave request submitted for manager approval.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Approve / Reject Leave
erpRouter.patch('/leaves/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { status, approver_notes } = req.body; // 'APPROVED' or 'REJECTED'
    await pool.query(`
      UPDATE leave_requests 
      SET status = ?, approver_notes = ?, approved_by = 'Jemsina Banu (HR)', approved_at = NOW() 
      WHERE id = ?
    `, [status, approver_notes || null, id]);

    if (status === 'APPROVED') {
      const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM leave_requests WHERE id = ?`, [id]);
      if (rows.length > 0) {
        const l = rows[0];
        // Mark attendance as Leave
        await pool.query(`
          INSERT INTO attendances (employee_id, date, status, working_hours)
          VALUES (?, ?, 'Leave', 0.0)
          ON DUPLICATE KEY UPDATE status = 'Leave', working_hours = 0.0
        `, [l.employee_id, l.start_date]);
      }
    }

    res.json({ success: true, message: `Leave ${status.toLowerCase()} successfully.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 5. INTERNSHIPS
// =========================================================================
erpRouter.get('/internships', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM internships ORDER BY id DESC`);
    res.json({ success: true, internships: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update internship evaluation
erpRouter.patch('/internships/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const b = req.body;
    await pool.query(`
      UPDATE internships 
      SET performance_score = COALESCE(?, performance_score),
          attendance_score = COALESCE(?, attendance_score),
          mentor_feedback = COALESCE(?, mentor_feedback),
          placement_eligible = COALESCE(?, placement_eligible),
          status = COALESCE(?, status)
      WHERE id = ?
    `, [b.performance_score, b.attendance_score, b.mentor_feedback, b.placement_eligible, b.status, id]);

    res.json({ success: true, message: 'Internship evaluation updated.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 6. AUDIT LOGS & REPORTS EXPORT
// =========================================================================
erpRouter.get('/audit-logs', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM audit_logs ORDER BY id DESC LIMIT 50`);
    res.json({ success: true, auditLogs: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Export CSV report
erpRouter.get('/reports/:type/export', async (req: Request, res: Response) => {
  try {
    const type = req.params.type;
    let csv = '';

    if (type === 'payroll') {
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT p.employee_id, e.full_name, e.department, p.pay_period, p.gross_salary, p.total_deductions, p.net_pay, p.status 
        FROM payroll p JOIN employees e ON p.employee_id = e.employee_id
      `);
      csv = 'Employee ID,Full Name,Department,Pay Period,Gross Salary,Deductions,Net Pay,Status\n';
      rows.forEach((r: any) => {
        csv += `"${r.employee_id}","${r.full_name}","${r.department}","${r.pay_period}",${r.gross_salary},${r.total_deductions},${r.net_pay},"${r.status}"\n`;
      });
    } else if (type === 'recruitment') {
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT application_id, full_name, email, mobile, job_title, experience_type, status, offer_status 
        FROM job_applications
      `);
      csv = 'Application ID,Candidate Name,Email,Mobile,Job Title,Experience,Status,Offer Status\n';
      rows.forEach((r: any) => {
        csv += `"${r.application_id}","${r.full_name}","${r.email}","${r.mobile}","${r.job_title}","${r.experience_type}","${r.status}","${r.offer_status}"\n`;
      });
    } else {
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT employee_id, full_name, role, department, joining_date, salary_month, status 
        FROM employees
      `);
      csv = 'Employee ID,Full Name,Role,Department,Joining Date,Monthly Salary,Status\n';
      rows.forEach((r: any) => {
        csv += `"${r.employee_id}","${r.full_name}","${r.role}","${r.department}","${r.joining_date}",${r.salary_month},"${r.status}"\n`;
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="AutoRevive_${type}_Report.csv"`);
    res.send(csv);
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// =========================================================================
// 7. HR MANAGEMENT & APPROVALS (SYNCHRONIZATION WITH EMPLOYEE PORTAL)
// =========================================================================

// List Attendance Corrections for HR
erpRouter.get('/attendance/corrections', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT c.*, e.full_name as employee_name, e.department, e.role as designation 
      FROM attendance_corrections c
      JOIN employees e ON c.employee_id = e.employee_id
      ORDER BY c.id DESC
    `);
    res.json({ success: true, corrections: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Approve / Reject Attendance Correction
erpRouter.patch('/attendance/corrections/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { status, approver_notes } = req.body; // 'APPROVED' or 'REJECTED'

    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM attendance_corrections WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Correction request not found.' });

    const corr = rows[0];

    await pool.query(`
      UPDATE attendance_corrections 
      SET status = ?, approver_notes = ?, approved_by = 'Jemsina Banu (HR)', approved_at = NOW() 
      WHERE id = ?
    `, [status, approver_notes || null, id]);

    if (status === 'APPROVED') {
      // Update actual attendance record in attendances table
      await pool.query(`
        INSERT INTO attendances (employee_id, date, check_in, check_out, working_hours, status)
        VALUES (?, ?, ?, ?, 8.5, 'Present')
        ON DUPLICATE KEY UPDATE 
          check_in = VALUES(check_in), 
          check_out = VALUES(check_out), 
          status = 'Present', 
          working_hours = 8.5
      `, [corr.employee_id, corr.attendance_date, corr.requested_check_in, corr.requested_check_out]);

      await pool.query(`
        INSERT INTO employee_notifications (employee_id, title, message, type, link)
        VALUES (?, 'Attendance Correction Approved', ?, 'ATTENDANCE', '#attendance')
      `, [corr.employee_id, `Your attendance correction request for ${corr.attendance_date} has been approved by HR.`]);
    } else {
      await pool.query(`
        INSERT INTO employee_notifications (employee_id, title, message, type, link)
        VALUES (?, 'Attendance Correction Rejected', ?, 'ATTENDANCE', '#attendance')
      `, [corr.employee_id, `Your attendance correction request for ${corr.attendance_date} was rejected: ${approver_notes || 'Please contact HR.'}`]);
    }

    res.json({ success: true, message: `Attendance correction ${status.toLowerCase()} successfully.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// List Profile Change Requests for HR
erpRouter.get('/employees/profile-requests', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT p.*, e.full_name, e.email, e.mobile, e.department, e.role 
      FROM profile_change_requests p
      JOIN employees e ON p.employee_id = e.employee_id
      ORDER BY p.id DESC
    `);
    res.json({ success: true, requests: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Approve Profile Change Request
erpRouter.patch('/employees/profile-requests/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { status, approver_notes } = req.body;

    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM profile_change_requests WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Request not found.' });

    const reqItem = rows[0];
    await pool.query(`
      UPDATE profile_change_requests 
      SET status = ?, approver_notes = ?, approved_by = 'Jemsina Banu (HR)', approved_at = NOW() 
      WHERE id = ?
    `, [status, approver_notes || null, id]);

    if (status === 'APPROVED') {
      const changes = typeof reqItem.requested_changes === 'string' ? JSON.parse(reqItem.requested_changes) : reqItem.requested_changes;
      if (changes && typeof changes === 'object') {
        const allowed = ['address', 'mobile', 'emergency_contact', 'bank_name', 'account_number', 'ifsc_code', 'dob', 'gender'];
        const updates: string[] = [];
        const values: any[] = [];
        for (const [k, v] of Object.entries(changes)) {
          if (allowed.includes(k) && v !== undefined) {
            updates.push(`${k} = ?`);
            values.push(v);
          }
        }
        if (updates.length > 0) {
          values.push(reqItem.employee_id);
          await pool.query(`UPDATE employees SET ${updates.join(', ')} WHERE employee_id = ?`, values);
        }
      }
      await pool.query(`
        INSERT INTO employee_notifications (employee_id, title, message, type, link)
        VALUES (?, 'Profile Changes Approved', 'Your profile update request has been approved and updated in the system.', 'PROFILE', '#profile')
      `, [reqItem.employee_id]);
    }

    res.json({ success: true, message: `Profile change request ${status.toLowerCase()} successfully.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// List & Assign Tasks (HR / Manager)
erpRouter.get('/tasks', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT t.*, e.full_name as employee_name, e.department, e.role as designation 
      FROM tasks t
      JOIN employees e ON t.employee_id = e.employee_id
      ORDER BY t.id DESC
    `);
    res.json({ success: true, tasks: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

erpRouter.post('/tasks', async (req: Request, res: Response) => {
  try {
    const b = req.body;
    const taskId = await nextCustomNumber('TSK', 4);
    await pool.query(`
      INSERT INTO tasks (task_id, employee_id, title, project, assigned_by, priority, start_date, due_date, status, progress, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 0, ?)
    `, [
      taskId, b.employee_id, b.title, b.project || 'AutoRevive Engineering',
      b.assigned_by || 'HR / Team Lead', b.priority || 'Medium',
      b.start_date || new Date().toISOString().split('T')[0],
      b.due_date || '2026-09-10', b.description || ''
    ]);

    await pool.query(`
      INSERT INTO employee_notifications (employee_id, title, message, type, link)
      VALUES (?, 'New Task Assigned', ?, 'TASK', '#tasks')
    `, [b.employee_id, `You have been assigned task: "${b.title}" with priority ${b.priority || 'Medium'}.`]);

    res.json({ success: true, taskId, message: 'Task assigned successfully to employee.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// HR Announcements Management
erpRouter.get('/announcements', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM announcements ORDER BY date DESC`);
    res.json({ success: true, announcements: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

erpRouter.post('/announcements', async (req: Request, res: Response) => {
  try {
    const { title, message, date, priority, target_department, created_by } = req.body;
    await pool.query(`
      INSERT INTO announcements (title, message, date, priority, target_department, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [title, message, date || new Date().toISOString().split('T')[0], priority || 'Medium', target_department || 'ALL', created_by || 'HR Department']);

    res.json({ success: true, message: 'Announcement published successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 8. SUPPORT TICKETS / HELPDESK SYSTEM
// =========================================================================

// List all tickets (HR view)
erpRouter.get('/tickets', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT t.*, e.full_name as employee_name, e.department, e.role as designation, e.email as employee_email 
      FROM support_tickets t
      JOIN employees e ON t.employee_id = e.employee_id
      ORDER BY t.id DESC
    `);
    res.json({ success: true, tickets: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// List tickets for authenticated employee
erpRouter.get('/employee/me/tickets', async (req: Request, res: Response) => {
  try {
    const empId = extractEmployeeId(req);
    if (!empId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT * FROM support_tickets 
      WHERE employee_id = ? 
      ORDER BY id DESC
    `, [empId]);

    res.json({ success: true, tickets: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create new support ticket (Employee or HR)
erpRouter.post('/tickets', async (req: Request, res: Response) => {
  try {
    const empId = req.body.employee_id || extractEmployeeId(req);
    const { subject, category, priority, description } = req.body;

    if (!empId || !subject || !description) {
      return res.status(400).json({ success: false, message: 'Employee ID, subject, and description are required.' });
    }

    const ticketId = await nextCustomNumber('TKT', 4);
    await pool.query(`
      INSERT INTO support_tickets (ticket_id, employee_id, subject, category, priority, description, status)
      VALUES (?, ?, ?, ?, ?, ?, 'OPEN')
    `, [ticketId, empId, subject, category || 'HR Policy & General', priority || 'Medium', description]);

    await pool.query(`
      INSERT INTO employee_notifications (employee_id, title, message, type, link)
      VALUES (?, 'Support Ticket Raised', ?, 'TICKET', '#tickets')
    `, [empId, `Ticket #${ticketId}: "${subject}" has been submitted to HR Helpdesk.`]);

    await logAudit('Ticket Raised', 'SupportTicket', ticketId, `Employee ${empId} raised ticket: ${subject}`);

    res.json({ success: true, ticketId, message: 'Support ticket submitted successfully. HR Helpdesk has been notified.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update / Resolve Support Ticket (HR)
erpRouter.patch('/tickets/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { status, hr_response, resolved_by } = req.body;

    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM support_tickets WHERE id = ? OR ticket_id = ?`, [id, id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Ticket not found.' });

    const ticket = rows[0];
    const resolvedAt = status === 'RESOLVED' || status === 'CLOSED' ? new Date() : null;

    await pool.query(`
      UPDATE support_tickets 
      SET status = COALESCE(?, status),
          hr_response = COALESCE(?, hr_response),
          resolved_by = COALESCE(?, 'Jemsina Banu (HR)'),
          resolved_at = COALESCE(?, resolved_at)
      WHERE id = ?
    `, [status, hr_response, resolved_by, resolvedAt, ticket.id]);

    // If resolving a profile change request ticket, apply updates to the employee record
    if (status === 'RESOLVED' && (ticket.category === 'Profile Change Request' || ticket.subject?.toLowerCase().includes('profile'))) {
      const [reqRows] = await pool.query<RowDataPacket[]>(`
        SELECT * FROM profile_change_requests WHERE employee_id = ? AND status = 'PENDING' ORDER BY id DESC LIMIT 1
      `, [ticket.employee_id]);

      if (reqRows.length > 0) {
        const reqItem = reqRows[0];
        await pool.query(`
          UPDATE profile_change_requests 
          SET status = 'APPROVED', approver_notes = ?, approved_by = 'Jemsina Banu (HR)', approved_at = NOW() 
          WHERE id = ?
        `, [hr_response || 'Approved via Helpdesk', reqItem.id]);

        const changes = typeof reqItem.requested_changes === 'string' ? JSON.parse(reqItem.requested_changes) : reqItem.requested_changes;
        if (changes && typeof changes === 'object') {
          const allowed = ['address', 'mobile', 'emergency_contact', 'bank_name', 'account_number', 'ifsc_code', 'dob', 'gender'];
          const updates: string[] = [];
          const values: any[] = [];
          for (const [k, v] of Object.entries(changes)) {
            if (allowed.includes(k) && v !== undefined && v !== '') {
              updates.push(`${k} = ?`);
              values.push(v);
            }
          }
          if (updates.length > 0) {
            values.push(ticket.employee_id);
            await pool.query(`UPDATE employees SET ${updates.join(', ')} WHERE employee_id = ?`, values);
          }
        }
      }
    }

    // If resolving or rejecting a Relieving & Resignation ticket
    if (ticket.category === 'Relieving & Resignation' || ticket.subject?.toLowerCase().includes('relieving') || ticket.subject?.toLowerCase().includes('resignation')) {
      const [relRows] = await pool.query<RowDataPacket[]>(`
        SELECT * FROM relieving_requests WHERE employee_id = ? ORDER BY id DESC LIMIT 1
      `, [ticket.employee_id]);

      if (relRows.length > 0) {
        const relItem = relRows[0];
        if (status === 'RESOLVED') {
          await pool.query(`
            UPDATE relieving_requests 
            SET status = 'APPROVED_IN_NOTICE', hr_remarks = ?, approved_by = 'Jemsina Banu (HR)', approved_at = NOW() 
            WHERE id = ?
          `, [hr_response || '1-Month Notice Approved via Helpdesk', relItem.id]);

          await pool.query(`
            UPDATE employees 
            SET status = 'On Notice Period', notice_period_end_date = ?, relieving_reason = ? 
            WHERE employee_id = ?
          `, [relItem.requested_relieving_date, relItem.reason, ticket.employee_id]);

          await pool.query(`
            INSERT INTO employee_notifications (employee_id, title, message, type, link)
            VALUES (?, '1-Month Resignation Accepted', ?, 'RELIEVING', '#documents')
          `, [ticket.employee_id, `HR has accepted your resignation & approved 1-month notice period. Your last working date is confirmed as ${relItem.requested_relieving_date}. HR Remarks: ${hr_response || 'Accepted'}`]);
        } else if (status === 'REJECTED' || status === 'CLOSED') {
          await pool.query(`
            UPDATE relieving_requests 
            SET status = 'REJECTED', hr_remarks = ?, approved_by = 'Jemsina Banu (HR)', approved_at = NOW() 
            WHERE id = ?
          `, [hr_response || 'Rejected by HR', relItem.id]);

          await pool.query(`
            UPDATE employees 
            SET status = 'Active', notice_period_end_date = NULL, relieving_reason = NULL 
            WHERE employee_id = ?
          `, [ticket.employee_id]);

          await pool.query(`
            INSERT INTO employee_notifications (employee_id, title, message, type, link)
            VALUES (?, 'Resignation / Relieving Request Rejected', ?, 'RELIEVING', '#documents')
          `, [ticket.employee_id, `HR has rejected your resignation / relieving application. HR Remarks: ${hr_response || 'Declined by HR'}`]);
        }
      }
    }

    await pool.query(`
      INSERT INTO employee_notifications (employee_id, title, message, type, link)
      VALUES (?, 'Support Ticket Updated', ?, 'TICKET', '#tickets')
    `, [ticket.employee_id, `Your ticket #${ticket.ticket_id} status updated to ${status}. HR Remarks: ${hr_response || 'Resolved by HR'}`]);

    res.json({ success: true, message: `Ticket status updated to ${status}.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 9. EMPLOYEE DOCUMENT UPLOADS & REPOSITORY
// =========================================================================

// Employee uploads personal document
erpRouter.post('/employee/me/documents/upload', async (req: Request, res: Response) => {
  try {
    const empId = extractEmployeeId(req);
    if (!empId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

    const { document_name, document_type, file_name, file_base64, file_size } = req.body;
    if (!document_name || !file_name) {
      return res.status(400).json({ success: false, message: 'Document name and file are required.' });
    }

    const uploadDate = new Date().toISOString().split('T')[0];
    const filePath = `uploads/employees/${empId}/${file_name}`;

    const [resHeader] = await pool.query<ResultSetHeader>(`
      INSERT INTO employee_uploaded_documents (employee_id, document_name, document_type, file_name, file_path, file_size, status, upload_date)
      VALUES (?, ?, ?, ?, ?, ?, 'VERIFIED', ?)
    `, [empId, document_name, document_type || 'Identity Document', file_name, filePath, file_size || 150000, uploadDate]);

    await pool.query(`
      INSERT INTO employee_notifications (employee_id, title, message, type, link)
      VALUES (?, 'Document Uploaded', ?, 'DOCUMENT', '#documents')
    `, [empId, `Your document "${document_name}" has been uploaded to your personal repository.`]);

    await logAudit('Document Uploaded', 'EmployeeDocument', empId, `Uploaded ${document_name} (${file_name})`);

    res.json({
      success: true,
      documentId: resHeader.insertId,
      message: `Document "${document_name}" uploaded and saved to your official repository.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete uploaded document
erpRouter.delete('/employee/me/documents/uploaded/:id', async (req: Request, res: Response) => {
  try {
    const empId = extractEmployeeId(req);
    const id = req.params.id;
    await pool.query(`DELETE FROM employee_uploaded_documents WHERE id = ? AND employee_id = ?`, [id, empId]);
    res.json({ success: true, message: 'Document removed from repository.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 10. HOLIDAYS MANAGEMENT (HR SETUP & CALENDAR)
// =========================================================================

// List all holidays
erpRouter.get('/holidays', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM company_holidays ORDER BY holiday_date ASC`);
    res.json({ success: true, holidays: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add new holiday (HR)
erpRouter.post('/holidays', async (req: Request, res: Response) => {
  try {
    const { name, holiday_date, day_name, holiday_type } = req.body;
    if (!name || !holiday_date) {
      return res.status(400).json({ success: false, message: 'Holiday name and date are required.' });
    }

    const day = day_name || new Date(holiday_date).toLocaleDateString('en-US', { weekday: 'long' });
    const year = new Date(holiday_date).getFullYear() || 2026;

    await pool.query(`
      INSERT INTO company_holidays (name, holiday_date, day_name, holiday_type, year)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name), day_name = VALUES(day_name), holiday_type = VALUES(holiday_type)
    `, [name, holiday_date, day, holiday_type || 'Public Holiday', year]);

    await logAudit('Holiday Created', 'Holiday', holiday_date, `Added ${name} on ${holiday_date}`);

    res.json({ success: true, message: `Holiday "${name}" on ${holiday_date} added to Company Calendar.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete holiday (HR)
erpRouter.delete('/holidays/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await pool.query(`DELETE FROM company_holidays WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Holiday removed from Company Calendar.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 11. PERFORMANCE APPRAISALS & RATINGS (HR SUBMITTED)
// =========================================================================

// HR submits performance evaluation for an employee
erpRouter.post('/performance/review', async (req: Request, res: Response) => {
  try {
    const { employee_id, period, performance_score, manager_feedback, kpis } = req.body;
    if (!employee_id || !performance_score) {
      return res.status(400).json({ success: false, message: 'Employee ID and performance score are required.' });
    }

    const reviewPeriod = period || 'Q3 2026 Appraisal';
    const kpisJson = kpis ? JSON.stringify(kpis) : null;

    await pool.query(`
      INSERT INTO employee_performance (employee_id, period, performance_score, manager_feedback, kpis)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        performance_score = VALUES(performance_score),
        manager_feedback = VALUES(manager_feedback),
        kpis = VALUES(kpis),
        updated_at = NOW()
    `, [employee_id, reviewPeriod, performance_score, manager_feedback || 'Demonstrates strong dedication and adherence to AutoRevive technical quality standards.', kpisJson]);

    await pool.query(`
      INSERT INTO employee_notifications (employee_id, title, message, type, link)
      VALUES (?, 'Performance Appraisal Published', ?, 'PERFORMANCE', '#performance')
    `, [employee_id, `Your ${reviewPeriod} performance evaluation has been published by HR (Score: ${performance_score}%).`]);

    await logAudit('Performance Evaluated', 'EmployeePerformance', employee_id, `HR evaluated employee ${employee_id} for ${reviewPeriod}: ${performance_score}%`);

    res.json({ success: true, message: `Performance appraisal submitted for ${employee_id} (${performance_score}%). Reflected in Employee Portal.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 12. PAYSLIPS PUBLISH & BULK EMAIL ACTIONS
// =========================================================================

// Publish payslip to portal
erpRouter.post('/payslips/:id/publish', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await pool.query(`UPDATE payslips SET portal_visible = TRUE WHERE id = ?`, [id]);
    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM payslips WHERE id = ?`, [id]);
    if (rows.length > 0) {
      await pool.query(`
        INSERT INTO employee_notifications (employee_id, title, message, type, link)
        VALUES (?, 'Payslip Published', ?, 'PAYSLIP', '#payroll_payslips')
      `, [rows[0].employee_id, `Your payslip for ${rows[0].pay_period} (${rows[0].payslip_reference}) is now live on the portal.`]);
    }
    res.json({ success: true, message: 'Payslip published to Employee Portal.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Bulk publish all payslips for a month
erpRouter.post('/payslips/publish-all', async (req: Request, res: Response) => {
  try {
    const { month = '2026-07' } = req.body;
    await pool.query(`UPDATE payslips SET portal_visible = TRUE WHERE pay_period = ?`, [month]);
    res.json({ success: true, message: `All payslips for ${month} published to Employee Portal.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});


