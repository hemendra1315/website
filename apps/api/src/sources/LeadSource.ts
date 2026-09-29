import { RawLeadInput, NormalizedLead, ImportRowValidation, Business } from '@client-finder/shared';

export interface LeadSearchQuery {
  city?: string;
  category?: string;
  limit?: number;
  minScore?: number;
}

export interface LeadSource {
  readonly name: string;
  readonly type: 'CSV' | 'PUBLIC_URL' | 'MANUAL';

  /**
   * Search / ingest leads from this source
   */
  search(query?: LeadSearchQuery): Promise<RawLeadInput[]>;

  /**
   * Normalize a raw input into a sanitized lead
   */
  normalize(raw: RawLeadInput): NormalizedLead;

  /**
   * Validate a single raw row against rules and existing leads
   */
  validate(raw: RawLeadInput, rowNumber: number, existingLeads: Business[]): ImportRowValidation;
}
