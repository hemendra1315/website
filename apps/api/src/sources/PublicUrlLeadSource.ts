import * as cheerio from 'cheerio';
import {
  RawLeadInput,
  NormalizedLead,
  ImportRowValidation,
  Business,
  validateAndNormalizeLeadRow,
  isSafeTargetUrl,
  safeFetchHtml,
} from '@client-finder/shared';
import { LeadSource, LeadSearchQuery } from './LeadSource';

export class PublicUrlLeadSource implements LeadSource {
  readonly name = 'Permitted Public URL Ingestion';
  readonly type = 'PUBLIC_URL' as const;

  /**
   * Fetches an explicitly provided public URL safely and extracts structured business data.
   * Does NOT use prohibited scraping, proxies, anti-bot evasions, or Google scrapers.
   */
  async ingestFromUrl(targetUrl: string, defaultCategory = 'Local Business', defaultCity = 'Chennai'): Promise<RawLeadInput[]> {
    if (!targetUrl || !targetUrl.startsWith('http')) {
      throw new Error('Please provide a valid HTTP/HTTPS public URL.');
    }

    const safety = isSafeTargetUrl(targetUrl);
    if (!safety.isSafe && !process.env.ALLOW_LOCAL_INGEST) {
      throw new Error(`Restricted URL: ${safety.reason}`);
    }

    try {
      const fetchResult = await safeFetchHtml(targetUrl, {
        maxRedirects: 3,
        maxSizeBytes: 2 * 1024 * 1024,
        timeoutMs: 7000,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ClientFinder/1.0',
      });

      if (!fetchResult.ok) {
        throw new Error(`Target public page responded with HTTP ${fetchResult.status}: ${fetchResult.statusText}`);
      }

      const html = fetchResult.html;
      const $ = cheerio.load(html);

      const extractedLeads: RawLeadInput[] = [];

      // 1. Look for Schema.org JSON-LD structured data
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const jsonText = $(el).html();
          if (!jsonText) return;
          const data = JSON.parse(jsonText);
          const items = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];

          for (const item of items) {
            const itemType = item['@type'] || '';
            if (
              itemType.includes('Business') ||
              itemType.includes('Organization') ||
              itemType.includes('Restaurant') ||
              itemType.includes('Sports') ||
              itemType.includes('Store') ||
              itemType.includes('LocalBusiness')
            ) {
              const name = item.name || item.legalName;
              if (name) {
                const phone = item.telephone || item.phone;
                const email = item.email;
                const website = item.url || targetUrl;
                const addressObj = item.address;
                const addressStr = typeof addressObj === 'string'
                  ? addressObj
                  : addressObj ? `${addressObj.streetAddress || ''} ${addressObj.addressLocality || ''}`.trim() : undefined;
                const cityStr = typeof addressObj === 'object' ? addressObj.addressLocality : defaultCity;

                extractedLeads.push({
                  name,
                  category: itemType.replace('LocalBusiness', '').trim() || defaultCategory,
                  city: cityStr || defaultCity,
                  address: addressStr || undefined,
                  phone: phone || undefined,
                  email: email || undefined,
                  website: website || undefined,
                  source_url: targetUrl,
                  source_type: 'PUBLIC_URL',
                });
              }
            }
          }
        } catch {
          // Ignore invalid JSON-LD blocks
        }
      });

      // 2. If no JSON-LD found, extract from OpenGraph & HTML metadata
      if (extractedLeads.length === 0) {
        const ogTitle = $('meta[property="og:site_name"]').attr('content') ||
                        $('meta[property="og:title"]').attr('content') ||
                        $('title').text().trim().split(/[-|–]/)[0]?.trim();

        // Extract phone from tel: links
        let phone: string | undefined;
        $('a[href^="tel:"]').each((_, el) => {
          if (!phone) {
            phone = $(el).attr('href')?.replace('tel:', '').trim();
          }
        });

        // Extract email from mailto: links
        let email: string | undefined;
        $('a[href^="mailto:"]').each((_, el) => {
          if (!email) {
            email = $(el).attr('href')?.replace('mailto:', '').split('?')[0].trim();
          }
        });

        // Extract social URLs
        let socialUrl: string | undefined;
        $('a[href*="instagram.com"], a[href*="facebook.com"], a[href*="linkedin.com"]').each((_, el) => {
          if (!socialUrl) {
            socialUrl = $(el).attr('href')?.trim();
          }
        });

        if (ogTitle && ogTitle.length > 2) {
          extractedLeads.push({
            name: ogTitle,
            category: defaultCategory,
            city: defaultCity,
            phone,
            email,
            website: targetUrl,
            social_url: socialUrl,
            source_url: targetUrl,
            source_type: 'PUBLIC_URL',
          });
        }
      }

      return extractedLeads;
    } catch (err: any) {
      if (err.name === 'AbortError' || (err.message && err.message.includes('timed out'))) {
        throw new Error('Connection timed out while trying to fetch the public URL.');
      }
      throw new Error(`Unable to fetch public URL: ${err.message}`);
    }
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
