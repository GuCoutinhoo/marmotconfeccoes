/**
 * Unified client authentication token and headers resolution.
 * Supports both standard '@marmot_auth_token' and legacy 'marmot_auth_token',
 * as well as Supabase session keys and session storage.
 */

export function getStoredAuthToken(explicitToken?: string | null): string | null {
  if (explicitToken && typeof explicitToken === 'string' && explicitToken.trim().length > 0) {
    const clean = explicitToken.trim();
    syncStoredTokens(clean);
    return clean;
  }

  if (typeof window === 'undefined') return null;

  try {
    const storageCandidates = [
      localStorage.getItem('@marmot_auth_token'),
      localStorage.getItem('marmot_auth_token'),
      localStorage.getItem('marmot_admin_token'),
      sessionStorage.getItem('@marmot_auth_token'),
      sessionStorage.getItem('marmot_auth_token'),
      sessionStorage.getItem('marmot_admin_token'),
      localStorage.getItem('supabase.auth.token'),
    ];

    for (const cand of storageCandidates) {
      if (cand && typeof cand === 'string' && cand.trim().length > 0) {
        const clean = cand.trim();
        syncStoredTokens(clean);
        return clean;
      }
    }

    // Inspect Supabase storage keys in localStorage (e.g. sb-*-auth-token)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.access_token && typeof parsed.access_token === 'string') {
              const clean = parsed.access_token.trim();
              syncStoredTokens(clean);
              return clean;
            }
          }
        } catch {}
      }
    }
  } catch (err) {
    console.warn('[AUTH] Error resolving stored auth token:', err);
  }

  return null;
}

/**
 * Ensures all known localStorage / sessionStorage auth keys are in sync
 */
export function syncStoredTokens(token: string): void {
  if (typeof window === 'undefined' || !token) return;
  try {
    localStorage.setItem('@marmot_auth_token', token);
    localStorage.setItem('marmot_auth_token', token);
  } catch {}
}

/**
 * Returns complete HTTP headers for authenticated and admin API calls.
 */
export function getAuthHeaders(
  explicitToken?: string | null,
  additionalHeaders?: Record<string, string>
): Record<string, string> {
  const token = getStoredAuthToken(explicitToken);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-auth-token'] = token;
    headers['x-admin-token'] = token;
  }

  return headers;
}
