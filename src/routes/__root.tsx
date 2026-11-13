import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { Button, Result } from 'antd'
import { AuthProvider } from '../lib/auth-context'

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
})

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}

function NotFoundPage() {
  return (
    <div className="app-shell flex min-h-dvh items-center justify-center px-6">
      <Result
        status="404"
        title="页面不存在"
        subTitle="你访问的页面可能已被移动或删除"
        extra={
          <Link to="/">
            <Button type="primary">回到首页</Button>
          </Link>
        }
      />
    </div>
  )
}
