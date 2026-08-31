import React, { useState, useMemo } from 'react';
import { StoredDocument, DocumentType } from '../types';
import { 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Mail, 
  Copy, 
  Trash2, 
  Eye, 
  Edit3, 
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Props {
  documents: StoredDocument[];
  onRefresh: () => void;
  onViewDocument: (doc: StoredDocument) => void;
  onEditDocument: (doc: StoredDocument) => void;
  onDuplicateDocument: (doc: StoredDocument) => void;
  onDeleteDocument: (docId: number) => Promise<void>;
  onPrintDocument: (docId: number) => void;
  onEmailDocument: (doc: StoredDocument) => void;
}

export const DocumentHistoryTable: React.FC<Props> = ({
  documents,
  onRefresh,
  onViewDocument,
  onEditDocument,
  onDuplicateDocument,
  onDeleteDocument,
  onPrintDocument,
  onEmailDocument,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedEmailStatus, setSelectedEmailStatus] = useState<string>('ALL');
  const [selectedDocStatus, setSelectedDocStatus] = useState<string>('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('ALL');
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);

  // Unique employees list for filter dropdown
  const uniqueEmployees = useMemo(() => {
    const map = new Map<string, string>();
    documents.forEach(d => {
      if (d.employee_id && d.full_name) {
        map.set(d.employee_id, `${d.full_name} (${d.employee_id})`);
      }
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [documents]);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || (
        (doc.full_name && doc.full_name.toLowerCase().includes(term)) ||
        (doc.email && doc.email.toLowerCase().includes(term)) ||
        (doc.document_number && doc.document_number.toLowerCase().includes(term)) ||
        (doc.employee_id && doc.employee_id.toLowerCase().includes(term))
      );

      const matchesType = selectedType === 'ALL' || doc.document_type === selectedType;
      const matchesEmailStatus = selectedEmailStatus === 'ALL' || doc.email_status === selectedEmailStatus;
      const matchesDocStatus = selectedDocStatus === 'ALL' || (doc.status || 'Created') === selectedDocStatus;
      const matchesEmp = selectedEmployee === 'ALL' || doc.employee_id === selectedEmployee;

      return matchesSearch && matchesType && matchesEmailStatus && matchesDocStatus && matchesEmp;
    });
  }, [documents, searchTerm, selectedType, selectedEmailStatus, selectedDocStatus, selectedEmployee]);

  const handleDelete = async (docId: number) => {
    if (window.confirm('Are you sure you want to delete this document record?')) {
      setIsDeletingId(docId);
      try {
        await onDeleteDocument(docId);
      } finally {
        setIsDeletingId(null);
      }
    }
  };

  const getStatusBadge = (status?: string) => {
    const s = status || 'Created';
    switch (s) {
      case 'Sent':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Sent</span>;
      case 'PDF Generated':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">PDF Generated</span>;
      case 'Draft':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">Draft</span>;
      case 'Accepted':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">Accepted</span>;
      case 'Rejected':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Rejected</span>;
      case 'Expired':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Expired</span>;
      case 'Created':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-[#EA580C] border border-orange-200">Created</span>;
    }
  };

  const getEmailStatusBadge = (doc: StoredDocument) => {
    if (doc.email_status === 'SENT') {
      return (
        <span 
          title={`Delivered to ${doc.email || 'employee'} at ${doc.email_sent_at || ''}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-help"
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>SENT</span>
        </span>
      );
    }
    if (doc.email_status === 'FAILED') {
      return (
        <span 
          title={doc.email_error || 'SMTP Delivery Failed'}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-red-50 text-red-700 border border-red-200 cursor-help"
        >
          <AlertCircle className="w-3 h-3 text-red-600" />
          <span>FAILED</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
        NOT SENT
      </span>
    );
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden no-print">
      {/* Table Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span className="text-[#EA580C]">AutoRevive Document History</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600 font-normal text-xs">Records &amp; Sent Audit Trail</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Persistent SQL database document ledger with SMTP delivery verification and action controls
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {filteredDocuments.length} of {documents.length} Document{documents.length === 1 ? '' : 's'}
            </span>
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-700 hover:text-[#EA580C] bg-white hover:bg-orange-50 border border-slate-300 hover:border-orange-300 rounded-md transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Employee Name, Email, Ref No..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#EA580C] focus:border-[#EA580C]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Document Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:border-[#EA580C] font-medium text-slate-700"
            >
              <option value="ALL">All Document Types</option>
              <option value="offer_letter">Offer Letter</option>
              <option value="internship_letter">Letter of Internship</option>
              <option value="internship_cum_placement">Internship Cum Placement</option>
              <option value="appointment_letter">Appointment Letter</option>
              <option value="internship_completion_certificate">Internship Completion Certificate</option>
              <option value="appreciation_certificate">Certificate of Appreciation</option>
              <option value="relieving_letter">Relieving Letter</option>
              <option value="stipend_certificate">Stipend Certificate</option>
              <option value="employment_certificate">Certificate of Employment</option>
            </select>
          </div>

          {/* Email Status Filter */}
          <div>
            <select
              value={selectedEmailStatus}
              onChange={(e) => setSelectedEmailStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:border-[#EA580C] font-medium text-slate-700"
            >
              <option value="ALL">All Email Statuses</option>
              <option value="SENT">SENT Only</option>
              <option value="NOT_SENT">NOT SENT Only</option>
              <option value="FAILED">FAILED Only</option>
            </select>
          </div>

          {/* Employee Filter */}
          <div>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:border-[#EA580C] font-medium text-slate-700 truncate"
            >
              <option value="ALL">All Employees</option>
              {uniqueEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[10.5px] border-b border-slate-200 font-bold">
            <tr>
              <th className="px-4 py-3">Employee Name</th>
              <th className="px-4 py-3">Document Type</th>
              <th className="px-4 py-3">Reference Number</th>
              <th className="px-4 py-3">Created Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Email Status</th>
              <th className="px-4 py-3">Last Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDocuments.map((doc) => {
              const formattedType = doc.document_type
                .replace(/^(autorevive_)/, '')
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase());

              return (
                <tr key={doc.id} className="text-slate-700 hover:bg-slate-50/80 transition-colors">
                  {/* Employee Name */}
                  <td className="px-4 py-2.5">
                    <div className="font-bold text-slate-900">{doc.full_name || 'Employee'}</div>
                    <div className="text-[10.5px] text-slate-500 font-medium">{doc.email || doc.employee_id}</div>
                  </td>

                  {/* Document Type */}
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {formattedType}
                  </td>

                  {/* Reference Number */}
                  <td className="px-4 py-2.5 font-mono font-bold text-slate-900">
                    {doc.document_number}
                  </td>

                  {/* Created Date */}
                  <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                    {doc.issue_date || (doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-GB') : '—')}
                  </td>

                  {/* Document Status */}
                  <td className="px-4 py-2.5">
                    {getStatusBadge(doc.status)}
                  </td>

                  {/* Email Status Badge */}
                  <td className="px-4 py-2.5">
                    {getEmailStatusBadge(doc)}
                  </td>

                  {/* Last Updated */}
                  <td className="px-4 py-2.5 text-slate-500 text-[10.5px] whitespace-nowrap">
                    {doc.updated_at ? new Date(doc.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (' + new Date(doc.updated_at).toLocaleDateString('en-GB') + ')' : '—'}
                  </td>

                  {/* Row Action Buttons */}
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      <button
                        onClick={() => onViewDocument(doc)}
                        className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
                        title="View Live Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEditDocument(doc)}
                        className="p-1 rounded text-[#EA580C] hover:bg-orange-100 transition-colors cursor-pointer"
                        title="Edit Document"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={`/api/documents/${doc.id}/download`}
                        className="p-1 rounded text-slate-600 hover:text-[#EA580C] hover:bg-slate-200 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => onPrintDocument(doc.id)}
                        className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
                        title="Print Document"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEmailDocument(doc)}
                        className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="Email Document to Candidate"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDuplicateDocument(doc)}
                        className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Duplicate Document"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        disabled={isDeletingId === doc.id}
                        className="p-1 rounded text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-40"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredDocuments.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400 italic">
                  {documents.length === 0
                    ? 'No documents stored yet. Click "Generate PDF" or "+ New Entry" above to persist a document in SQL.'
                    : 'No documents match the current search or filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
