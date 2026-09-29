import { describe, it, expect } from 'vitest';
import { validateAndNormalizeLeadRow, RawLeadInput } from '@client-finder/shared';

describe('CSV Lead Validation & Normalization', () => {
  it('validates a complete, valid lead row', () => {
    const raw: RawLeadInput = {
      name: 'Super Cricket Academy',
      category: 'Cricket Academy',
      city: 'Chennai',
      address: '15 Mount Road',
      phone: '+91 98401 12345',
      email: 'info@supercricket.com',
      website: 'www.supercricket.com',
      social_url: 'https://instagram.com/supercricket',
      source_url: 'CSV Import',
    };

    const res = validateAndNormalizeLeadRow(raw, 1, []);
    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
    expect(res.normalized).toBeDefined();
    expect(res.normalized?.name).toBe('Super Cricket Academy');
    expect(res.normalized?.normalized_domain).toBe('supercricket.com');
    expect(res.normalized?.public_phone).toBe('+919840112345');
  });

  it('rejects rows with missing business name', () => {
    const raw: RawLeadInput = {
      name: '',
      category: 'Cricket',
      city: 'Chennai',
    };

    const res = validateAndNormalizeLeadRow(raw, 2, []);
    expect(res.isValid).toBe(false);
    expect(res.errors).toContain('Business name is required.');
  });

  it('rejects rows with invalid email formats', () => {
    const raw: RawLeadInput = {
      name: 'Test Business',
      email: 'not-an-email-at-all',
    };

    const res = validateAndNormalizeLeadRow(raw, 3, []);
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.includes('Invalid email address format'))).toBe(true);
  });

  it('flags demo businesses accurately', () => {
    const raw: RawLeadInput = {
      name: 'DEMO Royal Fitness Studio',
      city: 'Chennai',
    };

    const res = validateAndNormalizeLeadRow(raw, 4, []);
    expect(res.isValid).toBe(true);
    expect(res.normalized?.is_demo).toBe(true);
  });
});
