import React from 'react';
import { LayoutDashboard, Search, Users, MessageSquareText, Settings, ShieldCheck } from 'lucide-react';

export type NavTab = 'dashboard' | 'find-leads' | 'leads' | 'messages' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'find-leads', label: 'Find Leads', icon: <Search className="w-4 h-4" /> },
    { id: 'leads', label: 'Leads', icon: <Users className="w-4 h-4" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquareText className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-56 bg-[#0b1016] border-r border-[#1b2430] flex flex-col justify-between shrink-0 select-none">
      <div>
        <div className="h-16 px-5 flex items-center gap-2.5 border-b border-[#1b2430]">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Search className="w-4 h-4 text-slate-950" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-white">Client Finder</span>
        </div>

        <nav className="p-3 space-y-0.5">
          <p className="cf-label px-3 pt-2 pb-2">Workspace</p>
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'bg-[#131b24] text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#10161e]'
                }`}
              >
                {isActive && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-emerald-400" />}
                <span className={isActive ? 'text-emerald-400' : 'text-slate-500'}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-[#1b2430]">
        <div className="flex items-center gap-2 text-slate-300 text-xs font-medium mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Manual contact only</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Nothing is sent automatically. You review and open every message yourself.
        </p>
      </div>
    </aside>
  );
};
