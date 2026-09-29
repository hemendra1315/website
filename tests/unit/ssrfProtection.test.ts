import { describe, it, expect } from 'vitest';
import { isSafeTargetUrl, safeFetchHtml } from '../../packages/shared/src/ssrfProtection';

describe('SSRF Protection Guardrails', () => {
  it('blocks loopback and localhost hosts', () => {
    expect(isSafeTargetUrl('http://localhost').isSafe).toBe(false);
    expect(isSafeTargetUrl('http://127.0.0.1').isSafe).toBe(false);
    expect(isSafeTargetUrl('http://127.0.0.2:8080').isSafe).toBe(false);
    expect(isSafeTargetUrl('http://[::1]').isSafe).toBe(false);
    expect(isSafeTargetUrl('http://0.0.0.0').isSafe).toBe(false);
  });

  it('blocks cloud metadata IP 169.254.169.254 and link-local ranges', () => {
    expect(isSafeTargetUrl('http://169.254.169.254/latest/meta-data').isSafe).toBe(false);
    expect(isSafeTargetUrl('http://169.254.1.1').isSafe).toBe(false);
    expect(isSafeTargetUrl('http://[fe80::1]').isSafe).toBe(false);
  });

  it('blocks RFC 1918 private ranges (10.x, 172.16-31.x, 192.168.x)', () => {
    expect(isSafeTargetUrl('http://10.0.0.1').isSafe).toBe(false);
    expect(isSafeTargetUrl('http://10.255.255.255').isSafe).toBe(false);
    expect(isSafeTargetUrl('http://172.16.0.1').isSafe).toBe(false);
    expect(isSafeTargetUrl('http://172.31.255.255').isSafe).toBe(false);
    expect(isSafeTargetUrl('http://192.168.0.1').isSafe).toBe(false);
    expect(isSafeTargetUrl('http://192.168.1.100').isSafe).toBe(false);
  });

  it('blocks non-HTTP/HTTPS protocols', () => {
    expect(isSafeTargetUrl('file:///etc/passwd').isSafe).toBe(false);
    expect(isSafeTargetUrl('ftp://example.com').isSafe).toBe(false);
    expect(isSafeTargetUrl('gopher://example.com').isSafe).toBe(false);
  });

  it('allows valid public domain names', () => {
    expect(isSafeTargetUrl('https://example.com').isSafe).toBe(true);
    expect(isSafeTargetUrl('https://chennaicricketacademy.in/about').isSafe).toBe(true);
    expect(isSafeTargetUrl('http://subdomain.business.co.uk').isSafe).toBe(true);
  });
});
