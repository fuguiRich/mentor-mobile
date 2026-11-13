import { api } from '../lib/api'
import type {
  AuthProfile,
  AuthTokens,
  ChangePasswordPayload,
  LoginPayload,
  UserProfile,
} from './types'

export const authApi = {
  login(payload: LoginPayload) {
    return api.post<AuthTokens>('/auth/login', payload, { auth: false })
  },
  logout(refreshToken: string) {
    return api.post<null>('/auth/logout', { refreshToken })
  },
  profile() {
    return api.get<AuthProfile>('/auth/profile')
  },
  changePassword(payload: ChangePasswordPayload) {
    return api.put<UserProfile>('/auth/password', payload)
  },
}
