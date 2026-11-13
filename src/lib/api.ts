import type { ApiEnvelope, AuthTokens, FieldError } from '../api/types'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from './token-store'

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
).replace(/\/+$/, '')

export class ApiError extends Error {
  readonly code: number
  readonly status: number
  readonly fields: FieldError[]

  constructor(
    message: string,
    code: number,
    status: number,
    fields: FieldError[] = [],
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.fields = fields
  }
}

type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler | null = null

/** Called when the session cannot be refreshed any more. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler
}

export interface RequestOptions {
  auth?: boolean
  signal?: AbortSignal
}

export function buildQuery(params?: object): string {
  if (!params) return ''
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

function parseFields(data: unknown): FieldError[] {
  if (
    typeof data === 'object' &&
    data !== null &&
    'fields' in data &&
    Array.isArray((data as { fields?: unknown }).fields)
  ) {
    return (data as { fields: FieldError[] }).fields
  }
  return []
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  let envelope: ApiEnvelope<T> | null = null
  try {
    envelope = text ? (JSON.parse(text) as ApiEnvelope<T>) : null
  } catch {
    envelope = null
  }

  if (envelope === null) {
    if (!response.ok) {
      throw new ApiError(
        `请求失败（HTTP ${response.status}）`,
        response.status,
        response.status,
      )
    }
    return undefined as T
  }

  if (envelope.code !== 0) {
    throw new ApiError(
      envelope.message || '请求失败',
      envelope.code,
      response.status,
      parseFields(envelope.data),
    )
  }

  return envelope.data
}

function buildInit(
  method: string,
  body: unknown,
  auth: boolean,
  signal?: AbortSignal,
): RequestInit {
  const headers: Record<string, string> = {}
  const init: RequestInit = { method, headers, signal }

  if (auth) {
    const token = getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  if (body instanceof FormData) {
    init.body = body
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }

  return init
}

let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false

    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!response.ok) return false
      const envelope = (await response.json()) as ApiEnvelope<AuthTokens>
      if (envelope.code !== 0 || !envelope.data?.accessToken) return false
      saveTokens(envelope.data)
      return true
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

async function send(
  path: string,
  method: string,
  body: unknown,
  options: RequestOptions,
): Promise<Response> {
  const auth = options.auth !== false
  return fetch(
    `${BASE_URL}${path}`,
    buildInit(method, body, auth, options.signal),
  )
}

async function request<T>(
  path: string,
  method: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  let response = await send(path, method, body, options)

  if (response.status === 401 && options.auth !== false) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      response = await send(path, method, body, options)
    } else {
      clearTokens()
      unauthorizedHandler?.()
      throw new ApiError('登录状态已失效，请重新登录', 10002, 401)
    }
  }

  return parseResponse<T>(response)
}

async function download(path: string): Promise<Blob> {
  let response = await send(path, 'GET', undefined, {})

  if (response.status === 401) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      response = await send(path, 'GET', undefined, {})
    } else {
      clearTokens()
      unauthorizedHandler?.()
      throw new ApiError('登录状态已失效，请重新登录', 10002, 401)
    }
  }

  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      await parseResponse<unknown>(response)
    }
    throw new ApiError(`下载失败（HTTP ${response.status}）`, response.status, response.status)
  }

  return response.blob()
}

export const api = {
  get<T>(path: string, params?: object, options?: RequestOptions) {
    return request<T>(`${path}${buildQuery(params)}`, 'GET', undefined, options)
  },
  post<T>(path: string, body?: unknown, options?: RequestOptions) {
    return request<T>(path, 'POST', body, options)
  },
  put<T>(path: string, body?: unknown, options?: RequestOptions) {
    return request<T>(path, 'PUT', body, options)
  },
  patch<T>(path: string, body?: unknown, options?: RequestOptions) {
    return request<T>(path, 'PATCH', body, options)
  },
  delete<T>(path: string, options?: RequestOptions) {
    return request<T>(path, 'DELETE', undefined, options)
  },
  upload<T>(path: string, formData: FormData) {
    return request<T>(path, 'POST', formData, {})
  },
  download,
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
