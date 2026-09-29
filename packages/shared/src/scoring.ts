import { Business, WebsiteAudit, OpportunityScoreBreakdown } from './types';

export interface AuditEvaluationInput {
  hasWebsite: boolean;
  websiteAudit?: Partial<WebsiteAudit> | null;
  hasPhone?: boolean;
  hasEmail?: boolean;
  hasSocial?: boolean;
}

/**
 * Deterministic rules-based opportunity scoring engine.
 * Generates an integer score between 0 and 100 with category breakdowns and clear reasons.
 */
export function calculateOpportunityScore(
  business: { website?: string | null; public_phone?: string | null; public_email?: string | null; social_url?: string | null },
  audit?: Partial<WebsiteAudit> | null
): OpportunityScoreBreakdown {
  let score = 0;
  let website_score = 0;
  let mobile_score = 0;
  let conversion_score = 0;
  let business_fit_score = 0;
  const reasons: string[] = [];

  const hasWebsite = Boolean(business.website && business.website.trim().length > 0);
  const auditStatus = audit?.website_status;

  // Factor 1: No website found (+30)
  if (!hasWebsite || auditStatus === 'NO_WEBSITE') {
    score += 30;
    website_score += 30;
    reasons.push('No dedicated website found for this business');
  } else if (auditStatus === 'UNREACHABLE' || auditStatus === 'ERROR') {
    // Factor 2: Website inaccessible / broken (+20)
    score += 20;
    website_score += 20;
    reasons.push('Existing website is offline or inaccessible');
  } else if (auditStatus === 'ONLINE') {
    // Audit factors for reachable sites
    let isStrongSite = true;

    // HTTPS (+10 if missing)
    if (audit?.https_enabled === false) {
      score += 10;
      website_score += 10;
      reasons.push('Website lacks secure HTTPS encryption');
      isStrongSite = false;
    }

    // Mobile Viewport (+10 if missing)
    if (audit?.mobile_ready === false) {
      score += 10;
      mobile_score += 10;
      reasons.push('Missing responsive mobile viewport tag');
      isStrongSite = false;
    }

    // Contact / Enquiry Path (+10 if missing)
    if (audit?.contact_path === false) {
      score += 10;
      conversion_score += 10;
      reasons.push('No obvious contact or enquiry path found on the homepage');
      isStrongSite = false;
    }

    // Missing useful title / description (+5)
    if (!audit?.title || audit.title.trim().length < 5 || !audit?.description || audit.description.trim().length < 10) {
      score += 5;
      website_score += 5;
      reasons.push('Missing standard SEO meta title and description');
      isStrongSite = false;
    }

    // Navigation / Observation check (+5)
    if (audit?.observations && audit.observations.toLowerCase().includes('navigation missing')) {
      score += 5;
      conversion_score += 5;
      reasons.push('Navigation links or menu structure are missing or broken');
      isStrongSite = false;
    }

    // Strong existing website penalty (-35)
    if (
      isStrongSite &&
      audit?.https_enabled === true &&
      audit?.mobile_ready === true &&
      audit?.contact_path === true &&
      audit?.title &&
      audit?.description
    ) {
      score -= 35;
      website_score -= 35;
      reasons.push('Strong existing web presence with HTTPS, mobile responsiveness, and clear contact path');
    }
  } else {
    // Unverified website
    score += 15;
    website_score += 15;
    reasons.push('Website presence is unverified; potential overhaul needed');
  }

  // Business fit scoring based on outreach reachability (+10 for verified phone/email/social)
  const hasPhone = Boolean(business.public_phone && business.public_phone.trim().length >= 7);
  const hasEmail = Boolean(business.public_email && business.public_email.trim().length > 3);
  const hasSocial = Boolean(business.social_url && business.social_url.trim().length > 5);

  if (hasPhone || hasEmail) {
    score += 10;
    business_fit_score += 10;
    reasons.push('Direct verified public contact details available for outreach');
  } else if (hasSocial) {
    score += 5;
    business_fit_score += 5;
    reasons.push('Public social profile available for outreach');
  } else {
    reasons.push('No direct contact information verified yet');
  }

  // Clamp score between 0 and 100
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score: finalScore,
    website_score,
    mobile_score,
    conversion_score,
    business_fit_score,
    reasons
  };
}
