import { Business, NormalizedLead } from './types';
import { normalizeBusinessName, normalizeCity, normalizeDomain, normalizePhone } from './normalizer';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedLead?: Business;
  reason?: string;
  matchType?: 'NAME_AND_CITY' | 'DOMAIN' | 'PHONE';
}

/**
 * Checks if a candidate lead is a duplicate of any existing leads.
 * Rules:
 * 1. Matching normalized domain (if both have non-empty valid domain)
 * 2. Matching normalized public phone (if both have non-empty valid phone with >= 7 digits)
 * 3. Matching normalized business name + normalized city (exact normalized match)
 */
export function findDuplicateMatch(
  candidate: NormalizedLead,
  existingLeads: Business[]
): DuplicateCheckResult {
  const candName = candidate.normalized_name;
  const candCity = normalizeCity(candidate.city);
  const candDomain = candidate.normalized_domain;
  const candPhone = normalizePhone(candidate.public_phone);

  for (const existing of existingLeads) {
    // 1. Domain match
    if (candDomain && existing.normalized_domain && candDomain === existing.normalized_domain) {
      return {
        isDuplicate: true,
        matchedLead: existing,
        reason: `Matches existing domain: ${candDomain}`,
        matchType: 'DOMAIN'
      };
    }

    // 2. Phone match
    const existingPhone = normalizePhone(existing.public_phone);
    if (candPhone && existingPhone && candPhone === existingPhone) {
      return {
        isDuplicate: true,
        matchedLead: existing,
        reason: `Matches existing phone: ${candPhone}`,
        matchType: 'PHONE'
      };
    }

    // 3. Name + City match
    const existingNormName = existing.normalized_name || normalizeBusinessName(existing.name);
    const existingCity = normalizeCity(existing.city);

    if (candName && existingNormName && candName === existingNormName && candCity === existingCity) {
      return {
        isDuplicate: true,
        matchedLead: existing,
        reason: `Matches existing name "${existing.name}" in ${existing.city}`,
        matchType: 'NAME_AND_CITY'
      };
    }
  }

  return {
    isDuplicate: false
  };
}
