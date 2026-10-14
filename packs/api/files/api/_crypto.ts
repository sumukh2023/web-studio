/**
 * Small, dependency-free crypto helpers on Web Crypto (global in Node 20+).
 */

const encoder = new TextEncoder();

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const hex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

/** URL-safe random token (default 24 bytes, about 192 bits of entropy). */
export function randomToken(bytes = 24): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return hex(new Uint8Array(digest));
}

async function hmac(secret: string, value: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

/**
 * HMAC-SHA256, hex. Makes a value the server generated provable when it comes
 * back from a client that could have edited it in between.
 */
export async function hmacHex(secret: string, value: string): Promise<string> {
  return hex(await hmac(secret, value));
}

/** HMAC-SHA256 in URL-safe base64: the alphabet a token can travel in a path. */
export async function hmacBase64Url(secret: string, value: string): Promise<string> {
  return base64Url(await hmac(secret, value));
}

/** Constant-time compare, so a secret cannot be recovered by timing. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
