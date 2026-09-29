import { describe, it, expect } from 'vitest';
import {
  normalizeBusinessName,
  normalizeDomain,
  normalizePhone,
  normalizeCity,
} from '@client-finder/shared';

describe('Normalizer Utilities', () => {
  describe('normalizeBusinessName', () => {
    it('removes common legal suffixes and collapses extra spaces', () => {
      expect(normalizeBusinessName('ABC Cricket Academy Pvt Ltd')).toBe('abc cricket academy');
      expect(normalizeBusinessName('Zenith Fitness LLC')).toBe('zenith fitness');
      expect(normalizeBusinessName('Spice Garden Inc.')).toBe('spice garden');
      expect(normalizeBusinessName('Apex   Sports   Company')).toBe('apex sports');
    });

    it('handles special characters and punctuation safely', () => {
      expect(normalizeBusinessName('The Best-Bakery & Cafe #1!')).toBe('the best bakery cafe 1');
    });
  });

  describe('normalizeDomain', () => {
    it('extracts hostname and strips protocols, www, ports, paths, and queries', () => {
      expect(normalizeDomain('https://www.example.com/contact-us?utm=test#form')).toBe('example.com');
      expect(normalizeDomain('http://subdomain.local-biz.org:8080/')).toBe('subdomain.local-biz.org');
      expect(normalizeDomain('cricketacademychennai.in/fees/')).toBe('cricketacademychennai.in');
    });

    it('returns null for invalid or blank URLs', () => {
      expect(normalizeDomain('')).toBeNull();
      expect(normalizeDomain(null)).toBeNull();
      expect(normalizeDomain(undefined)).toBeNull();
    });
  });

  describe('normalizePhone', () => {
    it('retains digits and preserves leading plus sign for international numbers', () => {
      expect(normalizePhone('+91 (984) 012-3456')).toBe('+919840123456');
      expect(normalizePhone('044-2456-7890')).toBe('04424567890');
      expect(normalizePhone('+1 800 555 0199')).toBe('+18005550199');
    });

    it('returns null for numbers that are too short to be valid', () => {
      expect(normalizePhone('123')).toBeNull();
      expect(normalizePhone('')).toBeNull();
      expect(normalizePhone(null)).toBeNull();
    });
  });

  describe('normalizeCity', () => {
    it('trims and normalizes casing', () => {
      expect(normalizeCity('  Chennai  ')).toBe('chennai');
      expect(normalizeCity('New Delhi ')).toBe('new delhi');
      expect(normalizeCity(null)).toBe('unknown');
    });
  });
});
