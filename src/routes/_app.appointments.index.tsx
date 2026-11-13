import { useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Button, Select } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { appointmentApi } from '../api/appointments'
import type { AppointmentType } from '../api/types'
import { AppointmentCard } from '../components/AppointmentCard'
import {
  EmptyState,
  ErrorState,
  ListFooter,
  LoadingBlock,
} from '../components/common'
import {
  APPOINTMENT_STATUS_FILTERS,
  APPOINTMENT_TYPE_LABELS,
} from '../lib/constants'
import { queryKeys } from '../lib/query-keys'

export const Route = createFileRoute('/_app/appointments/')({
  component: AppointmentListPage,
})

const PAGE_SIZE = 10

const TYPE_OPTIONS = [
  { value: 0, label: '全部类型' },
  ...Object.entries(APPOINTMENT_TYPE_LABELS).map(([value, label]) => ({
    value: Number(value),
    label,
  })),
]

const TIME_OPTIONS = [
  { value: 'all', label: '全部时间' },
  { value: '30', label: '近 30 天' },
  { value: '90', label: '近 90 天' },
  { value: 'year', label: '本年度' },
]

type TimeFilter = 'all' | '30' | '90' | 'year'

function AppointmentListPage() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState<0 | AppointmentType>(0)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')

  const query = useInfiniteQuery({
    queryKey: queryKeys.appointments({ scope: 'list', type: typeFilter }),
    queryFn: ({ pageParam }) =>
      appointmentApi.list({
        page: pageParam,
        pageSize: PAGE_SIZE,
        type: typeFilter === 0 ? undefined : typeFilter,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.list.length, 0)
      return loaded < lastPage.total ? lastPage.page + 1 : undefined
    },
  })

  const allAppointments = useMemo(
    () => query.data?.pages.flatMap((page) => page.list) ?? [],
    [query.data],
  )

  const timeFiltered = useMemo(() => {
    if (timeFilter === 'all') return allAppointments
    const now = dayjs()
    return allAppointments.filter((appointment) => {
      const value = dayjs(appointment.requestedTime)
      if (!value.isValid()) return true
      if (timeFilter === '30') return value.isAfter(now.subtract(30, 'day'))
      if (timeFilter === '90') return value.isAfter(now.subtract(90, 'day'))
      return value.isSame(now, 'year')
    })
  }, [allAppointments, timeFilter])

  const filter = APPOINTMENT_STATUS_FILTERS.find(
    (item) => item.key === activeFilter,
  )

  const appointments = filter?.statuses
    ? timeFiltered.filter((item) => filter.statuses?.includes(item.status))
    : timeFiltered

  const countFor = (key: string) => {
    const item = APPOINTMENT_STATUS_FILTERS.find((entry) => entry.key === key)
    if (!item?.statuses) return timeFiltered.length
    return timeFiltered.filter((appointment) =>
      item.statuses?.includes(appointment.status),
    ).length
  }

  const hasFilters = typeFilter !== 0 || timeFilter !== 'all'

  const resetFilters = () => {
    setActiveFilter('all')
    setTypeFilter(0)
    setTimeFilter('all')
  }

  return (
    <div className="px-4 pt-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-medium text-ink">预约记录</h2>
        <Link to="/mentors">
          <Button type="primary" size="small" icon={<PlusOutlined aria-hidden="true" />}>
            发起预约
          </Button>
        </Link>
      </div>

      <div className="mt-3">
        <div className="flex flex-wrap gap-2">
          {APPOINTMENT_STATUS_FILTERS.map((item) => {
            const active = item.key === activeFilter
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveFilter(item.key)}
                aria-pressed={active}
                className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-3.5 py-2 text-[13px] font-medium transition-colors ${
                  active
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-muted ring-1 ring-line'
                }`}
              >
                {item.label}
                <span
                  className={`rounded px-1.5 text-xs leading-4 ${
                    active ? 'bg-white/20 text-white' : 'bg-[#f1efea] text-muted'
                  }`}
                >
                  {countFor(item.key)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-2 flex gap-2">
        <Select
          value={typeFilter}
          onChange={(value) => setTypeFilter(value as 0 | AppointmentType)}
          options={TYPE_OPTIONS}
          className="flex-1"
          aria-label="指导类型"
        />
        <Select
          value={timeFilter}
          onChange={(value) => setTimeFilter(value as TimeFilter)}
          options={TIME_OPTIONS}
          className="flex-1"
          aria-label="时间范围"
        />
      </div>

      <div className="mt-3 space-y-2.5">
        {query.isLoading ? (
          <LoadingBlock rows={4} />
        ) : query.isError ? (
          <ErrorState
            message="预约列表加载失败"
            onRetry={() => void query.refetch()}
          />
        ) : appointments.length === 0 ? (
          <EmptyState
            description={
              activeFilter === 'all' && !hasFilters
                ? '暂无预约记录，可检索导师发起预约'
                : '当前筛选条件下暂无预约'
            }
            action={
              activeFilter === 'all' && !hasFilters ? (
                <Link to="/mentors">
                  <Button type="primary">检索导师</Button>
                </Link>
              ) : (
                <Button onClick={resetFilters}>清除筛选</Button>
              )
            }
          />
        ) : (
          <>
            {appointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
            <ListFooter
              loading={query.isFetchingNextPage}
              hasMore={query.hasNextPage}
              isEmpty={appointments.length === 0}
              onLoadMore={() => void query.fetchNextPage()}
            />
          </>
        )}
      </div>
    </div>
  )
}
