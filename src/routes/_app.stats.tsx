import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { App as AntdApp, Button, Select } from 'antd'
import {
  ClockCircleOutlined,
  DownloadOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { achievementApi } from '../api/achievements'
import { statsApi } from '../api/stats'
import type { GuidanceRecordRow } from '../api/stats'
import {
  EmptyState,
  ErrorState,
  LoadingBlock,
  SectionCard,
} from '../components/common'
import { ApiError } from '../lib/api'
import { APPOINTMENT_TYPE_LABELS } from '../lib/constants'
import { formatDuration } from '../lib/format'

export const Route = createFileRoute('/_app/stats')({
  component: StatsPage,
})

type TimeFilter = 'all' | '30' | '90' | 'year'

const TYPE_OPTIONS = [
  { value: 'all', label: '全部类型' },
  ...Object.values(APPOINTMENT_TYPE_LABELS).map((label) => ({
    value: label,
    label,
  })),
]

const TIME_OPTIONS = [
  { value: 'all', label: '全部时间' },
  { value: '30', label: '近 30 天' },
  { value: '90', label: '近 90 天' },
  { value: 'year', label: '本年度' },
]

function matchesTime(record: GuidanceRecordRow, filter: TimeFilter): boolean {
  if (filter === 'all') return true
  const value = dayjs(record.actualTime)
  if (!value.isValid()) return true
  const now = dayjs()
  if (filter === '30') return value.isAfter(now.subtract(30, 'day'))
  if (filter === '90') return value.isAfter(now.subtract(90, 'day'))
  return value.isSame(now, 'year')
}

function StatsPage() {
  const { message } = AntdApp.useApp()
  const [typeFilter, setTypeFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')

  const recordsQuery = useQuery({
    queryKey: ['me', 'records'],
    queryFn: () => statsApi.records(),
  })

  const achievementsQuery = useQuery({
    queryKey: ['achievements', { scope: 'stats' }],
    queryFn: () => achievementApi.list({ page: 1, pageSize: 1 }),
    select: (data) => data.total,
  })

  const exportMutation = useMutation({
    mutationFn: () => statsApi.exportRecords(),
    onSuccess: () => message.success('指导档案已开始下载'),
    onError: (error) =>
      message.error(error instanceof ApiError ? error.message : '导出失败'),
  })

  const records = recordsQuery.data ?? []
  const filtered = useMemo(
    () =>
      records.filter(
        (record) =>
          (typeFilter === 'all' || record.typeLabel === typeFilter) &&
          matchesTime(record, timeFilter),
      ),
    [records, typeFilter, timeFilter],
  )

  const totalMinutes = records.reduce(
    (sum, record) => sum + record.durationMinutes,
    0,
  )

  if (recordsQuery.isLoading) {
    return (
      <div className="px-4 pt-4">
        <LoadingBlock rows={4} />
      </div>
    )
  }

  if (recordsQuery.isError) {
    return (
      <div className="px-4 pt-4">
        <ErrorState
          message="指导档案加载失败"
          onRetry={() => void recordsQuery.refetch()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4 px-4 pt-4">
      <section className="grid grid-cols-3 gap-2.5">
        <div className="rounded-xl border border-line bg-white p-3 text-center shadow-[0_2px_8px_rgba(31,42,55,0.04)]">
          <p className="font-serif text-[24px] leading-none font-medium text-ink">
            {records.length}
          </p>
          <p className="mt-1.5 text-xs text-muted">指导次数</p>
        </div>
        <div className="rounded-xl border border-line bg-white p-3 text-center shadow-[0_2px_8px_rgba(31,42,55,0.04)]">
          <p className="font-serif text-[24px] leading-none font-medium text-ink">
            {Math.round(totalMinutes / 60)}
          </p>
          <p className="mt-1.5 text-xs text-muted">指导小时</p>
        </div>
        <div className="rounded-xl border border-line bg-white p-3 text-center shadow-[0_2px_8px_rgba(31,42,55,0.04)]">
          <p className="font-serif text-[24px] leading-none font-medium text-ink">
            {achievementsQuery.data ?? 0}
          </p>
          <p className="mt-1.5 text-xs text-muted">创新创业成果</p>
        </div>
      </section>

      {records.length === 0 ? (
        <EmptyState
          description="暂无指导记录，完成指导后将在此汇总"
          action={
            <Button
              icon={<DownloadOutlined aria-hidden="true" />}
              onClick={() => exportMutation.mutate()}
              loading={exportMutation.isPending}
            >
              导出个人档案
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex gap-2">
            <Select
              value={typeFilter}
              onChange={(value) => setTypeFilter(value)}
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

          <SectionCard
            title="指导记录"
            extra={<span className="text-xs text-muted">{filtered.length} 条</span>}
          >
            {filtered.length === 0 ? (
              <EmptyState description="当前筛选条件下暂无记录" />
            ) : (
              <ul className="divide-y divide-line">
                {filtered.map((record) => (
                  <li
                    key={record.appointmentId}
                    className="py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-serif text-[15px] font-medium text-ink">
                        {record.mentorName}
                      </p>
                      <span className="shrink-0 rounded bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
                        {record.typeLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] leading-5 text-ink/85">
                      {record.topic}
                    </p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span className="inline-flex items-center gap-1">
                        <ClockCircleOutlined aria-hidden="true" />
                        {record.actualTime}
                      </span>
                      <span>{formatDuration(record.durationMinutes)}</span>
                      {record.score ? <span>评分 {record.score}</span> : null}
                    </p>
                    {record.comment ? (
                      <p className="mt-2 rounded-md bg-brand-50/50 px-3 py-2 text-[13px] leading-5 text-ink/85">
                        {record.comment}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="导出档案">
            <p className="mb-3 text-[12px] leading-5 text-muted">
              导出包含已完成预约的 CSV 档案，可用于创新创业实践学分认定等材料。
            </p>
            <Button
              block
              type="primary"
              icon={<DownloadOutlined aria-hidden="true" />}
              onClick={() => exportMutation.mutate()}
              loading={exportMutation.isPending}
            >
              导出个人指导档案
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
              <FileTextOutlined aria-hidden="true" />
              UTF-8 CSV · 仅包含已完成的指导
            </p>
          </SectionCard>
        </>
      )}
    </div>
  )
}
