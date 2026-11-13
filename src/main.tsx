import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { routeTree } from './routeTree.gen'
import type { RouterContext } from './routes/__root'
import './index.css'

dayjs.locale('zh-cn')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

const router = createRouter({
  routeTree,
  context: { queryClient } satisfies RouterContext,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const antdTheme = {
  token: {
    colorPrimary: '#1b5e6b',
    colorInfo: '#2f7d8c',
    colorLink: '#1b5e6b',
    colorSuccess: '#3f6e5a',
    colorWarning: '#8a6a2f',
    colorError: '#a23b3b',
    colorText: '#1f2a37',
    colorTextSecondary: '#5b6775',
    colorBorder: '#e3ded4',
    colorBgLayout: '#f7f5f0',
    colorBgContainer: '#ffffff',
    borderRadius: 8,
    borderRadiusLG: 14,
    controlHeight: 44,
    fontSize: 15,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Button: {
      controlHeight: 44,
      borderRadius: 8,
      fontWeight: 500,
      primaryShadow: 'none',
      defaultShadow: 'none',
    },
    Input: { controlHeight: 44, borderRadius: 8 },
    Select: { controlHeight: 44, borderRadius: 8 },
    Card: { borderRadiusLG: 14 },
    Tabs: { titleFontSize: 14 },
    Tag: { borderRadiusSM: 4 },
    Segmented: {
      itemSelectedBg: '#e2edef',
      itemSelectedColor: '#1b5e6b',
    },
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider locale={zhCN} theme={antdTheme}>
      <AntdApp>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>
  </StrictMode>,
)
