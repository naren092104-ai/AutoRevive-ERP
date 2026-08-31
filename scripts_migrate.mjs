import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function runMigration() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Naren@0921',
    database: process.env.DB_NAME || 'autorevive_hr'
  });

  await conn.query(`
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
    ) ENGINE=InnoDB
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      ticket_id VARCHAR(50) NOT NULL UNIQUE,
      employee_id VARCHAR(100) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      category ENUM('Attendance & Punch', 'Payroll & Salary', 'Document Request', 'IT & Equipment', 'HR Policy & General') NOT NULL DEFAULT 'HR Policy & General',
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
    ) ENGINE=InnoDB
  `);

  try {
    await conn.query(`ALTER TABLE payslips ADD COLUMN portal_visible BOOLEAN NOT NULL DEFAULT TRUE`);
  } catch (e) {
    // Already exists
  }

  // Seed initial sample tickets for Gautham and Narendhar
  await conn.query(`
    INSERT INTO support_tickets (ticket_id, employee_id, subject, category, priority, description, status)
    VALUES 
      ('TKT-2026-001', 'AR-EMP-2026-0003', 'Biometric punch sync on 25 Aug', 'Attendance & Punch', 'Medium', 'My punch at 9:15 AM did not record due to biometric machine reboot. Requesting manual update.', 'OPEN'),
      ('TKT-2026-002', 'AR-EMP-2026-0001', 'Aadhaar Card copy verification', 'Document Request', 'Low', 'Uploaded updated Aadhaar card copy with current residential address.', 'RESOLVED')
    ON DUPLICATE KEY UPDATE status = VALUES(status)
  `);

  console.log('Migration completed successfully!');
  await conn.end();
}

runMigration().catch(console.error);
