import { Router, Request, Response } from 'express';
import { pool, nextCustomNumber, generateSafeAdminId } from '../../database/database';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { sendOtpEmail } from '../services/emailService';

export const rbacRouter = Router();
const otpCache = new Map<string, { otp: string; expiresAt: number; attempts: number }>();

// =========================================================================
// 1. RBAC HELPERS & SECURITY MIDDLEWARE
// =========================================================================

export interface AdminUser {
  id: number;
  admin_id: string;
  full_name: string;
  email: string;
  mobile: string | null;
  role: 'SUPER_ADMIN' | 'HR_ADMIN' | 'TELECALLING_ADMIN' | 'MARKETING_ADMIN' | 'DESIGN_ADMIN' | 'SOCIAL_MEDIA_ADMIN' | 'DEPARTMENT_MANAGER';
  department: string;
  status: 'Active' | 'Inactive';
  permissions: string[];
}

export const extractAdmin = (req: Request): { admin_id: string; role: string; email: string; name: string } | null => {
  const xAdminId = req.headers['x-admin-id'] as string;
  const xAdminRole = req.headers['x-admin-role'] as string;
  const xAdminEmail = req.headers['x-admin-email'] as string;
  const xAdminName = req.headers['x-admin-name'] as string;

  if (xAdminId && xAdminRole) {
    return { admin_id: xAdminId, role: xAdminRole, email: xAdminEmail || '', name: xAdminName || '' };
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer adm_')) {
    const parts = authHeader.replace('Bearer ', '').split('_');
    if (parts.length >= 3) {
      return { admin_id: parts[2], role: parts[1], email: '', name: '' };
    }
  }
  return null;
};

export const getRolePermissions = (role: string): string[] => {
  switch (role) {
    case 'SUPER_ADMIN':
      return ['*'];
    case 'HR_ADMIN':
      return [
        'dashboard.view', 'employees.view', 'employees.create', 'employees.edit', 'employees.delete',
        'recruitment.view', 'recruitment.create', 'recruitment.edit', 'recruitment.offer', 'recruitment.shortlist',
        'document_center.view', 'document_center.create', 'document_center.delete',
        'attendance.view', 'attendance.mark', 'attendance.edit', 'attendance.approve',
        'payroll.view', 'payroll.process', 'payroll.edit',
        'payslips.view', 'payslips.generate', 'payslips.download',
        'leaves.view', 'leaves.approve', 'leaves.reject',
        'performance.view', 'performance.create', 'performance.edit',
        'tickets.view', 'tickets.resolve', 'tickets.close',
        'holidays.view', 'holidays.create', 'holidays.edit', 'holidays.delete',
        'reports.view', 'reports.hr'
      ];
    case 'TELECALLING_ADMIN':
      return [
        'dashboard.view', 'telecalling.view', 'telecalling.leads', 'telecalling.assign',
        'telecalling.calls', 'telecalling.targets', 'telecalling.incentives', 'telecalling.team',
        'reports.view', 'reports.telecalling', 'announcements.view'
      ];
    case 'MARKETING_ADMIN':
      return [
        'dashboard.view', 'marketing.view', 'marketing.campaigns', 'marketing.leads',
        'marketing.tasks', 'marketing.content', 'marketing.analytics', 'marketing.targets',
        'marketing.team', 'reports.view', 'reports.marketing', 'announcements.view'
      ];
    case 'DESIGN_ADMIN':
      return [
        'dashboard.view', 'design.view', 'design.projects', 'design.tasks',
        'design.creative_requests', 'design.review', 'design.workload', 'design.team',
        'reports.view', 'reports.design', 'announcements.view'
      ];
    case 'SOCIAL_MEDIA_ADMIN':
      return [
        'dashboard.view', 'social.view', 'social.calendar', 'social.posts',
        'social.reels', 'social.approvals', 'social.analytics', 'social.team',
        'reports.view', 'reports.social', 'announcements.view'
      ];
    case 'DEPARTMENT_MANAGER':
      return ['dashboard.view', 'department.view', 'department.team', 'department.tasks', 'announcements.view'];
    default:
      return ['dashboard.view'];
  }
};

async function logAdminAction(adminId: string, adminName: string, role: string, action: string, module: string, recordId?: string, details?: string, ip: string = '127.0.0.1') {
  try {
    await pool.query(`
      INSERT INTO admin_activity_logs (admin_id, admin_name, role, action, module, record_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [adminId, adminName, role, action, module, recordId || null, details || null, ip]);
  } catch (err) {
    console.warn('Could not record admin activity log:', err);
  }
}

// =========================================================================
// 2. ADMIN AUTHENTICATION & PROFILE
// =========================================================================

// POST /api/auth/admin/login
rbacRouter.post('/auth/admin/login', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanEmail || !cleanPass) {
      return res.status(400).json({ success: false, message: 'Please provide official email and password.' });
    }

    // 1. Check if admin exists in database
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT * FROM admins WHERE LOWER(email) = ?
    `, [cleanEmail]);

    let admin: any = null;

    if (rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'No registered admin account found with this email. Please verify credentials or contact Super Admin.' 
      });
    }

    admin = rows[0];
    if (admin.status !== 'Active') {
      return res.status(403).json({ 
        success: false, 
        message: 'Your admin account has been deactivated. Please contact Super Admin.' 
      });
    }

    const isValidPassword = cleanPass === admin.password_hash || (admin.password_hash === 'AutoRevive@2026' && cleanPass === 'AutoRevive@2026');
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid password. Please check your official credentials.' });
    }

    // Update last_login
    await pool.query(`UPDATE admins SET last_login = NOW() WHERE id = ?`, [admin.id]);

    const permissions = getRolePermissions(admin.role);
    const token = `adm_${admin.role}_${admin.admin_id}_${Date.now()}`;

    await logAdminAction(admin.admin_id, admin.full_name, admin.role, 'Admin Login', 'Authentication', admin.admin_id, `Logged in successfully from ${req.ip}`);

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        admin_id: admin.admin_id,
        full_name: admin.full_name,
        email: admin.email,
        mobile: admin.mobile,
        role: admin.role,
        department: admin.department,
        status: admin.status,
        permissions,
        last_login: admin.last_login || new Date().toISOString(),
      },
      message: `Welcome back, ${admin.full_name} (${admin.role.replace(/_/g, ' ')})!`
    });
  } catch (err: any) {
    console.error('Admin Login Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/admin/send-otp
rbacRouter.post('/auth/admin/send-otp', async (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: 'Please provide your registered admin work email.' });
    }

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT * FROM admins WHERE LOWER(email) = ?
    `, [cleanEmail]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'No registered admin account found with this email.' });
    }

    const admin = rows[0];
    if (admin.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Your admin account has been deactivated. Please contact Super Admin.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpCache.set(cleanEmail, { otp, expiresAt, attempts: 0 });

    // Send OTP via SMTP Email
    await sendOtpEmail(cleanEmail, otp, admin.full_name);

    res.json({
      success: true,
      message: `A 6-digit verification code (OTP) has been sent to ${cleanEmail}. Valid for 10 minutes.`,
      expiresInMinutes: 10,
    });
  } catch (err: any) {
    console.error('Send OTP Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/admin/verify-otp
rbacRouter.post('/auth/admin/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanOtp = (otp || '').trim();

    if (!cleanEmail || !cleanOtp) {
      return res.status(400).json({ success: false, message: 'Email and 6-digit OTP code are required.' });
    }

    const record = otpCache.get(cleanEmail);
    if (!record) {
      return res.status(400).json({ success: false, message: 'No active OTP request found for this email. Please request a new OTP.' });
    }

    if (Date.now() > record.expiresAt) {
      otpCache.delete(cleanEmail);
      return res.status(400).json({ success: false, message: 'This OTP has expired. Please request a new OTP.' });
    }

    if (record.otp !== cleanOtp) {
      record.attempts += 1;
      if (record.attempts >= 5) {
        otpCache.delete(cleanEmail);
        return res.status(400).json({ success: false, message: 'Too many incorrect OTP attempts. Please request a new code.' });
      }
      return res.status(400).json({ success: false, message: `Invalid OTP code. (${5 - record.attempts} attempts remaining)` });
    }

    // OTP is valid - remove from cache
    otpCache.delete(cleanEmail);

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT * FROM admins WHERE LOWER(email) = ?
    `, [cleanEmail]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Admin account not found.' });
    }

    const admin = rows[0];
    if (admin.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Your admin account has been deactivated.' });
    }

    // Update last_login
    await pool.query(`UPDATE admins SET last_login = NOW() WHERE id = ?`, [admin.id]);

    const permissions = getRolePermissions(admin.role);
    const token = `adm_${admin.role}_${admin.admin_id}_${Date.now()}`;

    await logAdminAction(admin.admin_id, admin.full_name, admin.role, 'Admin Login (OTP)', 'Authentication', admin.admin_id, `Logged in via OTP from ${req.ip}`);

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        admin_id: admin.admin_id,
        full_name: admin.full_name,
        email: admin.email,
        mobile: admin.mobile,
        role: admin.role,
        department: admin.department,
        status: admin.status,
        permissions,
        last_login: admin.last_login || new Date().toISOString(),
      },
      message: `OTP Verified! Welcome back, ${admin.full_name} (${admin.role.replace(/_/g, ' ')})!`
    });
  } catch (err: any) {
    console.error('Verify OTP Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/admin/register (Public/Self-serve initial official admin setup)
rbacRouter.post('/auth/admin/register', async (req: Request, res: Response) => {
  try {
    const { full_name, email, mobile, role, department, password } = req.body || {};
    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [exists] = await pool.query<RowDataPacket[]>(`SELECT id FROM admins WHERE LOWER(email) = ?`, [cleanEmail]);
    if (exists.length > 0) {
      return res.status(409).json({ success: false, message: 'An admin account with this email already exists. Please login directly.' });
    }

    const assignedRole = role || 'SUPER_ADMIN';
    const roleDeptMap: Record<string, string> = {
      'SUPER_ADMIN': 'Executive Office',
      'HR_ADMIN': 'Human Resources',
      'TELECALLING_ADMIN': 'Telecalling',
      'MARKETING_ADMIN': 'Marketing',
      'DESIGN_ADMIN': 'Designing',
      'SOCIAL_MEDIA_ADMIN': 'Social Media',
      'DEPARTMENT_MANAGER': department || 'Operations',
    };
    const assignedDept = department || roleDeptMap[assignedRole] || 'Administration';
    const adminId = await generateSafeAdminId();

    await pool.query(`
      INSERT INTO admins (admin_id, full_name, email, mobile, role, department, password_hash, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
    `, [adminId, full_name, cleanEmail, mobile || null, assignedRole, assignedDept, password.trim()]);

    const token = `adm_${assignedRole}_${adminId}_${Date.now()}`;
    const permissions = getRolePermissions(assignedRole);

    await logAdminAction(adminId, full_name, assignedRole, 'Official Admin Created', 'AdminManagement', adminId, `Self-registered official admin account.`);

    res.json({
      success: true,
      token,
      admin: {
        admin_id: adminId,
        full_name,
        email: cleanEmail,
        mobile,
        role: assignedRole,
        department: assignedDept,
        status: 'Active',
        permissions,
      },
      message: `Official Admin account #${adminId} registered and activated successfully!`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/me
rbacRouter.get('/admin/me', async (req: Request, res: Response) => {
  try {
    const adminInfo = extractAdmin(req);
    if (!adminInfo) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Admin session required.' });
    }

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT * FROM admins WHERE admin_id = ? OR LOWER(email) = ?
    `, [adminInfo.admin_id, adminInfo.email]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin profile not found.' });
    }

    const adm = rows[0];
    const permissions = getRolePermissions(adm.role);

    res.json({
      success: true,
      admin: {
        id: adm.id,
        admin_id: adm.admin_id,
        full_name: adm.full_name,
        email: adm.email,
        mobile: adm.mobile,
        role: adm.role,
        department: adm.department,
        status: adm.status,
        permissions,
        last_login: adm.last_login,
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 3. ROLE-BASED DASHBOARD METRICS API (/api/admin/dashboard)
// =========================================================================
rbacRouter.get('/admin/dashboard', async (req: Request, res: Response) => {
  try {
    const admin = extractAdmin(req);
    const role = admin?.role || 'SUPER_ADMIN';

    // 1. Common Global Counts
    const [empRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as total, SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active FROM employees`);
    const [vacRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as openVacancies FROM job_vacancies WHERE status = 'Published'`);
    const [appRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as total FROM job_applications`);
    const [leaveRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as pending FROM leave_requests WHERE status = 'PENDING'`);
    const [tktRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as openTkts FROM support_tickets WHERE status = 'OPEN'`);
    const [leadRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_leads, 
        SUM(CASE WHEN status = 'Converted' THEN 1 ELSE 0 END) as converted,
        SUM(CASE WHEN status = 'Interested' THEN 1 ELSE 0 END) as interested,
        SUM(CASE WHEN status = 'Follow-up Scheduled' THEN 1 ELSE 0 END) as followups
      FROM telecaller_leads
    `);
    const [callRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as total_calls FROM calls_log`);
    const [campRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as total_camps, SUM(leads_generated) as total_leads, SUM(conversions) as total_conv FROM marketing_campaigns WHERE status = 'Active'`);
    const [desRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as total_proj, SUM(CASE WHEN status = 'In Review' THEN 1 ELSE 0 END) as in_review FROM design_projects`);
    const [socRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as total_posts, SUM(reach) as total_reach, SUM(leads_generated) as leads FROM social_media_posts`);

    const stats = {
      role,
      workforce: {
        total: Number(empRows[0]?.total || 0),
        active: Number(empRows[0]?.active || 0),
      },
      recruitment: {
        vacancies: Number(vacRows[0]?.openVacancies || 0),
        applications: Number(appRows[0]?.total || 0),
      },
      leaves: {
        pending: Number(leaveRows[0]?.pending || 0),
      },
      tickets: {
        open: Number(tktRows[0]?.openTkts || 0),
      },
      telecalling: {
        totalLeads: Number(leadRows[0]?.total_leads || 0),
        converted: Number(leadRows[0]?.converted || 0),
        interested: Number(leadRows[0]?.interested || 0),
        followups: Number(leadRows[0]?.followups || 0),
        todayCalls: Number(callRows[0]?.total_calls || 0),
        conversionRate: leadRows[0]?.total_leads ? ((Number(leadRows[0].converted) / Number(leadRows[0].total_leads)) * 100).toFixed(1) : '18.5',
      },
      marketing: {
        activeCampaigns: Number(campRows[0]?.total_camps || 0),
        leadsGenerated: Number(campRows[0]?.total_leads || 0),
        conversions: Number(campRows[0]?.total_conv || 0),
      },
      design: {
        activeProjects: Number(desRows[0]?.total_proj || 0),
        inReview: Number(desRows[0]?.in_review || 0),
      },
      social: {
        posts: Number(socRows[0]?.total_posts || 0),
        totalReach: Number(socRows[0]?.total_reach || 0),
        leads: Number(socRows[0]?.leads || 0),
      }
    };

    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 4. SUPER ADMIN: ADMIN MANAGEMENT SUITE
// =========================================================================

// GET /api/admins
rbacRouter.get('/admins', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT id, admin_id, full_name, email, mobile, role, department, password_hash, status, last_login, created_at
      FROM admins
      ORDER BY id ASC
    `);

    res.json({ success: true, admins: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admins (Create Admin)
rbacRouter.post('/admins', async (req: Request, res: Response) => {
  try {
    const caller = extractAdmin(req);
    const { full_name, email, mobile, role, department, password } = req.body || {};

    if (!full_name || !email || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, and role are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [exists] = await pool.query<RowDataPacket[]>(`SELECT id FROM admins WHERE LOWER(email) = ?`, [cleanEmail]);
    if (exists.length > 0) {
      return res.status(409).json({ success: false, message: 'An admin with this email address already exists.' });
    }

    const roleDeptMap: Record<string, string> = {
      'SUPER_ADMIN': 'Executive Office',
      'HR_ADMIN': 'Human Resources',
      'TELECALLING_ADMIN': 'Telecalling',
      'MARKETING_ADMIN': 'Marketing',
      'DESIGN_ADMIN': 'Designing',
      'SOCIAL_MEDIA_ADMIN': 'Social Media',
      'DEPARTMENT_MANAGER': department || 'Operations',
    };
    const assignedDept = department || roleDeptMap[role] || 'Human Resources';
    const adminId = await generateSafeAdminId();

    await pool.query(`
      INSERT INTO admins (admin_id, full_name, email, mobile, role, department, password_hash, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
    `, [adminId, full_name, cleanEmail, mobile || null, role, assignedDept, (password || 'AutoRevive@2026').trim()]);

    await logAdminAction(
      caller?.admin_id || 'SUPER_ADMIN',
      caller?.name || 'Super Admin',
      caller?.role || 'SUPER_ADMIN',
      'Admin Created',
      'AdminManagement',
      adminId,
      `Created new admin ${full_name} (${role} - ${assignedDept})`
    );

    res.json({
      success: true,
      adminId,
      message: `Admin account ${adminId} created successfully for ${full_name}.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admins/:id (Edit Admin Profile/Role/Department)
rbacRouter.patch('/admins/:id', async (req: Request, res: Response) => {
  try {
    const caller = extractAdmin(req);
    const id = req.params.id;
    const { full_name, mobile, role, department, status } = req.body || {};

    await pool.query(`
      UPDATE admins 
      SET full_name = COALESCE(?, full_name),
          mobile = COALESCE(?, mobile),
          role = COALESCE(?, role),
          department = COALESCE(?, department),
          status = COALESCE(?, status)
      WHERE id = ? OR admin_id = ?
    `, [full_name, mobile, role, department, status, id, id]);

    await logAdminAction(
      caller?.admin_id || 'SUPER_ADMIN',
      caller?.name || 'Super Admin',
      caller?.role || 'SUPER_ADMIN',
      'Admin Updated',
      'AdminManagement',
      id,
      `Updated profile/role for admin #${id}`
    );

    res.json({ success: true, message: `Admin record updated successfully.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admins/:id/status (Toggle Status Active/Inactive)
rbacRouter.patch('/admins/:id/status', async (req: Request, res: Response) => {
  try {
    const caller = extractAdmin(req);
    const id = req.params.id;
    const { status } = req.body || {};

    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    await pool.query(`UPDATE admins SET status = ? WHERE id = ? OR admin_id = ?`, [status, id, id]);

    await logAdminAction(
      caller?.admin_id || 'SUPER_ADMIN',
      caller?.name || 'Super Admin',
      caller?.role || 'SUPER_ADMIN',
      `Admin ${status}`,
      'AdminManagement',
      id,
      `Changed admin #${id} status to ${status}`
    );

    res.json({ success: true, message: `Admin status set to ${status}.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admins/:id/reset-password
rbacRouter.post('/admins/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const caller = extractAdmin(req);
    const id = req.params.id;
    const { new_password } = req.body || {};
    const pass = (new_password || 'AutoRevive@2026').trim();

    await pool.query(`UPDATE admins SET password_hash = ? WHERE id = ? OR admin_id = ?`, [pass, id, id]);

    await logAdminAction(
      caller?.admin_id || 'SUPER_ADMIN',
      caller?.name || 'Super Admin',
      caller?.role || 'SUPER_ADMIN',
      'Password Reset',
      'AdminManagement',
      id,
      `Reset password for admin #${id}`
    );

    res.json({ success: true, message: `Admin password successfully reset to default: AutoRevive@2026.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admins/:id (Delete Admin User)
rbacRouter.delete('/admins/:id', async (req: Request, res: Response) => {
  try {
    const caller = extractAdmin(req);
    const id = req.params.id;

    // Check if target admin exists
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT * FROM admins WHERE id = ? OR admin_id = ?
    `, [id, id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    const targetAdmin = rows[0];

    // Protect primary Super Admin from being deleted
    if (targetAdmin.admin_id === 'AR-ADM-2026-0001' || targetAdmin.email.toLowerCase() === 'admin@autorevives.com') {
      return res.status(403).json({ success: false, message: 'The primary Super Administrator account cannot be deleted.' });
    }

    await pool.query(`DELETE FROM admins WHERE id = ?`, [targetAdmin.id]);

    await logAdminAction(
      caller?.admin_id || 'SUPER_ADMIN',
      caller?.name || 'Super Admin',
      caller?.role || 'SUPER_ADMIN',
      'Admin Deleted',
      'AdminManagement',
      targetAdmin.admin_id,
      `Deleted admin user ${targetAdmin.full_name} (${targetAdmin.role} - ${targetAdmin.email})`
    );

    res.json({ 
      success: true, 
      message: `Admin account #${targetAdmin.admin_id} (${targetAdmin.full_name}) deleted successfully.` 
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/employee-accounts (List all employee portal login accounts and credentials)
rbacRouter.get('/admin/employee-accounts', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        a.id, 
        a.employee_id, 
        a.user_id, 
        a.email, 
        a.password_hash, 
        a.status, 
        a.last_login, 
        a.created_at,
        a.updated_at,
        e.full_name, 
        e.department, 
        e.role,
        e.mobile,
        e.work_location
      FROM employee_accounts a
      LEFT JOIN employees e ON a.employee_id = e.employee_id
      ORDER BY a.id ASC
    `);

    res.json({ success: true, accounts: rows });
  } catch (err: any) {
    console.error('Error fetching employee accounts:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/employee-accounts/:id/reset-password (Reset employee portal password)
rbacRouter.post('/admin/employee-accounts/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body || {};
    const newPass = (new_password || 'AutoRevive@2026').trim();

    if (!newPass) {
      return res.status(400).json({ success: false, message: 'Password cannot be empty.' });
    }

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT a.*, e.full_name 
      FROM employee_accounts a 
      LEFT JOIN employees e ON a.employee_id = e.employee_id 
      WHERE a.id = ? OR a.employee_id = ?
    `, [id, id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee account not found.' });
    }

    const acc = rows[0];
    await pool.query(`UPDATE employee_accounts SET password_hash = ? WHERE id = ?`, [newPass, acc.id]);

    const admin = extractAdmin(req);
    await logAdminAction(
      admin?.admin_id || 'AR-ADM-2026-0001',
      admin?.name || 'Super Admin',
      admin?.role || 'SUPER_ADMIN',
      'Reset Employee Password',
      'Employee Accounts',
      acc.employee_id,
      `Reset portal password for employee #${acc.employee_id} (${acc.full_name || acc.email})`
    );

    res.json({
      success: true,
      message: `Password for employee #${acc.employee_id} (${acc.full_name || acc.email}) updated successfully.`,
      password: newPass
    });
  } catch (err: any) {
    console.error('Error resetting employee password:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admin/employee-accounts/:id/status (Toggle Active / Inactive / Suspended)
rbacRouter.patch('/admin/employee-accounts/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const newStatus = status === 'Active' ? 'Active' : status === 'Suspended' ? 'Suspended' : 'Inactive';

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT a.*, e.full_name 
      FROM employee_accounts a 
      LEFT JOIN employees e ON a.employee_id = e.employee_id 
      WHERE a.id = ? OR a.employee_id = ?
    `, [id, id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee account not found.' });
    }

    const acc = rows[0];
    await pool.query(`UPDATE employee_accounts SET status = ? WHERE id = ?`, [newStatus, acc.id]);

    const admin = extractAdmin(req);
    await logAdminAction(
      admin?.admin_id || 'AR-ADM-2026-0001',
      admin?.name || 'Super Admin',
      admin?.role || 'SUPER_ADMIN',
      'Update Employee Account Status',
      'Employee Accounts',
      acc.employee_id,
      `Changed portal access status for #${acc.employee_id} to ${newStatus}`
    );

    res.json({
      success: true,
      message: `Account status for #${acc.employee_id} updated to ${newStatus}.`,
      status: newStatus
    });
  } catch (err: any) {
    console.error('Error updating employee account status:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/employee-accounts/:id (Delete employee portal account)
rbacRouter.delete('/admin/employee-accounts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT a.*, e.full_name 
      FROM employee_accounts a 
      LEFT JOIN employees e ON a.employee_id = e.employee_id 
      WHERE a.id = ? OR a.employee_id = ?
    `, [id, id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee account not found.' });
    }

    const acc = rows[0];
    await pool.query(`DELETE FROM employee_accounts WHERE id = ?`, [acc.id]);

    const admin = extractAdmin(req);
    await logAdminAction(
      admin?.admin_id || 'AR-ADM-2026-0001',
      admin?.name || 'Super Admin',
      admin?.role || 'SUPER_ADMIN',
      'Delete Employee Account',
      'Employee Accounts',
      acc.employee_id,
      `Deleted portal login account for #${acc.employee_id} (${acc.full_name || acc.email})`
    );

    res.json({
      success: true,
      message: `Portal account for #${acc.employee_id} (${acc.full_name || acc.email}) deleted successfully.`
    });
  } catch (err: any) {
    console.error('Error deleting employee account:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/employee-accounts/sync (Sync all employees with employee_accounts)
rbacRouter.post('/admin/employee-accounts/sync', async (req: Request, res: Response) => {
  try {
    const [employees] = await pool.query<RowDataPacket[]>(`SELECT * FROM employees`);
    let syncedCount = 0;

    for (const emp of employees) {
      const cleanEmail = (emp.email || `${emp.employee_id.toLowerCase()}@autorevives.com`).trim().toLowerCase();
      const userId = `USR-${emp.employee_id}`;
      const defaultPass = 'AutoRevive@2026';

      const [existing] = await pool.query<RowDataPacket[]>(`
        SELECT id FROM employee_accounts WHERE employee_id = ?
      `, [emp.employee_id]);

      if (existing.length === 0) {
        await pool.query(`
          INSERT INTO employee_accounts (employee_id, user_id, email, password_hash, status)
          VALUES (?, ?, ?, ?, 'Active')
        `, [emp.employee_id, userId, cleanEmail, defaultPass]);
        syncedCount++;
      }
    }

    res.json({
      success: true,
      message: `Successfully synchronized ${syncedCount} missing employee portal account(s).`,
      syncedCount
    });
  } catch (err: any) {
    console.error('Error syncing employee accounts:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/activity-logs (Searchable Audit Trail)
rbacRouter.get('/admin/activity-logs', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT * FROM admin_activity_logs 
      ORDER BY id DESC 
      LIMIT 150
    `);

    res.json({ success: true, logs: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 5. TELECALLING ADMIN CONSOLE ENDPOINTS (/api/telecalling/...)
// =========================================================================

// Leads list
rbacRouter.get('/telecalling/leads', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT l.*, e.full_name as assigned_employee_name, e.department as employee_department
      FROM telecaller_leads l
      LEFT JOIN employees e ON l.employee_id = e.employee_id
      ORDER BY l.id DESC
    `);
    res.json({ success: true, leads: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create lead
rbacRouter.post('/telecalling/leads', async (req: Request, res: Response) => {
  try {
    const { employee_id, lead_name, phone, email, source, status, call_notes, follow_up_date } = req.body || {};
    if (!lead_name || !phone) {
      return res.status(400).json({ success: false, message: 'Lead name and phone number are required.' });
    }

    const [header] = await pool.query<ResultSetHeader>(`
      INSERT INTO telecaller_leads (employee_id, lead_name, phone, email, source, status, call_notes, follow_up_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      employee_id || 'AR-EMP-2026-0002',
      lead_name,
      phone,
      email || null,
      source || 'Meta Ads',
      status || 'New',
      call_notes || null,
      follow_up_date || null,
    ]);

    res.json({ success: true, leadId: header.insertId, message: `Lead for ${lead_name} added to pipeline.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update lead status / notes
rbacRouter.patch('/telecalling/leads/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { status, call_notes, follow_up_date, employee_id } = req.body || {};

    await pool.query(`
      UPDATE telecaller_leads
      SET status = COALESCE(?, status),
          call_notes = COALESCE(?, call_notes),
          follow_up_date = COALESCE(?, follow_up_date),
          employee_id = COALESCE(?, employee_id)
      WHERE id = ?
    `, [status, call_notes, follow_up_date, employee_id, id]);

    res.json({ success: true, message: 'Lead updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Assign leads in bulk
rbacRouter.post('/telecalling/leads/assign', async (req: Request, res: Response) => {
  try {
    const { lead_ids, employee_id } = req.body || {};
    if (!lead_ids || !Array.isArray(lead_ids) || !employee_id) {
      return res.status(400).json({ success: false, message: 'Lead IDs array and assigned employee ID are required.' });
    }

    await pool.query(`
      UPDATE telecaller_leads 
      SET employee_id = ? 
      WHERE id IN (?)
    `, [employee_id, lead_ids]);

    res.json({ success: true, message: `${lead_ids.length} lead(s) successfully assigned to ${employee_id}.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Call logs
rbacRouter.get('/telecalling/calls', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT c.*, e.full_name as employee_name
      FROM calls_log c
      LEFT JOIN employees e ON c.employee_id = e.employee_id
      ORDER BY c.id DESC
      LIMIT 100
    `);
    res.json({ success: true, calls: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Log a call
rbacRouter.post('/telecalling/calls', async (req: Request, res: Response) => {
  try {
    const { lead_id, employee_id, caller_name, contact_number, call_type, duration_seconds, outcome, notes, follow_up_date } = req.body || {};
    if (!lead_id || !caller_name || !contact_number) {
      return res.status(400).json({ success: false, message: 'Lead ID, caller name, and contact number are required.' });
    }

    const callId = await nextCustomNumber('CAL', 4);
    await pool.query(`
      INSERT INTO calls_log (call_id, lead_id, employee_id, caller_name, contact_number, call_type, duration_seconds, outcome, notes, follow_up_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      callId,
      lead_id,
      employee_id || 'AR-EMP-2026-0002',
      caller_name,
      contact_number,
      call_type || 'Outbound',
      duration_seconds || 120,
      outcome || 'Connected - Interested',
      notes || null,
      follow_up_date || null
    ]);

    // Also update lead status
    const statusMap: Record<string, string> = {
      'Connected - Interested': 'Interested',
      'Call Back Requested': 'Follow-up Scheduled',
      'Converted / Deal Closed': 'Converted',
      'Connected - Not Interested': 'Contacted',
    };
    if (statusMap[outcome]) {
      await pool.query(`UPDATE telecaller_leads SET status = ?, call_notes = ? WHERE id = ?`, [statusMap[outcome], notes, lead_id]);
    }

    res.json({ success: true, callId, message: `Call logged successfully (#${callId}).` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Targets
rbacRouter.get('/telecalling/targets', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT t.*, e.full_name as employee_name, e.role
      FROM telecaller_targets t
      LEFT JOIN employees e ON t.employee_id = e.employee_id
      ORDER BY t.id DESC
    `);
    res.json({ success: true, targets: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create/Update Target
rbacRouter.post('/telecalling/targets', async (req: Request, res: Response) => {
  try {
    const { employee_id, period, target_calls, target_conversions, target_type } = req.body || {};
    if (!employee_id || !period) {
      return res.status(400).json({ success: false, message: 'Employee ID and period are required.' });
    }

    await pool.query(`
      INSERT INTO telecaller_targets (employee_id, period, target_type, target_calls, target_conversions)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE target_calls = VALUES(target_calls), target_conversions = VALUES(target_conversions)
    `, [employee_id, period, target_type || 'Monthly', target_calls || 600, target_conversions || 25]);

    res.json({ success: true, message: `Target set for ${employee_id} (${period}).` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Incentives
rbacRouter.get('/telecalling/incentives', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT i.*, e.full_name as employee_name, e.department
      FROM telecaller_incentives i
      LEFT JOIN employees e ON i.employee_id = e.employee_id
      ORDER BY i.id DESC
    `);
    res.json({ success: true, incentives: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Send Incentive to Payroll
rbacRouter.post('/telecalling/incentives/:id/send-payroll', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await pool.query(`UPDATE telecaller_incentives SET status = 'Sent to Payroll', approved_by = 'Arun Kumar (Telecalling Admin)' WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Incentive marked approved and forwarded to HR / Payroll processing.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Telecalling Team
rbacRouter.get('/telecalling/team', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT employee_id, full_name, email, mobile, role, department, status, joining_date
      FROM employees
      WHERE department LIKE '%Sales%' OR department LIKE '%Telecalling%' OR department LIKE '%Business%'
      ORDER BY full_name ASC
    `);
    res.json({ success: true, team: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 6. MARKETING ADMIN CONSOLE ENDPOINTS (/api/marketing/...)
// =========================================================================

// Campaigns
rbacRouter.get('/marketing/campaigns', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT c.*, e.full_name as manager_name
      FROM marketing_campaigns c
      LEFT JOIN employees e ON c.employee_id = e.employee_id
      ORDER BY c.id DESC
    `);
    res.json({ success: true, campaigns: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create campaign
rbacRouter.post('/marketing/campaigns', async (req: Request, res: Response) => {
  try {
    const { campaign_name, channel, target_count, incentive, status, employee_id } = req.body || {};
    if (!campaign_name) {
      return res.status(400).json({ success: false, message: 'Campaign name is required.' });
    }

    const [header] = await pool.query<ResultSetHeader>(`
      INSERT INTO marketing_campaigns (employee_id, campaign_name, channel, target_count, incentive, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [employee_id || 'AR-EMP-2026-0002', campaign_name, channel || 'Google / Meta Ads', target_count || 100, incentive || 10000.00, status || 'Active']);

    res.json({ success: true, campaignId: header.insertId, message: `Marketing Campaign "${campaign_name}" launched successfully.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update campaign
rbacRouter.patch('/marketing/campaigns/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { status, leads_generated, conversions } = req.body || {};
    await pool.query(`
      UPDATE marketing_campaigns
      SET status = COALESCE(?, status),
          leads_generated = COALESCE(?, leads_generated),
          conversions = COALESCE(?, conversions)
      WHERE id = ?
    `, [status, leads_generated, conversions, id]);

    res.json({ success: true, message: 'Campaign updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Marketing tasks
rbacRouter.get('/marketing/tasks', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT t.*, e.full_name as assigned_name, c.campaign_name
      FROM marketing_tasks t
      LEFT JOIN employees e ON t.assigned_to = e.employee_id
      LEFT JOIN marketing_campaigns c ON t.campaign_id = c.id
      ORDER BY t.id DESC
    `);
    res.json({ success: true, tasks: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create marketing task
rbacRouter.post('/marketing/tasks', async (req: Request, res: Response) => {
  try {
    const { task_title, campaign_id, assigned_to, deadline, priority, notes } = req.body || {};
    if (!task_title || !deadline) {
      return res.status(400).json({ success: false, message: 'Task title and deadline are required.' });
    }

    const taskId = await nextCustomNumber('MTK', 4);
    await pool.query(`
      INSERT INTO marketing_tasks (task_id, campaign_id, task_title, assigned_to, deadline, priority, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, 'In Progress', ?)
    `, [taskId, campaign_id || null, task_title, assigned_to || 'AR-EMP-2026-0002', deadline, priority || 'Medium', notes || null]);

    res.json({ success: true, taskId, message: `Marketing task #${taskId} created and assigned.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Marketing Team
rbacRouter.get('/marketing/team', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT employee_id, full_name, email, mobile, role, department, status, joining_date
      FROM employees
      WHERE department LIKE '%Marketing%' OR department LIKE '%Growth%' OR department LIKE '%Sales%'
      ORDER BY full_name ASC
    `);
    res.json({ success: true, team: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 7. DESIGN ADMIN CONSOLE ENDPOINTS (/api/design/...)
// =========================================================================

// Design projects
rbacRouter.get('/design/projects', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT p.*, e.full_name as designer_name
      FROM design_projects p
      LEFT JOIN employees e ON p.employee_id = e.employee_id
      ORDER BY p.id DESC
    `);
    res.json({ success: true, projects: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create design project
rbacRouter.post('/design/projects', async (req: Request, res: Response) => {
  try {
    const { project_name, design_type, employee_id, preview_url } = req.body || {};
    if (!project_name) return res.status(400).json({ success: false, message: 'Project name is required.' });

    const [header] = await pool.query<ResultSetHeader>(`
      INSERT INTO design_projects (employee_id, project_name, design_type, status, preview_url)
      VALUES (?, ?, ?, 'In Review', ?)
    `, [employee_id || 'AR-EMP-2026-0003', project_name, design_type || 'UI/UX Design Mockup', preview_url || null]);

    res.json({ success: true, projectId: header.insertId, message: `Design project "${project_name}" created.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Design tasks
rbacRouter.get('/design/tasks', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT t.*, e.full_name as designer_name, p.project_name
      FROM design_tasks t
      LEFT JOIN employees e ON t.designer_id = e.employee_id
      LEFT JOIN design_projects p ON t.project_id = p.id
      ORDER BY t.id DESC
    `);
    res.json({ success: true, tasks: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update design task status (Review & Approval workflow)
rbacRouter.patch('/design/tasks/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { status, feedback_notes, preview_url } = req.body || {};

    await pool.query(`
      UPDATE design_tasks
      SET status = COALESCE(?, status),
          feedback_notes = COALESCE(?, feedback_notes),
          preview_url = COALESCE(?, preview_url)
      WHERE id = ?
    `, [status, feedback_notes, preview_url, id]);

    res.json({ success: true, message: `Design task updated to ${status}.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Creative requests (cross-department from Marketing/Social Media)
rbacRouter.get('/design/creative-requests', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT r.*, e.full_name as assigned_name
      FROM creative_requests r
      LEFT JOIN employees e ON r.assigned_designer = e.employee_id
      ORDER BY r.id DESC
    `);
    res.json({ success: true, requests: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create creative request
rbacRouter.post('/design/creative-requests', async (req: Request, res: Response) => {
  try {
    const { from_department, requested_by, title, asset_type, description, due_date, assigned_designer } = req.body || {};
    if (!title || !due_date) {
      return res.status(400).json({ success: false, message: 'Title and due date are required.' });
    }

    const requestId = await nextCustomNumber('CR', 4);
    await pool.query(`
      INSERT INTO creative_requests (request_id, from_department, requested_by, assigned_designer, title, asset_type, description, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending Assignment')
    `, [
      requestId,
      from_department || 'Marketing',
      requested_by || 'Marketing Admin',
      assigned_designer || 'AR-EMP-2026-0003',
      title,
      asset_type || 'Instagram Post',
      description || 'High resolution promotional creative',
      due_date,
    ]);

    res.json({ success: true, requestId, message: `Creative request #${requestId} submitted to Design Team.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Review/Approve creative request
rbacRouter.patch('/design/creative-requests/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { status, comments, assigned_designer, preview_url } = req.body || {};

    await pool.query(`
      UPDATE creative_requests
      SET status = COALESCE(?, status),
          comments = COALESCE(?, comments),
          assigned_designer = COALESCE(?, assigned_designer),
          preview_url = COALESCE(?, preview_url)
      WHERE id = ?
    `, [status, comments, assigned_designer, preview_url, id]);

    res.json({ success: true, message: `Creative request status updated to ${status}.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Design Team
rbacRouter.get('/design/team', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT employee_id, full_name, email, mobile, role, department, status, joining_date
      FROM employees
      WHERE department LIKE '%Design%' OR department LIKE '%Engineering%' OR department LIKE '%UI%'
      ORDER BY full_name ASC
    `);
    res.json({ success: true, team: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================================
// 8. SOCIAL MEDIA ADMIN CONSOLE ENDPOINTS (/api/social/...)
// =========================================================================

// Social media posts & reels
rbacRouter.get('/social/posts', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT p.*, e.full_name as creator_name
      FROM social_media_posts p
      LEFT JOIN employees e ON p.employee_id = e.employee_id
      ORDER BY p.id DESC
    `);
    res.json({ success: true, posts: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create social post / reel
rbacRouter.post('/social/posts', async (req: Request, res: Response) => {
  try {
    const { title, platform, post_type, scheduled_date, status, employee_id } = req.body || {};
    if (!title) return res.status(400).json({ success: false, message: 'Post title is required.' });

    const [header] = await pool.query<ResultSetHeader>(`
      INSERT INTO social_media_posts (employee_id, title, platform, post_type, scheduled_date, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      employee_id || 'AR-EMP-2026-0003',
      title,
      platform || 'Instagram',
      post_type || 'Reel',
      scheduled_date || new Date().toISOString().split('T')[0],
      status || 'Scheduled'
    ]);

    res.json({ success: true, postId: header.insertId, message: `Social media post "${title}" added to calendar.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Approve/Publish social post
rbacRouter.patch('/social/posts/:id/approve', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { status = 'Published' } = req.body || {};
    await pool.query(`UPDATE social_media_posts SET status = ? WHERE id = ?`, [status, id]);
    res.json({ success: true, message: `Post status updated to ${status}.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Analytics
rbacRouter.get('/social/analytics', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT * FROM social_media_analytics 
      ORDER BY id DESC
    `);
    res.json({ success: true, analytics: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Social Media Team
rbacRouter.get('/social/team', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT employee_id, full_name, email, mobile, role, department, status, joining_date
      FROM employees
      WHERE department LIKE '%Social%' OR department LIKE '%Marketing%' OR department LIKE '%Design%'
      ORDER BY full_name ASC
    `);
    res.json({ success: true, team: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
