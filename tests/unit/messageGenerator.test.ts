import { describe, it, expect } from 'vitest';
import { generatePersonalizedMessages, Business, WebsiteAudit } from '@client-finder/shared';

describe('Personalized Message Generator', () => {
  const business: Business = {
    id: 'biz-1',
    name: 'Royals Cricket Academy',
    normalized_name: 'royals cricket academy',
    category: 'Cricket Academy',
    city: 'Chennai',
    address: '12 Mount Road',
    public_phone: '+919840123456',
    public_email: 'info@royalscricket.in',
    website: null,
    normalized_domain: null,
    social_url: 'https://instagram.com/royalscricket',
    source_url: 'CSV',
    source_type: 'CSV',
    status: 'NEW',
    do_not_contact: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('generates WhatsApp, Email, and Generic DM messages strictly referencing verified facts', () => {
    const drafts = generatePersonalizedMessages(business, null, null, {
      user_name: 'Hemu',
      business_name: 'Hemu Web Studio',
      service_description: 'modern websites for local sports academies',
    });

    // Check WhatsApp
    expect(drafts.WHATSAPP.content).toContain('Royals Cricket Academy');
    expect(drafts.WHATSAPP.content).toContain('Chennai');
    expect(drafts.WHATSAPP.content).toContain('does not currently have a dedicated website');
    expect(drafts.WHATSAPP.content).toContain('Hemu Web Studio');
    expect(drafts.WHATSAPP.content).not.toContain('we spoke last week'); // no fake prior contact

    // Check Email
    expect(drafts.EMAIL.subject).toContain('Royals Cricket Academy');
    expect(drafts.EMAIL.content).toContain('Hemu Web Studio');
    expect(drafts.EMAIL.content).toContain('Hemu');

    // Check Generic DM
    expect(drafts.GENERIC_DM.content).toContain('Royals Cricket Academy');
  });

  it('adapts message insight for broken/unreachable sites', () => {
    const siteAudit: WebsiteAudit = {
      id: 'aud-1',
      business_id: 'biz-1',
      website_status: 'UNREACHABLE',
      https_enabled: false,
      mobile_ready: false,
      title: null,
      description: null,
      contact_path: null,
      observations: 'Connection timed out',
      audited_at: new Date().toISOString(),
    };

    const bizWithBrokenSite: Business = {
      ...business,
      website: 'http://broken-site.com',
    };

    const drafts = generatePersonalizedMessages(bizWithBrokenSite, siteAudit);
    expect(drafts.WHATSAPP.content).toContain('appears to be offline or inaccessible');
  });
});
