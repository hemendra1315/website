import * as cheerio from 'cheerio';
import { WebsiteAudit, WebsiteStatus, isSafeTargetUrl, safeFetchHtml } from '@client-finder/shared';
import crypto from 'crypto';

export interface AuditResult {
  website_status: WebsiteStatus;
  https_enabled: boolean | null;
  mobile_ready: boolean | null;
  title: string | null;
  description: string | null;
  contact_path: boolean | null;
  observations: string | null;
}

export class WebsiteAuditService {
  /**
   * Audits a business website safely and deterministically.
   */
  async auditWebsite(businessId: string, rawWebsiteUrl: string | null | undefined): Promise<WebsiteAudit> {
    const auditedAt = new Date().toISOString();
    const auditId = crypto.randomUUID();

    if (!rawWebsiteUrl || !rawWebsiteUrl.trim()) {
      return {
        id: auditId,
        business_id: businessId,
        website_status: 'NO_WEBSITE',
        https_enabled: null,
        mobile_ready: null,
        title: null,
        description: null,
        contact_path: null,
        observations: 'No website URL provided for this business.',
        audited_at: auditedAt,
      };
    }

    let targetUrl = rawWebsiteUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    const safety = isSafeTargetUrl(targetUrl);
    if (!safety.isSafe && !process.env.ALLOW_LOCAL_INGEST) {
      return {
        id: auditId,
        business_id: businessId,
        website_status: 'ERROR',
        https_enabled: null,
        mobile_ready: null,
        title: null,
        description: null,
        contact_path: null,
        observations: `Audit blocked: ${safety.reason}`,
        audited_at: auditedAt,
      };
    }

    const httpsEnabled = targetUrl.startsWith('https://');

    try {
      const fetchResult = await safeFetchHtml(targetUrl, {
        maxRedirects: 3,
        maxSizeBytes: 2 * 1024 * 1024, // 2 MB
        timeoutMs: 6000,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ClientFinderAudit/1.0',
      });

      if (!fetchResult.ok) {
        return {
          id: auditId,
          business_id: businessId,
          website_status: 'UNREACHABLE',
          https_enabled: httpsEnabled,
          mobile_ready: null,
          title: null,
          description: null,
          contact_path: null,
          observations: `Site responded with HTTP status code ${fetchResult.status} (${fetchResult.statusText}).`,
          audited_at: auditedAt,
        };
      }

      const html = fetchResult.html;
      const $ = cheerio.load(html);

      // Title & description
      const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || null;
      const description = $('meta[name="description"]').attr('content')?.trim() ||
                          $('meta[property="og:description"]').attr('content')?.trim() ||
                          null;

      // Mobile viewport check
      const viewport = $('meta[name="viewport"]').attr('content');
      const mobileReady = Boolean(viewport && viewport.includes('width=device-width'));

      // Contact/enquiry path detection
      const hasTelLink = $('a[href^="tel:"]').length > 0;
      const hasMailtoLink = $('a[href^="mailto:"]').length > 0;
      const hasWhatsAppLink = $('a[href*="wa.me"], a[href*="whatsapp.com"]').length > 0;
      const hasContactForm = $('form').length > 0 && ($('input[type="email"]').length > 0 || $('input[type="tel"]').length > 0 || $('textarea').length > 0);
      const hasContactPageLink = $('a[href*="contact"], a[href*="inquiry"], a[href*="enquiry"], a[href*="reach-us"]').length > 0;

      const contactPath = hasTelLink || hasMailtoLink || hasWhatsAppLink || hasContactForm || hasContactPageLink;

      // Navigation & observation notes
      const hasNav = $('nav').length > 0 || $('header').length > 0 || $('.nav, .menu, #nav, #menu').length > 0;
      const observationNotes: string[] = [];

      if (!httpsEnabled) observationNotes.push('No HTTPS encryption detected');
      if (!mobileReady) observationNotes.push('Missing responsive mobile viewport tag');
      if (!contactPath) observationNotes.push('No direct contact form or booking buttons identified on homepage');
      if (!hasNav) observationNotes.push('Basic navigation menu missing or unstructured');
      if (!title) observationNotes.push('Missing HTML page title');
      if (!description) observationNotes.push('Missing SEO meta description');

      if (observationNotes.length === 0) {
        observationNotes.push('Website is online, HTTPS enabled, mobile responsive with contact paths');
      }

      return {
        id: auditId,
        business_id: businessId,
        website_status: 'ONLINE',
        https_enabled: httpsEnabled,
        mobile_ready: mobileReady,
        title: title ? title.slice(0, 300) : null,
        description: description ? description.slice(0, 500) : null,
        contact_path: contactPath,
        observations: observationNotes.join('; '),
        audited_at: auditedAt,
      };
    } catch (err: any) {
      const isTimeout = err.message && err.message.includes('timed out');

      return {
        id: auditId,
        business_id: businessId,
        website_status: isTimeout ? 'UNREACHABLE' : 'ERROR',
        https_enabled: httpsEnabled,
        mobile_ready: null,
        title: null,
        description: null,
        contact_path: null,
        observations: isTimeout
          ? 'Website connection timed out after 6 seconds.'
          : `Unable to verify website: ${err.message || 'Network error'}`,
        audited_at: auditedAt,
      };
    }
  }
}

export const websiteAuditService = new WebsiteAuditService();
