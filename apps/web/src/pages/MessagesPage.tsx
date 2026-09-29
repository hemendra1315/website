import React, { useState, useEffect } from 'react';
import {
  MessageSquareText,
  Check,
  Edit2,
  Send,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Message, Business, MessageChannel, MessageStatus } from '@client-finder/shared';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { MessageEditModal } from '../components/MessageEditModal';
import { ContactActionModal } from '../components/ContactActionModal';

export const MessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<(Message & { business: Business })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<MessageStatus | ''>('');
  const [channelFilter, setChannelFilter] = useState<MessageChannel | ''>('');

  // Editing state
  const [editingMessage, setEditingMessage] = useState<(Message & { business?: Business }) | null>(null);

  // Contact Action state
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [activeContactMsg, setActiveContactMsg] = useState<{ message: Message; business: Business } | null>(null);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAllMessages(statusFilter || undefined, channelFilter || undefined);
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [statusFilter, channelFilter]);

  const handleApprove = async (msgId: string) => {
    try {
      await api.updateMessage(msgId, { status: 'APPROVED' });
      fetchMessages();
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    }
  };

  const handleSkip = async (msgId: string) => {
    try {
      await api.updateMessage(msgId, { status: 'SKIPPED' });
      fetchMessages();
    } catch (err: any) {
      alert(`Skip error: ${err.message}`);
    }
  };

  const handleRegenerate = async (businessId: string) => {
    try {
      await api.generateMessages(businessId);
      fetchMessages();
    } catch (err: any) {
      alert(`Regeneration error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Outreach Messages Review Queue</span>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {messages.length} messages
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Review, edit, and approve personalized drafts before manually contacting businesses
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#0f141c] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="APPROVED">Approved</option>
            <option value="SKIPPED">Skipped</option>
          </select>

          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as any)}
            className="bg-[#0f141c] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Channels</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="EMAIL">Email</option>
            <option value="GENERIC_DM">Generic DM</option>
          </select>

          <button
            onClick={fetchMessages}
            className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      {messages.length === 0 ? (
        <div className="bg-[#0f141c] border border-slate-800 rounded-xl p-12 text-center space-y-3">
          <div className="p-3 bg-slate-800/80 rounded-full w-fit mx-auto text-slate-400">
            <MessageSquareText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">No messages found in queue</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Generate tailored pitches from the Leads directory to review and approve them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-[#0f141c] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Message Header */}
                <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                      <span>{msg.business.name}</span>
                      {msg.business.is_demo && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300">
                          DEMO
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {msg.business.category} · {msg.business.city}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-300 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                      {msg.channel}
                    </span>
                    <StatusBadge status={msg.status} type="message" />
                  </div>
                </div>

                {/* Email Subject if applicable */}
                {msg.channel === 'EMAIL' && msg.subject && (
                  <div className="p-2 bg-[#090d12] border border-slate-800 rounded-lg text-xs font-mono text-emerald-300">
                    <span className="text-slate-500 font-sans mr-2">Subject:</span>
                    {msg.subject}
                  </div>
                )}

                {/* Message Body */}
                <div className="bg-[#090d12] border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {msg.content}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingMessage(msg)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>EDIT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRegenerate(msg.business_id)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>REGENERATE</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {msg.status !== 'SKIPPED' && (
                    <button
                      type="button"
                      onClick={() => handleSkip(msg.id)}
                      className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs font-semibold"
                    >
                      SKIP
                    </button>
                  )}

                  {msg.status !== 'APPROVED' ? (
                    <button
                      type="button"
                      onClick={() => handleApprove(msg.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>APPROVE</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveContactMsg({ message: msg, business: msg.business });
                        setContactModalOpen(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>CONTACT</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <MessageEditModal
        isOpen={Boolean(editingMessage)}
        message={editingMessage}
        onClose={() => setEditingMessage(null)}
        onSuccess={fetchMessages}
      />

      {/* Contact Action Modal */}
      {activeContactMsg && (
        <ContactActionModal
          isOpen={contactModalOpen}
          business={activeContactMsg.business}
          message={activeContactMsg.message}
          channel={activeContactMsg.message.channel}
          onClose={() => {
            setContactModalOpen(false);
            setActiveContactMsg(null);
          }}
          onSuccess={fetchMessages}
        />
      )}
    </div>
  );
};
