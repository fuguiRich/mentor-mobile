import { createFileRoute } from '@tanstack/react-router'
import { useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Alert, App as AntdApp, Button, Input } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { authApi } from '../api/auth'
import { SectionCard } from '../components/common'
import { useAuth } from '../lib/auth-context'
import { ApiError } from '../lib/api'

export const Route = createFileRoute('/_app/profile_/password')({
  component: ChangePasswordPage,
})

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, '请输入当前密码'),
    newPassword: z
      .string()
      .min(6, '新密码至少 6 位')
      .max(72, '新密码最多 72 位'),
    confirmPassword: z.string().min(1, '请再次输入新密码'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: '两次输入的新密码不一致',
  })

type PasswordValues = z.infer<typeof passwordSchema>

function ChangePasswordPage() {
  const { message } = AntdApp.useApp()
  const router = useRouter()
  const { profile } = useAuth()

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    mode: 'onTouched',
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  if (profile?.user.authSource === 'sso') {
    return (
      <div className="px-4 pt-4">
        <Alert
          type="info"
          showIcon
          message="统一认证账号请在学校统一认证平台修改密码"
          description="本系统不保存统一认证账号的密码，无法在此修改。"
        />
      </div>
    )
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      await authApi.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      })
      reset()
      message.success('密码已修改')
      router.history.push('/profile')
    } catch (error) {
      if (error instanceof ApiError) {
        for (const field of error.fields) {
          if (
            field.field === 'oldPassword' ||
            field.field === 'newPassword'
          ) {
            setError(field.field, { message: field.message })
          }
        }
        message.error(error.message)
      } else {
        message.error('修改失败，请稍后重试')
      }
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="px-4 pt-4">
      <Alert
        type="info"
        showIcon
        message="建议使用字母、数字和符号组合的密码"
        className="mb-4"
      />

      <SectionCard>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="oldPassword"
              className="mb-1.5 block text-[13px] font-medium text-ink"
            >
              当前密码
            </label>
            <Input.Password
              id="oldPassword"
              size="large"
              autoComplete="current-password"
              placeholder="请输入当前密码"
              prefix={<LockOutlined className="text-muted/60" aria-hidden="true" />}
              status={errors.oldPassword ? 'error' : undefined}
              aria-invalid={errors.oldPassword ? true : undefined}
              aria-describedby={
                errors.oldPassword ? 'oldPassword-error' : undefined
              }
              {...register('oldPassword')}
            />
            {errors.oldPassword ? (
              <p id="oldPassword-error" className="mt-1 text-xs text-danger">
                {errors.oldPassword.message}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="mb-1.5 block text-[13px] font-medium text-ink"
            >
              新密码
            </label>
            <Input.Password
              id="newPassword"
              size="large"
              autoComplete="new-password"
              placeholder="至少 6 位"
              prefix={<LockOutlined className="text-muted/60" aria-hidden="true" />}
              status={errors.newPassword ? 'error' : undefined}
              aria-invalid={errors.newPassword ? true : undefined}
              aria-describedby={
                errors.newPassword ? 'newPassword-error' : undefined
              }
              {...register('newPassword')}
            />
            {errors.newPassword ? (
              <p id="newPassword-error" className="mt-1 text-xs text-danger">
                {errors.newPassword.message}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-[13px] font-medium text-ink"
            >
              确认新密码
            </label>
            <Input.Password
              id="confirmPassword"
              size="large"
              autoComplete="new-password"
              placeholder="再次输入新密码"
              prefix={<LockOutlined className="text-muted/60" aria-hidden="true" />}
              status={errors.confirmPassword ? 'error' : undefined}
              aria-invalid={errors.confirmPassword ? true : undefined}
              aria-describedby={
                errors.confirmPassword ? 'confirmPassword-error' : undefined
              }
              {...register('confirmPassword')}
            />
            {errors.confirmPassword ? (
              <p
                id="confirmPassword-error"
                className="mt-1 text-xs text-danger"
              >
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>
        </div>
      </SectionCard>

      <Button
        type="primary"
        size="large"
        block
        htmlType="submit"
        loading={isSubmitting}
        className="mt-4 !h-12 !text-base"
      >
        保存新密码
      </Button>
    </form>
  )
}
