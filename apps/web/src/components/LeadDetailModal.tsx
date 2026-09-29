import React, { useState, useEffect } from 'react';
import {
  X,
  Globe,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ShieldAlert,
  Send,
  RefreshCw,
  Clock,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  Lock,
  Smartphone,
  Edit2,
  Trash2,
} from 'lucide-react';
import { LeadWithRelations, api } from '../api/client';
import { ScoreBadge } from './ScoreBadge';
import { StatusBadge } from './StatusBadge';
import { LeadStatus, MessageChannel, Message } from '@client-finder/shared';
import { ContactActionModal } from './ContactActionModal';
import { MessageEditModal } from './MessageEditModal';

interface LeadDetailModalProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: () => void;
  onDeleteLead?: (id: string) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  leadId,
  isOpen,
  onClose,
  onLeadUpdated,
  onDeleteLead,
}) => {
  const [lead, setLead] = useState<LeadWithRelations | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contact Action state
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<MessageChannel>('WHATSAPP');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // Message Edit state
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  const fetchLeadDetails = async () => {
    if (!leadId) return;
    setError(null);
    try {
      const data = await api.getLeadById(leadId);
      setLead(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load lead details');
    }
  };

  useEffect(() => {
    if (isOpen && leadId) {
      fetchLeadDetails();
    }
  }, [isOpen, leadId]);

  if (!isOpen || !leadId) return null;

  const handleRunAudit = async () => {
    if (!lead) return;
    setIsAuditing(true);
    setError(null);
    try {
      await api.runWebsiteAudit(lead.id);
      await fetchLeadDetails();
      onLeadUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to run website audit');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleGenerateMessages = async () => {
    if (!lead) return;
    setIsGenerating(true);
    setError(null);
    try {
      await api.generateMessages(lead.id);
      await fetchLeadDetails();
      onLeadUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to generate messages');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!lead) return;
    try {
      await api.updateLead(lead.id, { status: newStatus });
      await fetchLeadDetails();
      onLeadUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleToggleDoNotContact = async () => {
    if (!lead) return;
    try {
      await api.updateLead(lead.id, { do_not_contact: !lead.do_not_contact });
      await fetchLeadDetails();
      onLeadUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update Do Not Contact flag');
    }
  };

  const handleInitiateContact = (channel: MessageChannel, message: Message) => {
    if (lead?.do_not_contact) {
      alert('Cannot initiate contact: Lead is marked Do Not Contact.');
      return;
    }
    setSelectedChannel(channel);
    setSelectedMessage(message);
    setContactModalOpen(true);
  };

  const statusOptions: LeadStatus[] = [
    'NEW',
    'REVIEW',
    'QUALIFIED',
    'APPROVED',
    'CONTACT_OPENED',
    'REPLIED',
    'INTERESTED',
    'CONVERTED',
    'REJECTED',
    'CLOSED',
  ];

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75 animate-in fade-in duration-150">
        <div className="bg-[#0f141c] border border-slate-800 rounded-xl w-full max-w-4xl flex flex-col max-h-[92vh] overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">{lead?.name || 'Loading Lead...'}</h2>
                  {lead?.is_demo && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      DEMO
                    </span>
                  )}
                  {lead?.do_not_contact && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> DO NOT CONTACT
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {lead?.category} · {lead?.city}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ScoreBadge score={lead?.opportunity?.score} size="lg" />
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {error && (
              <div className="p-3.5 bg-rose-950/50 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Action Bar & Status Management */}
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400">Outreach Status:</span>
                <select
                  value={lead?.status || 'NEW'}
                  onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                  className="bg-[#0a0d12] border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-300 focus:outline-none focus:border-emerald-500"
                >
                  {statusOptions.map((st) => (
                    <option key={st} value={st}>
                      {st.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleDoNotContact}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 ${
                    lead?.do_not_contact
                      ? 'bg-rose-950/60 text-rose-300 border-rose-700 hover:bg-rose-900/60'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-rose-400 hover:border-rose-700/50'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{lead?.do_not_contact ? 'Unmark Do Not Contact' : 'Mark Do Not Contact'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRunAudit}
                  disabled={isAuditing}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>{isAuditing ? 'Auditing...' : 'Run Website Audit'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateMessages}
                  disabled={isGenerating || lead?.do_not_contact}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGenerating ? 'Generating...' : 'Generate Messages'}</span>
                </button>
              </div>
            </div>

            {/* Grid 1: Business Profile & Website Audit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Business Information Card */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
                  <span>Business Information</span>
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                    <span className="text-slate-300">{lead?.address || `${lead?.city || 'Chennai'}, India`}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    {lead?.public_phone ? (
                      <span className="font-mono text-slate-200">{lead.public_phone}</span>
                    ) : (
                      <span className="text-slate-500 italic">No public phone verified</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    {lead?.public_email ? (
                      <span className="font-mono text-slate-200">{lead.public_email}</span>
                    ) : (
                      <span className="text-slate-500 italic">No public email verified</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    {lead?.website ? (
                      <a
                        href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:underline flex items-center gap-1 truncate max-w-[280px]"
                      >
                        <span>{lead.website}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-rose-400 font-medium">No Website Found</span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Source: {lead?.source_type}</span>
                    <span>Added: {lead ? new Date(lead.created_at).toLocaleDateString() : ''}</span>
                  </div>
                </div>
              </div>

              {/* Website Audit Card */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <span>Website Audit Analysis</span>
                  </h3>
                  <StatusBadge status={lead?.audit?.website_status || 'UNVERIFIED'} type="website" />
                </div>

                {lead?.audit ? (
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Lock className="w-3 h-3" /> HTTPS
                        </span>
                        <span className={lead.audit.https_enabled ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                          {lead.audit.https_enabled === null ? 'N/A' : lead.audit.https_enabled ? 'Secure' : 'Missing'}
                        </span>
                      </div>

                      <div className="p-2 rounded bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Smartphone className="w-3 h-3" /> Mobile
                        </span>
                        <span className={lead.audit.mobile_ready ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                          {lead.audit.mobile_ready === null ? 'N/A' : lead.audit.mobile_ready ? 'Ready' : 'Not Optimized'}
                        </span>
                      </div>
                    </div>

                    {lead.audit.title && (
                      <div>
                        <span className="text-[11px] text-slate-500 block">Page Title:</span>
                        <p className="text-slate-300 font-medium line-clamp-1">{lead.audit.title}</p>
                      </div>
                    )}

                    {lead.audit.observations && (
                      <div>
                        <span className="text-[11px] text-slate-500 block">Observations:</span>
                        <p className="text-slate-400 text-[11px] leading-relaxed bg-slate-950/40 p-2 rounded border border-slate-800">
                          {lead.audit.observations}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No website audit completed yet. Click "Run Website Audit" above.
                  </div>
                )}
              </div>
            </div>

            {/* Opportunity Reasons Card */}
            {lead?.opportunity && (
              <div className="bg-emerald-950/15 border border-emerald-500/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Deterministic Opportunity Breakdown ({lead.opportunity.score}/100)</span>
                  </h3>
                </div>

                <div className="space-y-1.5">
                  {lead.opportunity.reasons && lead.opportunity.reasons.length > 0 ? (
                    lead.opportunity.reasons.map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                        <span className="text-emerald-400 font-bold mt-0.5">•</span>
                        <span>{reason}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">Score evaluated based on general business profile.</p>
                  )}
                </div>
              </div>
            )}

            {/* Outreach Messages Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Personalized Outreach Messages</span>
                </h3>
              </div>

              {lead?.messages && lead.messages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {lead.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs font-bold text-emerald-300">{msg.channel}</span>
                          <StatusBadge status={msg.status} type="message" />
                        </div>
                        {msg.subject && (
                          <p className="text-[11px] font-semibold text-slate-300 mb-1">
                            Subject: {msg.subject}
                          </p>
                        )}
                        <p className="text-xs text-slate-300 whitespace-pre-wrap font-sans line-clamp-6 leading-relaxed bg-[#090d12] p-2.5 rounded-lg border border-slate-800/80">
                          {msg.content}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setEditingMessage(msg)}
                          className="text-[11px] font-semibold text-slate-400 hover:text-white flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleInitiateContact(msg.channel, msg)}
                          disabled={lead.do_not_contact}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition disabled:opacity-40"
                        >
                          <Send className="w-3 h-3" />
                          <span>Contact</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-6 text-center space-y-2">
                  <p className="text-xs text-slate-400">No tailored messages generated yet for this lead.</p>
                  <button
                    type="button"
                    onClick={handleGenerateMessages}
                    disabled={isGenerating || lead?.do_not_contact}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-lg transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Personalized Pitch</span>
                  </button>
                </div>
              )}
            </div>

            {/* Activity History Log */}
            {lead?.activity && lead.activity.length > 0 && (
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Activity Timeline</span>
                </h3>
                <div className="space-y-2 divide-y divide-slate-800/60 max-h-40 overflow-y-auto pr-1">
                  {lead.activity.map((act, i) => (
                    <div key={i} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                      <span className="font-mono text-emerald-400/90 font-medium">
                        {act.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(act.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between">
            {onDeleteLead && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete lead "${lead?.name}"?`)) {
                    onDeleteLead(lead!.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Lead</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="ml-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Nested Contact Action Modal */}
      <ContactActionModal
        isOpen={contactModalOpen}
        business={lead}
        message={selectedMessage}
        channel={selectedChannel}
        onClose={() => setContactModalOpen(false)}
        onSuccess={() => {
          fetchLeadDetails();
          onLeadUpdated();
        }}
      />

      {/* Nested Message Edit Modal */}
      <MessageEditModal
        isOpen={Boolean(editingMessage)}
        message={editingMessage ? { ...editingMessage, business: lead } : null}
        onClose={() => setEditingMessage(null)}
        onSuccess={() => {
          fetchLeadDetails();
          onLeadUpdated();
        }}
      />
    </>
  );
};
