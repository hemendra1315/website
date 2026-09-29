import React, { useState } from 'react';
import { X, Globe, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { ImportPreviewResult } from '@client-finder/shared';

interface AddSourceUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddSourceUrlModal: React.FC<AddSourceUrlModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Cricket Academy');
  const [city, setCity] = useState('Chennai');
  const [isLoading, setIsLoading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);

  if (!isOpen) return null;

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setError(null);
    setIsLoading(true);

    try {
      const res = await api.ingestPublicUrl(url.trim(), category, city);
      setPreview(res.preview);
    } catch (err: any) {
      setError(err.message || 'Failed to inspect public URL.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!preview || preview.validRows.length === 0) return;
    setIsCommitting(true);
    setError(null);

    try {
      const leadsToImport = preview.validRows.map(r => ({
        ...r.data,
        source_url: url,
        source_type: 'PUBLIC_URL' as const,
      }));
      await api.commitImport(leadsToImport);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import leads.');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-150">
      <div className="bg-[#0f141c] border border-slate-800 rounded-xl w-full max-w-lg flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Add Permitted Public Source URL</h2>
              <p className="text-xs text-slate-400">Safely inspect structured business data from a specific page</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-950/50 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {!preview ? (
            <form onSubmit={handleIngest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Public Web Page URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/business-directory-page"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-[#0a0d12] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Only explicitly user-supplied URLs are fetched. Prohibited scrapers and Google APIs are disabled.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Default Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Default City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !url.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  <span>Inspect Public URL</span>
                </button>
              </div>
            </form>
          ) : (
            /* Results View */
            <div className="space-y-4">
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Found {preview.validCount} Business Leads</span>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl divide-y divide-slate-800 bg-slate-900/40">
                {preview.validRows.map((r, i) => (
                  <div key={i} className="p-2.5 text-xs">
                    <span className="font-semibold text-white">{r.data.name}</span>
                    <p className="text-slate-400 text-[11px]">{r.data.phone || 'No phone'} · {r.data.email || 'No email'}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ← Retry with another URL
                </button>
                <button
                  type="button"
                  onClick={handleCommit}
                  disabled={isCommitting || preview.validCount === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition"
                >
                  {isCommitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  <span>Save Leads ({preview.validCount})</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
