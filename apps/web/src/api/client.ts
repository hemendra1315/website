import {
  Business,
  WebsiteAudit,
  Opportunity,
  Message,
  LeadFilters,
  DashboardStats,
  AppSettings,
  ImportPreviewResult,
  RawLeadInput,
  MessageStatus,
  MessageChannel,
} from '@client-finder/shared';

const API_BASE = '/api';

export interface LeadWithRelations extends Business {
  opportunity: (Opportunity & { reasons: string[] }) | null;
  audit: WebsiteAudit | null;
  messages?: Message[];
  outreach?: any[];
  activity?: any[];
}

export interface PaginatedLeads {
  items: LeadWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const api = {
  // Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  // Leads
  async getLeads(filters: LeadFilters = {}): Promise<PaginatedLeads> {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.city) params.append('city', filters.city);
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.websiteStatus) params.append('websiteStatus', filters.websiteStatus);
    if (typeof filters.doNotContact === 'boolean') params.append('doNotContact', String(filters.doNotContact));
    if (typeof filters.minScore === 'number') params.append('minScore', String(filters.minScore));
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const res = await fetch(`${API_BASE}/leads?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch leads');
    return res.json();
  },

  async getLeadById(id: string): Promise<LeadWithRelations> {
    const res = await fetch(`${API_BASE}/leads/${id}`);
    if (!res.ok) throw new Error('Failed to fetch lead details');
    return res.json();
  },

  async createLead(raw: RawLeadInput): Promise<Business> {
    const res = await fetch(`${API_BASE}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(raw),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create lead');
    return data;
  },

  async updateLead(id: string, updates: Partial<Business>): Promise<Business> {
    const res = await fetch(`${API_BASE}/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update lead');
    return data;
  },

  async deleteLead(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/leads/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete lead');
    return true;
  },

  async runWebsiteAudit(id: string): Promise<{ audit: WebsiteAudit; opportunity: Opportunity }> {
    const res = await fetch(`${API_BASE}/leads/${id}/audit`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to audit website');
    return data;
  },

  async generateMessages(id: string): Promise<Message[]> {
    const res = await fetch(`${API_BASE}/leads/${id}/messages/generate`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate messages');
    return data;
  },

  async prepareContactAction(
    leadId: string,
    messageId: string,
    channel: MessageChannel
  ): Promise<{ actionResult: any; business: Business; message: Message }> {
    const res = await fetch(`${API_BASE}/leads/${leadId}/contact-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, channel }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to prepare contact action');
    return data;
  },

  // Messages Page
  async getAllMessages(status?: MessageStatus, channel?: MessageChannel): Promise<(Message & { business: Business })[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (channel) params.append('channel', channel);

    const res = await fetch(`${API_BASE}/messages?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  },

  async updateMessage(
    id: string,
    updates: { content?: string; subject?: string; status?: MessageStatus }
  ): Promise<Message> {
    const res = await fetch(`${API_BASE}/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update message');
    return data;
  },

  // Sources & Imports
  async previewCsv(csvTextOrFile: string | File): Promise<ImportPreviewResult> {
    let res: Response;
    if (typeof csvTextOrFile === 'string') {
      res = await fetch(`${API_BASE}/leads/import/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvTextOrFile }),
      });
    } else {
      const formData = new FormData();
      formData.append('file', csvTextOrFile);
      res = await fetch(`${API_BASE}/leads/import/preview`, {
        method: 'POST',
        body: formData,
      });
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to preview CSV');
    return data;
  },

  async commitImport(leads: RawLeadInput[]): Promise<{ importedCount: number; skippedCount: number }> {
    const res = await fetch(`${API_BASE}/leads/import/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads, runAudits: true }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to commit import');
    return data;
  },

  async ingestPublicUrl(url: string, category?: string, city?: string): Promise<{ url: string; preview: ImportPreviewResult }> {
    const res = await fetch(`${API_BASE}/leads/source-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, category, city }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to ingest URL');
    return data;
  },

  // Settings & DB management
  async getSettings(): Promise<AppSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update settings');
    return data;
  },

  async clearDatabase(confirmation: string): Promise<void> {
    const res = await fetch(`${API_BASE}/data/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to clear database');
  },

  async seedDemoData(): Promise<{ importedCount: number; message: string }> {
    const res = await fetch(`${API_BASE}/demo/seed`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to seed demo data');
    return data;
  },

  getExportUrl(): string {
    return `${API_BASE}/data/export`;
  },
};
