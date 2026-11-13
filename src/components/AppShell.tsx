import type { ReactNode } from 'react'
import { Outlet, useRouterState } from '@tanstack/react-router'
import { Alert } from 'antd'
import { BottomNav } from './BottomNav'
import { PageHeader } from './common'
import { useAuth } from '../lib/auth-context'

interface PageMeta {
  title: string
  back?: boolean
  backTo?: string
  tab?: boolean
}

const TAB_PATHS = new Set(['/', '/mentors', '/appointments', '/messages', '/profile'])

function resolveMeta(pathname: string): PageMeta {
  if (pathname === '/') return { title: '学生首页', tab: true }
  if (pathname === '/mentors') return { title: '导师检索', tab: true }
  if (pathname === '/appointments') return { title: '我的预约', tab: true }
  if (pathname === '/messages') return { title: '消息中心', tab: true }
  if (pathname === '/profile') return { title: '个人中心', tab: true }
  if (pathname === '/achievements') {
    return { title: '我的成果', back: true, backTo: '/profile' }
  }
  if (pathname === '/stats') {
    return { title: '指导档案', back: true, backTo: '/profile' }
  }
  if (pathname === '/profile/password') {
    return { title: '修改密码', back: true, backTo: '/profile' }
  }

  const mentorDetail = pathname.match(/^\/mentors\/([^/]+)$/)
  if (mentorDetail) {
    return { title: '导师详情', back: true, backTo: '/mentors' }
  }

  const mentorBook = pathname.match(/^\/mentors\/([^/]+)\/book$/)
  if (mentorBook) {
    return {
      title: '发起预约',
      back: true,
      backTo: `/mentors/${mentorBook[1]}`,
    }
  }

  const appointmentDetail = pathname.match(/^\/appointments\/([^/]+)$/)
  if (appointmentDetail) {
    return { title: '预约详情', back: true, backTo: '/appointments' }
  }

  const appointmentReview = pathname.match(/^\/appointments\/([^/]+)\/review$/)
  if (appointmentReview) {
    return {
      title: '评价指导',
      back: true,
      backTo: `/appointments/${appointmentReview[1]}`,
    }
  }

  return { title: '导师指导' }
}

export function AppShell({ children }: { children?: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const meta = resolveMeta(pathname)
  const showTab = meta.tab === true && TAB_PATHS.has(pathname)
  const { loginNotice, dismissLoginNotice } = useAuth()

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <PageHeader title={meta.title} back={meta.back} backTo={meta.backTo} />
      {loginNotice ? (
        <div className="space-y-2 px-4 pt-3">
          {loginNotice.ssoUnavailable ? (
            <Alert
              type="warning"
              showIcon
              closable
              onClose={() => dismissLoginNotice('ssoUnavailable')}
              message="统一认证暂不可用，已使用本地密码登录"
            />
          ) : null}
          {loginNotice.isDefaultPwd ? (
            <Alert
              type="warning"
              showIcon
              closable
              onClose={() => dismissLoginNotice('isDefaultPwd')}
              message="你仍在使用初始密码，请尽快到统一认证平台修改"
            />
          ) : null}
        </div>
      ) : null}
      <main className={`flex-1 ${showTab ? 'page-content' : 'pb-8'}`}>
        {children ?? <Outlet />}
      </main>
      {showTab ? <BottomNav pathname={pathname} /> : null}
    </div>
  )
}
