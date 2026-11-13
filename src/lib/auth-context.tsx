import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api/auth'
import type { AuthProfile, LoginPayload } from '../api/types'
import { setUnauthorizedHandler } from './api'
import {
  clearTokens,
  getRefreshToken,
  isAuthenticated,
  saveTokens,
} from './token-store'

const PROFILE_KEY = ['auth', 'profile'] as const
const LOGIN_NOTICE_KEY = 'mentor-mobile.login-notice'

export interface LoginNotice {
  ssoUnavailable: boolean
  isDefaultPwd: boolean
  loginSource?: 'sso' | 'local' | 'local-fallback'
}

function readLoginNotice(): LoginNotice | null {
  try {
    const raw = sessionStorage.getItem(LOGIN_NOTICE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LoginNotice
    return parsed.ssoUnavailable || parsed.isDefaultPwd ? parsed : null
  } catch {
    return null
  }
}

function writeLoginNotice(notice: LoginNotice | null): void {
  if (!notice || (!notice.ssoUnavailable && !notice.isDefaultPwd)) {
    sessionStorage.removeItem(LOGIN_NOTICE_KEY)
    return
  }
  sessionStorage.setItem(LOGIN_NOTICE_KEY, JSON.stringify(notice))
}

interface AuthContextValue {
  profile: AuthProfile | null
  isLoading: boolean
  signedIn: boolean
  loginNotice: LoginNotice | null
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  hasPermission: (code: string) => boolean
  dismissLoginNotice: (flag?: 'ssoUnavailable' | 'isDefaultPwd') => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [signedIn, setSignedIn] = useState(() => isAuthenticated())
  const [loginNotice, setLoginNotice] = useState<LoginNotice | null>(() =>
    readLoginNotice(),
  )

  const profileQuery = useQuery({
    queryKey: PROFILE_KEY,
    queryFn: authApi.profile,
    enabled: signedIn,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const resetSession = useCallback(() => {
    clearTokens()
    setSignedIn(false)
    setLoginNotice(null)
    writeLoginNotice(null)
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      resetSession()
      void navigate({ to: '/login', replace: true })
    })
    return () => setUnauthorizedHandler(null)
  }, [navigate, resetSession])

  useEffect(() => {
    if (profileQuery.error && !signedIn) {
      queryClient.removeQueries({ queryKey: PROFILE_KEY })
    }
  }, [profileQuery.error, queryClient, signedIn])

  const login = useCallback(
    async (payload: LoginPayload) => {
      const tokens = await authApi.login(payload)
      saveTokens(tokens)
      setSignedIn(true)
      const notice: LoginNotice = {
        ssoUnavailable: tokens.ssoUnavailable === true,
        isDefaultPwd: tokens.isDefaultPwd === true,
        loginSource: tokens.loginSource,
      }
      const hasNotice = notice.ssoUnavailable || notice.isDefaultPwd
      setLoginNotice(hasNotice ? notice : null)
      writeLoginNotice(hasNotice ? notice : null)
      try {
        await queryClient.fetchQuery({
          queryKey: PROFILE_KEY,
          queryFn: authApi.profile,
          staleTime: 0,
        })
      } catch (error) {
        resetSession()
        throw error
      }
    },
    [queryClient, resetSession],
  )

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken()
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } catch {
      // Best effort: a failed logout must still clear the local session.
    }
    resetSession()
    await navigate({ to: '/login', replace: true })
  }, [navigate, resetSession])

  const refreshProfile = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: PROFILE_KEY })
  }, [queryClient])

  const dismissLoginNotice = useCallback(
    (flag?: 'ssoUnavailable' | 'isDefaultPwd') => {
      setLoginNotice((current) => {
        if (!current) return null
        const candidate = flag ? { ...current, [flag]: false } : null
        const next =
          candidate && (candidate.ssoUnavailable || candidate.isDefaultPwd)
            ? candidate
            : null
        writeLoginNotice(next)
        return next
      })
    },
    [],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      profile: profileQuery.data ?? null,
      isLoading: signedIn && profileQuery.isLoading,
      signedIn,
      loginNotice,
      login,
      logout,
      refreshProfile,
      dismissLoginNotice,
      hasPermission: (code: string) => {
        const profile = profileQuery.data
        if (!profile) return false
        return profile.user.isSuperAdmin || profile.permissions.includes(code)
      },
    }),
    [
      profileQuery.data,
      profileQuery.isLoading,
      signedIn,
      loginNotice,
      login,
      logout,
      refreshProfile,
      dismissLoginNotice,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within <AuthProvider>')
  }
  return context
}
