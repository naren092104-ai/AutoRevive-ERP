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

  // Fetch an application that has an offer_token
  const [apps] = await conn.query('SELECT id, application_id, offer_token FROM job_applications LIMIT 1');
  if (apps.length === 0) {
    console.log('No apps found');
    await conn.end();
    return;
  }

  const app = apps[0];
  console.log('Testing with app:', app.application_id, 'Token:', app.offer_token);

  // Generate tiny dummy base64 files
  const sampleBase64Pdf = 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4 sample pdf document').toString('base64');
  const sampleBase64Png = 'data:image/png;base64,' + Buffer.from('dummy image png').toString('base64');

  // Submit offer acceptance with complete KYC and experience documents
  const res = await fetch(`http://localhost:4000/api/offers/accept/${app.offer_token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'ACCEPT',
      confirmedJoiningDate: '01/12/2026',
      panNumber: 'ABCDE9999Z',
      aadhaarNumber: '9999 8888 7777',
      bankName: 'HDFC Bank',
      accountNumber: '5010099887766',
      ifscCode: 'HDFC0009999',
      panDoc: { name: 'PAN_Card.png', base64: sampleBase64Png },
      aadhaarDoc: { name: 'Aadhaar_Card.pdf', base64: sampleBase64Pdf },
      passbookDoc: { name: 'Bank_Passbook.pdf', base64: sampleBase64Pdf },
      experienceLetterDoc: { name: 'Relieving_Certificate.pdf', base64: sampleBase64Pdf },
      previousPayslipsDoc: { name: 'Last_3_Months_Payslips.pdf', base64: sampleBase64Pdf },
    })
  });

  const data = await res.json();
  console.log('Accept Response:', data.success, data.message);

  // Fetch documents for this application
  const docRes = await fetch(`http://localhost:4000/api/recruitment/applications/${app.id}/documents`);
  const docData = await docRes.json();
  console.log('Documents recorded:', docData.documents.map(d => ({ type: d.document_type, file: d.file_name })));

  // Test preview endpoint
  if (docData.documents.length > 0) {
    const testDoc = docData.documents[0];
    const prevRes = await fetch(`http://localhost:4000/api/recruitment/documents/${testDoc.id}/preview`);
    console.log('Preview test for doc ID', testDoc.id, 'status:', prevRes.status, 'content-type:', prevRes.headers.get('content-type'));
  }

  await conn.end();
}

test().catch(console.error);
