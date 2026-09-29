import React, { useState } from 'react';
import { X, Send, AlertTriangle, ShieldCheck, Loader2, ExternalLink } from 'lucide-react';
import { Business, Message, MessageChannel } from '@client-finder/shared';
import { api } from '../api/client';

interface ContactActionModalProps {
  isOpen: boolean;
  business: Business | null;
  message: Message | null;
  channel: MessageChannel;
  onClose: () => void;
  onSuccess: () => void;
}

export const ContactActionModal: React.FC<ContactActionModalProps> = ({
  isOpen,
  business,
  message,
  channel,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !business || !message) return null;

  const isWhatsApp = channel === 'WHATSAPP';
  const isEmail = channel === 'EMAIL';

  const handleOpenContact = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.prepareContactAction(business.id, message.id, channel);
      
      if (business.is_demo) {
        alert('Demo Lead Protected: External communication link is disabled to prevent real messages during testing.');
      } else if (res.actionResult && res.actionResult.url) {
        window.open(res.actionResult.url, '_blank', 'noopener,noreferrer');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to trigger contact action.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-in fade-in duration-150">
      <div className="bg-[#0f141c] border border-slate-800 rounded-xl w-full max-w-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${isWhatsApp ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'}`}>
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Manual Contact Initiation</h2>
              <p className="text-xs text-slate-400">Review recipient and message before proceeding</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-950/50 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Business & Channel Info */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Target Business:</span>
              <span className="font-bold text-white">{business.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Channel:</span>
              <span className="font-mono text-emerald-300 font-semibold">{channel}</span>
            </div>
            {isWhatsApp && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Public Phone:</span>
                <span className="font-mono text-slate-200">{business.public_phone || 'N/A'}</span>
              </div>
            )}
            {isEmail && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Public Email:</span>
                <span className="font-mono text-slate-200">{business.public_email || 'N/A'}</span>
              </div>
            )}
          </div>

          {/* Message Content Preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Exact Prefilled Message:
            </label>
            {isEmail && message.subject && (
              <div className="mb-2 p-2 bg-[#090d12] border border-slate-800 rounded-lg text-xs font-mono text-emerald-300">
                <span className="text-slate-500 font-sans mr-2">Subject:</span>
                {message.subject}
              </div>
            )}
            <div className="bg-[#090d12] border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto font-sans leading-relaxed">
              {message.content}
            </div>
          </div>

          {/* Compliance & Safety Notice */}
          <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-200/90 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Anti-Spam Safety Guarantee</p>
              <p>
                Clicking the button below opens {isWhatsApp ? 'WhatsApp' : isEmail ? 'your email client' : 'the public link'} with this prefilled message.
                You must manually review and press Send. No automatic sending occurs.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleOpenContact}
            disabled={isLoading}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition ${
              isWhatsApp
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/20'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            <span>
              {isWhatsApp ? 'OPEN WHATSAPP' : isEmail ? 'OPEN EMAIL CLIENT' : 'OPEN PROFILE'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
