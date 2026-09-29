import React, { useState, useEffect } from 'react';
import { Search, Upload, Globe, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { AppSettings } from '@client-finder/shared';

interface FindLeadsPageProps {
  onSearchSubmit: (params: { city: string; category: string; limit: number; minScore: number }) => void;
  onOpenImportCsv: () => void;
  onOpenAddSource: () => void;
}

export const FindLeadsPage: React.FC<FindLeadsPageProps> = ({
  onSearchSubmit,
  onOpenImportCsv,
  onOpenAddSource,
}) => {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState(30);
  const [minScore, setMinScore] = useState(50);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    api.getSettings().then((s) => {
      setSettings(s);
      if (!city) setCity(s.default_city || 'Chennai');
      if (!category && s.default_categories && s.default_categories.length > 0) {
        setCategory(s.default_categories[0]);
      }
      if (s.min_opportunity_score) {
        setMinScore(s.min_opportunity_score);
      }
    }).catch(console.error);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit({
      city: city.trim(),
      category: category.trim(),
      limit,
      minScore,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-150">
      <div className="text-center space-y-2 py-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Configurable Opportunity Discovery</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Find Target Business Opportunities</h2>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          Filter your database leads by region, business category, and deterministic opportunity score threshold, or import new public lead sources.
        </p>
      </div>

      {/* Discovery Form Card */}
      <div className="bg-[#0f141c] border border-slate-800 rounded-xl p-6 space-y-6">
        <form onSubmit={handleSearch} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                City / Location
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Chennai, Bangalore, Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Business Category
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cricket Academy, Fitness Studio"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0a0d12] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Lead Limit: <span className="font-mono text-emerald-400 font-bold">{limit}</span>
              </label>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Minimum Opportunity Score: <span className="font-mono text-emerald-400 font-bold">{minScore}/100</span>
              </label>
              <input
                type="range"
                min={0}
                max={90}
                step={5}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenImportCsv}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>IMPORT CSV</span>
              </button>

              <button
                type="button"
                onClick={onOpenAddSource}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
              >
                <Globe className="w-3.5 h-3.5 text-teal-400" />
                <span>ADD SOURCE</span>
              </button>
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition"
            >
              <Search className="w-4 h-4" />
              <span>FIND LEADS</span>
            </button>
          </div>
        </form>
      </div>

      {/* Preset Suggestions */}
      {settings?.default_categories && settings.default_categories.length > 0 && (
        <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Quick Preset Categories:
          </p>
          <div className="flex flex-wrap gap-2">
            {settings.default_categories.map((cat, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                  category === cat
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
