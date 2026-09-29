import React, { useState } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { FindLeadsPage } from './pages/FindLeadsPage';
import { LeadsPage } from './pages/LeadsPage';
import { MessagesPage } from './pages/MessagesPage';
import { SettingsPage } from './pages/SettingsPage';
import { ImportCsvModal } from './components/ImportCsvModal';
import { AddSourceUrlModal } from './components/AddSourceUrlModal';
import { LeadFilters } from '@client-finder/shared';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [leadFilters, setLeadFilters] = useState<Partial<LeadFilters>>({});
  const [isImportCsvOpen, setIsImportCsvOpen] = useState(false);
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSearchSubmit = (params: {
    city: string;
    category: string;
    limit: number;
    minScore: number;
  }) => {
    setLeadFilters({
      city: params.city,
      category: params.category,
      minScore: params.minScore,
      limit: params.limit,
    });
    setCurrentTab('leads');
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0e13] text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Navbar
          onOpenImportCsv={() => setIsImportCsvOpen(true)}
          onOpenAddSource={() => setIsAddSourceOpen(true)}
          onRefresh={handleRefresh}
        />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
          {currentTab === 'dashboard' && (
            <DashboardPage
              key={refreshKey}
              onNavigate={setCurrentTab}
              onOpenImportCsv={() => setIsImportCsvOpen(true)}
            />
          )}

          {currentTab === 'find-leads' && (
            <FindLeadsPage
              key={refreshKey}
              onSearchSubmit={handleSearchSubmit}
              onOpenImportCsv={() => setIsImportCsvOpen(true)}
              onOpenAddSource={() => setIsAddSourceOpen(true)}
            />
          )}

          {currentTab === 'leads' && (
            <LeadsPage key={refreshKey} initialFilters={leadFilters} />
          )}

          {currentTab === 'messages' && <MessagesPage key={refreshKey} />}

          {currentTab === 'settings' && <SettingsPage key={refreshKey} />}
        </main>
      </div>

      {/* Global Ingestion Modals */}
      <ImportCsvModal
        isOpen={isImportCsvOpen}
        onClose={() => setIsImportCsvOpen(false)}
        onSuccess={() => {
          handleRefresh();
          setCurrentTab('leads');
        }}
      />

      <AddSourceUrlModal
        isOpen={isAddSourceOpen}
        onClose={() => setIsAddSourceOpen(false)}
        onSuccess={() => {
          handleRefresh();
          setCurrentTab('leads');
        }}
      />
    </div>
  );
};
export default App;
