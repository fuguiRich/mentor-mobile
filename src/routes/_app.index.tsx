import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRightOutlined,
  BellOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import { appointmentApi } from '../api/appointments'
import { achievementApi } from '../api/achievements'
import { messageApi } from '../api/messages'
import { AppointmentCard } from '../components/AppointmentCard'
import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  SectionCard,
} from '../components/common'
import { useAuth } from '../lib/auth-context'
import { queryKeys } from '../lib/query-keys'
import { todayLabel } from '../lib/format'
import { UNIVERSITY_NAME } from '../lib/constants'

export const Route = createFileRoute('/_app/')({
  component: HomePage,
})

const QUICK_ACTIONS = [
  {
    to: '/mentors' as const,
    label: '导师检索',
    hint: '按研究方向筛选',
    icon: TeamOutlined,
    className: 'bg-brand-50 text-brand-600',
  },
  {
    to: '/appointments' as const,
    label: '我的预约',
    hint: '查看预约进度',
    icon: CalendarOutlined,
    className: 'bg-brand-50 text-brand-600',
  },
  {
    to: '/achievements' as const,
    label: '我的成果',
    hint: '学科竞赛与立项',
    icon: TrophyOutlined,
    className: 'bg-[#f7f1e3] text-[#8a6a2f]',
  },
  {
    to: '/stats' as const,
    label: '指导档案',
    hint: '统计与材料导出',
    icon: FileTextOutlined,
    className: 'bg-[#edf3ef] text-[#3f6e5a]',
  },
]

function HomePage() {
  const { profile } = useAuth()

  const appointmentsQuery = useQuery({
    queryKey: queryKeys.appointments({ scope: 'home' }),
    queryFn: () => appointmentApi.list({ page: 1, pageSize: 100 }),
  })

  const unreadQuery = useQuery({
    queryKey: queryKeys.messagesUnread,
    queryFn: () => messageApi.list({ page: 1, pageSize: 1, read: 0 }),
    select: (data) => data.unread,
    staleTime: 30_000,
  })

  const achievementsQuery = useQuery({
    queryKey: queryKeys.achievements({ scope: 'home' }),
    queryFn: () => achievementApi.list({ page: 1, pageSize: 1 }),
    select: (data) => data.total,
  })

  const appointments = appointmentsQuery.data?.list ?? []
  const activeCount = appointments.filter(
    (item) => item.status >= 0 && item.status <= 5,
  ).length
  const completedCount = appointments.filter((item) => item.status === 6).length
  const recent = appointments.slice(0, 3)

  const greetingName = profile?.user.realName || '同学'

  return (
    <div className="space-y-4 px-4 pt-4">
      <section className="rounded-xl border-t-2 border-gold bg-linear-to-br from-brand-600 to-brand-800 p-5 text-white shadow-[0_2px_8px_rgba(31,42,55,0.06)]">
        <p className="text-xs tracking-[0.12em] text-white/90">
          {UNIVERSITY_NAME} · 创新创业学院
        </p>
        <p className="mt-1 text-xs tracking-wide text-white/90">{todayLabel()}</p>
        <h1 className="mt-1.5 font-serif text-[24px] leading-tight font-medium">
          {greetingName}同学
        </h1>
        <p className="mt-1.5 text-[13px] leading-5 text-white/90">
          查看指导进度，或检索导师发起新的预约。
        </p>
        <Link to="/mentors" className="mt-4 inline-flex no-underline">
          <span className="pressable inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-[13px] font-medium text-brand-700">
            检索导师
            <ArrowRightOutlined style={{ fontSize: 12 }} aria-hidden="true" />
          </span>
        </Link>
      </section>

      <section className="grid grid-cols-3 gap-2.5" aria-label="概览">
        <div className="rounded-xl border border-line bg-white p-3 text-center shadow-[0_2px_8px_rgba(31,42,55,0.04)]">
          <p className="font-serif text-[22px] leading-none font-medium text-ink">
            {appointmentsQuery.isLoading ? '—' : activeCount}
          </p>
          <p className="mt-1.5 text-xs text-muted">进行中</p>
        </div>
        <div className="rounded-xl border border-line bg-white p-3 text-center shadow-[0_2px_8px_rgba(31,42,55,0.04)]">
          <p className="font-serif text-[22px] leading-none font-medium text-ink">
            {appointmentsQuery.isLoading ? '—' : completedCount}
          </p>
          <p className="mt-1.5 text-xs text-muted">已完成</p>
        </div>
        <div className="rounded-xl border border-line bg-white p-3 text-center shadow-[0_2px_8px_rgba(31,42,55,0.04)]">
          <p className="font-serif text-[22px] leading-none font-medium text-ink">
            {unreadQuery.data ?? 0}
          </p>
          <p className="mt-1.5 text-xs text-muted">未读消息</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2.5" aria-label="快捷入口">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.to} to={action.to} className="block no-underline">
              <span className="pressable flex items-center gap-3 rounded-xl border border-line bg-white p-3.5 shadow-[0_2px_8px_rgba(31,42,55,0.04)] hover:bg-brand-50/40">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${action.className}`}
                  aria-hidden="true"
                >
                  <Icon style={{ fontSize: 19 }} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-medium text-ink">
                    {action.label}
                  </span>
                  <span className="block text-xs text-muted">{action.hint}</span>
                </span>
              </span>
            </Link>
          )
        })}
      </section>

      <SectionCard
        title="最近预约"
        extra={
          <Link to="/appointments" className="inline-flex no-underline">
            <span className="inline-flex min-h-11 items-center px-1 text-xs font-medium text-brand-700">
              查看全部
            </span>
          </Link>
        }
      >
        {appointmentsQuery.isLoading ? (
          <LoadingBlock rows={2} />
        ) : appointmentsQuery.isError ? (
          <ErrorState
            message="预约信息加载失败"
            onRetry={() => void appointmentsQuery.refetch()}
          />
        ) : recent.length === 0 ? (
          <EmptyState
            description="暂无预约记录"
            action={
              <Link to="/mentors">
                <span className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-brand-700 px-4 py-2 text-[13px] font-medium text-white">
                  <TeamOutlined aria-hidden="true" /> 检索导师
                </span>
              </Link>
            }
          />
        ) : (
          <div className="space-y-2.5">
            {recent.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        )}
      </SectionCard>

      <div className="flex items-center justify-center gap-4 pb-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <CheckCircleOutlined aria-hidden="true" />
          已完成 {completedCount} 次指导
        </span>
        <span className="inline-flex items-center gap-1">
          <TrophyOutlined aria-hidden="true" />
          成果 {achievementsQuery.data ?? 0} 项
        </span>
        <span className="inline-flex items-center gap-1">
          <BellOutlined aria-hidden="true" />
          未读 {unreadQuery.data ?? 0} 条
        </span>
      </div>
    </div>
  )
}
