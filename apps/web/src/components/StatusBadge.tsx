import React from 'react';
import { LeadStatus, WebsiteStatus, MessageStatus } from '@client-finder/shared';

interface StatusBadgeProps {
  status?: LeadStatus | WebsiteStatus | MessageStatus | string;
  type?: 'lead' | 'website' | 'message';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'lead' }) => {
  if (!status) return null;

  let label = status.replace(/_/g, ' ');
  let classes = 'bg-slate-800 text-slate-400 border-slate-700';

  if (type === 'lead') {
    switch (status) {
      case 'NEW':
        classes = 'bg-sky-950/60 text-sky-300 border-sky-600/30';
        break;
      case 'REVIEW':
        classes = 'bg-indigo-950/60 text-indigo-300 border-indigo-600/30';
        break;
      case 'QUALIFIED':
        classes = 'bg-teal-950/60 text-teal-300 border-teal-500/40';
        break;
      case 'APPROVED':
        classes = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
        break;
      case 'CONTACT_OPENED':
        classes = 'bg-amber-950/60 text-amber-300 border-amber-500/40';
        break;
      case 'REPLIED':
        classes = 'bg-blue-950/60 text-blue-300 border-blue-500/40';
        break;
      case 'INTERESTED':
        classes = 'bg-emerald-900 text-emerald-200 border-emerald-400 font-bold';
        break;
      case 'CONVERTED':
        classes = 'bg-emerald-500 text-slate-950 font-bold border-emerald-400';
        break;
      case 'REJECTED':
      case 'CLOSED':
        classes = 'bg-rose-950/60 text-rose-300 border-rose-800/40';
        break;
    }
  } else if (type === 'website') {
    switch (status) {
      case 'NO_WEBSITE':
        classes = 'bg-rose-950/70 text-rose-300 border-rose-600/40';
        label = 'No Website';
        break;
      case 'ONLINE':
        classes = 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40';
        label = 'Online';
        break;
      case 'UNREACHABLE':
      case 'ERROR':
        classes = 'bg-amber-950/70 text-amber-300 border-amber-600/40';
        label = 'Unreachable';
        break;
      case 'UNVERIFIED':
      default:
        classes = 'bg-slate-800 text-slate-400 border-slate-700';
        label = 'Unverified';
        break;
    }
  } else if (type === 'message') {
    switch (status) {
      case 'APPROVED':
        classes = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
        break;
      case 'DRAFT':
        classes = 'bg-amber-950/60 text-amber-300 border-amber-500/40';
        break;
      case 'SKIPPED':
        classes = 'bg-slate-800 text-slate-400 border-slate-700';
        break;
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${classes}`}>
      {label.toLowerCase()}
    </span>
  );
};
