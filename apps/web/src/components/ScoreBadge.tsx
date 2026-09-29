import React from 'react';

interface ScoreBadgeProps {
  score?: number | null;
  size?: 'sm' | 'md' | 'lg';
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, size = 'md' }) => {
  if (score === undefined || score === null) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-400 border border-slate-700">
        N/A
      </span>
    );
  }

  let colorClasses = 'bg-slate-800 text-slate-400 border-slate-700';
  let dotColor = 'bg-slate-400';

  if (score >= 70) {
    colorClasses = 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40';
    dotColor = 'bg-emerald-400';
  } else if (score >= 40) {
    colorClasses = 'bg-amber-950/60 text-amber-300 border-amber-500/30';
    dotColor = 'bg-amber-400';
  } else {
    colorClasses = 'bg-slate-800/80 text-slate-400 border-slate-700';
    dotColor = 'bg-slate-500';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5 font-bold',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-semibold border ${colorClasses} ${sizeClasses}`}
      title={`Opportunity Score: ${score}/100`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{score}</span>
      <span className="text-[10px] opacity-70 font-normal">/100</span>
    </span>
  );
};
