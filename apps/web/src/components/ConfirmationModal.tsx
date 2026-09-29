import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  requiredInputText?: string;
  isDestructive?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  requiredInputText,
  isDestructive = false,
  onClose,
  onConfirm,
}) => {
  const [typedInput, setTypedInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (requiredInputText && typedInput !== requiredInputText) return;
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = isLoading || (requiredInputText ? typedInput !== requiredInputText : false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-in fade-in duration-150">
      <div className="bg-[#0f141c] border border-slate-800 rounded-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${isDestructive ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>{message}</p>

          {requiredInputText && (
            <div className="pt-2">
              <label className="block font-semibold text-slate-400 mb-1.5">
                Type <span className="font-mono text-rose-400 font-bold">{requiredInputText}</span> to confirm:
              </label>
              <input
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                className="w-full bg-[#0a0d12] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-rose-500"
                placeholder={requiredInputText}
              />
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isButtonDisabled}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition disabled:opacity-50 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
            }`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
