import type { ReactNode } from 'react'
import { Button, Empty, Result, Skeleton } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useRouter } from '@tanstack/react-router'
import type { AppointmentStatus } from '../api/types'
import { APPOINTMENT_STATUS_META, UNIVERSITY_NAME } from '../lib/constants'
import type { StatusTone } from '../lib/constants'
import { initialOf } from '../lib/format'

const toneClasses: Record<StatusTone, string> = {
  warning: 'bg-[#f7f1e3] text-[#8a6a2f] ring-[#e8dcc2]',
  info: 'bg-brand-50 text-brand-700 ring-brand-200',
  purple: 'bg-[#f2eff6] text-[#5b4b7a] ring-[#ddd5e8]',
  success: 'bg-[#edf3ef] text-[#3f6e5a] ring-[#cfe0d7]',
  danger: 'bg-[#f7ecec] text-[#a23b3b] ring-[#e8cfcf]',
  neutral: 'bg-[#f1efea] text-[#5b6775] ring-[#e3ded4]',
}

const dotClasses: Record<StatusTone, string> = {
  warning: 'bg-[#b08d57]',
  info: 'bg-brand-600',
  purple: 'bg-[#5b4b7a]',
  success: 'bg-[#3f6e5a]',
  danger: 'bg-[#a23b3b]',
  neutral: 'bg-[#8a8f96]',
}

export function StatusTag({ status }: { status: AppointmentStatus }) {
  const meta = APPOINTMENT_STATUS_META[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${toneClasses[meta.tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[meta.tone]}`} />
      {meta.label}
    </span>
  )
}

export function InitialAvatar({
  name,
  size = 48,
  className = '',
}: {
  name: string | null | undefined
  size?: number
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand-700 font-medium text-white ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initialOf(name)}
    </span>
  )
}

export function PageHeader({
  title,
  back = false,
  backTo,
  right,
}: {
  title: string
  back?: boolean
  backTo?: string
  right?: ReactNode
}) {
  const router = useRouter()

  const goBack = () => {
    if (backTo) {
      router.history.push(backTo)
    } else {
      router.history.back()
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white pt-[env(safe-area-inset-top)]">
      <div className="flex h-14 items-center gap-1 px-2">
        {back ? (
          <Button
            type="text"
            shape="circle"
            aria-label="返回"
            icon={<ArrowLeftOutlined aria-hidden="true" />}
            onClick={goBack}
            className="!h-11 !w-11 !text-lg"
          />
        ) : null}
        <div className="min-w-0 flex-1 px-1">
          <p className="text-[10px] leading-none tracking-[0.14em] text-muted">
            {UNIVERSITY_NAME}
          </p>
          <h1 className="mt-0.5 truncate font-serif text-[17px] font-medium text-ink">
            {title}
          </h1>
        </div>
        {right ? <div className="shrink-0 pr-1">{right}</div> : null}
      </div>
    </header>
  )
}

export function SectionCard({
  title,
  extra,
  children,
  className = '',
}: {
  title?: ReactNode
  extra?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-xl border border-line bg-white p-4 shadow-[0_2px_8px_rgba(31,42,55,0.04)] ${className}`}
    >
      {title ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-serif text-[15px] font-medium text-ink">
            <span
              aria-hidden="true"
              className="h-3.5 w-0.5 rounded-full bg-gold"
            />
            {title}
          </h2>
          {extra}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function InfoRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start gap-4 py-2.5">
      <span className="w-20 shrink-0 text-[13px] text-muted">{label}</span>
      <div className="min-w-0 flex-1 text-[14px] leading-6 text-ink">{children}</div>
    </div>
  )
}

export function EmptyState({
  description,
  action,
}: {
  description: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-12">
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />
      {action}
    </div>
  )
}

export function ErrorState({
  message = '加载失败，请稍后重试',
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <Result
      status="warning"
      title="出了点问题"
      subTitle={message}
      extra={
        onRetry ? (
          <Button type="primary" onClick={onRetry}>
            重新加载
          </Button>
        ) : null
      }
    />
  )
}

export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-1">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="rounded-xl border border-line bg-white p-4">
          <Skeleton active avatar paragraph={{ rows: 2 }} title={{ width: '45%' }} />
        </div>
      ))}
    </div>
  )
}

export function ListFooter({
  loading,
  hasMore,
  isEmpty,
  onLoadMore,
}: {
  loading: boolean
  hasMore: boolean
  isEmpty: boolean
  onLoadMore: () => void
}) {
  if (isEmpty) return null
  if (loading) {
    return (
      <p className="py-4 text-center text-xs text-muted" role="status">
        加载中…
      </p>
    )
  }
  if (!hasMore) {
    return <p className="py-4 text-center text-xs text-muted">没有更多了</p>
  }
  return (
    <div className="py-3 text-center">
      <Button size="small" type="text" onClick={onLoadMore}>
        加载更多
      </Button>
    </div>
  )
}
