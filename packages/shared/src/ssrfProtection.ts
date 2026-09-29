export interface SsrCheckResult {
  isSafe: boolean;
  reason?: string;
  normalizedUrl?: string;
}

/**
 * Validates whether a target URL is safe to fetch and not pointing to local/private/internal resources.
 */
export function isSafeTargetUrl(targetUrl: string | null | undefined): SsrCheckResult {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return { isSafe: false, reason: 'URL is empty or invalid.' };
  }

  let cleaned = targetUrl.trim();
  if (!cleaned.includes('://')) {
    // If no scheme present, default to https://
    cleaned = 'https://' + cleaned;
  }

  let parsed: URL;
  try {
    parsed = new URL(cleaned);
  } catch {
    return { isSafe: false, reason: 'Invalid URL format.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isSafe: false, reason: `Unsupported protocol: ${parsed.protocol}. Only http and https are permitted.` };
  }

  let hostname = parsed.hostname.toLowerCase().trim();

  // Strip IPv6 brackets if present for evaluation
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    hostname = hostname.slice(1, -1);
  }

  // 1. Localhost and internal TLDs
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === '0.0.0.0'
  ) {
    return { isSafe: false, reason: 'Access to localhost and internal domain names is blocked.' };
  }

  // 2. IPv4 Checks
  // Check loopback 127.0.0.0/8
  if (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return { isSafe: false, reason: 'Access to loopback IP addresses is blocked.' };
  }

  // Check 10.0.0.0/8 (RFC 1918)
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return { isSafe: false, reason: 'Access to private network range 10.0.0.0/8 is blocked.' };
  }

  // Check 172.16.0.0/12 (172.16.0.0 - 172.31.255.255) (RFC 1918)
  const rfc172Match = hostname.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (rfc172Match) {
    const secondOctet = parseInt(rfc172Match[1], 10);
    if (secondOctet >= 16 && secondOctet <= 31) {
      return { isSafe: false, reason: 'Access to private network range 172.16.0.0/12 is blocked.' };
    }
  }

  // Check 192.168.0.0/16 (RFC 1918)
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return { isSafe: false, reason: 'Access to private network range 192.168.0.0/16 is blocked.' };
  }

  // Check 169.254.0.0/16 (Link-local & AWS/GCP/Azure Cloud Metadata 169.254.169.254)
  if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return { isSafe: false, reason: 'Access to link-local and cloud metadata addresses is blocked.' };
  }

  // Check 100.64.0.0/10 (Carrier-Grade NAT)
  const cgnatMatch = hostname.match(/^100\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (cgnatMatch) {
    const secondOctet = parseInt(cgnatMatch[1], 10);
    if (secondOctet >= 64 && secondOctet <= 127) {
      return { isSafe: false, reason: 'Access to carrier-grade NAT addresses is blocked.' };
    }
  }

  // 3. IPv6 Checks
  if (
    hostname === '::1' ||
    hostname === '::' ||
    hostname.startsWith('fe80:') ||
    hostname.startsWith('fc00:') ||
    hostname.startsWith('fd00:') ||
    hostname.startsWith('::ffff:127.') ||
    hostname.startsWith('::ffff:10.') ||
    hostname.startsWith('::ffff:192.168.') ||
    hostname.startsWith('::ffff:169.254.')
  ) {
    return { isSafe: false, reason: 'Access to private IPv6 addresses is blocked.' };
  }

  return {
    isSafe: true,
    normalizedUrl: cleaned,
  };
}

export interface SafeFetchOptions {
  maxRedirects?: number;
  maxSizeBytes?: number;
  timeoutMs?: number;
  userAgent?: string;
}

export interface SafeFetchResult {
  ok: boolean;
  status: number;
  statusText: string;
  finalUrl: string;
  html: string;
}

/**
 * Safely fetches an HTTP/HTTPS URL with:
 * - SSRF protection on initial request and every subsequent redirect
 * - Redirect limit cap (default: 3)
 * - Response size cap (default: 2 MB)
 * - Strict timeout (default: 6000ms)
 */
export async function safeFetchHtml(
  targetUrl: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  const maxRedirects = options.maxRedirects ?? 3;
  const maxSizeBytes = options.maxSizeBytes ?? 2 * 1024 * 1024; // 2 MB
  const timeoutMs = options.timeoutMs ?? 6000;
  const userAgent =
    options.userAgent ||
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ClientFinder/1.0';

  let currentUrl = targetUrl;
  let redirectCount = 0;

  while (redirectCount <= maxRedirects) {
    const safety = isSafeTargetUrl(currentUrl);
    if (!safety.isSafe) {
      throw new Error(`SSRF Guard: ${safety.reason}`);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(currentUrl, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'manual', // Handle redirects manually to validate destination IPs
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      clearTimeout(timer);

      // Handle redirect status codes (301, 302, 303, 307, 308)
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        redirectCount++;
        if (redirectCount > maxRedirects) {
          throw new Error(`Exceeded maximum redirect limit of ${maxRedirects}.`);
        }

        const locationHeader = response.headers.get('location');
        if (!locationHeader) {
          throw new Error(`Redirect response (${response.status}) missing Location header.`);
        }

        // Resolve relative redirects against current URL
        const nextUrl = new URL(locationHeader, currentUrl).toString();
        const nextSafety = isSafeTargetUrl(nextUrl);
        if (!nextSafety.isSafe) {
          throw new Error(`SSRF Guard: Blocked redirect to unsafe URL: ${nextSafety.reason}`);
        }

        currentUrl = nextUrl;
        continue;
      }

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          statusText: response.statusText,
          finalUrl: currentUrl,
          html: '',
        };
      }

      // Check Content-Length header if available
      const contentLengthHeader = response.headers.get('content-length');
      if (contentLengthHeader) {
        const contentLength = parseInt(contentLengthHeader, 10);
        if (contentLength > maxSizeBytes) {
          throw new Error(`Response size (${contentLength} bytes) exceeds maximum limit of ${maxSizeBytes} bytes.`);
        }
      }

      // Read text with size boundary
      const fullText = await response.text();
      const html = fullText.length > maxSizeBytes ? fullText.slice(0, maxSizeBytes) : fullText;

      return {
        ok: true,
        status: response.status,
        statusText: response.statusText,
        finalUrl: currentUrl,
        html,
      };
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error(`Website request timed out after ${timeoutMs}ms.`);
      }
      throw err;
    }
  }

  throw new Error(`Exceeded maximum redirect limit of ${maxRedirects}.`);
}
