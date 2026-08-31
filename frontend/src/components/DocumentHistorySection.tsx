import React, { useState, useMemo } from 'react';
import { StoredDocument, DocumentType } from '../types';
import { 
  Search, 
  Calendar, 
  Filter, 
  Plus, 
  Eye, 
  Edit3, 
  Download, 
  Mail, 
  MoreVertical, 
  Printer, 
  Copy, 
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { apiUrl } from '../api/client';

interface Props {
  documents: StoredDocument[];
  onRefresh: () => void;
  onViewDocument: (doc: StoredDocument) => void;
  onEditDocument: (doc: StoredDocument) => void;
  onDuplicateDocument: (doc: StoredDocument) => void;
  onDeleteDocument: (docId: number) => Promise<void>;
  onPrintDocument: (docId: number) => void;
  onEmailDocument: (doc: StoredDocument) => void;
  onOpenNewEntry: () => void;
}

export const DocumentHistorySection: React.FC<Props> = ({
  documents,
  onRefresh,
  onViewDocument,
  onEditDocument,
  onDuplicateDocument,
  onDeleteDocument,
  onPrintDocument,
  onEmailDocument,
  onOpenNewEntry,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [dateRange, setDateRange] = useState('01/01/2026 - 31/12/2026');
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered documents
  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || (
        (doc.full_name && doc.full_name.toLowerCase().includes(term)) ||
        (doc.email && doc.email.toLowerCase().includes(term)) ||
        (doc.document_number && doc.document_number.toLowerCase().includes(term)) ||
        (doc.employee_id && doc.employee_id.toLowerCase().includes(term))
      );

      const matchesType = selectedType === 'ALL' || doc.document_type === selectedType;
      const matchesStatus = selectedStatus === 'ALL' || (doc.status || 'Created') === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [documents, searchTerm, selectedType, selectedStatus]);

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedDocs = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status?: string) => {
    const s = status || 'Created';
    switch (s) {
      case 'PDF Generated':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            PDF Generated
          </span>
        );
      case 'Sent':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Sent
          </span>
        );
      case 'Accepted':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            Accepted
          </span>
        );
      case 'Draft':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            Draft
          </span>
        );
      case 'Created':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-[#EA580C] border border-orange-200">
            Created
          </span>
        );
    }
  };

  const getEmailStatusBadge = (doc: StoredDocument) => {
    if (doc.email_status === 'SENT') {
      return (
        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>SENT</span>
        </span>
      );
    }
    return (
      <span className="text-slate-400 font-medium text-[11px]">
        NOT SENT
      </span>
    );
  };

  const formatDocTypeLabel = (type: string) => {
    switch (type) {
      case 'offer_letter':
      case 'autorevive_offer':
        return 'Offer Letter';
      case 'internship_letter':
      case 'autorevive_internship':
        return 'Letter of Internship';
      case 'internship_cum_placement':
        return 'Internship-Cum-Placement';
      case 'appointment_letter':
      case 'autorevive_appointment':
        return 'Appointment Letter';
      case 'internship_completion_certificate':
        return 'Internship Completion';
      case 'appreciation_certificate':
        return 'Appreciation Certificate';
      case 'relieving_letter':
        return 'Relieving Letter';
      case 'stipend_certificate':
        return 'Stipend Certificate';
      case 'employment_certificate':
        return 'Employment Certificate';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs select-none no-print">
      {/* Top Title & Filters Bar */}
      <div className="space-y-3 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900">
            Document History
          </h2>

          <div className="flex items-center gap-2">
            {documents.length > 0 && (
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm('WARNING: Are you sure you want to delete all document history records and reset document counters?')) return;
                  try {
                    const res = await fetch(apiUrl('/documents/actions/clear-all'), { method: 'DELETE' });
                    const d = await res.json();
                    if (d.success) onRefresh();
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}

            {/* Right: + New Document Button */}
            <button
              type="button"
              onClick={onOpenNewEntry}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Document</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 pt-1">
          {/* Dropdown 1: All Documents */}
          <div className="lg:col-span-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#EA580C]"
            >
              <option value="ALL">All Documents</option>
              <option value="offer_letter">Offer Letter</option>
              <option value="internship_letter">Letter of Internship</option>
              <option value="internship_cum_placement">Internship-Cum-Placement</option>
              <option value="appointment_letter">Appointment Letter</option>
              <option value="internship_completion_certificate">Internship Completion</option>
              <option value="appreciation_certificate">Appreciation Certificate</option>
              <option value="relieving_letter">Relieving Letter</option>
              <option value="stipend_certificate">Stipend Certificate</option>
              <option value="employment_certificate">Employment Certificate</option>
            </select>
          </div>

          {/* Dropdown 2: All Status */}
          <div className="lg:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#EA580C]"
            >
              <option value="ALL">All Status</option>
              <option value="Created">Created</option>
              <option value="PDF Generated">PDF Generated</option>
              <option value="Sent">Sent</option>
              <option value="Accepted">Accepted</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {/* Date Range Input */}
          <div className="lg:col-span-3 relative">
            <input
              type="text"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              placeholder="01/01/2026 - 31/12/2026"
              className="w-full px-3 py-1.5 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#EA580C]"
            />
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Search Box */}
          <div className="lg:col-span-4 relative flex items-center gap-1.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, ref no. or email..."
                className="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#EA580C]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            <button
              type="button"
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-100 rounded-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 font-bold text-[11px] border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Employee Name</th>
              <th className="px-4 py-3">Document Type</th>
              <th className="px-4 py-3">Reference No.</th>
              <th className="px-4 py-3">Created Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Email Status</th>
              <th className="px-4 py-3">Sent To</th>
              <th className="px-4 py-3">Sent Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedDocs.map((doc) => {
              const isMenuOpen = openActionMenuId === doc.id;
              return (
                <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Employee Name */}
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {doc.full_name || 'Mr. Narendhar Dhandapani'}
                  </td>

                  {/* Document Type */}
                  <td className="px-4 py-3 text-slate-700 font-medium">
                    {formatDocTypeLabel(doc.document_type)}
                  </td>

                  {/* Reference No */}
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900 text-[11.5px]">
                    {doc.document_number}
                  </td>

                  {/* Created Date */}
                  <td className="px-4 py-3 text-slate-600 text-[11px] whitespace-nowrap">
                    {doc.issue_date || (doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-GB') : '—')}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {getStatusBadge(doc.status)}
                  </td>

                  {/* Email Status */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getEmailStatusBadge(doc)}
                  </td>

                  {/* Sent To */}
                  <td className="px-4 py-3 text-slate-600 text-[11px]">
                    {doc.email || '—'}
                  </td>

                  {/* Sent Date */}
                  <td className="px-4 py-3 text-slate-500 text-[11px] whitespace-nowrap">
                    {doc.email_sent_at ? new Date(doc.email_sent_at).toLocaleDateString('en-GB') : '—'}
                  </td>

                  {/* Actions Icons + 3-dots popup */}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="relative inline-flex items-center gap-1.5">
                      {/* View */}
                      <button
                        type="button"
                        onClick={() => onViewDocument(doc)}
                        className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="View Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => onEditDocument(doc)}
                        className="p-1 rounded text-slate-500 hover:text-[#EA580C] hover:bg-orange-50 transition-colors cursor-pointer"
                        title="Edit Document"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Download */}
                      <a
                        href={`/api/documents/${doc.id}/download`}
                        className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors inline-flex items-center"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>

                      {/* Email */}
                      <button
                        type="button"
                        onClick={() => onEmailDocument(doc)}
                        className="p-1 rounded text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                        title="Email Document"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>

                      {/* 3-dots Menu Button */}
                      <button
                        type="button"
                        onClick={() => setOpenActionMenuId(isMenuOpen ? null : doc.id)}
                        className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="More Actions"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {/* Dropdown Menu (View, Edit, Download, Print, Email, Duplicate, Delete) */}
                      {isMenuOpen && (
                        <div className="absolute right-0 top-7 z-30 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-left text-xs font-medium text-slate-700 animate-in fade-in">
                          <button
                            type="button"
                            onClick={() => {
                              onViewDocument(doc);
                              setOpenActionMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-slate-400" />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onEditDocument(doc);
                              setOpenActionMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3 text-slate-400" />
                            <span>Edit</span>
                          </button>
                          <a
                            href={`/api/documents/${doc.id}/download`}
                            onClick={() => setOpenActionMenuId(null)}
                            className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Download className="w-3 h-3 text-slate-400" />
                            <span>Download</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              onPrintDocument(doc.id);
                              setOpenActionMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                          >
                            <Printer className="w-3 h-3 text-slate-400" />
                            <span>Print</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onEmailDocument(doc);
                              setOpenActionMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                          >
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>Email</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onDuplicateDocument(doc);
                              setOpenActionMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                          >
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>Duplicate</span>
                          </button>
                          <div className="border-t border-slate-100 my-1"></div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm('Delete this document record?')) {
                                await onDeleteDocument(doc.id);
                              }
                              setOpenActionMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {paginatedDocs.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-400 italic">
                  No documents found matching the filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Pagination Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs text-slate-500">
        <div>
          Showing {filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
          {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries
        </div>

        {/* Pagination Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            if (totalPages > 5 && Math.abs(pageNum - currentPage) > 2 && pageNum !== 1 && pageNum !== totalPages) {
              return null;
            }
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 rounded text-xs font-bold transition-colors cursor-pointer ${
                  currentPage === pageNum
                    ? 'bg-[#EA580C] text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
