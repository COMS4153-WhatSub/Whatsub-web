/**
 * Payload signature utilities for HMAC-SHA256 signing.
 * 
 * This module provides functions to sign request payloads to ensure
 * authenticity and integrity when payload signature verification is enabled.
 */

/**
 * Generate HMAC-SHA256 signature for a payload using Web Crypto API.
 * 
 * @param payload - The request payload object
 * @param secretKey - Shared secret key for signing
 * @returns Promise that resolves to hexadecimal signature string
 */
export async function generatePayloadSignature(
  payload: Record<string, unknown>,
  secretKey: string
): Promise<string> {
  if (typeof window === 'undefined' || !crypto?.subtle) {
    console.warn('Web Crypto API not available. Payload signing skipped.');
    return '';
  }

  // Sort keys to ensure consistent serialization (same as backend)
  // Backend uses: json.dumps(payload, sort_keys=True, separators=(',', ':'))
  // We need to match this exactly - create sorted object first
  const sortedKeys = Object.keys(payload).sort();
  const sortedPayloadObj: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    sortedPayloadObj[key] = payload[key];
  }
  // Stringify with no whitespace to match Python's separators=(',', ':')
  const compactPayload = JSON.stringify(sortedPayloadObj);
  
  // Use Web Crypto API for HMAC-SHA256
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const payloadData = encoder.encode(compactPayload);
  
  try {
    // Import key for HMAC
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Sign the payload
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, payloadData);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Error generating payload signature:', error);
    return '';
  }
}

