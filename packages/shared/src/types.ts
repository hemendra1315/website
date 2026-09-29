export type LeadStatus =
  | 'NEW'
  | 'REVIEW'
  | 'QUALIFIED'
  | 'APPROVED'
  | 'CONTACT_OPENED'
  | 'REPLIED'
  | 'INTERESTED'
  | 'CONVERTED'
  | 'REJECTED'
  | 'CLOSED';

export type WebsiteStatus =
  | 'NO_WEBSITE'
  | 'ONLINE'
  | 'UNREACHABLE'
  | 'ERROR'
  | 'UNVERIFIED';

export type MessageChannel = 'WHATSAPP' | 'EMAIL' | 'GENERIC_DM';

export type MessageStatus = 'DRAFT' | 'APPROVED' | 'SKIPPED';

export type LeadSourceType = 'CSV' | 'PUBLIC_URL' | 'MANUAL';

export interface Business {
  id: string;
  name: string;
  normalized_name: string;
  category: string;
  city: string;
  address: string | null;
  public_phone: string | null;
  public_email: string | null;
  website: string | null;
  normalized_domain: string | null;
  social_url: string | null;
  source_url: string | null;
  source_type: LeadSourceType;
  status: LeadStatus;
  do_not_contact: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebsiteAudit {
  id: string;
  business_id: string;
  website_status: WebsiteStatus;
  https_enabled: boolean | null;
  mobile_ready: boolean | null;
  title: string | null;
  description: string | null;
  contact_path: boolean | null;
  observations: string | null;
  audited_at: string;
}

export interface OpportunityScoreBreakdown {
  score: number;
  website_score: number;
  mobile_score: number;
  conversion_score: number;
  business_fit_score: number;
  reasons: string[];
}

export interface Opportunity {
  id: string;
  business_id: string;
  score: number;
  website_score: number;
  mobile_score: number;
  conversion_score: number;
  business_fit_score: number;
  reasons: string[];
  created_at: string;
}

export interface Message {
  id: string;
  business_id: string;
  channel: MessageChannel;
  content: string;
  subject?: string | null;
  status: MessageStatus;
  created_at: string;
  updated_at: string;
}

export interface Outreach {
  id: string;
  business_id: string;
  message_id: string;
  channel: MessageChannel;
  status: 'CONTACT_OPENED' | 'MANUALLY_SENT' | 'REPLIED' | 'CANCELLED';
  created_at: string;
}

export interface ActivityLog {
  id: string;
  business_id: string;
  action: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface AppSettings {
  id: string;
  user_name: string;
  business_name: string;
  service_description: string;
  default_city: string;
  default_categories: string[];
  default_message_tone: 'friendly' | 'professional' | 'direct';
  min_opportunity_score: number;
  updated_at: string;
}

export interface RawLeadInput {
  name: string;
  category?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  social_url?: string;
  source_url?: string;
  source_type?: LeadSourceType;
  is_demo?: boolean;
}

export interface NormalizedLead {
  name: string;
  normalized_name: string;
  category: string;
  city: string;
  address: string | null;
  public_phone: string | null;
  public_email: string | null;
  website: string | null;
  normalized_domain: string | null;
  social_url: string | null;
  source_url: string | null;
  source_type: LeadSourceType;
  is_demo: boolean;
}

export interface ImportRowValidation {
  rowNumber: number;
  data: RawLeadInput;
  normalized?: NormalizedLead;
  isValid: boolean;
  errors: string[];
  isDuplicate: boolean;
  duplicateReason?: string;
  matchedExistingId?: string;
}

export interface ImportPreviewResult {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  validRows: ImportRowValidation[];
  invalidRows: ImportRowValidation[];
  duplicateRows: ImportRowValidation[];
}

export interface LeadFilters {
  search?: string;
  city?: string;
  category?: string;
  minScore?: number;
  websiteStatus?: WebsiteStatus;
  status?: LeadStatus;
  doNotContact?: boolean;
  sortBy?: 'score' | 'created_at' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface DashboardStats {
  totalLeads: number;
  leadsWithoutWebsites: number;
  qualifiedLeads: number;
  awaitingReview: number;
  messagesApproved: number;
  contactOpened: number;
  replies: number;
  interested: number;
  converted: number;
  funnel: {
    total: number;
    qualified: number;
    approved: number;
    contactOpened: number;
    replied: number;
    interested: number;
    converted: number;
  };
}
