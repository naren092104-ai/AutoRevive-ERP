import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  // 1. Initial check (should be 0)
  const res1 = await fetch('http://localhost:4000/api/employee-portal/payslips?employee_id=AR-EMP-2026-0001');
  const d1 = await res1.json();
  console.log('Before HR sends payslip: count =', d1.payslips.length);

  // 2. HR creates payroll & sends payslip
  const [pRes] = await conn.query(`
    INSERT INTO payroll (employee_id, pay_period, paid_days, lop_days, gross_salary, total_earnings, total_deductions, net_pay, status)
    VALUES ('AR-EMP-2026-0001', '2026-08', 31.0, 0.0, 41500, 41500, 0, 41500, 'GENERATED')
  `);
  await conn.query(`
    INSERT INTO payslips (payroll_id, employee_id, payslip_reference, pay_period, file_name, file_path, net_pay_in_words, email_status)
    VALUES (?, 'AR-EMP-2026-0001', 'AR/PS/2026-08/000001', '2026-08', 'Payslip.pdf', 'path.pdf', 'Forty-One Thousand Five Hundred', 'SENT')
  `, [pRes.insertId]);

  // 3. Check again (should find 1 payslip)
  const res2 = await fetch('http://localhost:4000/api/employee-portal/payslips?employee_id=AR-EMP-2026-0001');
  const d2 = await res2.json();
  console.log('After HR sends payslip: count =', d2.payslips.length, '| Ref:', d2.payslips[0]?.payslip_reference);

  // 4. Clean up test record
  await conn.query(`DELETE FROM payslips WHERE payslip_reference = 'AR/PS/2026-08/000001'`);
  await conn.query(`DELETE FROM payroll WHERE id = ?`, [pRes.insertId]);

  // 5. Final check (should be 0 again)
  const res3 = await fetch('http://localhost:4000/api/employee-portal/payslips?employee_id=AR-EMP-2026-0001');
  const d3 = await res3.json();
  console.log('After cleanup: count =', d3.payslips.length);

  await conn.end();
}

test().catch(console.error);
