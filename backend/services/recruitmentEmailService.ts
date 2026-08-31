import nodemailer from 'nodemailer';

export interface CandidateEmailData {
  full_name: string;
  email: string;
  application_id: string;
  candidate_id?: string;
  job_title: string;
}

export interface InterviewEmailData {
  round: string;
  date: string;
  time: string;
  mode?: string;
  meeting_link?: string;
  interviewer?: string;
  notes?: string;
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.MAIL_SERVER || 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT || 587),
    secure: false,
    auth: {
      user: process.env.MAIL_USERNAME || 'hr@autorevives.com',
      pass: process.env.MAIL_PASSWORD || 'cjrk paso ysae bbbm',
    },
  });
}

const mailFrom = `"AutoRevive Careers" <${process.env.MAIL_FROM || 'hr@autorevives.com'}>`;

const headerHtml = `
  <div style="background-color: #0f172a; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; font-family: Arial, sans-serif;">
      AUTO<span style="color: #ea580c;">REVIVE</span>
    </h1>
    <p style="color: #94a3b8; margin: 4px 0 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-family: Arial, sans-serif;">
      Unlock. Bid. Drive.
    </p>
  </div>
`;

const footerHtml = `
  <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; border-radius: 0 0 12px 12px; font-family: Arial, sans-serif;">
    <p style="margin: 0; font-size: 12px; font-weight: bold; color: #334155;">Talent Acquisition & Human Resources</p>
    <p style="margin: 3px 0 0; font-size: 11px; color: #64748b;">
      AutoRevive Technologies Private Limited • Uthangarai, Krishnagiri – 635207, Tamil Nadu
    </p>
    <p style="margin: 6px 0 0; font-size: 10px; color: #94a3b8;">
      This is an automated recruitment communication. Please do not reply directly to this email.
    </p>
  </div>
`;

/**
 * 1. Application Received Email
 */
export async function sendApplicationReceivedEmail(candidate: CandidateEmailData): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: mailFrom,
      to: candidate.email,
      subject: `Application Received – ${candidate.application_id} – ${candidate.job_title} | AutoRevive`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-family: Arial, sans-serif; color: #1e293b;">
          ${headerHtml}
          <div style="padding: 28px 24px; line-height: 1.6;">
            <h2 style="color: #0f172a; margin-top: 0; font-size: 18px;">Application Successfully Received</h2>
            <p>Dear <strong>${candidate.full_name}</strong>,</p>
            <p>Thank you for your interest in joining <strong>AutoRevive</strong>. We have successfully registered your application for the position of <strong>${candidate.job_title}</strong>.</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #ea580c; border-radius: 6px; padding: 14px 18px; margin: 20px 0;">
              <p style="margin: 3px 0; font-size: 12.5px;"><strong>Official Application ID:</strong> <span style="font-family: monospace; color: #ea580c; font-weight: bold;">${candidate.application_id}</span></p>
              ${candidate.candidate_id ? `<p style="margin: 3px 0; font-size: 12.5px;"><strong>Candidate ID:</strong> <span style="font-family: monospace; color: #334155; font-weight: bold;">${candidate.candidate_id}</span></p>` : ''}
              <p style="margin: 3px 0; font-size: 12.5px;"><strong>Target Role:</strong> ${candidate.job_title}</p>
              <p style="margin: 3px 0; font-size: 12.5px;"><strong>Status:</strong> Under Technical Screening</p>
            </div>

            <p>Our talent acquisition panel is currently evaluating candidate profiles against technical benchmarks. If your skills match our requirements, our recruiter will reach out with interview details.</p>
            <p style="margin-bottom: 0;">We wish you the very best in the selection process!</p>
          </div>
          ${footerHtml}
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('Error sending Application Received email:', err);
    return false;
  }
}

/**
 * 2. Candidate Shortlisted Email
 */
export async function sendShortlistedEmail(candidate: CandidateEmailData, notes?: string): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: mailFrom,
      to: candidate.email,
      subject: `Congratulations! Profile Shortlisted – ${candidate.job_title} | AutoRevive`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-family: Arial, sans-serif; color: #1e293b;">
          ${headerHtml}
          <div style="padding: 28px 24px; line-height: 1.6;">
            <div style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 20px; padding: 4px 14px; margin-bottom: 16px;">
              <span style="color: #059669; font-weight: bold; font-size: 12px;">✓ STATUS: SHORTLISTED</span>
            </div>
            
            <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Congratulations, ${candidate.full_name}!</h2>
            <p>We are delighted to inform you that your profile has been <strong>shortlisted</strong> for the position of <strong>${candidate.job_title}</strong> at AutoRevive.</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #059669; border-radius: 6px; padding: 14px 18px; margin: 20px 0;">
              <p style="margin: 3px 0; font-size: 12.5px;"><strong>Candidate Name:</strong> ${candidate.full_name}</p>
              <p style="margin: 3px 0; font-size: 12.5px;"><strong>Application Reference:</strong> <span style="font-family: monospace; color: #ea580c; font-weight: bold;">${candidate.application_id}</span></p>
              <p style="margin: 3px 0; font-size: 12.5px;"><strong>Position:</strong> ${candidate.job_title}</p>
              <p style="margin: 3px 0; font-size: 12.5px;"><strong>Recruitment Stage:</strong> Technical & Interview Round</p>
            </div>

            ${notes ? `
            <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; padding: 12px 16px; margin: 16px 0;">
              <p style="margin: 0; font-size: 12px; color: #92400e;"><strong>Recruiter Note:</strong> ${notes}</p>
            </div>
            ` : ''}

            <p>Our HR team is currently coordinating the interviewer panel. You will receive an official interview invitation containing the scheduled date, time, and meeting link shortly.</p>
            <p>Please keep your updated resume and technical project portfolios ready.</p>
          </div>
          ${footerHtml}
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('Error sending Shortlisted email:', err);
    return false;
  }
}

/**
 * 3. Interview Scheduled Email
 */
export async function sendInterviewScheduledEmail(
  candidate: CandidateEmailData,
  interview: InterviewEmailData
): Promise<boolean> {
  try {
    const transporter = createTransporter();
    const meetLink = interview.meeting_link || 'https://meet.google.com/xyz-auto-revive';

    await transporter.sendMail({
      from: mailFrom,
      to: candidate.email,
      subject: `Interview Invitation: ${interview.round} – ${candidate.job_title} | AutoRevive`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-family: Arial, sans-serif; color: #1e293b;">
          ${headerHtml}
          <div style="padding: 28px 24px; line-height: 1.6;">
            <div style="display: inline-block; background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 20px; padding: 4px 14px; margin-bottom: 16px;">
              <span style="color: #7e22ce; font-weight: bold; font-size: 12px;">📅 INTERVIEW SCHEDULED</span>
            </div>

            <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Interview Invitation – AutoRevive</h2>
            <p>Dear <strong>${candidate.full_name}</strong>,</p>
            <p>You are cordially invited to attend the <strong>${interview.round}</strong> for the role of <strong>${candidate.job_title}</strong>.</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #7e22ce; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 5px 0; color: #64748b; width: 130px;"><strong>Interview Round:</strong></td>
                  <td style="padding: 5px 0; color: #0f172a; font-weight: bold;">${interview.round}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b;"><strong>Date:</strong></td>
                  <td style="padding: 5px 0; color: #0f172a; font-weight: bold;">${interview.date}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b;"><strong>Time:</strong></td>
                  <td style="padding: 5px 0; color: #0f172a; font-weight: bold;">${interview.time} (IST)</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b;"><strong>Mode:</strong></td>
                  <td style="padding: 5px 0; color: #0f172a;">${interview.mode || 'Online Video Conference'}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b;"><strong>Interviewer:</strong></td>
                  <td style="padding: 5px 0; color: #0f172a;">${interview.interviewer || 'Jemsina Banu (HR) & Technical Lead'}</td>
                </tr>
              </table>

              <div style="margin-top: 18px; text-align: center;">
                <a href="${meetLink}" target="_blank" style="display: inline-block; background-color: #ea580c; color: #ffffff; padding: 12px 28px; text-decoration: none; font-size: 13px; font-weight: bold; border-radius: 8px; letter-spacing: 0.5px;">
                  Join Google Meet Interview
                </a>
                <p style="margin: 8px 0 0; font-size: 11px; color: #64748b; word-break: break-all;">
                  Meeting Link: <a href="${meetLink}" style="color: #ea580c;">${meetLink}</a>
                </p>
              </div>
            </div>

            ${interview.notes ? `
            <div style="background-color: #f1f5f9; border-radius: 6px; padding: 12px 16px; margin: 16px 0; font-size: 12px;">
              <strong style="color: #334155;">Instructions:</strong>
              <p style="margin: 4px 0 0; color: #475569;">${interview.notes}</p>
            </div>
            ` : ''}

            <p style="font-size: 12px; color: #64748b;">
              Please ensure you join 5 minutes prior to the scheduled time from a quiet place with a stable internet connection. If you require rescheduling due to unavoidable circumstances, kindly reply with at least 24 hours' notice.
            </p>
          </div>
          ${footerHtml}
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('Error sending Interview Scheduled email:', err);
    return false;
  }
}

/**
 * 4. Offer Letter Generated Email
 */
export async function sendOfferLetterEmail(
  candidate: CandidateEmailData,
  offerToken: string,
  salaryText?: string
): Promise<boolean> {
  try {
    const transporter = createTransporter();
    const portalBase = process.env.VITE_APP_URL || 'http://localhost:3000';
    const acceptanceUrl = `${portalBase}/offer/accept/${offerToken}`;

    await transporter.sendMail({
      from: mailFrom,
      to: candidate.email,
      subject: `Official Employment Offer Letter – ${candidate.job_title} | AutoRevive`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-family: Arial, sans-serif; color: #1e293b;">
          ${headerHtml}
          <div style="padding: 28px 24px; line-height: 1.6;">
            <div style="display: inline-block; background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 20px; padding: 4px 14px; margin-bottom: 16px;">
              <span style="color: #ea580c; font-weight: bold; font-size: 12px;">★ EMPLOYMENT OFFER ISSUED</span>
            </div>

            <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Congratulations, ${candidate.full_name}!</h2>
            <p>Following your successful performance in technical and HR interview rounds, the leadership team at <strong>AutoRevive</strong> is delighted to extend you an official offer of employment for the role of <strong>${candidate.job_title}</strong>.</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #ea580c; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 5px 0; color: #64748b; width: 140px;"><strong>Designation:</strong></td>
                  <td style="padding: 5px 0; color: #0f172a; font-weight: bold;">${candidate.job_title}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b;"><strong>Application Ref:</strong></td>
                  <td style="padding: 5px 0; color: #ea580c; font-family: monospace; font-weight: bold;">${candidate.application_id}</td>
                </tr>
                ${salaryText ? `
                <tr>
                  <td style="padding: 5px 0; color: #64748b;"><strong>Compensation (CTC):</strong></td>
                  <td style="padding: 5px 0; color: #0f172a; font-weight: bold;">${salaryText}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 5px 0; color: #64748b;"><strong>Work Location:</strong></td>
                  <td style="padding: 5px 0; color: #0f172a;">Uthangarai, Krishnagiri (AutoRevive HQ)</td>
                </tr>
              </table>

              <div style="margin-top: 20px; text-align: center;">
                <a href="${acceptanceUrl}" target="_blank" style="display: inline-block; background-color: #ea580c; color: #ffffff; padding: 12px 30px; text-decoration: none; font-size: 13px; font-weight: bold; border-radius: 8px; letter-spacing: 0.5px;">
                  Review &amp; Accept Offer Letter Online
                </a>
                <p style="margin: 8px 0 0; font-size: 11px; color: #64748b;">
                  Link: <a href="${acceptanceUrl}" style="color: #ea580c;">${acceptanceUrl}</a>
                </p>
              </div>
            </div>

            <p style="font-size: 12px; color: #64748b;">
              Please review the detailed terms and conditions, compensation breakdown, and joining formalities by clicking the button above. We look forward to welcoming you to team AutoRevive!
            </p>
          </div>
          ${footerHtml}
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('Error sending Offer Letter email:', err);
    return false;
  }
}

/**
 * 5. Rejection Email
 */
export async function sendRejectionEmail(candidate: CandidateEmailData): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: mailFrom,
      to: candidate.email,
      subject: `Update regarding your application for ${candidate.job_title} | AutoRevive`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-family: Arial, sans-serif; color: #1e293b;">
          ${headerHtml}
          <div style="padding: 28px 24px; line-height: 1.6;">
            <h2 style="color: #0f172a; margin-top: 0; font-size: 18px;">Application Status Update</h2>
            <p>Dear <strong>${candidate.full_name}</strong>,</p>
            <p>Thank you for taking the time to apply for the position of <strong>${candidate.job_title}</strong> at AutoRevive.</p>
            <p>After careful consideration and review of candidate qualifications against our present organizational requirements, we regret to inform you that we will not be moving forward with your application for this specific opening.</p>
            <p>We truly appreciated your interest in AutoRevive and will keep your profile in our talent pool for future opportunities that align with your background and expertise.</p>
            <p>We wish you all the best in your professional journey.</p>
          </div>
          ${footerHtml}
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('Error sending Rejection email:', err);
    return false;
  }
}
