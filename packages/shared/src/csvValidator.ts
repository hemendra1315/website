import { RawLeadInput, NormalizedLead, ImportRowValidation } from './types';
import { normalizeBusinessName, normalizeCity, normalizeDomain, normalizePhone } from './normalizer';
import { findDuplicateMatch } from './deduplication';
import { Business } from './types';

/**
 * Validates and normalizes a single raw row input.
 */
export function validateAndNormalizeLeadRow(
  raw: RawLeadInput,
  rowNumber: number,
  existingLeads: Business[] = []
): ImportRowValidation {
  const errors: string[] = [];

  // Name is required
  const rawName = (raw.name || '').trim();
  if (!rawName) {
    errors.push('Business name is required.');
  }

  // Category and City defaults if blank
  const category = (raw.category || 'General Business').trim();
  const city = (raw.city || 'Unknown').trim();

  // Validate email if present
  let cleanEmail: string | null = null;
  if (raw.email && raw.email.trim()) {
    const emailCandidate = raw.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailCandidate)) {
      errors.push(`Invalid email address format: "${raw.email}"`);
    } else {
      cleanEmail = emailCandidate.toLowerCase();
    }
  }

  // Normalize phone if present
  let cleanPhone: string | null = null;
  if (raw.phone && raw.phone.trim()) {
    cleanPhone = normalizePhone(raw.phone);
    if (!cleanPhone && raw.phone.trim().length > 0) {
      errors.push(`Invalid phone format: "${raw.phone}"`);
    }
  }

  // Normalize website & domain
  let cleanWebsite: string | null = null;
  let normalizedDomain: string | null = null;
  if (raw.website && raw.website.trim()) {
    cleanWebsite = raw.website.trim();
    if (!cleanWebsite.startsWith('http://') && !cleanWebsite.startsWith('https://')) {
      cleanWebsite = 'https://' + cleanWebsite;
    }
    normalizedDomain = normalizeDomain(cleanWebsite);
  }

  const normalizedName = normalizeBusinessName(rawName);

  const normalized: NormalizedLead = {
    name: rawName,
    normalized_name: normalizedName,
    category: category,
    city: city,
    address: raw.address ? raw.address.trim() : null,
    public_phone: cleanPhone,
    public_email: cleanEmail,
    website: cleanWebsite,
    normalized_domain: normalizedDomain,
    social_url: raw.social_url ? raw.social_url.trim() : null,
    source_url: raw.source_url ? raw.source_url.trim() : null,
    source_type: raw.source_type || 'CSV',
    is_demo: Boolean(raw.is_demo || rawName.toUpperCase().includes('DEMO'))
  };

  const isValid = errors.length === 0;

  // Duplicate check only if valid
  let isDuplicate = false;
  let duplicateReason: string | undefined;
  let matchedExistingId: string | undefined;

  if (isValid) {
    const dupResult = findDuplicateMatch(normalized, existingLeads);
    if (dupResult.isDuplicate) {
      isDuplicate = true;
      duplicateReason = dupResult.reason;
      matchedExistingId = dupResult.matchedLead?.id;
    }
  }

  return {
    rowNumber,
    data: raw,
    normalized: isValid ? normalized : undefined,
    isValid,
    errors,
    isDuplicate,
    duplicateReason,
    matchedExistingId
  };
}

/**
 * Escapes strings to prevent CSV Formula Injection in spreadsheet editors (Excel, LibreOffice, Google Sheets).
 * Prefixes cells starting with '=', '+', '-', '@', '\t', '\r' with a single quote.
 */
export function escapeCsvFormulaInjection(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (!str) return '';

  // Check if string starts with formula triggers or whitespace followed by formula triggers
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }

  return str;
}
