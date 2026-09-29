/**
 * Normalizes a business name by:
 * - Trimming whitespace
 * - Converting to lowercase
 * - Stripping common legal entity suffixes (e.g. LLC, Ltd, Pvt Ltd, Inc, Corp, Co)
 * - Removing non-alphanumeric punctuation (except spaces)
 * - Collapsing multiple spaces
 */
export function normalizeBusinessName(name: string): string {
  if (!name) return '';

  let normalized = name.toLowerCase().trim();

  // Remove common punctuation except alphanumeric and space
  normalized = normalized.replace(/[^\w\s]/gi, ' ');

  // Common corporate suffixes
  const suffixes = [
    '\\bpvt\\s*ltd\\b',
    '\\bprivate\\s*limited\\b',
    '\\blimited\\b',
    '\\bltd\\b',
    '\\bllc\\b',
    '\\binc\\b',
    '\\bcorp\\b',
    '\\bcorporation\\b',
    '\\bco\\b',
    '\\bcompany\\b',
    '\\benterprises\\b',
    '\\bservices\\b'
  ];

  for (const suffix of suffixes) {
    normalized = normalized.replace(new RegExp(suffix, 'gi'), ' ');
  }

  // Collapse multiple whitespaces
  return normalized.replace(/\s+/g, ' ').trim();
}

/**
 * Normalizes a website domain by:
 * - Stripping protocol (http://, https://)
 * - Stripping www.
 * - Stripping path, query params, hash
 * - Stripping trailing slashes and port numbers
 * - Converting to lowercase
 */
export function normalizeDomain(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  let cleaned = rawUrl.trim().toLowerCase();
  if (!cleaned) return null;

  // Add protocol if missing so URL parser works cleanly
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'http://' + cleaned;
  }

  try {
    const parsed = new URL(cleaned);
    let hostname = parsed.hostname.toLowerCase();

    // Strip www.
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }

    // Return hostname only
    return hostname || null;
  } catch {
    // Fallback regex if URL parsing fails
    let domain = rawUrl.toLowerCase().trim();
    domain = domain.replace(/^https?:\/\//i, '');
    domain = domain.replace(/^www\./i, '');
    domain = domain.split('/')[0];
    domain = domain.split('?')[0];
    domain = domain.split('#')[0];
    domain = domain.split(':')[0];
    return domain || null;
  }
}

/**
 * Normalizes phone numbers:
 * - Strips non-digits (except leading +)
 * - Identifies 10-digit Indian mobile numbers starting with 6-9 and prepends +91
 * - Normalizes 0-prefixed or 91-prefixed Indian mobile numbers
 * - Retains international format with + prefix
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone || typeof phone !== 'string') return null;

  const trimmed = phone.trim();
  if (!trimmed) return null;

  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.length < 6) return null; // Too short to be a valid phone number

  // Indian mobile normalization:
  // 1. 10 digits starting with 6, 7, 8, 9
  if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly)) {
    return `+91${digitsOnly}`;
  }

  // 2. 11 digits starting with 0 followed by 6, 7, 8, 9 (Trunk prefix 0)
  if (digitsOnly.length === 11 && /^0[6-9]/.test(digitsOnly)) {
    return `+91${digitsOnly.slice(1)}`;
  }

  // 3. 12 digits starting with 91 followed by 6, 7, 8, 9
  if (digitsOnly.length === 12 && /^91[6-9]/.test(digitsOnly)) {
    return `+91${digitsOnly.slice(2)}`;
  }

  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

/**
 * Normalizes city names:
 * - Trims and title-cases/lowercases standardly
 */
export function normalizeCity(city: string | null | undefined): string {
  if (!city || typeof city !== 'string') return 'unknown';
  return city.trim().toLowerCase().replace(/\s+/g, ' ');
}
