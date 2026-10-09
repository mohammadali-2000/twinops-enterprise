/**
 * Shared SSRF guards for any URL a user can save through Settings and that
 * the server later fetches on its own (Jira base URL, Teams webhook URL).
 */

function isPrivateIPv4(hostname: string): boolean {
  const match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return false;
  const [a, b] = [Number(match[1]), Number(match[2])];
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 169 && b === 254) return true; // link-local / cloud metadata (169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  return false;
}

function isPrivateIPv6(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "::1") return true; // loopback
  if (h.startsWith("fc") || h.startsWith("fd")) return true; // unique local fc00::/7
  if (h.startsWith("fe80")) return true; // link-local fe80::/10
  return false;
}

/** Blocks loopback, private LAN ranges, and the cloud metadata address. Does not resolve DNS. */
export function isPrivateOrLocalHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (isPrivateIPv4(h)) return true;
  if (h.includes(":") && isPrivateIPv6(h)) return true;
  return false;
}

/** https-only and not pointed at an internal/loopback/metadata address. */
export function isSafeExternalUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !isPrivateOrLocalHost(url.hostname);
  } catch {
    return false;
  }
}

const MICROSOFT_WEBHOOK_HOST_SUFFIXES = [
  ".logic.azure.com",
  ".powerplatform.com",
  ".powerautomate.com",
  ".webhook.office.com",
];

/** Teams/Power Automate webhooks must additionally be on a Microsoft-owned host. */
export function isMicrosoftWebhookUrl(value: unknown): value is string {
  if (!isSafeExternalUrl(value)) return false;
  const url = new URL(value);
  return MICROSOFT_WEBHOOK_HOST_SUFFIXES.some((suffix) => url.hostname.endsWith(suffix));
}
