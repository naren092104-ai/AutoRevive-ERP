import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  await c.query('DELETE FROM employees');
  await c.query('DELETE FROM salary_structures');
  await c.query('DELETE FROM attendances');
  await c.query('DELETE FROM payslips');
  await c.query('DELETE FROM payroll_items');
  await c.query('DELETE FROM payroll');
  await c.query('DELETE FROM hr_documents');
  await c.query('DELETE FROM email_logs');
  await c.query("UPDATE document_counters SET next_number = 1 WHERE prefix IN ('EMP', 'HR', 'APT', 'INT', 'INC', 'PS')");

  const [emps] = await c.query('SELECT COUNT(*) as cnt FROM employees');
  const [docs] = await c.query('SELECT COUNT(*) as cnt FROM hr_documents');
  console.log('Final Employee Count:', emps[0].cnt, '| Final Document Count:', docs[0].cnt);
  await c.end();
}

run().catch(console.error);
