import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  CalendarOutlined,
  HomeOutlined,
  MessageOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Badge } from 'antd'
import type { ComponentType, CSSProperties } from 'react'
import { messageApi } from '../api/messages'
import { queryKeys } from '../lib/query-keys'

interface TabItem {
  to: '/' | '/mentors' | '/appointments' | '/messages' | '/profile'
  label: string
  icon: ComponentType<{ style?: CSSProperties; 'aria-hidden'?: boolean }>
  badge?: 'unread'
}

const TABS: TabItem[] = [
  { to: '/', label: '首页', icon: HomeOutlined },
  { to: '/mentors', label: '导师', icon: TeamOutlined },
  { to: '/appointments', label: '预约', icon: CalendarOutlined },
  { to: '/messages', label: '消息', icon: MessageOutlined, badge: 'unread' },
  { to: '/profile', label: '我的', icon: UserOutlined },
]

export function BottomNav({ pathname }: { pathname: string }) {
  const unreadQuery = useQuery({
    queryKey: queryKeys.messagesUnread,
    queryFn: () => messageApi.list({ page: 1, pageSize: 1, read: 0 }),
    select: (data) => data.unread,
    staleTime: 30_000,
  })

  const unread = unreadQuery.data ?? 0

  return (
    <nav
      aria-label="主导航"
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-line bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-stretch">
        {TABS.map((tab) => {
          const active =
            tab.to === '/' ? pathname === '/' : pathname.startsWith(tab.to)
          const Icon = tab.icon
          return (
            <li key={tab.to} className="flex-1">
              <Link
                to={tab.to}
                aria-current={active ? 'page' : undefined}
                aria-label={
                  tab.badge === 'unread' && unread > 0
                    ? `${tab.label}，${unread} 条未读`
                    : tab.label
                }
                className="pressable relative flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 no-underline"
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-gold"
                  />
                ) : null}
                <span
                  className={`flex flex-col items-center gap-1 ${
                    active ? 'text-brand-600' : 'text-muted'
                  }`}
                >
                  <span className="relative flex h-6 items-center">
                    {tab.badge === 'unread' && unread > 0 ? (
                      <Badge count={unread} size="small" offset={[6, -2]}>
                        <Icon style={{ fontSize: 22 }} aria-hidden />
                      </Badge>
                    ) : (
                      <Icon style={{ fontSize: 22 }} aria-hidden />
                    )}
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-xs leading-none font-medium"
                  >
                    {tab.label}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
