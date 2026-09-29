import { describe, it, expect } from 'vitest';
import { findDuplicateMatch, Business, NormalizedLead } from '@client-finder/shared';

describe('Deduplication Engine', () => {
  const existingLeads: Business[] = [
    {
      id: 'lead-1',
      name: 'ABC Cricket Academy',
      normalized_name: 'abc cricket academy',
      category: 'Cricket Academy',
      city: 'Chennai',
      address: '12 Anna Salai',
      public_phone: '+919840123456',
      public_email: 'contact@abc.com',
      website: 'https://abccricket.com',
      normalized_domain: 'abccricket.com',
      social_url: null,
      source_url: 'CSV',
      source_type: 'CSV',
      status: 'NEW',
      do_not_contact: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'lead-2',
      name: 'Zenith Fitness Studio',
      normalized_name: 'zenith fitness studio',
      category: 'Fitness Studio',
      city: 'Bangalore',
      address: '88 Indiranagar',
      public_phone: '+919840222222',
      public_email: 'info@zenithfit.com',
      website: 'https://zenithfit.com',
      normalized_domain: 'zenithfit.com',
      social_url: null,
      source_url: 'CSV',
      source_type: 'CSV',
      status: 'QUALIFIED',
      do_not_contact: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  it('detects duplicate by matching normalized domain', () => {
    const candidate: NormalizedLead = {
      name: 'ABC Sports Coaching',
      normalized_name: 'abc sports coaching',
      category: 'Sports',
      city: 'Chennai',
      address: null,
      public_phone: '+919999999999',
      public_email: 'other@mail.com',
      website: 'http://www.abccricket.com/about',
      normalized_domain: 'abccricket.com',
      social_url: null,
      source_url: 'URL',
      source_type: 'PUBLIC_URL',
      is_demo: false,
    };

    const match = findDuplicateMatch(candidate, existingLeads);
    expect(match.isDuplicate).toBe(true);
    expect(match.matchType).toBe('DOMAIN');
    expect(match.matchedLead?.id).toBe('lead-1');
  });

  it('detects duplicate by matching normalized public phone', () => {
    const candidate: NormalizedLead = {
      name: 'New Coaching Academy',
      normalized_name: 'new coaching academy',
      category: 'Cricket',
      city: 'Chennai',
      address: null,
      public_phone: '+91 98401 23456', // formatted version of lead-1
      public_email: null,
      website: null,
      normalized_domain: null,
      social_url: null,
      source_url: 'CSV',
      source_type: 'CSV',
      is_demo: false,
    };

    const match = findDuplicateMatch(candidate, existingLeads);
    expect(match.isDuplicate).toBe(true);
    expect(match.matchType).toBe('PHONE');
    expect(match.matchedLead?.id).toBe('lead-1');
  });

  it('detects duplicate by matching normalized name + city', () => {
    const candidate: NormalizedLead = {
      name: 'ABC Cricket Academy Pvt. Ltd.',
      normalized_name: 'abc cricket academy',
      category: 'Cricket Coaching',
      city: 'Chennai',
      address: null,
      public_phone: null,
      public_email: null,
      website: null,
      normalized_domain: null,
      social_url: null,
      source_url: 'CSV',
      source_type: 'CSV',
      is_demo: false,
    };

    const match = findDuplicateMatch(candidate, existingLeads);
    expect(match.isDuplicate).toBe(true);
    expect(match.matchType).toBe('NAME_AND_CITY');
    expect(match.matchedLead?.id).toBe('lead-1');
  });

  it('does NOT merge businesses with vaguely similar names in different cities', () => {
    const candidate: NormalizedLead = {
      name: 'ABC Cricket Academy',
      normalized_name: 'abc cricket academy',
      category: 'Cricket Academy',
      city: 'Mumbai', // Different city
      address: null,
      public_phone: '+919840999999',
      public_email: null,
      website: 'https://mumbaicricket.com',
      normalized_domain: 'mumbaicricket.com',
      social_url: null,
      source_url: 'CSV',
      source_type: 'CSV',
      is_demo: false,
    };

    const match = findDuplicateMatch(candidate, existingLeads);
    expect(match.isDuplicate).toBe(false);
  });
});
