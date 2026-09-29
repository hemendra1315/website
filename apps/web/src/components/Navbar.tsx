import React from 'react';
import { Upload, Link2, RefreshCw } from 'lucide-react';

interface NavbarProps {
  onOpenImportCsv: () => void;
  onOpenAddSource: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenImportCsv, onOpenAddSource, onRefresh, isRefreshing }) => {
  return (
    <header className="h-16 border-b border-[#1b2430] bg-[#0a0e13] px-6 flex items-center justify-between sticky top-0 z-30">
      <span className="inline-flex items-center gap-2 text-[11px] text-slate-500">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Local database
      </span>

      <div className="flex items-center gap-2">
        {onRefresh && (
          <button onClick={onRefresh} disabled={isRefreshing} className="cf-btn-ghost !px-2.5" title="Refresh data" aria-label="Refresh data">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        )}
        <button onClick={onOpenAddSource} className="cf-btn-ghost">
          <Link2 className="w-3.5 h-3.5" />
          <span>Add Source URL</span>
        </button>
        <button onClick={onOpenImportCsv} className="cf-btn-primary">
          <Upload className="w-3.5 h-3.5" />
          <span>Import CSV</span>
        </button>
      </div>
    </header>
  );
};
