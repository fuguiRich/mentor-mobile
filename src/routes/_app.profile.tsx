import { createFileRoute, Link } from '@tanstack/react-router'
import {
  App as AntdApp,
  Button,
  List,
} from 'antd'
import {
  FileTextOutlined,
  LockOutlined,
  LogoutOutlined,
  RightOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { InitialAvatar } from '../components/common'
import { useAuth } from '../lib/auth-context'
import { PLATFORM_NAME, UNIVERSITY_NAME } from '../lib/constants'

export const Route = createFileRoute('/_app/profile')({
  component: ProfilePage,
})

const MENU = [
  {
    to: '/achievements' as const,
    label: '我的成果',
    hint: '学科竞赛与项目立项',
    icon: TrophyOutlined,
    iconClass: 'bg-[#f7f1e3] text-[#8a6a2f]',
  },
  {
    to: '/stats' as const,
    label: '指导档案',
    hint: '统计个人指导记录并导出',
    icon: FileTextOutlined,
    iconClass: 'bg-[#edf3ef] text-[#3f6e5a]',
  },
  {
    to: '/profile/password' as const,
    label: '修改密码',
    hint: '定期更换密码更安全',
    icon: LockOutlined,
    iconClass: 'bg-brand-50 text-brand-600',
  },
]

function ProfilePage() {
  const { profile, logout } = useAuth()
  const { modal } = AntdApp.useApp()

  const user = profile?.user
  const isSso = user?.authSource === 'sso'
  const menuItems = isSso
    ? MENU.filter((item) => item.to !== '/profile/password')
    : MENU

  const onLogout = () => {
    modal.confirm({
      title: '退出登录？',
      content: '退出后需要重新输入学号和密码。',
      okText: '退出登录',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => logout(),
    })
  }

  return (
    <div className="space-y-4 px-4 pt-4">
      <section className="rounded-xl border-t-2 border-gold bg-linear-to-br from-brand-600 to-brand-800 p-5 text-white shadow-[0_2px_8px_rgba(31,42,55,0.06)]">
        <div className="flex items-center gap-4">
          <InitialAvatar
            name={user?.realName}
            size={64}
            className="!bg-white/15 ring-2 ring-white/30"
          />
          <div className="min-w-0">
            <p className="text-[11px] tracking-[0.14em] text-white/85">
              {UNIVERSITY_NAME} · 学生
            </p>
            <p className="truncate font-serif text-[22px] leading-tight font-medium">
              {user?.realName ?? '同学'}
            </p>
            <p className="mt-1 text-[13px] text-white/90">
              学号 {user?.username ?? '—'}
            </p>
            <p className="mt-0.5 truncate text-[12px] text-white/85">
              {user?.deptName ?? '未设置学院'}
            </p>
            {user?.mobile ? (
              <p className="mt-0.5 truncate text-[12px] text-white/85">
                联系电话 {user.mobile}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-line bg-white shadow-[0_2px_8px_rgba(31,42,55,0.04)]">
        <List
          dataSource={menuItems}
          split
          renderItem={(item) => {
            const Icon = item.icon
            return (
              <Link to={item.to} className="block no-underline">
                <span className="pressable flex items-center gap-3 px-4 py-3.5 hover:bg-brand-50/40">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.iconClass}`}
                    aria-hidden="true"
                  >
                    <Icon style={{ fontSize: 18 }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-medium text-ink">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {item.hint}
                    </span>
                  </span>
                  <RightOutlined
                    className="text-xs text-muted/40"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            )
          }}
        />
        {isSso ? (
          <p className="border-t border-line px-4 py-3 text-xs leading-5 text-muted">
            统一认证账号请在学校统一认证平台修改密码。
          </p>
        ) : null}
      </section>

      <Button
        block
        danger
        size="large"
        icon={<LogoutOutlined aria-hidden="true" />}
        onClick={onLogout}
        className="!h-12"
      >
        退出登录
      </Button>

      <div className="flex items-center justify-center gap-1.5 pb-2 text-xs text-muted">
        <UserOutlined aria-hidden="true" />
        {UNIVERSITY_NAME} · {PLATFORM_NAME}
      </div>
    </div>
  )
}
