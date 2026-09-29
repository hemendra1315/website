import { describe, it, expect } from 'vitest';
import { normalizePhone, buildWhatsAppUrl } from '../../packages/shared/src';

describe('Indian Phone Number Normalization & wa.me', () => {
  it('normalizes 10-digit Indian mobile numbers starting with 6-9 to +91', () => {
    expect(normalizePhone('9840199999')).toBe('+919840199999');
    expect(normalizePhone('8870123456')).toBe('+918870123456');
    expect(normalizePhone('7358123456')).toBe('+917358123456');
    expect(normalizePhone('6380123456')).toBe('+916380123456');
  });

  it('handles leading 0 for Indian mobile numbers', () => {
    expect(normalizePhone('09840199999')).toBe('+919840199999');
    expect(normalizePhone('0 98401 99999')).toBe('+919840199999');
  });

  it('handles 91 prefix without leading +', () => {
    expect(normalizePhone('919840199999')).toBe('+919840199999');
    expect(normalizePhone('91-98401-99999')).toBe('+919840199999');
  });

  it('handles +91 formatted numbers with spaces and dashes', () => {
    expect(normalizePhone('+91 98401 99999')).toBe('+919840199999');
    expect(normalizePhone('+91-98401-99999')).toBe('+919840199999');
    expect(normalizePhone('+91 (98401) 99999')).toBe('+919840199999');
  });

  it('builds valid wa.me URLs with full international country code', () => {
    const res = buildWhatsAppUrl('9840199999', 'Hello there', false);
    expect(res.isValid).toBe(true);
    expect(res.url).toContain('https://wa.me/919840199999?text=Hello%20there');
  });
});
