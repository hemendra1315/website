import { describe, it, expect } from 'vitest';
import { calculateOpportunityScore } from '@client-finder/shared';

describe('Deterministic Opportunity Scoring Engine', () => {
  it('awards high score (no website + verified phone) with exact clear reasons', () => {
    const business = {
      website: null,
      public_phone: '+919840123456',
      public_email: 'cricket@local.in',
    };

    const audit = {
      website_status: 'NO_WEBSITE' as const,
      https_enabled: null,
      mobile_ready: null,
      title: null,
      description: null,
      contact_path: null,
    };

    const breakdown = calculateOpportunityScore(business, audit);

    expect(breakdown.score).toBe(40); // 30 (no website) + 10 (fit)
    expect(breakdown.reasons).toContain('No dedicated website found for this business');
    expect(breakdown.reasons).toContain('Direct verified public contact details available for outreach');
  });

  it('evaluates unreachable/broken websites accurately', () => {
    const business = {
      website: 'http://broken-academy.com',
      public_phone: '+919840123456',
    };

    const audit = {
      website_status: 'UNREACHABLE' as const,
      https_enabled: false,
      mobile_ready: null,
      title: null,
      description: null,
      contact_path: null,
    };

    const breakdown = calculateOpportunityScore(business, audit);
    expect(breakdown.score).toBe(30); // 20 (unreachable) + 10 (fit)
    expect(breakdown.reasons).toContain('Existing website is offline or inaccessible');
  });

  it('penalizes sites with missing HTTPS, missing mobile viewport, and missing contact path', () => {
    const business = {
      website: 'http://old-gym.com',
      public_phone: '+919840123456',
    };

    const audit = {
      website_status: 'ONLINE' as const,
      https_enabled: false,
      mobile_ready: false,
      contact_path: false,
      title: 'Gym', // too short (<5)
      description: 'Gym', // too short (<10)
      observations: 'navigation missing',
    };

    const breakdown = calculateOpportunityScore(business, audit);
    // 10 (no https) + 10 (no mobile) + 10 (no contact) + 5 (poor meta) + 5 (nav missing) + 10 (fit) = 50
    expect(breakdown.score).toBe(50);
    expect(breakdown.reasons).toContain('Website lacks secure HTTPS encryption');
    expect(breakdown.reasons).toContain('Missing responsive mobile viewport tag');
    expect(breakdown.reasons).toContain('No obvious contact or enquiry path found on the homepage');
  });

  it('awards low score and penalty to strong, fully optimized existing websites', () => {
    const business = {
      website: 'https://topcricketacademy.com',
      public_phone: '+919840123456',
    };

    const audit = {
      website_status: 'ONLINE' as const,
      https_enabled: true,
      mobile_ready: true,
      contact_path: true,
      title: 'Top Cricket Academy - Premier Training in Chennai',
      description: 'Professional cricket training, batting nets, and state-of-the-art coaching facilities in Chennai.',
      observations: 'Website is online, HTTPS enabled, mobile responsive with contact paths',
    };

    const breakdown = calculateOpportunityScore(business, audit);
    // 0 - 35 (strong site penalty) + 10 (fit) = -25 -> clamped to 0
    expect(breakdown.score).toBe(0);
    expect(breakdown.reasons).toContain('Strong existing web presence with HTTPS, mobile responsiveness, and clear contact path');
  });

  it('guarantees score is clamped between 0 and 100', () => {
    const minResult = calculateOpportunityScore({ website: 'https://strong.com' }, {
      website_status: 'ONLINE',
      https_enabled: true,
      mobile_ready: true,
      contact_path: true,
      title: 'Super Title Long Enough',
      description: 'Super Description Long Enough For Verification',
    });
    expect(minResult.score).toBeGreaterThanOrEqual(0);

    const maxResult = calculateOpportunityScore({ website: null, public_phone: '+919840123456' }, { website_status: 'NO_WEBSITE' });
    expect(maxResult.score).toBeLessThanOrEqual(100);
  });
});
