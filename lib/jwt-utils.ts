/**
 * JWT token utilities for decoding and checking expiration.
 * 
 * JWT tokens are base64url-encoded JSON objects with three parts:
 * header.payload.signature
 * 
 * We decode the payload to check the expiration (exp) claim.
 */

interface JWTPayload {
  exp?: number; // Expiration time (Unix timestamp)
  iat?: number; // Issued at time
  sub?: string; // Subject (user ID)
  [key: string]: unknown; // Other claims
}

/**
 * Decode JWT token payload without verification.
 * This is safe for checking expiration since we're not verifying the signature.
 * 
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode payload (second part)
    const payload = parts[1];
    
    // Base64URL decode (replace - with +, _ with /, add padding if needed)
    let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }

    // Decode and parse JSON
    const decoded = atob(base64);
    return JSON.parse(decoded) as JWTPayload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired.
 * 
 * @param token - JWT token string
 * @returns true if token is expired or invalid, false if valid
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  
  if (!payload || !payload.exp) {
    // If no expiration claim, consider it invalid/expired
    return true;
  }

  // exp is a Unix timestamp in seconds
  // Compare with current time (also in seconds)
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

/**
 * Get token expiration time as a Date object.
 * 
 * @param token - JWT token string
 * @returns Expiration date or null if invalid
 */
export function getTokenExpiration(token: string): Date | null {
  const payload = decodeJWT(token);
  
  if (!payload || !payload.exp) {
    return null;
  }

  // exp is in seconds, Date expects milliseconds
  return new Date(payload.exp * 1000);
}

/**
 * Get time until token expires in milliseconds.
 * 
 * @param token - JWT token string
 * @returns Milliseconds until expiration, or null if invalid/expired
 */
export function getTimeUntilExpiration(token: string): number | null {
  const payload = decodeJWT(token);
  
  if (!payload || !payload.exp) {
    return null;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const timeUntilExpiration = payload.exp - currentTime;
  
  if (timeUntilExpiration <= 0) {
    return null; // Already expired
  }

  // Convert to milliseconds
  return timeUntilExpiration * 1000;
}

