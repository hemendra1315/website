import React, { useState, useEffect } from 'react';
import {
  Search,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import { PaginatedLeads, api } from '../api/client';
import { ScoreBadge } from '../components/ScoreBadge';
import { StatusBadge } from '../components/StatusBadge';
import { LeadStatus, WebsiteStatus, LeadFilters } from '@client-finder/shared';
import { LeadDetailModal } from '../components/LeadDetailModal';

interface LeadsPageProps {
  initialFilters?: Partial<LeadFilters>;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({ initialFilters }) => {
  const [leadsData, setLeadsData] = useState<PaginatedLeads>({
    items: [],
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState(initialFilters?.search || '');
  const [city, setCity] = useState(initialFilters?.city || '');
  const [category, setCategory] = useState(initialFilters?.category || '');
  const [status, setStatus] = useState<LeadStatus | ''>(initialFilters?.status || '');
  const [websiteStatus, setWebsiteStatus] = useState<WebsiteStatus | ''>(initialFilters?.websiteStatus || '');
  const [doNotContact, setDoNotContact] = useState<boolean | undefined>(initialFilters?.doNotContact);
  const [minScore, setMinScore] = useState<number | undefined>(initialFilters?.minScore);
  const [sortBy, setSortBy] = useState<'score' | 'created_at' | 'name'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const res = await api.getLeads({
        search: search.trim() || undefined,
        city: city.trim() || undefined,
        category: category.trim() || undefined,
        status: status || undefined,
        websiteStatus: websiteStatus || undefined,
        doNotContact,
        minScore,
        sortBy,
        sortOrder,
        page,
        limit: 15,
      });
      setLeadsData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, city, category, status, websiteStatus, doNotContact, minScore, sortBy, sortOrder, page]);

  const handleResetFilters = () => {
    setSearch('');
    setCity('');
    setCategory('');
    setStatus('');
    setWebsiteStatus('');
    setDoNotContact(undefined);
    setMinScore(undefined);
    setSortBy('score');
    setSortOrder('desc');
    setPage(1);
  };

  const handleDeleteLead = async (id: string) => {
    try {
      await api.deleteLead(id);
      fetchLeads();
    } catch (err: any) {
      alert(`Failed to delete lead: ${err.message}`);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header & Main Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Leads Directory</span>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {leadsData.total} records
            </span>
          </h2>
          <p className="text-xs text-slate-400">Manage, audit, and initiate manual outreach for verified businesses</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border transition ${
              showFilters || status || websiteStatus || doNotContact !== undefined || minScore
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>

          <button
            onClick={fetchLeads}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition"
            title="Refresh Leads"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#0f141c] border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search business name, category, city, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#090d12] border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* City Filter */}
          <div>
            <input
              type="text"
              placeholder="Filter by city..."
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#090d12] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-[#090d12] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="score">Sort: Opportunity Score</option>
              <option value="created_at">Sort: Newest Added</option>
              <option value="name">Sort: Business Name</option>
            </select>
          </div>
        </div>

        {/* Expanded Filters Drawer */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as any);
                  setPage(1);
                }}
                className="w-full bg-[#090d12] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Statuses</option>
                <option value="NEW">New</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="APPROVED">Approved</option>
                <option value="CONTACT_OPENED">Contact Opened</option>
                <option value="REPLIED">Replied</option>
                <option value="INTERESTED">Interested</option>
                <option value="CONVERTED">Converted</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Website Status</label>
              <select
                value={websiteStatus}
                onChange={(e) => {
                  setWebsiteStatus(e.target.value as any);
                  setPage(1);
                }}
                className="w-full bg-[#090d12] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Web Presences</option>
                <option value="NO_WEBSITE">No Website</option>
                <option value="ONLINE">Online</option>
                <option value="UNREACHABLE">Unreachable</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Do Not Contact</label>
              <select
                value={doNotContact === undefined ? '' : String(doNotContact)}
                onChange={(e) => {
                  setDoNotContact(e.target.value === '' ? undefined : e.target.value === 'true');
                  setPage(1);
                }}
                className="w-full bg-[#090d12] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Leads</option>
                <option value="false">Active Only</option>
                <option value="true">Do Not Contact</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-[#0f141c] border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4">Business</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">City</th>
              <th className="py-3.5 px-4">Website</th>
              <th className="py-3.5 px-4">Opportunity</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Contact</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {leadsData.items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                  No leads match your current search or filter criteria.
                </td>
              </tr>
            ) : (
              leadsData.items.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => setSelectedLeadId(lead.id)}
                  className="hover:bg-slate-800/40 cursor-pointer transition"
                >
                  <td className="py-3.5 px-4 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <span>{lead.name}</span>
                      {lead.is_demo && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          DEMO
                        </span>
                      )}
                      {lead.do_not_contact && (
                        <span className="p-0.5 rounded text-rose-400" title="Do Not Contact">
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">{lead.category}</td>
                  <td className="py-3.5 px-4 text-slate-400">{lead.city}</td>
                  <td className="py-3.5 px-4">
                    {lead.website ? (
                      <span className="text-emerald-400 truncate max-w-[140px] block" title={lead.website}>
                        {lead.normalized_domain || lead.website}
                      </span>
                    ) : (
                      <span className="text-rose-400 text-[11px] font-medium">No Website</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <ScoreBadge score={lead.opportunity?.score} size="sm" />
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={lead.status} type="lead" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      {lead.public_phone && (
                        <span title={lead.public_phone}>
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        </span>
                      )}
                      {lead.public_email && (
                        <span title={lead.public_email}>
                          <Mail className="w-3.5 h-3.5 text-sky-400" />
                        </span>
                      )}
                      {!lead.public_phone && !lead.public_email && <span className="text-slate-600">-</span>}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLeadId(lead.id);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 text-xs font-medium transition inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="block md:hidden space-y-3">
        {leadsData.items.map((lead) => (
          <div
            key={lead.id}
            onClick={() => setSelectedLeadId(lead.id)}
            className="bg-[#0f141c] border border-slate-800 rounded-xl p-4 space-y-3 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <span>{lead.name}</span>
                  {lead.is_demo && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300">
                      DEMO
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">{lead.category} · {lead.city}</p>
              </div>
              <ScoreBadge score={lead.opportunity?.score} size="sm" />
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
              <StatusBadge status={lead.status} type="lead" />
              <span className="text-slate-400">{lead.website ? 'Has Website' : 'No Website'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-slate-400">
          Page <span className="font-mono text-white font-semibold">{leadsData.page}</span> of{' '}
          <span className="font-mono text-white font-semibold">{Math.max(1, leadsData.totalPages)}</span>
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={leadsData.page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg border border-slate-700 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={leadsData.page >= leadsData.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg border border-slate-700 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lead Detail Drawer / Modal */}
      <LeadDetailModal
        leadId={selectedLeadId}
        isOpen={Boolean(selectedLeadId)}
        onClose={() => setSelectedLeadId(null)}
        onLeadUpdated={fetchLeads}
        onDeleteLead={handleDeleteLead}
      />
    </div>
  );
};
