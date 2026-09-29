import { normalizePhone } from './normalizer';

export interface ContactActionResult {
  url: string;
  channel: 'WHATSAPP' | 'EMAIL' | 'GENERIC_DM' | 'WEBSITE';
  isDemo: boolean;
  isValid: boolean;
  error?: string;
}

/**
 * Builds a WhatsApp wa.me click-to-chat URL.
 * Protects demo businesses from triggering real external outreach.
 */
export function buildWhatsAppUrl(
  rawPhone: string | null | undefined,
  message: string,
  isDemo = false
): ContactActionResult {
  if (isDemo) {
    return {
      url: '#demo-mode-whatsapp-prevented',
      channel: 'WHATSAPP',
      isDemo: true,
      isValid: true,
      error: 'Demo lead: External communication disabled to prevent real messages during testing.'
    };
  }

  const phone = normalizePhone(rawPhone);
  if (!phone) {
    return {
      url: '',
      channel: 'WHATSAPP',
      isDemo: false,
      isValid: false,
      error: 'No valid phone number available for this business.'
    };
  }

  // wa.me format requires numbers without + or spaces
  const cleanDigits = phone.replace(/\D/g, '');
  const encodedText = encodeURIComponent(message || '');
  const url = `https://wa.me/${cleanDigits}?text=${encodedText}`;

  return {
    url,
    channel: 'WHATSAPP',
    isDemo: false,
    isValid: true
  };
}

/**
 * Builds a standard mailto: link with prefilled subject and body.
 */
export function buildMailtoUrl(
  rawEmail: string | null | undefined,
  subject: string,
  body: string,
  isDemo = false
): ContactActionResult {
  if (isDemo) {
    return {
      url: '#demo-mode-email-prevented',
      channel: 'EMAIL',
      isDemo: true,
      isValid: true,
      error: 'Demo lead: External email disabled to prevent real messages during testing.'
    };
  }

  const email = (rawEmail || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return {
      url: '',
      channel: 'EMAIL',
      isDemo: false,
      isValid: false,
      error: 'No valid email address available for this business.'
    };
  }

  const encodedSubject = encodeURIComponent(subject || 'Website Inquiry');
  const encodedBody = encodeURIComponent(body || '');
  const url = `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;

  return {
    url,
    channel: 'EMAIL',
    isDemo: false,
    isValid: true
  };
}

/**
 * Builds a direct link to public social or contact page.
 */
export function buildSocialContactUrl(
  rawUrl: string | null | undefined,
  isDemo = false
): ContactActionResult {
  if (isDemo) {
    return {
      url: '#demo-mode-social-prevented',
      channel: 'GENERIC_DM',
      isDemo: true,
      isValid: true,
      error: 'Demo lead: External link disabled to prevent real interaction during testing.'
    };
  }

  const url = (rawUrl || '').trim();
  if (!url) {
    return {
      url: '',
      channel: 'GENERIC_DM',
      isDemo: false,
      isValid: false,
      error: 'No public social profile or contact URL available.'
    };
  }

  let finalUrl = url;
  if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
    finalUrl = 'https://' + finalUrl;
  }

  return {
    url: finalUrl,
    channel: 'GENERIC_DM',
    isDemo: false,
    isValid: true
  };
}
