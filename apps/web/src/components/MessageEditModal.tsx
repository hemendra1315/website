import React, { useState, useEffect } from 'react';
import { X, Check, Save, Loader2, AlertCircle } from 'lucide-react';
import { Message, MessageStatus } from '@client-finder/shared';
import { api } from '../api/client';

interface MessageEditModalProps {
  isOpen: boolean;
  message: (Message & { business?: any }) | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const MessageEditModal: React.FC<MessageEditModalProps> = ({
  isOpen,
  message,
  onClose,
  onSuccess,
}) => {
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [status, setStatus] = useState<MessageStatus>('DRAFT');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (message) {
      setContent(message.content || '');
      setSubject(message.subject || '');
      setStatus(message.status || 'DRAFT');
    }
  }, [message]);

  if (!isOpen || !message) return null;

  const handleSave = async (newStatus?: MessageStatus) => {
    setError(null);
    setIsLoading(true);
    try {
      await api.updateMessage(message.id, {
        content: content.trim(),
        subject: message.channel === 'EMAIL' ? subject.trim() : undefined,
        status: newStatus || status,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update message.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-in fade-in duration-150">
      <div className="bg-[#0f141c] border border-slate-800 rounded-xl w-full max-w-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Edit {message.channel} Message</span>
              {message.business && (
                <span className="text-xs font-normal text-emerald-400">· {message.business.name}</span>
              )}
            </h2>
            <p className="text-xs text-slate-400">Personalize and review the outreach message before approval</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {message.channel === 'EMAIL' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Subject Line</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#0a0d12] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Message Body</label>
            <textarea
              rows={9}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-[#0a0d12] border border-slate-800 rounded-xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Status:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MessageStatus)}
                className="bg-[#0a0d12] border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="APPROVED">Approved</option>
                <option value="SKIPPED">Skipped</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isLoading || !content.trim()}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Changes</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave('APPROVED')}
              disabled={isLoading || !content.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve Message</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
