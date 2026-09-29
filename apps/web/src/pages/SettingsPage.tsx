import React, { useState, useEffect } from 'react';
import {
  Save,
  Download,
  Trash2,
  Database,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Info,
} from 'lucide-react';
import { api } from '../api/client';
import { AppSettings } from '@client-finder/shared';
import { ConfirmationModal } from '../components/ConfirmationModal';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    id: 'default',
    user_name: 'Hemu',
    business_name: 'Hemu Web Studio',
    service_description: 'modern, fast websites for local businesses',
    default_city: 'Chennai',
    default_categories: ['Cricket Academy', 'Fitness Studio', 'Restaurant'],
    default_message_tone: 'friendly',
    min_opportunity_score: 50,
    updated_at: new Date().toISOString(),
  });

  const [categoryInput, setCategoryInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear DB modal state
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then((s) => {
        setSettings(s);
        setCategoryInput(s.default_categories ? s.default_categories.join(', ') : '');
      })
      .catch((err) => setError(err.message));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const parsedCategories = categoryInput
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      const updated = await api.updateSettings({
        ...settings,
        default_categories: parsedCategories,
      });

      setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearDatabase = async () => {
    try {
      await api.clearDatabase('CLEAR_ALL_DATA');
      alert('Database cleared successfully.');
    } catch (err: any) {
      alert(`Clear failed: ${err.message}`);
    }
  };

  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    try {
      const res = await api.seedDemoData();
      alert(`Successfully seeded ${res.importedCount} demo leads.`);
    } catch (err: any) {
      alert(`Seed failed: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Settings & Data Management</h2>
        <p className="text-xs text-slate-400">
          Configure your outreach persona, defaults, export datasets, and manage local data retention
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-950/60 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Business Persona Form */}
      <div className="bg-[#0f141c] border border-slate-800 rounded-xl p-6 space-y-5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Agency Profile & Pitch Defaults</span>
        </h3>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Your Name / Outreach Sender
              </label>
              <input
                type="text"
                required
                value={settings.user_name}
                onChange={(e) => setSettings({ ...settings, user_name: e.target.value })}
                className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Your Agency / Business Name
              </label>
              <input
                type="text"
                required
                value={settings.business_name}
                onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Service Description / Offering
            </label>
            <input
              type="text"
              required
              value={settings.service_description}
              onChange={(e) => setSettings({ ...settings, service_description: e.target.value })}
              placeholder="e.g. modern, fast websites for local businesses"
              className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Used inside generated outreach messages to concisely introduce your service without false hype.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Default City
              </label>
              <input
                type="text"
                required
                value={settings.default_city}
                onChange={(e) => setSettings({ ...settings, default_city: e.target.value })}
                className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Default Message Tone
              </label>
              <select
                value={settings.default_message_tone}
                onChange={(e) => setSettings({ ...settings, default_message_tone: e.target.value as any })}
                className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="friendly">Friendly & Conversational</option>
                <option value="professional">Direct & Professional</option>
                <option value="direct">Brief & Concise</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Min Opportunity Threshold
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={settings.min_opportunity_score}
                onChange={(e) => setSettings({ ...settings, min_opportunity_score: Number(e.target.value) })}
                className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Default Target Categories (Comma-separated)
            </label>
            <input
              type="text"
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              placeholder="Cricket Academy, Fitness Studio, Restaurant, Dance Studio"
              className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>

      {/* Data Retention & Privacy Section */}
      <div className="bg-[#0f141c] border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Local Data Retention & Privacy Architecture</span>
        </h3>

        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Where your data is stored:</p>
              <p className="text-slate-400">
                All business records, website audits, scoring evaluations, and message logs are saved strictly in your local SQLite database file at <code className="font-mono text-emerald-300 bg-slate-950 px-1.5 py-0.5 rounded">./data/client_finder.sqlite</code>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Privacy & Ethics:</p>
              <p className="text-slate-400">
                No telemetry or third-party lead tracking exists. No automated unsolicited sending is permitted. All outreach is manually initiated by you.
              </p>
            </div>
          </div>
        </div>

        {/* Database Export & Reset Tools */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Export CSV */}
          <a
            href={api.getExportUrl()}
            download="client-finder-leads.csv"
            className="flex items-center justify-center gap-2 p-3.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Database to CSV</span>
          </a>

          {/* Seed Demo Leads */}
          <button
            type="button"
            onClick={handleSeedDemoData}
            disabled={isSeeding}
            className="flex items-center justify-center gap-2 p-3.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <Database className="w-4 h-4 text-amber-400" />
            <span>{isSeeding ? 'Seeding...' : 'Seed Synthetic Demo Leads'}</span>
          </button>

          {/* Clear Database */}
          <button
            type="button"
            onClick={() => setClearModalOpen(true)}
            className="flex items-center justify-center gap-2 p-3.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-semibold transition"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Clear Local Database</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Clearing Database */}
      <ConfirmationModal
        isOpen={clearModalOpen}
        title="Clear Entire Database"
        message="This action will permanently delete all stored businesses, website audits, opportunities, generated messages, outreach logs, and activity history from your local SQLite database."
        confirmText="Clear All Data"
        requiredInputText="CLEAR_ALL_DATA"
        isDestructive={true}
        onClose={() => setClearModalOpen(false)}
        onConfirm={handleClearDatabase}
      />
    </div>
  );
};
