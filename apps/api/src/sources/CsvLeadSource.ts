import { parse } from 'csv-parse/sync';
import { RawLeadInput, NormalizedLead, ImportRowValidation, Business, validateAndNormalizeLeadRow } from '@client-finder/shared';
import { LeadSource, LeadSearchQuery } from './LeadSource';

export class CsvLeadSource implements LeadSource {
  readonly name = 'CSV File Importer';
  readonly type = 'CSV' as const;

  /**
   * Parses CSV raw content string into RawLeadInput array
   */
  parseCsvContent(csvString: string): RawLeadInput[] {
    if (!csvString || !csvString.trim()) {
      return [];
    }

    const records = parse(csvString, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as Record<string, string>[];

    return records.map((row) => {
      // Map case-insensitively and handle variations in header names
      const findField = (keys: string[]): string | undefined => {
        for (const k of Object.keys(row)) {
          const lower = k.toLowerCase().replace(/[\s_-]/g, '');
          for (const target of keys) {
            if (lower === target.toLowerCase().replace(/[\s_-]/g, '')) {
              return row[k];
            }
          }
        }
        return undefined;
      };

      const name = findField(['name', 'business', 'businessname', 'company', 'title']) || '';
      const category = findField(['category', 'type', 'industry', 'niche']) || 'General Business';
      const city = findField(['city', 'location', 'town']) || 'Chennai';
      const address = findField(['address', 'street', 'streetaddress', 'fulladdress']) || '';
      const phone = findField(['phone', 'mobile', 'telephone', 'contactnumber', 'publicphone']) || '';
      const email = findField(['email', 'mail', 'publicemail', 'contactemail']) || '';
      const website = findField(['website', 'url', 'web', 'site']) || '';
      const social_url = findField(['social_url', 'social', 'instagram', 'facebook', 'linkedin']) || '';
      const source_url = findField(['source_url', 'source', 'directory_url']) || 'CSV Import';

      return {
        name,
        category,
        city,
        address: address || undefined,
        phone: phone || undefined,
        email: email || undefined,
        website: website || undefined,
        social_url: social_url || undefined,
        source_url: source_url || undefined,
        source_type: 'CSV',
      };
    });
  }

  async search(_query?: LeadSearchQuery): Promise<RawLeadInput[]> {
    return [];
  }

  normalize(raw: RawLeadInput): NormalizedLead {
    const validation = validateAndNormalizeLeadRow(raw, 0, []);
    if (validation.normalized) {
      return validation.normalized;
    }
    throw new Error(`Failed to normalize lead: ${validation.errors.join(', ')}`);
  }

  validate(raw: RawLeadInput, rowNumber: number, existingLeads: Business[]): ImportRowValidation {
    return validateAndNormalizeLeadRow(raw, rowNumber, existingLeads);
  }
}
