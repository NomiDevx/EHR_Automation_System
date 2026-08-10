'use client';

import { useState } from 'react';
import { 
  ContactSubmissionItem, 
  getContactSubmissions,
  updateContactStatus, 
  deleteContactSubmission 
} from '@/app/actions';
import { 
  Mail, 
  Search, 
  Filter, 
  CheckCircle, 
  MessageSquare, 
  Clock, 
  Trash2, 
  Eye, 
  Send, 
  X,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContactMessagesClientProps {
  initialSubmissions: ContactSubmissionItem[];
}

export function ContactMessagesClient({ initialSubmissions }: ContactMessagesClientProps) {
  const [submissions, setSubmissions] = useState<ContactSubmissionItem[]>(initialSubmissions);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read' | 'replied'>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactSubmissionItem | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const unreadCount = submissions.filter((s) => s.status === 'unread').length;
  const readCount = submissions.filter((s) => s.status === 'read').length;
  const repliedCount = submissions.filter((s) => s.status === 'replied').length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await getContactSubmissions();
      if (res.success && res.submissions) {
        setSubmissions(res.submissions);
      }
    } catch (err) {
      console.error('Failed to refresh messages:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter & Search logic
  const filteredSubmissions = submissions.filter((item) => {
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.subject.toLowerCase().includes(q) ||
      item.message.toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  const handleStatusChange = async (id: string, newStatus: 'unread' | 'read' | 'replied') => {
    setIsUpdating(true);
    setSubmissions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    if (selectedMessage && selectedMessage.id === id) {
      setSelectedMessage((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    await updateContactStatus(id, newStatus);
    setIsUpdating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact submission?')) return;

    setSubmissions((prev) => prev.filter((item) => item.id !== id));
    if (selectedMessage && selectedMessage.id === id) {
      setSelectedMessage(null);
    }
    await deleteContactSubmission(id);
  };

  const handleOpenMessage = (msg: ContactSubmissionItem) => {
    setSelectedMessage(msg);
    if (msg.status === 'unread') {
      handleStatusChange(msg.id, 'read');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2A55] font-cambria flex items-center gap-2">
            <Mail className="w-6 h-6 text-[#0891B2]" /> Contact Form Inquiries
          </h1>
          <p className="text-xs text-[#475569] mt-1">
            Review and respond to messages submitted by visitors and patients via the Contact Us page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-bold text-[#0B2A55] transition-all shadow-sm disabled:opacity-60"
            title="Refresh Messages"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-[#0891B2]', isRefreshing && 'animate-spin')} />
            <span>Refresh</span>
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0891B2]/10 border border-[#0891B2]/20 text-[#0891B2] text-xs font-bold">
            <MessageSquare className="w-3.5 h-3.5" /> Total: {submissions.length}
          </span>
          {unreadCount > 0 && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs font-bold animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" /> {unreadCount} Unread
            </span>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Unread Inquiries</p>
            <p className="text-2xl font-extrabold text-amber-600 font-cambria mt-1">{unreadCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Reviewed / Read</p>
            <p className="text-2xl font-extrabold text-[#0891B2] font-cambria mt-1">{readCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0891B2]/10 text-[#0891B2] flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Responded</p>
            <p className="text-2xl font-extrabold text-emerald-600 font-cambria mt-1">{repliedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Controls Bar: Search & Status Filters */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by sender, email, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0891B2] bg-[#F8FAFC]"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['all', 'unread', 'read', 'replied'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all shrink-0',
                filterStatus === status
                  ? 'bg-[#0B2A55] text-white shadow-sm'
                  : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0B2A55]'
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F1F5F9] text-[#94A3B8] flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-[#0B2A55]">No messages found</p>
            <p className="text-xs text-[#64748B]">Try clearing your search query or switching filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Sender</th>
                  <th className="py-3.5 px-4">Subject &amp; Message Snippet</th>
                  <th className="py-3.5 px-4">Submitted At</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredSubmissions.map((msg) => {
                  const isUnread = msg.status === 'unread';
                  return (
                    <tr
                      key={msg.id}
                      onClick={() => handleOpenMessage(msg)}
                      className={cn(
                        'cursor-pointer hover:bg-[#F8FAFC] transition-colors',
                        isUnread && 'bg-amber-500/5 font-semibold'
                      )}
                    >
                      <td className="py-3.5 px-4">
                        {msg.status === 'unread' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold">
                            Unread
                          </span>
                        )}
                        {msg.status === 'read' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800 text-[11px] font-bold">
                            Read
                          </span>
                        )}
                        {msg.status === 'replied' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                            Replied
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0B2A55]">{msg.name}</div>
                        <div className="text-[11px] text-[#64748B]">{msg.email}</div>
                      </td>
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-bold text-[#0B2A55] truncate">{msg.subject}</div>
                        <div className="text-[#64748B] truncate text-[11px]">{msg.message}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#64748B]">
                        {new Date(msg.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenMessage(msg)}
                            className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#0891B2]/10 hover:text-[#0891B2] transition-colors text-[#64748B]"
                            title="View Full Message"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`mailto:${msg.email}?subject=RE: ${encodeURIComponent(msg.subject)}`}
                            onClick={() => handleStatusChange(msg.id, 'replied')}
                            className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-emerald-50 hover:text-emerald-600 transition-colors text-[#64748B]"
                            title="Reply via Email"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-red-50 hover:text-red-600 transition-colors text-[#64748B]"
                            title="Delete Message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Message Modal Detail Drawer */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] pb-4">
              <div>
                <span className="text-xs font-bold text-[#0891B2] uppercase tracking-wider">Contact Submission Details</span>
                <h3 className="text-lg font-bold text-[#0B2A55] font-cambria mt-0.5">{selectedMessage.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-2 rounded-full text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0B2A55] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sender Info */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#64748B] block font-medium">Sender Name:</span>
                <span className="font-bold text-[#0B2A55] text-sm">{selectedMessage.name}</span>
              </div>
              <div>
                <span className="text-[#64748B] block font-medium">Email Address:</span>
                <a href={`mailto:${selectedMessage.email}`} className="font-bold text-[#0891B2] hover:underline">
                  {selectedMessage.email}
                </a>
              </div>
              <div>
                <span className="text-[#64748B] block font-medium">Submission Time:</span>
                <span className="font-semibold text-[#0B2A55]">
                  {new Date(selectedMessage.created_at).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block font-medium">Current Status:</span>
                <span className="font-bold capitalize text-[#0891B2]">{selectedMessage.status}</span>
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Message Content</span>
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-xs text-[#0B2A55] leading-relaxed whitespace-pre-wrap font-normal">
                {selectedMessage.message}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleStatusChange(selectedMessage.id, 'unread')}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors',
                    selectedMessage.status === 'unread'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'
                  )}
                >
                  Mark Unread
                </button>
                <button
                  onClick={() => handleStatusChange(selectedMessage.id, 'read')}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors',
                    selectedMessage.status === 'read'
                      ? 'bg-[#0891B2] text-white border-[#0891B2]'
                      : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'
                  )}
                >
                  Mark Read
                </button>
                <button
                  onClick={() => handleStatusChange(selectedMessage.id, 'replied')}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors',
                    selectedMessage.status === 'replied'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'
                  )}
                >
                  Mark Replied
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <a
                  href={`mailto:${selectedMessage.email}?subject=RE: ${encodeURIComponent(selectedMessage.subject)}`}
                  onClick={() => handleStatusChange(selectedMessage.id, 'replied')}
                  className="px-4 py-2 rounded-xl bg-[#0B2A55] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#0891B2] transition-colors shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" /> Reply Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
