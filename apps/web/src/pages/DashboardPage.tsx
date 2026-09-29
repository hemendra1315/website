import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Database,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api/client';
import { DashboardStats } from '@client-finder/shared';
import { NavTab } from '../components/Sidebar';

interface DashboardPageProps {
  onNavigate: (tab: NavTab) => void;
  onOpenImportCsv?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      await api.seedDemoData();
      await fetchStats();
    } catch (err: any) {
      alert(`Seed failed: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const primary = [
    { label: 'Total leads', value: stats?.totalLeads ?? 0 },
    { label: 'Without website', value: stats?.leadsWithoutWebsites ?? 0 },
    { label: 'Qualified', value: stats?.qualifiedLeads ?? 0 },
    { label: 'Awaiting review', value: stats?.awaitingReview ?? 0 },
  ];
  const outreach = [
    { label: 'Messages approved', value: stats?.messagesApproved ?? 0 },
    { label: 'Contact opened', value: stats?.contactOpened ?? 0 },
    { label: 'Replies', value: stats?.replies ?? 0 },
    { label: 'Interested', value: stats?.interested ?? 0 },
    { label: 'Converted', value: stats?.converted ?? 0 },
  ];

  const funnelSteps = [
    { label: 'Leads', count: stats?.funnel?.total ?? 0 },
    { label: 'Qualified', count: stats?.funnel?.qualified ?? 0 },
    { label: 'Message approved', count: stats?.funnel?.approved ?? 0 },
    { label: 'Contact opened', count: stats?.funnel?.contactOpened ?? 0 },
    { label: 'Replied', count: stats?.funnel?.replied ?? 0 },
    { label: 'Interested', count: stats?.funnel?.interested ?? 0 },
    { label: 'Converted', count: stats?.funnel?.converted ?? 0 },
  ];
  const top = Math.max(1, funnelSteps[0].count);
  const isEmpty = !isLoading && (stats?.totalLeads ?? 0) === 0;

  const Strip = ({ items, cols }: { items: { label: string; value: number }[]; cols: string }) => (
    <div className={`cf-card grid ${cols} divide-x divide-y sm:divide-y-0 divide-[#1b2430]`}>
      {items.map((it) => (
        <div key={it.label} className="px-5 py-4">
          <p className="cf-label">{it.label}</p>
          <p className="text-2xl font-semibold font-mono text-white mt-1.5 tabular-nums">{isLoading ? '–' : it.value}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">Live counts from your local database.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSeedDemo} disabled={isSeeding} className="cf-btn-ghost">
            <Database className="w-3.5 h-3.5" />
            <span>{isSeeding ? 'Seeding...' : 'Load demo data'}</span>
          </button>
          <button onClick={() => onNavigate('find-leads')} className="cf-btn-primary">
            <span>Find leads</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isEmpty && (
        <div className="cf-card p-5 border-dashed">
          <p className="text-sm font-medium text-white">No leads yet</p>
          <p className="text-xs text-slate-500 mt-1">Import a CSV, add a source URL, or load the demo data to see the dashboard fill in.</p>
        </div>
      )}

      <section className="space-y-2">
        <p className="cf-label">Pipeline</p>
        <Strip items={primary} cols="grid-cols-2 sm:grid-cols-4" />
      </section>

      <section className="space-y-2">
        <p className="cf-label">Outreach</p>
        <Strip items={outreach} cols="grid-cols-2 sm:grid-cols-5" />
      </section>

      <section className="cf-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Conversion funnel</h3>
            <p className="text-xs text-slate-500 mt-0.5">Computed from stored records only.</p>
          </div>
          <button onClick={fetchStats} className="cf-btn-ghost !px-2.5" aria-label="Refresh funnel">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-2.5">
          {funnelSteps.map((step) => {
            const pct = step.count === 0 ? 0 : Math.max(2, (step.count / top) * 100);
            return (
              <div key={step.label} className="grid grid-cols-[130px_1fr_40px] items-center gap-3 text-xs">
                <span className="text-slate-400">{step.label}</span>
                <div className="h-2 rounded-full bg-[#141b24] overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="font-mono text-white text-right tabular-nums">{step.count}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
