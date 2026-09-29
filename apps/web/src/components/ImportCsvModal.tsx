import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, Copy, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import { ImportPreviewResult } from '@client-finder/shared';

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportCsvModal: React.FC<ImportCsvModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [csvText, setCsvText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePreview = async () => {
    setError(null);
    setIsLoading(true);
    try {
      if (mode === 'file' && file) {
        const res = await api.previewCsv(file);
        setPreview(res);
      } else if (mode === 'text' && csvText.trim()) {
        const res = await api.previewCsv(csvText);
        setPreview(res);
      } else {
        setError('Please select a CSV file or paste CSV content.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to parse CSV');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!preview || preview.validRows.length === 0) return;
    setIsCommitting(true);
    setError(null);

    try {
      const leadsToImport = preview.validRows.map(r => r.data);
      await api.commitImport(leadsToImport);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import valid leads');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreview(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-150">
      <div className="bg-[#0f141c] border border-slate-800 rounded-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Import Business Leads CSV</h2>
              <p className="text-xs text-slate-400">Supported columns: name, category, city, address, phone, email, website, social_url</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 bg-rose-950/50 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {!preview ? (
            <div className="space-y-4">
              <div className="flex gap-2 border-b border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setMode('file')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    mode === 'file' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Upload File (.csv)
                </button>
                <button
                  type="button"
                  onClick={() => setMode('text')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    mode === 'text' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Paste Raw CSV
                </button>
              </div>

              {mode === 'file' ? (
                <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl p-8 text-center transition bg-slate-900/30">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    id="csv-file-input"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="csv-file-input" className="cursor-pointer flex flex-col items-center gap-2">
                    <div className="p-3 bg-slate-800 rounded-full text-emerald-400">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-semibold text-slate-200">
                      {file ? file.name : 'Click to select CSV file'}
                    </span>
                    <span className="text-xs text-slate-400">Comma-separated values with header row</span>
                  </label>
                </div>
              ) : (
                <div>
                  <textarea
                    rows={8}
                    placeholder="name,category,city,phone,email,website&#10;ABC Academy,Cricket Academy,Chennai,+91 9840123456,contact@abc.com,https://abc.local"
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    className="w-full bg-[#0a0d12] border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={isLoading || (mode === 'file' ? !file : !csvText.trim())}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-xs rounded-lg transition"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  <span>Generate Preview</span>
                </button>
              </div>
            </div>
          ) : (
            /* Preview Screen */
            <div className="space-y-5">
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Valid Rows</span>
                  </div>
                  <span className="text-xl font-bold font-mono text-emerald-200">{preview.validCount}</span>
                </div>

                <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
                    <Copy className="w-4 h-4" />
                    <span>Duplicates</span>
                  </div>
                  <span className="text-xl font-bold font-mono text-amber-200">{preview.duplicateCount}</span>
                </div>

                <div className="p-3.5 bg-rose-950/30 border border-rose-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mb-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Invalid Rows</span>
                  </div>
                  <span className="text-xl font-bold font-mono text-rose-200">{preview.invalidCount}</span>
                </div>
              </div>

              {/* Sample list */}
              <div>
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Rows Ready to Import:</h3>
                <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl divide-y divide-slate-800/80 bg-slate-900/40">
                  {preview.validRows.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">No valid rows found in this CSV.</div>
                  ) : (
                    preview.validRows.map((r, i) => (
                      <div key={i} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-white">{r.data.name}</span>
                          <span className="text-slate-400 ml-2">({r.data.category || 'General'} - {r.data.city || 'Chennai'})</span>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-400">Valid</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Invalid Rows Explanation */}
              {preview.invalidRows.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">Invalid Rows (Will be skipped):</h3>
                  <div className="max-h-32 overflow-y-auto border border-rose-900/40 bg-rose-950/20 rounded-xl divide-y divide-rose-900/30 p-2 space-y-1">
                    {preview.invalidRows.map((r, i) => (
                      <div key={i} className="text-xs text-rose-300">
                        Row #{r.rowNumber}: {r.errors.join('; ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Duplicate Rows Explanation */}
              {preview.duplicateRows.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Duplicate Rows (Will be skipped):</h3>
                  <div className="max-h-32 overflow-y-auto border border-amber-900/40 bg-amber-950/20 rounded-xl divide-y divide-amber-900/30 p-2 space-y-1">
                    {preview.duplicateRows.map((r, i) => (
                      <div key={i} className="text-xs text-amber-300">
                        Row #{r.rowNumber} ("{r.data.name}"): {r.duplicateReason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
                >
                  ← Back to Selection
                </button>

                <button
                  type="button"
                  onClick={handleCommit}
                  disabled={isCommitting || preview.validCount === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition"
                >
                  {isCommitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>IMPORT VALID LEADS ({preview.validCount})</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
