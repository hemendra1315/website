import { describe, it, expect } from 'vitest';
import { buildWhatsAppUrl, buildMailtoUrl, buildSocialContactUrl } from '@client-finder/shared';

describe('Contact Action Link Builders', () => {
  describe('buildWhatsAppUrl', () => {
    it('creates properly encoded wa.me url from phone and message', () => {
      const res = buildWhatsAppUrl('+91 (984) 012-3456', 'Hi ABC Cricket Academy, would you like a demo?');
      expect(res.isValid).toBe(true);
      expect(res.url).toContain('https://wa.me/919840123456?text=');
      expect(res.url).toContain('Hi%20ABC%20Cricket%20Academy');
    });

    it('prevents real external WhatsApp dispatch for demo leads', () => {
      const res = buildWhatsAppUrl('+91 9840123456', 'Demo message', true);
      expect(res.isDemo).toBe(true);
      expect(res.url).toBe('#demo-mode-whatsapp-prevented');
      expect(res.error).toContain('Demo lead: External communication disabled');
    });

    it('flags invalid when phone number is missing or empty', () => {
      const res = buildWhatsAppUrl('', 'Test message');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('No valid phone number');
    });
  });

  describe('buildMailtoUrl', () => {
    it('creates properly encoded mailto url with subject and body', () => {
      const res = buildMailtoUrl('contact@cricket.in', 'Demo Inquiry', 'Hello team, let us talk.');
      expect(res.isValid).toBe(true);
      expect(res.url).toBe('mailto:contact@cricket.in?subject=Demo%20Inquiry&body=Hello%20team%2C%20let%20us%20talk.');
    });

    it('protects demo leads from real email dispatch', () => {
      const res = buildMailtoUrl('demo@cricket.local', 'Demo Subject', 'Demo Body', true);
      expect(res.isDemo).toBe(true);
      expect(res.url).toBe('#demo-mode-email-prevented');
    });
  });

  describe('buildSocialContactUrl', () => {
    it('normalizes http/https protocol for public social URLs', () => {
      const res = buildSocialContactUrl('instagram.com/mybusiness');
      expect(res.isValid).toBe(true);
      expect(res.url).toBe('https://instagram.com/mybusiness');
    });
  });
});
