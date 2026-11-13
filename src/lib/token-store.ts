import type { AuthTokens } from '../api/types'

const STORAGE_KEY = 'mentor-mobile.auth.tokens'

interface StoredTokens extends AuthTokens {
  obtainedAt: number
}

function read(): StoredTokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredTokens
    if (
      typeof parsed.accessToken !== 'string' ||
      typeof parsed.refreshToken !== 'string'
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveTokens(tokens: AuthTokens): void {
  const stored: StoredTokens = { ...tokens, obtainedAt: Date.now() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
}

export function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function getAccessToken(): string | null {
  return read()?.accessToken ?? null
}

export function getRefreshToken(): string | null {
  return read()?.refreshToken ?? null
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== null
}
