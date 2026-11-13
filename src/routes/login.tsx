import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { Alert, Button, Input } from 'antd'
import type { InputRef } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { BrandMark } from '../components/BrandMark'
import { UNIVERSITY_NAME, UNIVERSITY_NAME_EN } from '../lib/constants'
import { useAuth } from '../lib/auth-context'
import { ApiError } from '../lib/api'
import { isAuthenticated } from '../lib/token-store'

const loginSchema = z.object({
  username: z.string().trim().min(1, '请输入学号'),
  password: z.string().min(6, '密码至少 6 位').max(72, '密码过长'),
})

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const { login } = useAuth()
  const search = Route.useSearch()
  const usernameRef = useRef<InputRef>(null)
  const passwordRef = useRef<InputRef>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [errors, setErrors] = useState<{
    username?: string
    password?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // Read the native inputs directly. This keeps validation reliable with
    // antd Input, browser autofill and password managers.
    const values = {
      username: (usernameRef.current?.input?.value ?? '').trim(),
      password: passwordRef.current?.input?.value ?? '',
    }
    const parsed = loginSchema.safeParse(values)
    if (!parsed.success) {
      const next: { username?: string; password?: string } = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (field === 'username' && !next.username) next.username = issue.message
        if (field === 'password' && !next.password) next.password = issue.message
      }
      setErrors(next)
      return
    }

    setErrors({})
    setServerError(null)
    setIsSubmitting(true)
    try {
      await login(parsed.data)
      const target =
        search.redirect &&
        search.redirect.startsWith('/') &&
        !search.redirect.startsWith('//')
          ? search.redirect
          : '/'
      window.location.replace(target)
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.message : '登录失败，请稍后重试',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <div className="flex flex-1 flex-col overflow-y-auto px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-6">
        <div className="my-auto">
          <div className="mb-8">
            <BrandMark size={56} className="mb-5 block" />
            <p className="mb-1 text-xs font-medium tracking-[0.16em] text-muted">
              {UNIVERSITY_NAME} · 学生端
            </p>
            <h1 className="font-serif text-[28px] leading-tight font-medium tracking-tight text-ink">
              创新创业导师指导
            </h1>
            <p className="mt-1.5 text-[11px] tracking-[0.18em] text-muted">
              {UNIVERSITY_NAME_EN}
            </p>
            <p className="mt-2 text-[14px] leading-6 text-muted">
              校内外导师预约与指导服务
            </p>
            <div aria-hidden="true" className="mt-4 h-px w-12 bg-gold" />
          </div>

        <div className="rounded-xl border border-line bg-white p-5 shadow-[0_2px_8px_rgba(31,42,55,0.04)]">
          <form onSubmit={onSubmit} noValidate>
            <div className="mb-4">
              <label
                htmlFor="username"
                className="mb-1.5 block text-[13px] font-medium text-ink"
              >
                学号
              </label>
              <Input
                id="username"
                ref={usernameRef}
                size="large"
                autoComplete="username"
                inputMode="text"
                placeholder="请输入学号"
                prefix={<UserOutlined className="text-muted/60" aria-hidden="true" />}
                status={errors.username ? 'error' : undefined}
                aria-invalid={errors.username ? true : undefined}
                aria-describedby={errors.username ? 'username-error' : undefined}
                onChange={() =>
                  setErrors((prev) =>
                    prev.username ? { ...prev, username: undefined } : prev,
                  )
                }
              />
              {errors.username ? (
                <p id="username-error" className="mt-1.5 text-xs text-danger">
                  {errors.username}
                </p>
              ) : null}
            </div>

            <div className="mb-5">
              <label
                htmlFor="password"
                className="mb-1.5 block text-[13px] font-medium text-ink"
              >
                密码
              </label>
              <Input.Password
                id="password"
                ref={passwordRef}
                size="large"
                autoComplete="current-password"
                placeholder="请输入密码"
                prefix={<LockOutlined className="text-muted/60" aria-hidden="true" />}
                status={errors.password ? 'error' : undefined}
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={errors.password ? 'password-error' : undefined}
                onChange={() =>
                  setErrors((prev) =>
                    prev.password ? { ...prev, password: undefined } : prev,
                  )
                }
              />
              {errors.password ? (
                <p id="password-error" className="mt-1.5 text-xs text-danger">
                  {errors.password}
                </p>
              ) : null}
            </div>

            {serverError ? (
              <Alert
                type="error"
                showIcon
                message={serverError}
                className="mb-4"
                role="alert"
              />
            ) : null}

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={isSubmitting}
              className="!h-12 !text-base"
            >
              登录
            </Button>
          </form>

          {import.meta.env.DEV ? (
            <p className="mt-4 text-center text-xs text-muted">
              开发环境测试账号：20230001 / Mentor@2026
            </p>
          ) : null}
        </div>
        </div>
      </div>

      <p className="pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-center text-xs leading-5 text-muted">
        登录遇到问题请联系所在二级学院或创新创业学院
      </p>
    </div>
  )
}
