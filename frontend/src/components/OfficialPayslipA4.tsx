import React from 'react';
import { AutoReviveLogo } from './AutoReviveLogo';

export interface PayslipRecord {
  id?: number;
  payroll_id?: number;
  employee_id?: string;
  employee_name?: string;
  department?: string;
  designation?: string;
  role?: string;
  gender?: string;
  bank_name?: string;
  account_number?: string;
  pan_number?: string;
  aadhaar_number?: string;
  ifsc_code?: string;
  joining_date?: string;
  pay_period?: string; // e.g. "2026-07"
  month_name?: string; // e.g. "JULY 2026"
  payslip_reference?: string;
  paid_days?: number;
  lop_days?: number;
  gross_salary?: number;
  total_earnings?: number;
  total_deductions?: number;
  net_pay?: number;
  net_pay_in_words?: string;
  email_status?: string;
  status?: string;
}

interface Props {
  data?: PayslipRecord;
  payslip?: PayslipRecord;
}

export const OfficialPayslipA4: React.FC<Props> = ({ data, payslip }) => {
  const p = payslip || data || {
    employee_id: 'AR-EMP-2026-0001',
    employee_name: 'Employee',
    designation: 'Staff',
    pay_period: '2026-07',
    payslip_reference: 'AR/PS/2026-07/000001',
    net_pay: 41500,
  };

  const gross = Number(p.total_earnings || p.gross_salary || 41500);
  const basic = Math.round(gross * 0.5);
  const hra = Math.round(gross * 0.25);
  const special = gross - basic - hra;
  const deductions = Number(p.total_deductions || 0);
  const netPay = Number(p.net_pay || (gross - deductions));

  const maskAcc = (acc?: string) => {
    if (!acc) return '5010 06** **** 2166';
    const clean = acc.replace(/\s+/g, '');
    if (clean.length <= 6) return clean;
    return `${clean.slice(0, 4)} 06** **** ${clean.slice(-4)}`;
  };

  return (
    <div className="bg-white text-slate-900 font-sans border border-slate-300 shadow-sm p-6 sm:p-8 rounded-lg max-w-[850px] mx-auto text-xs select-none">
      {/* 1. Header Section */}
      <div className="flex items-start justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <AutoReviveLogo size="sm" showSubText={true} />
        </div>

        <div className="text-center flex-1 px-4">
          <h1 className="text-base sm:text-lg font-bold text-[#EA580C] tracking-wide">
            AUTO REVIVE
          </h1>
          <p className="text-[10px] font-bold text-slate-700 tracking-wider">
            UNLOCK. BID. DRIVE.
          </p>
          <p className="text-[9.5px] text-slate-500 mt-0.5 max-w-sm mx-auto leading-tight">
            No. 999, Kuppusamy Naidu Street, Uthangarai, Krishnagiri – 635207, Tamil Nadu, India.
          </p>
          <p className="text-[9.5px] text-slate-500">
            Email: <span className="font-semibold text-slate-700">hr@autorevives.com</span> | Phone: <span className="font-semibold text-slate-700">+91 94426 93306</span>
          </p>
        </div>

        {/* Top Right Reference Box */}
        <div className="border border-slate-300 bg-slate-50 rounded p-2 text-center min-w-[150px]">
          <p className="text-[10px] font-bold text-slate-600">Payslip Reference</p>
          <p className="font-mono text-xs font-bold text-[#EA580C] mt-0.5">
            {p.payslip_reference || 'AR/PS/2026-07/000001'}
          </p>
        </div>
      </div>

      {/* 2. Title Banner */}
      <div className="py-2.5 text-center border-b border-slate-200">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">
          PAYSLIP FOR THE MONTH OF {p.month_name || 'JULY 2026'}
        </h2>
      </div>

      {/* 3. Employee & Bank Information Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 border border-slate-300 rounded divide-y sm:divide-y-0 sm:divide-x divide-slate-300 my-4 bg-slate-50/50">
        {/* Left Column */}
        <div className="p-3 space-y-1 text-[11px]">
          <div className="flex">
            <span className="w-32 font-bold text-slate-600">Employee ID</span>
            <span className="font-mono font-bold text-slate-900">: {p.employee_id || 'AR-EMP-2026-0001'}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-bold text-slate-600">Employee Name</span>
            <span className="font-bold text-slate-900">: {p.employee_name || 'Narendhar D'}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-bold text-slate-600">Designation</span>
            <span className="text-slate-800">: {p.designation || p.role || 'Full Stack React & Node Developer'}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-bold text-slate-600">Gender</span>
            <span className="text-slate-800">: {p.gender || 'Male'}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-bold text-slate-600">PAN Card</span>
            <span className="font-mono font-bold text-slate-900">: {p.pan_number || 'ABCDE1234F'}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-bold text-slate-600">Aadhaar Card</span>
            <span className="font-mono font-bold text-slate-900">: {p.aadhaar_number || 'XXXX XXXX 8901'}</span>
          </div>
        </div>

        {/* Right Column */}
        <div className="p-3 space-y-1 text-[11px]">
          <div className="flex">
            <span className="w-32 font-bold text-slate-600">Bank Name</span>
            <span className="text-slate-800">: {p.bank_name || 'HDFC Bank'}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-bold text-slate-600">A/C #</span>
            <span className="font-mono font-bold text-slate-900">: {maskAcc(p.account_number)}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-bold text-slate-600">IFSC Code</span>
            <span className="font-mono font-bold text-slate-800">: {p.ifsc_code || 'HDFC0001234'}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-bold text-slate-600">Date of Joining</span>
            <span className="text-slate-800">: {p.joining_date || '03/11/2026'}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-bold text-slate-600">Paid / LOP Days</span>
            <span className="text-slate-800">: {p.paid_days || 31} Days | LOP: {p.lop_days || 0}</span>
          </div>
        </div>
      </div>

      {/* 4. Earnings & Deductions Tables */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Earnings Table */}
        <div className="border border-slate-300 rounded overflow-hidden">
          <div className="bg-[#EA580C] text-white px-3 py-1.5 flex justify-between font-bold text-[11px]">
            <span>EARNINGS</span>
            <span>Amount (₹)</span>
          </div>
          <table className="w-full text-[10.5px]">
            <tbody className="divide-y divide-slate-200">
              <tr className="bg-white"><td className="px-3 py-1 text-slate-700">Basic</td><td className="px-3 py-1 text-right font-mono font-semibold">{basic.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
              <tr className="bg-slate-50/70"><td className="px-3 py-1 text-slate-700">HRA</td><td className="px-3 py-1 text-right font-mono font-semibold">{hra.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
              <tr className="bg-white"><td className="px-3 py-1 text-slate-700">Special Allowance</td><td className="px-3 py-1 text-right font-mono font-semibold">{special.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
              <tr className="bg-slate-50/70"><td className="px-3 py-1 text-slate-700">Other Earnings</td><td className="px-3 py-1 text-right font-mono text-slate-500">0.00</td></tr>
              <tr className="bg-white"><td className="px-3 py-1 text-slate-700">Incentives</td><td className="px-3 py-1 text-right font-mono text-slate-500">0.00</td></tr>
              <tr className="bg-slate-50/70"><td className="px-3 py-1 text-slate-700">Bonus</td><td className="px-3 py-1 text-right font-mono text-slate-500">0.00</td></tr>
              <tr className="bg-white"><td className="px-3 py-1 text-slate-700">Over Time Pay</td><td className="px-3 py-1 text-right font-mono text-slate-500">0.00</td></tr>
            </tbody>
            <tfoot>
              <tr className="bg-[#EA580C] text-white font-bold text-[11px]">
                <td className="px-3 py-1.5">TOTAL EARNINGS</td>
                <td className="px-3 py-1.5 text-right font-mono">₹ {gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Deductions Table */}
        <div className="border border-slate-300 rounded overflow-hidden">
          <div className="bg-[#b45309] text-white px-3 py-1.5 flex justify-between font-bold text-[11px]">
            <span>DEDUCTIONS</span>
            <span>Amount (₹)</span>
          </div>
          <table className="w-full text-[10.5px]">
            <tbody className="divide-y divide-slate-200">
              <tr className="bg-white"><td className="px-3 py-1 text-slate-700">Provident Fund</td><td className="px-3 py-1 text-right font-mono text-slate-500">0.00</td></tr>
              <tr className="bg-slate-50/70"><td className="px-3 py-1 text-slate-700">ESI</td><td className="px-3 py-1 text-right font-mono text-slate-500">0.00</td></tr>
              <tr className="bg-white"><td className="px-3 py-1 text-slate-700">Professional Tax</td><td className="px-3 py-1 text-right font-mono text-slate-500">0.00</td></tr>
              <tr className="bg-slate-50/70"><td className="px-3 py-1 text-slate-700">Salary Advance</td><td className="px-3 py-1 text-right font-mono text-slate-500">0.00</td></tr>
              <tr className="bg-white"><td className="px-3 py-1 text-slate-700">TDS</td><td className="px-3 py-1 text-right font-mono text-slate-500">0.00</td></tr>
              <tr className="bg-slate-50/70"><td className="px-3 py-1 text-slate-700">Unpaid Leave</td><td className="px-3 py-1 text-right font-mono text-slate-500">0.00</td></tr>
              <tr className="bg-white"><td className="px-3 py-1 text-slate-700">Other Deduction</td><td className="px-3 py-1 text-right font-mono text-slate-500">{deductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
            </tbody>
            <tfoot>
              <tr className="bg-[#b45309] text-white font-bold text-[11px]">
                <td className="px-3 py-1.5">TOTAL DEDUCTIONS</td>
                <td className="px-3 py-1.5 text-right font-mono">₹ {deductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 5. NET PAY BANNER */}
      <div className="bg-slate-900 text-white rounded px-4 py-2 flex items-center justify-between font-bold text-xs sm:text-sm shadow-xs">
        <span className="tracking-wider">NET PAY</span>
        <span className="font-mono text-sm sm:text-base text-orange-400">
          INR {netPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Net Pay in Words */}
      <div className="mt-2.5 px-1 flex items-baseline gap-2 text-[11px]">
        <span className="font-bold text-slate-800">Net Pay in Words :</span>
        <span className="italic text-slate-600 font-medium">
          {p.net_pay_in_words || 'Forty One Thousand Five Hundred Rupees Only'}
        </span>
      </div>

      {/* 6. Footer */}
      <div className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[9.5px] text-slate-400">
        <span>Generated on : 01/08/2026 10:30 AM</span>
        <span>This is a system generated payslip and does not require signature.</span>
      </div>
    </div>
  );
};
export default OfficialPayslipA4;
