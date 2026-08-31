import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import path from 'node:path';
import mysql from 'mysql2/promise';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

function findProjectRoot(startPath: string): string {
  let currentPath = path.resolve(startPath);
  while ((!fs.existsSync(path.join(currentPath, 'package.json')) || !fs.existsSync(path.join(currentPath, 'backend')) || !fs.existsSync(path.join(currentPath, 'database'))) && path.dirname(currentPath) !== currentPath) {
    currentPath = path.dirname(currentPath);
  }
  return currentPath;
}

const projectRoot = findProjectRoot(path.dirname(fileURLToPath(import.meta.url)));
dotenv.config({ path: path.join(projectRoot, '.env') });

const databaseName = process.env.DB_NAME || 'autorevive_hr';
export const pool: Pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: databaseName,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  multipleStatements: true,
});

export const db = {
  prepare(sql: string) {
    return {
      async get(parameters: unknown = []) {
        const [rows] = await pool.execute<RowDataPacket[]>(sql, parameters as any);
        return rows[0];
      },
      async all(parameters: unknown = []) {
        const [rows] = await pool.execute<RowDataPacket[]>(sql, parameters as any);
        return rows;
      },
      async run(parameters: unknown = []) {
        const [result] = await pool.execute<ResultSetHeader>(sql, parameters as any);
        return { changes: result.affectedRows, lastInsertRowid: result.insertId };
      },
    };
  },
};

export async function initializeDatabase(): Promise<void> {
  const admin = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });
  await admin.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName.replace(/`/g, '')}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await admin.end();

  // 1. Core Existing Tables (Preserved)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      employee_id VARCHAR(100) NOT NULL UNIQUE,
      full_name VARCHAR(255) NOT NULL,
      parent_name VARCHAR(255), email VARCHAR(255), mobile VARCHAR(50), college VARCHAR(255), register_no VARCHAR(100),
      department VARCHAR(255) NOT NULL, role VARCHAR(255) NOT NULL, employment_type VARCHAR(100) DEFAULT 'Full-Time', work_location VARCHAR(255) DEFAULT 'Uthangarai, Krishnagiri', address TEXT,
      gender VARCHAR(20) DEFAULT 'Male', bank_name VARCHAR(100) DEFAULT 'HDFC Bank', account_number VARCHAR(100) DEFAULT '50100612342166',
      joining_date VARCHAR(100), start_date VARCHAR(100), end_date VARCHAR(100), duration_months DECIMAL(10,2),
      stipend_month DECIMAL(12,2), salary_month DECIMAL(12,2), annual_ctc DECIMAL(14,2), placement_status VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS hr_documents (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      document_number VARCHAR(100) NOT NULL UNIQUE, employee_id VARCHAR(100) NOT NULL, document_type VARCHAR(80) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Created', issue_date VARCHAR(100) NOT NULL, file_name VARCHAR(255) NOT NULL, file_path TEXT NOT NULL, file_size BIGINT UNSIGNED NULL,
      document_data JSON NULL,
      email_status ENUM('NOT_SENT', 'SENT', 'FAILED') NOT NULL DEFAULT 'NOT_SENT', email_sent_at DATETIME NULL, email_error VARCHAR(500),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_documents_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON UPDATE CASCADE ON DELETE RESTRICT,
      INDEX idx_documents_employee (employee_id), INDEX idx_documents_type (document_type), INDEX idx_documents_status (email_status)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS email_logs (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      document_id BIGINT UNSIGNED NULL,
      employee_id VARCHAR(100) NOT NULL,
      document_type VARCHAR(80) NOT NULL,
      recipient_email VARCHAR(255) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status ENUM('SENT', 'FAILED') NOT NULL,
      error_message TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email_emp (employee_id),
      INDEX idx_email_status (status)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS document_counters (
      prefix VARCHAR(20) NOT NULL, year SMALLINT NOT NULL, next_number INT NOT NULL DEFAULT 1,
      PRIMARY KEY (prefix, year)
    ) ENGINE=InnoDB;
  `);

  // 2. Additional Tables for Full ERP Lifecycle
  await pool.query(`
    CREATE TABLE IF NOT EXISTS job_vacancies (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      job_id VARCHAR(50) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      department VARCHAR(255) NOT NULL,
      designation VARCHAR(255) NOT NULL,
      employment_type VARCHAR(50) NOT NULL DEFAULT 'Full Time',
      openings INT NOT NULL DEFAULT 1,
      location VARCHAR(255) NOT NULL DEFAULT 'Uthangarai, Krishnagiri',
      work_model VARCHAR(50) NOT NULL DEFAULT 'On-site',
      salary_range VARCHAR(100) NOT NULL,
      experience_required VARCHAR(100) NOT NULL,
      qualification VARCHAR(255) NOT NULL,
      skills TEXT NULL,
      description TEXT NULL,
      responsibilities TEXT NULL,
      requirements TEXT NULL,
      deadline VARCHAR(50) NULL,
      status ENUM('Draft', 'Published', 'Paused', 'Closed') NOT NULL DEFAULT 'Published',
      public_token VARCHAR(100) NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_vac_status (status)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS job_applications (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      application_id VARCHAR(50) NOT NULL UNIQUE,
      vacancy_id BIGINT UNSIGNED NULL,
      job_title VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      mobile VARCHAR(50) NOT NULL,
      dob VARCHAR(50) NULL,
      gender VARCHAR(20) NULL,
      current_address TEXT NULL,
      permanent_address TEXT NULL,
      city VARCHAR(100) NULL,
      state VARCHAR(100) NULL,
      pincode VARCHAR(20) NULL,
      highest_qualification VARCHAR(255) NULL,
      course VARCHAR(255) NULL,
      institution VARCHAR(255) NULL,
      passing_year VARCHAR(20) NULL,
      percentage_cgpa VARCHAR(20) NULL,
      experience_type ENUM('Fresher', 'Experienced') NOT NULL DEFAULT 'Fresher',
      total_experience VARCHAR(50) NULL,
      current_company VARCHAR(255) NULL,
      current_designation VARCHAR(255) NULL,
      previous_company VARCHAR(255) NULL,
      previous_salary VARCHAR(50) NULL,
      expected_salary VARCHAR(50) NULL,
      notice_period VARCHAR(50) NULL,
      primary_skills TEXT NULL,
      secondary_skills TEXT NULL,
      technical_skills TEXT NULL,
      languages TEXT NULL,
      linkedin_url VARCHAR(255) NULL,
      portfolio_url VARCHAR(255) NULL,
      github_url VARCHAR(255) NULL,
      resume_path VARCHAR(500) NULL,
      resume_name VARCHAR(255) NULL,
      documents_json JSON NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'APPLIED',
      offer_token VARCHAR(100) NULL UNIQUE,
      offer_status VARCHAR(50) NOT NULL DEFAULT 'NOT_SENT',
      offer_accepted_at DATETIME NULL,
      employee_id VARCHAR(100) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_app_status (status),
      INDEX idx_app_email (email)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS interviews (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      interview_id VARCHAR(50) NOT NULL UNIQUE,
      application_id VARCHAR(50) NOT NULL,
      candidate_name VARCHAR(255) NOT NULL,
      job_title VARCHAR(255) NOT NULL,
      round VARCHAR(100) NOT NULL DEFAULT 'Technical Round 1',
      interviewer VARCHAR(255) NOT NULL DEFAULT 'Jemsina Banu (HR)',
      date VARCHAR(50) NOT NULL,
      time VARCHAR(50) NOT NULL,
      mode VARCHAR(50) NOT NULL DEFAULT 'Online',
      meeting_link VARCHAR(500) NULL,
      location VARCHAR(255) NULL,
      notes TEXT NULL,
      rating INT NOT NULL DEFAULT 0,
      recommendation ENUM('PENDING', 'SELECTED', 'HOLD', 'REJECTED') NOT NULL DEFAULT 'PENDING',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_int_app (application_id)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS salary_structures (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      employee_id VARCHAR(100) NOT NULL UNIQUE,
      basic DECIMAL(12,2) NOT NULL DEFAULT 20750.00,
      hra DECIMAL(12,2) NOT NULL DEFAULT 10375.00,
      special_allowance DECIMAL(12,2) NOT NULL DEFAULT 10375.00,
      other_allowance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      pf_employee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      esic_employee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      prof_tax DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      effective_from DATE NULL,
      effective_to DATE NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS attendances (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      employee_id VARCHAR(100) NOT NULL,
      date DATE NOT NULL,
      check_in TIME NULL,
      check_out TIME NULL,
      working_hours DECIMAL(5,2) NOT NULL DEFAULT 8.50,
      status ENUM('Present', 'Absent', 'Late', 'Half Day', 'Leave', 'Holiday', 'Week Off', 'Work From Home') NOT NULL DEFAULT 'Present',
      late_minutes INT NOT NULL DEFAULT 0,
      overtime_hours DECIMAL(5,2) NOT NULL DEFAULT 0.00,
      notes VARCHAR(255) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_emp_date (employee_id, date),
      INDEX idx_att_date (date),
      INDEX idx_att_status (status)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS leave_requests (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      employee_id VARCHAR(100) NOT NULL,
      leave_type ENUM('Casual Leave', 'Sick Leave', 'Earned Leave', 'Permission', 'Other') NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      days_count DECIMAL(5,1) NOT NULL DEFAULT 1.0,
      reason TEXT NOT NULL,
      status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
      approver_notes TEXT NULL,
      approved_by VARCHAR(100) NULL,
      approved_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_leave_emp (employee_id),
      INDEX idx_leave_status (status)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS payroll (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      employee_id VARCHAR(100) NOT NULL,
      pay_period VARCHAR(20) NOT NULL,
      paid_days DECIMAL(5,1) NOT NULL DEFAULT 31.0,
      lop_days DECIMAL(5,1) NOT NULL DEFAULT 0.0,
      gross_salary DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      total_earnings DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      total_deductions DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      net_pay DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      status ENUM('DRAFT', 'GENERATED', 'FINALIZED', 'EMAILED') NOT NULL DEFAULT 'GENERATED',
      generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      finalized_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_emp_period (employee_id, pay_period),
      INDEX idx_payroll_period (pay_period),
      INDEX idx_payroll_status (status)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS payroll_items (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      payroll_id BIGINT UNSIGNED NOT NULL,
      component_type VARCHAR(100) NOT NULL,
      component_name VARCHAR(100) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      category ENUM('EARNING', 'DEDUCTION') NOT NULL,
      INDEX idx_item_payroll (payroll_id)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS payslips (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      payroll_id BIGINT UNSIGNED NOT NULL UNIQUE,
      employee_id VARCHAR(100) NOT NULL,
      payslip_reference VARCHAR(100) NOT NULL UNIQUE,
      pay_period VARCHAR(20) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_path TEXT NOT NULL,
      net_pay_in_words VARCHAR(500) NULL,
      email_status ENUM('NOT_SENT', 'QUEUED', 'SENT', 'FAILED') NOT NULL DEFAULT 'NOT_SENT',
      emailed_at DATETIME NULL,
      generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_ps_emp (employee_id),
      INDEX idx_ps_period (pay_period)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS internships (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      intern_id VARCHAR(100) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NULL,
      position VARCHAR(255) NOT NULL,
      department VARCHAR(255) NOT NULL,
      mentor VARCHAR(255) NULL,
      start_date VARCHAR(50) NULL,
      end_date VARCHAR(50) NULL,
      duration VARCHAR(50) NULL,
      work_model VARCHAR(50) NULL DEFAULT 'On-site',
      attendance_score DECIMAL(5,2) NOT NULL DEFAULT 96.50,
      tasks_completed INT NOT NULL DEFAULT 14,
      performance_score DECIMAL(5,2) NOT NULL DEFAULT 88.00,
      mentor_feedback TEXT NULL,
      placement_eligible ENUM('YES', 'NO', 'PENDING') NOT NULL DEFAULT 'YES',
      status ENUM('Applied', 'Selected', 'Active', 'Completed', 'Performance Review', 'Placement Eligible', 'Placed', 'Not Placed') NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_name VARCHAR(100) NOT NULL DEFAULT 'HR Manager',
      action VARCHAR(100) NOT NULL,
      entity VARCHAR(100) NOT NULL,
      entity_id VARCHAR(100) NOT NULL,
      details TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_audit_entity (entity),
      INDEX idx_audit_time (created_at)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS application_documents (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      application_id VARCHAR(50) NOT NULL,
      candidate_id VARCHAR(50) NOT NULL,
      document_type VARCHAR(100) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size BIGINT NULL,
      uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_app_docs_app (application_id),
      INDEX idx_app_docs_cnd (candidate_id)
    ) ENGINE=InnoDB;

    -- =========================================================================
    -- EMPLOYEE PORTAL FULL ERP TABLES
    -- =========================================================================

    CREATE TABLE IF NOT EXISTS employee_accounts (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      employee_id VARCHAR(100) NOT NULL UNIQUE,
      user_id VARCHAR(100) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      status ENUM('Active', 'Inactive', 'Suspended') NOT NULL DEFAULT 'Active',
      last_login DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_emp_acc_email (email),
      INDEX idx_emp_acc_status (status)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS tasks (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      task_id VARCHAR(50) NOT NULL UNIQUE,
      employee_id VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      project VARCHAR(255) NULL,
      assigned_by VARCHAR(255) NOT NULL DEFAULT 'HR / Reporting Manager',
      priority ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
      start_date DATE NULL,
      due_date DATE NULL,
      status ENUM('Pending', 'In Progress', 'In Review', 'Completed', 'Overdue') NOT NULL DEFAULT 'Pending',
      progress INT NOT NULL DEFAULT 0,
      description TEXT NULL,
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tasks_emp (employee_id),
      INDEX idx_tasks_status (status)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS attendance_corrections (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      employee_id VARCHAR(100) NOT NULL,
      attendance_date DATE NOT NULL,
      requested_check_in TIME NULL,
      requested_check_out TIME NULL,
      reason TEXT NOT NULL,
      status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
      approver_notes TEXT NULL,
      approved_by VARCHAR(100) NULL,
      approved_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_att_corr_emp (employee_id),
      INDEX idx_att_corr_status (status)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS profile_change_requests (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      employee_id VARCHAR(100) NOT NULL,
      requested_changes JSON NOT NULL,
      reason TEXT NOT NULL,
      status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
      approver_notes TEXT NULL,
      approved_by VARCHAR(100) NULL,
      approved_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_prof_req_emp (employee_id),
      INDEX idx_prof_req_status (status)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS employee_notifications (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      employee_id VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'INFO',
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      link VARCHAR(255) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_emp_notif (employee_id, is_read)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS announcements (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      date DATE NOT NULL,
      priority ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
      target_department VARCHAR(100) NOT NULL DEFAULT 'ALL',
      created_by VARCHAR(100) NOT NULL DEFAULT 'HR Department',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_ann_date (date)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS company_holidays (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      holiday_date DATE NOT NULL,
      day_name VARCHAR(50) NOT NULL,
      holiday_type VARCHAR(100) NOT NULL DEFAULT 'Public Holiday',
      year SMALLINT NOT NULL DEFAULT 2026,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_holiday_date (holiday_date)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS employee_performance (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      employee_id VARCHAR(100) NOT NULL,
      period VARCHAR(50) NOT NULL,
      performance_score DECIMAL(5,2) NOT NULL DEFAULT 88.50,
      goals JSON NULL,
      kpis JSON NULL,
      manager_feedback TEXT NULL,
      review_history JSON NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_perf_emp_period (employee_id, period)
    ) ENGINE=InnoDB;

    -- DEPARTMENT MODULES:
    CREATE TABLE IF NOT EXISTS telecaller_leads (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      employee_id VARCHAR(100) NOT NULL,
      lead_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      email VARCHAR(255) NULL,
      source VARCHAR(100) NOT NULL DEFAULT 'Inbound / Website',
      status ENUM('New', 'Contacted', 'Interested', 'Follow-up Scheduled', 'Converted', 'Lost') NOT NULL DEFAULT 'New',
      call_notes TEXT NULL,
      follow_up_date DATE NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tel_emp (employee_id)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS marketing_campaigns (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      employee_id VARCHAR(100) NOT NULL,
      campaign_name VARCHAR(255) NOT NULL,
      channel VARCHAR(100) NOT NULL DEFAULT 'Google / Meta / B2B',
      leads_generated INT NOT NULL DEFAULT 0,
      conversions INT NOT NULL DEFAULT 0,
      target_count INT NOT NULL DEFAULT 50,
      incentive DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      status VARCHAR(50) NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_mkt_emp (employee_id)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS developer_projects (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      employee_id VARCHAR(100) NOT NULL,
      project_name VARCHAR(255) NOT NULL,
      sprint_name VARCHAR(100) NOT NULL DEFAULT 'Sprint 2026.Q3.1',
      bug_count INT NOT NULL DEFAULT 0,
      progress_percent INT NOT NULL DEFAULT 65,
      status VARCHAR(50) NOT NULL DEFAULT 'Active',
      work_log TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_dev_emp (employee_id)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS design_projects (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      employee_id VARCHAR(100) NOT NULL,
      project_name VARCHAR(255) NOT NULL,
      design_type VARCHAR(100) NOT NULL DEFAULT 'UI/UX Design Mockup',
      status ENUM('Pending', 'In Review', 'Approved', 'Revision Required', 'Completed') NOT NULL DEFAULT 'Pending',
      revisions_count INT NOT NULL DEFAULT 0,
      preview_url VARCHAR(500) NULL,
      approved_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_des_emp (employee_id)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS social_media_posts (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      employee_id VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      platform VARCHAR(50) NOT NULL DEFAULT 'Instagram',
      post_type ENUM('Reel', 'Carousel', 'Single Image', 'Video', 'Article') NOT NULL DEFAULT 'Reel',
      reach INT NOT NULL DEFAULT 0,
      engagement INT NOT NULL DEFAULT 0,
      leads_generated INT NOT NULL DEFAULT 0,
      scheduled_date DATE NULL,
      status ENUM('Draft', 'Scheduled', 'Published') NOT NULL DEFAULT 'Published',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_soc_emp (employee_id)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS employee_uploaded_documents (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      employee_id VARCHAR(100) NOT NULL,
      document_name VARCHAR(255) NOT NULL,
      document_type VARCHAR(100) NOT NULL DEFAULT 'Identity Document',
      file_name VARCHAR(255) NOT NULL,
      file_path TEXT NOT NULL,
      file_size BIGINT NULL,
      status ENUM('VERIFIED', 'PENDING', 'REJECTED') NOT NULL DEFAULT 'VERIFIED',
      upload_date DATE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_up_docs_emp (employee_id)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS support_tickets (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      ticket_id VARCHAR(50) NOT NULL UNIQUE,
      employee_id VARCHAR(100) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL DEFAULT 'HR Policy & General',
      priority ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
      description TEXT NOT NULL,
      status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
      hr_response TEXT NULL,
      resolved_by VARCHAR(100) NULL,
      resolved_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tkt_emp (employee_id),
      INDEX idx_tkt_status (status)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS relieving_requests (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      request_id VARCHAR(50) NOT NULL UNIQUE,
      employee_id VARCHAR(100) NOT NULL,
      notice_period_days INT NOT NULL DEFAULT 30,
      resignation_date DATE NOT NULL,
      requested_relieving_date DATE NOT NULL,
      reason VARCHAR(255) NOT NULL,
      handover_notes TEXT NULL,
      status ENUM('PENDING_HR_APPROVAL', 'APPROVED_IN_NOTICE', 'RELIEVED', 'REJECTED') NOT NULL DEFAULT 'PENDING_HR_APPROVAL',
      hr_remarks TEXT NULL,
      approved_by VARCHAR(100) NULL,
      approved_at DATETIME NULL,
      relieving_letter_issued BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_rel_emp (employee_id),
      INDEX idx_rel_status (status)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS admins (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      admin_id VARCHAR(50) NOT NULL UNIQUE,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      mobile VARCHAR(50) NULL,
      role ENUM('SUPER_ADMIN', 'HR_ADMIN', 'TELECALLING_ADMIN', 'MARKETING_ADMIN', 'DESIGN_ADMIN', 'SOCIAL_MEDIA_ADMIN', 'DEPARTMENT_MANAGER') NOT NULL DEFAULT 'HR_ADMIN',
      department VARCHAR(100) NOT NULL DEFAULT 'Human Resources',
      password_hash VARCHAR(255) NOT NULL DEFAULT 'AutoRevive@2026',
      status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
      permissions JSON NULL,
      last_login DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_adm_email (email),
      INDEX idx_adm_role (role),
      INDEX idx_adm_status (status)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS admin_activity_logs (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      admin_id VARCHAR(50) NOT NULL,
      admin_name VARCHAR(255) NOT NULL,
      role VARCHAR(100) NOT NULL,
      action VARCHAR(255) NOT NULL,
      module VARCHAR(100) NOT NULL,
      record_id VARCHAR(100) NULL,
      details TEXT NULL,
      ip_address VARCHAR(100) NULL DEFAULT '127.0.0.1',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_log_adm (admin_id),
      INDEX idx_log_mod (module),
      INDEX idx_log_created (created_at)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS calls_log (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      call_id VARCHAR(50) NOT NULL UNIQUE,
      lead_id BIGINT UNSIGNED NOT NULL,
      employee_id VARCHAR(100) NOT NULL,
      caller_name VARCHAR(255) NOT NULL,
      contact_number VARCHAR(50) NOT NULL,
      call_type ENUM('Outbound', 'Inbound', 'Follow-up') NOT NULL DEFAULT 'Outbound',
      duration_seconds INT NOT NULL DEFAULT 120,
      outcome ENUM('Connected - Interested', 'Connected - Not Interested', 'Call Back Requested', 'Ringing / No Answer', 'Busy / Disconnected', 'Converted / Deal Closed') NOT NULL DEFAULT 'Connected - Interested',
      notes TEXT NULL,
      follow_up_date DATE NULL,
      call_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_call_lead (lead_id),
      INDEX idx_call_emp (employee_id)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS telecaller_targets (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      employee_id VARCHAR(100) NOT NULL,
      period VARCHAR(50) NOT NULL,
      target_type ENUM('Daily', 'Weekly', 'Monthly') NOT NULL DEFAULT 'Monthly',
      target_calls INT NOT NULL DEFAULT 600,
      achieved_calls INT NOT NULL DEFAULT 0,
      target_conversions INT NOT NULL DEFAULT 25,
      achieved_conversions INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tgt_emp (employee_id)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS telecaller_incentives (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      incentive_id VARCHAR(50) NOT NULL UNIQUE,
      employee_id VARCHAR(100) NOT NULL,
      month VARCHAR(50) NOT NULL,
      leads_converted INT NOT NULL DEFAULT 0,
      incentive_rate DECIMAL(10,2) NOT NULL DEFAULT 1500.00,
      total_incentive DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      status ENUM('Draft', 'Approved', 'Sent to Payroll', 'Paid') NOT NULL DEFAULT 'Draft',
      approved_by VARCHAR(100) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_inc_emp (employee_id)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS marketing_tasks (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      task_id VARCHAR(50) NOT NULL UNIQUE,
      campaign_id BIGINT UNSIGNED NULL,
      task_title VARCHAR(255) NOT NULL,
      assigned_to VARCHAR(100) NOT NULL,
      deadline DATE NOT NULL,
      priority ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
      status ENUM('New', 'In Progress', 'Under Review', 'Completed') NOT NULL DEFAULT 'In Progress',
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_mkt_task_emp (assigned_to)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS design_tasks (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      task_id VARCHAR(50) NOT NULL UNIQUE,
      project_id BIGINT UNSIGNED NULL,
      task_title VARCHAR(255) NOT NULL,
      designer_id VARCHAR(100) NOT NULL,
      priority ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
      deadline DATE NOT NULL,
      status ENUM('New', 'Assigned', 'In Progress', 'Submitted', 'Under Review', 'Revision Required', 'Approved', 'Completed') NOT NULL DEFAULT 'In Progress',
      preview_url VARCHAR(500) NULL,
      feedback_notes TEXT NULL,
      revisions_count INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_des_task_emp (designer_id)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS creative_requests (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      request_id VARCHAR(50) NOT NULL UNIQUE,
      from_department VARCHAR(100) NOT NULL,
      requested_by VARCHAR(100) NOT NULL,
      assigned_designer VARCHAR(100) NULL,
      title VARCHAR(255) NOT NULL,
      asset_type ENUM('Instagram Post', 'Instagram Reel / Story', 'Website Banner', 'Ad Creative', 'Brochure / Flyer', 'Brand Asset') NOT NULL DEFAULT 'Instagram Post',
      description TEXT NOT NULL,
      due_date DATE NOT NULL,
      status ENUM('Pending Assignment', 'In Progress', 'Review & Approval', 'Approved & Completed', 'Rejected') NOT NULL DEFAULT 'Pending Assignment',
      preview_url VARCHAR(500) NULL,
      comments TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_cr_status (status)
    ) ENGINE=InnoDB;

    CREATE TABLE IF NOT EXISTS social_media_analytics (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      platform VARCHAR(50) NOT NULL,
      metric_date DATE NOT NULL,
      followers_count INT NOT NULL DEFAULT 12500,
      reach INT NOT NULL DEFAULT 45000,
      impressions INT NOT NULL DEFAULT 85000,
      profile_visits INT NOT NULL DEFAULT 3200,
      engagement_rate DECIMAL(5,2) NOT NULL DEFAULT 4.85,
      leads_generated INT NOT NULL DEFAULT 42,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_soc_plat_date (platform, metric_date)
    ) ENGINE=InnoDB;
  `);

  // 3. Ensure Columns on employees
  try {
    const [cols] = await pool.query<RowDataPacket[]>(`SHOW COLUMNS FROM employees LIKE 'gender'`);
    if (cols.length === 0) {
      await pool.query(`ALTER TABLE employees ADD COLUMN gender VARCHAR(20) DEFAULT 'Male' AFTER address`);
      await pool.query(`ALTER TABLE employees ADD COLUMN bank_name VARCHAR(100) DEFAULT 'HDFC Bank' AFTER gender`);
      await pool.query(`ALTER TABLE employees ADD COLUMN account_number VARCHAR(100) DEFAULT '50100612342166' AFTER bank_name`);
      await pool.query(`ALTER TABLE employees ADD COLUMN status VARCHAR(50) DEFAULT 'Active' AFTER placement_status`);
      await pool.query(`ALTER TABLE employees ADD COLUMN notice_period_end_date DATE NULL AFTER status`);
      await pool.query(`ALTER TABLE employees ADD COLUMN relieving_reason VARCHAR(255) NULL AFTER notice_period_end_date`);
    }
  } catch (err) {
    console.warn('Could not add extra columns to employees:', err);
  }

  // 3b. Ensure Columns on job_vacancies (Mandatory Fields & Documents configuration)
  try {
    const [vCols] = await pool.query<RowDataPacket[]>(`SHOW COLUMNS FROM job_vacancies LIKE 'mandatory_fields'`);
    if (vCols.length === 0) {
      await pool.query(`ALTER TABLE job_vacancies ADD COLUMN mandatory_fields TEXT NULL AFTER skills`);
      await pool.query(`ALTER TABLE job_vacancies ADD COLUMN mandatory_documents TEXT NULL AFTER mandatory_fields`);
      await pool.query(`ALTER TABLE job_vacancies ADD COLUMN experience_level ENUM('Fresher', 'Experienced', 'Both') NOT NULL DEFAULT 'Both' AFTER mandatory_documents`);
    }
  } catch (err) {
    console.warn('Could not add extra columns to job_vacancies:', err);
  }

  // 3c. Ensure Columns on job_applications (All 10 Sections)
  try {
    const [aCols] = await pool.query<RowDataPacket[]>(`SHOW COLUMNS FROM job_applications LIKE 'candidate_id'`);
    if (aCols.length === 0) {
      await pool.query(`ALTER TABLE job_applications ADD COLUMN candidate_id VARCHAR(50) NULL AFTER application_id`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN alternate_phone VARCHAR(50) NULL AFTER mobile`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN father_or_spouse_name VARCHAR(255) NULL AFTER gender`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN blood_group VARCHAR(20) NULL AFTER father_or_spouse_name`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN marital_status VARCHAR(50) NULL AFTER blood_group`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN same_as_current BOOLEAN NOT NULL DEFAULT FALSE AFTER permanent_address`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN education_records JSON NULL AFTER percentage_cgpa`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN total_experience_years INT NOT NULL DEFAULT 0 AFTER total_experience`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN total_experience_months INT NOT NULL DEFAULT 0 AFTER total_experience_years`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN current_ctc VARCHAR(50) NULL AFTER previous_salary`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN reason_for_change TEXT NULL AFTER expected_salary`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN work_history JSON NULL AFTER reason_for_change`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN technical_tools TEXT NULL AFTER technical_skills`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN preferred_location VARCHAR(100) NULL AFTER languages`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN preferred_shift VARCHAR(50) NULL AFTER preferred_location`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN expected_joining_date VARCHAR(50) NULL AFTER preferred_shift`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN willing_to_relocate BOOLEAN NOT NULL DEFAULT TRUE AFTER expected_joining_date`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN references_data JSON NULL AFTER github_url`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN declaration_confirmed BOOLEAN NOT NULL DEFAULT TRUE AFTER references_data`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN recruitment_consent BOOLEAN NOT NULL DEFAULT TRUE AFTER declaration_confirmed`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN signature_name VARCHAR(255) NULL AFTER recruitment_consent`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN declaration_date VARCHAR(50) NULL AFTER signature_name`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN screening_status ENUM('PENDING', 'PASSED', 'REJECTED') NOT NULL DEFAULT 'PENDING' AFTER status`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN interview_status ENUM('NOT_SCHEDULED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'NOT_SCHEDULED' AFTER screening_status`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN final_status VARCHAR(50) NOT NULL DEFAULT 'APPLIED' AFTER interview_status`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN recruiter_name VARCHAR(100) NOT NULL DEFAULT 'Jemsina Banu (HR)' AFTER final_status`);
      await pool.query(`ALTER TABLE job_applications ADD COLUMN notes TEXT NULL AFTER recruiter_name`);
      await pool.query(`ALTER TABLE job_applications ADD INDEX idx_app_candidate (candidate_id)`);

      // Backfill candidate_id for existing applications
      const [existingApps] = await pool.query<RowDataPacket[]>(`SELECT id, application_id FROM job_applications WHERE candidate_id IS NULL`);
      for (const a of existingApps) {
        const seq = a.application_id.split('-').pop() || String(a.id).padStart(6, '0');
        await pool.query(`UPDATE job_applications SET candidate_id = ? WHERE id = ?`, [`AR-CND-2026-${seq}`, a.id]);
      }
    }
  } catch (err) {
    console.warn('Could not add extra columns to job_applications:', err);
  }

  // 3d. Ensure additional employee profile & portal columns
  try {
    const [empCols] = await pool.query<RowDataPacket[]>(`SHOW COLUMNS FROM employees LIKE 'reporting_manager'`);
    if (empCols.length === 0) {
      await pool.query(`ALTER TABLE employees ADD COLUMN reporting_manager VARCHAR(255) DEFAULT 'Arun Kumar (VP Operations)' AFTER department`);
      await pool.query(`ALTER TABLE employees ADD COLUMN work_timing VARCHAR(100) DEFAULT '09:00 AM - 06:00 PM' AFTER work_location`);
      await pool.query(`ALTER TABLE employees ADD COLUMN probation_period VARCHAR(100) DEFAULT '3 Months' AFTER joining_date`);
      await pool.query(`ALTER TABLE employees ADD COLUMN confirmation_date VARCHAR(100) DEFAULT '03/05/2027' AFTER probation_period`);
      await pool.query(`ALTER TABLE employees ADD COLUMN dob VARCHAR(50) DEFAULT '15/06/1998' AFTER gender`);
      await pool.query(`ALTER TABLE employees ADD COLUMN emergency_contact VARCHAR(100) DEFAULT '+91 98401 98765' AFTER mobile`);
      await pool.query(`ALTER TABLE employees ADD COLUMN photo_url TEXT NULL AFTER full_name`);
      await pool.query(`ALTER TABLE employees ADD COLUMN account_status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active' AFTER status`);
    }
  } catch (err) {
    console.warn('Could not add portal columns to employees:', err);
  }

  // 3e. Synchronize document_counters for APP and CND with current MAX in job_applications
  try {
    const year = new Date().getFullYear();
    const [maxRows] = await pool.query<RowDataPacket[]>(
      `SELECT MAX(CAST(SUBSTRING_INDEX(application_id, '-', -1) AS UNSIGNED)) as max_seq FROM job_applications`
    );
    const maxSeq = Number(maxRows[0]?.max_seq || 0);
    const nextSeq = maxSeq + 1;
    await pool.query(
      `INSERT INTO document_counters (prefix, year, next_number) VALUES ('APP', ?, ?)
       ON DUPLICATE KEY UPDATE next_number = GREATEST(next_number, VALUES(next_number))`,
      [year, nextSeq]
    );
    await pool.query(
      `INSERT INTO document_counters (prefix, year, next_number) VALUES ('CND', ?, ?)
       ON DUPLICATE KEY UPDATE next_number = GREATEST(next_number, VALUES(next_number))`,
      [year, nextSeq]
    );
  } catch (err) {
    console.warn('Could not sync document counters:', err);
  }

  // 4. Seed Company Holidays (2026)
  const [holRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as count FROM company_holidays`);
  if (Number(holRows[0].count) === 0) {
    console.log('Seeding official company holidays for 2026...');
    await pool.query(`
      INSERT INTO company_holidays (name, holiday_date, day_name, holiday_type, year)
      VALUES
      ('New Year''s Day', '2026-01-01', 'Thursday', 'Public Holiday', 2026),
      ('Pongal Festival', '2026-01-14', 'Wednesday', 'Regional Holiday', 2026),
      ('Thiruvalluvar Day', '2026-01-15', 'Thursday', 'Regional Holiday', 2026),
      ('Republic Day', '2026-01-26', 'Monday', 'National Holiday', 2026),
      ('Tamil New Year', '2026-04-14', 'Tuesday', 'Regional Holiday', 2026),
      ('May Day / Workers'' Day', '2026-05-01', 'Friday', 'Public Holiday', 2026),
      ('Independence Day', '2026-08-15', 'Saturday', 'National Holiday', 2026),
      ('Vinayagar Chaturthi', '2026-09-14', 'Monday', 'Public Holiday', 2026),
      ('Gandhi Jayanti', '2026-10-02', 'Friday', 'National Holiday', 2026),
      ('Ayutha Pooja & Vijaya Dasami', '2026-10-20', 'Tuesday', 'Regional Holiday', 2026),
      ('Deepavali / Diwali', '2026-11-08', 'Sunday', 'Public Holiday', 2026),
      ('Christmas Day', '2026-12-25', 'Friday', 'Public Holiday', 2026)
    `);
  }

  // 5. Seed Initial Announcements
  const [annRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as count FROM announcements`);
  if (Number(annRows[0].count) === 0) {
    console.log('Seeding initial HR announcements...');
    await pool.query(`
      INSERT INTO announcements (title, message, date, priority, target_department, created_by)
      VALUES
      ('AutoRevive Employee Self-Service Portal Rollout', 'Welcome to the new official AutoRevive Employee Portal! You can now clock in/out, view payslips, track sprint deliverables, and manage leave applications online.', '2026-08-28', 'High', 'ALL', 'HR Department'),
      ('Independence Day Celebration & Annual Townhall', 'All team members are invited to our annual townhall and workshop milestone celebration at the Uthangarai HQ.', '2026-08-15', 'Medium', 'ALL', 'Executive Office'),
      ('Quarterly Performance & Appraisal Reviews', 'Manager reviews and department KPI assessments for Q3 will commence starting next week.', '2026-08-20', 'Urgent', 'ALL', 'HR Department')
    `);
  }

  // 6. Seed Vacancies if empty (keeps active job postings intact)
  const [vacRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as count FROM job_vacancies`);
  if (Number(vacRows[0].count) === 0) {
    console.log('Seeding initial job vacancies...');
    await pool.query(`
      INSERT INTO job_vacancies 
      (job_id, title, department, designation, employment_type, openings, location, work_model, salary_range, experience_required, qualification, skills, description, status, public_token)
      VALUES 
      ('AR-JOB-2026-001', 'Sales & Business Development Specialist', 'Sales & Business Development', 'Sales & BD Specialist', 'Full Time', 3, 'Uthangarai, Krishnagiri', 'On-site', '₹ 4.5 - 6.0 LPA', '1 - 3 Years', 'B.Com / BBA / MBA / Any Graduate', 'Automobile Sales, Negotiation, CRM, Communication', 'Lead vehicle bidding sales, client acquisitions, and auto dealer relations.', 'Published', 'token-sales-2026-001'),
      ('AR-JOB-2026-002', 'Full Stack React & Node Developer', 'Engineering', 'Software Engineer', 'Full Time', 2, 'Krishnagiri / Hybrid', 'Hybrid', '₹ 5.0 - 8.0 LPA', '2 - 4 Years', 'B.E / B.Tech / MCA', 'React, TypeScript, Node.js, Express, MySQL', 'Develop vehicle auction engines, document centers, and HR ERP modules.', 'Published', 'token-dev-2026-002'),
      ('AR-JOB-2026-003', 'Graduate Automobile Engineering Intern', 'Operations', 'Intern Trainee', 'Internship', 5, 'Uthangarai, Krishnagiri', 'On-site', '₹ 15,000 / month', 'Fresher', 'Diploma / B.E Automobile or Mechanical', 'Vehicle Inspection, Diagnostic Scanning, Maintenance Protocols', '3-month internship cum placement training program with performance-based PPO.', 'Published', 'token-intern-2026-003')
    `);
  }

  // 7. Seed Sample Applications if empty
  const [appRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as count FROM job_applications`);
  if (Number(appRows[0].count) === 0) {
    console.log('Seeding initial job applications...');
    await pool.query(`
      INSERT INTO job_applications 
      (application_id, job_title, full_name, email, mobile, highest_qualification, experience_type, total_experience, status)
      VALUES 
      ('AR-APP-2026-000001', 'Sales & Business Development Specialist', 'Karthik N', 'karthik.n@autorevives.com', '+91 94426 93306', 'BBA in Marketing', 'Experienced', '2 Years', 'SELECTED'),
      ('AR-APP-2026-000002', 'Full Stack React & Node Developer', 'Rohan M', 'rohan.m@autorevives.com', '+91 95979 69650', 'B.Tech IT', 'Experienced', '3 Years', 'SHORTLISTED'),
      ('AR-APP-2026-000003', 'Graduate Automobile Engineering Intern', 'Priya S', 'priya.s@example.com', '+91 98401 23456', 'B.E Automobile', 'Fresher', '0 Years', 'APPLIED'),
      ('AR-APP-2026-000004', 'Sales & Business Development Specialist', 'Anitha R', 'anitha.r@autorevives.com', '+91 97890 12345', 'B.Com', 'Experienced', '1.5 Years', 'INTERVIEW_SCHEDULED')
    `);
  }

  // 8. Seed Sample Internships if empty
  const [internRows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) as count FROM internships`);
  if (Number(internRows[0].count) === 0) {
    console.log('Seeding initial internships...');
    await pool.query(`
      INSERT INTO internships 
      (intern_id, name, email, phone, position, department, mentor, start_date, end_date, duration, attendance_score, tasks_completed, performance_score, placement_eligible, status)
      VALUES 
      ('AR-INT-2026-0001', 'Gowtham R', 'gowtham.r@example.com', '+91 94426 93306', 'Automotive Technician Trainee', 'Operations', 'Vijay M', '01/08/2026', '31/10/2026', '3 Months', 98.00, 16, 92.50, 'YES', 'Placement Eligible'),
      ('AR-INT-2026-0002', 'Gopika S', 'gopika.s@example.com', '+91 95979 69650', 'Graduate HR Intern', 'Human Resources', 'Jemsina Banu', '01/08/2026', '31/10/2026', '3 Months', 95.00, 14, 87.00, 'PENDING', 'Active')
    `);
  }

  // 9. Synchronize employee_accounts for existing active employees
  try {
    const [allEmps] = await pool.query<RowDataPacket[]>(`SELECT * FROM employees`);
    for (const emp of allEmps) {
      const email = emp.email || `${emp.employee_id.toLowerCase()}@autorevives.com`;
      const userId = `USR-${emp.employee_id}`;
      const pass = emp.portal_password || 'AutoRevive@2026';
      await pool.query(`
        INSERT INTO employee_accounts (employee_id, user_id, email, password_hash, status)
        VALUES (?, ?, ?, ?, 'Active')
        ON DUPLICATE KEY UPDATE email = VALUES(email)
      `, [emp.employee_id, userId, email, pass]);
    }
  } catch (err) {
    console.warn('Could not sync employee accounts:', err);
  }

  // 10. Seed Default Super Admin
  try {
    const superAdmin = {
      admin_id: 'AR-ADM-2026-0001',
      full_name: 'Narendhar D',
      email: 'admin@autorevives.com',
      mobile: '+91 94426 93306',
      role: 'SUPER_ADMIN',
      department: 'Executive Office',
      password_hash: 'AutoRevive@2026',
    };

    await pool.query(`
      INSERT INTO admins (admin_id, full_name, email, mobile, role, department, password_hash, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
      ON DUPLICATE KEY UPDATE 
        full_name = VALUES(full_name),
        role = VALUES(role),
        department = VALUES(department),
        status = 'Active'
    `, [superAdmin.admin_id, superAdmin.full_name, superAdmin.email, superAdmin.mobile, superAdmin.role, superAdmin.department, superAdmin.password_hash]);
  } catch (err) {
    console.warn('Could not seed default super admin:', err);
  }
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

export async function nextDocumentNumber(prefix: string, year: number): Promise<string> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('INSERT IGNORE INTO document_counters (prefix, year, next_number) VALUES (?, ?, 1)', [prefix, year]);
    const [rows] = await connection.execute<RowDataPacket[]>('SELECT next_number FROM document_counters WHERE prefix = ? AND year = ? FOR UPDATE', [prefix, year]);
    const number = Number(rows[0].next_number);
    await connection.execute('UPDATE document_counters SET next_number = next_number + 1 WHERE prefix = ? AND year = ?', [prefix, year]);
    await connection.commit();
    return `AR/${prefix}/${year}/${String(number).padStart(4, '0')}`;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function nextCustomNumber(prefix: string, digits: number = 6): Promise<string> {
  const year = new Date().getFullYear();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('INSERT IGNORE INTO document_counters (prefix, year, next_number) VALUES (?, ?, 1)', [prefix, year]);
    const [rows] = await connection.execute<RowDataPacket[]>('SELECT next_number FROM document_counters WHERE prefix = ? AND year = ? FOR UPDATE', [prefix, year]);
    const number = Number(rows[0].next_number);
    await connection.execute('UPDATE document_counters SET next_number = next_number + 1 WHERE prefix = ? AND year = ?', [prefix, year]);
    await connection.commit();
    return `AR-${prefix}-${year}-${String(number).padStart(digits, '0')}`;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function generateSafeApplicationId(connection?: mysql.PoolConnection): Promise<string> {
  const conn = connection || (await pool.getConnection());
  const shouldRelease = !connection;
  try {
    const year = new Date().getFullYear();
    // Query maximum application ID sequence in database
    const [maxRows] = await conn.query<RowDataPacket[]>(
      `SELECT MAX(CAST(SUBSTRING_INDEX(application_id, '-', -1) AS UNSIGNED)) as max_seq 
       FROM job_applications 
       WHERE application_id LIKE ?`,
      [`AR-APP-${year}-%`]
    );
    const maxExisting = Number(maxRows[0]?.max_seq || 0);

    // Sync counter
    await conn.query(
      `INSERT INTO document_counters (prefix, year, next_number) 
       VALUES ('APP', ?, ?) 
       ON DUPLICATE KEY UPDATE next_number = GREATEST(next_number, VALUES(next_number))`,
      [year, maxExisting + 1]
    );

    const [counterRows] = await conn.query<RowDataPacket[]>(
      `SELECT next_number FROM document_counters WHERE prefix = 'APP' AND year = ? FOR UPDATE`,
      [year]
    );
    let nextNum = Math.max(Number(counterRows[0]?.next_number || 1), maxExisting + 1);

    // Collision prevention loop
    while (true) {
      const candidateAppId = `AR-APP-${year}-${String(nextNum).padStart(6, '0')}`;
      const [exists] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM job_applications WHERE application_id = ?`,
        [candidateAppId]
      );
      if (exists.length === 0) {
        await conn.query(
          `UPDATE document_counters SET next_number = ? WHERE prefix = 'APP' AND year = ?`,
          [nextNum + 1, year]
        );
        return candidateAppId;
      }
      nextNum++;
    }
  } finally {
    if (shouldRelease) conn.release();
  }
}

export async function generateSafeCandidateId(connection?: mysql.PoolConnection): Promise<string> {
  const conn = connection || (await pool.getConnection());
  const shouldRelease = !connection;
  try {
    const year = new Date().getFullYear();
    const [maxRows] = await conn.query<RowDataPacket[]>(
      `SELECT MAX(CAST(SUBSTRING_INDEX(candidate_id, '-', -1) AS UNSIGNED)) as max_seq 
       FROM job_applications 
       WHERE candidate_id LIKE ?`,
      [`AR-CND-${year}-%`]
    );
    const maxExisting = Number(maxRows[0]?.max_seq || 0);

    await conn.query(
      `INSERT INTO document_counters (prefix, year, next_number) 
       VALUES ('CND', ?, ?) 
       ON DUPLICATE KEY UPDATE next_number = GREATEST(next_number, VALUES(next_number))`,
      [year, maxExisting + 1]
    );

    const [counterRows] = await conn.query<RowDataPacket[]>(
      `SELECT next_number FROM document_counters WHERE prefix = 'CND' AND year = ? FOR UPDATE`,
      [year]
    );
    let nextNum = Math.max(Number(counterRows[0]?.next_number || 1), maxExisting + 1);

    while (true) {
      const cndId = `AR-CND-${year}-${String(nextNum).padStart(6, '0')}`;
      const [exists] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM job_applications WHERE candidate_id = ?`,
        [cndId]
      );
      if (exists.length === 0) {
        await conn.query(
          `UPDATE document_counters SET next_number = ? WHERE prefix = 'CND' AND year = ?`,
          [nextNum + 1, year]
        );
        return cndId;
      }
      nextNum++;
    }
  } finally {
    if (shouldRelease) conn.release();
  }
}

export async function generateSafeAdminId(connection?: mysql.PoolConnection): Promise<string> {
  const conn = connection || (await pool.getConnection());
  const shouldRelease = !connection;
  try {
    const year = new Date().getFullYear();
    const [maxRows] = await conn.query<RowDataPacket[]>(
      `SELECT MAX(CAST(SUBSTRING_INDEX(admin_id, '-', -1) AS UNSIGNED)) as max_seq 
       FROM admins 
       WHERE admin_id LIKE ?`,
      [`AR-ADM-${year}-%`]
    );
    const maxExisting = Number(maxRows[0]?.max_seq || 0);

    await conn.query(
      `INSERT INTO document_counters (prefix, year, next_number) 
       VALUES ('ADM', ?, ?) 
       ON DUPLICATE KEY UPDATE next_number = GREATEST(next_number, VALUES(next_number))`,
      [year, maxExisting + 1]
    );

    const [counterRows] = await conn.query<RowDataPacket[]>(
      `SELECT next_number FROM document_counters WHERE prefix = 'ADM' AND year = ? FOR UPDATE`,
      [year]
    );
    let nextNum = Math.max(Number(counterRows[0]?.next_number || 1), maxExisting + 1);

    while (true) {
      const candidateId = `AR-ADM-${year}-${String(nextNum).padStart(4, '0')}`;
      const [exists] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM admins WHERE admin_id = ?`,
        [candidateId]
      );
      if (exists.length === 0) {
        await conn.query(
          `UPDATE document_counters SET next_number = ? WHERE prefix = 'ADM' AND year = ?`,
          [nextNum + 1, year]
        );
        return candidateId;
      }
      nextNum++;
    }
  } finally {
    if (shouldRelease) conn.release();
  }
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
