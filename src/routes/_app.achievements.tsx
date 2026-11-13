import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Select } from 'antd'
import { TrophyOutlined } from '@ant-design/icons'
import { achievementApi } from '../api/achievements'
import type { AchievementType } from '../api/types'
import {
  EmptyState,
  ErrorState,
  ListFooter,
  LoadingBlock,
} from '../components/common'
import {
  ACHIEVEMENT_LEVEL_LABELS,
  ACHIEVEMENT_TYPE_LABELS,
} from '../lib/constants'
import { queryKeys } from '../lib/query-keys'

export const Route = createFileRoute('/_app/achievements')({
  component: AchievementsPage,
})

const PAGE_SIZE = 10
const CURRENT_YEAR = new Date().getFullYear()

const TYPE_OPTIONS = [
  { value: 0, label: '全部类型' },
  ...Object.entries(ACHIEVEMENT_TYPE_LABELS).map(([value, label]) => ({
    value: Number(value),
    label,
  })),
]

const YEAR_OPTIONS = [
  { value: 0, label: '全部年份' },
  ...Array.from({ length: 5 }, (_, index) => {
    const year = CURRENT_YEAR - index
    return { value: year, label: `${year} 年` }
  }),
]

function AchievementsPage() {
  const [type, setType] = useState(0)
  const [year, setYear] = useState(0)
  const [linked, setLinked] = useState<'all' | 'linked' | 'unlinked'>('all')

  const params = useMemo(() => {
    const linkedParam: 0 | 1 | undefined =
      linked === 'linked' ? 1 : linked === 'unlinked' ? 0 : undefined
    return {
      type: type === 0 ? undefined : (type as AchievementType),
      year: year === 0 ? undefined : year,
      linked: linkedParam,
    }
  }, [type, year, linked])

  const query = useInfiniteQuery({
    queryKey: queryKeys.achievements(params as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      achievementApi.list({ ...params, page: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.list.length, 0)
      return loaded < lastPage.total ? lastPage.page + 1 : undefined
    },
  })

  const achievements = query.data?.pages.flatMap((page) => page.list) ?? []
  const total = query.data?.pages[0]?.total ?? 0

  return (
    <div className="px-4 pt-4">
      <section className="rounded-xl border border-line bg-white p-4 shadow-[0_2px_8px_rgba(31,42,55,0.04)]">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#f7f1e3] text-[#8a6a2f]">
            <TrophyOutlined style={{ fontSize: 20 }} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[13px] text-muted">创新创业成果</p>
            <p className="text-[20px] leading-tight font-medium text-ink">
              {query.isLoading ? '—' : total}
              <span className="ml-1 text-xs font-normal text-muted">项</span>
            </p>
          </div>
        </div>
      </section>

      <div className="mt-3 flex gap-2">
        <Select
          value={type}
          onChange={(value) => setType(value)}
          options={TYPE_OPTIONS}
          className="flex-1"
          aria-label="成果类型"
        />
        <Select
          value={year}
          onChange={(value) => setYear(value)}
          options={YEAR_OPTIONS}
          className="flex-1"
          aria-label="年份"
        />
      </div>

      <div className="mt-2 overflow-x-auto no-scrollbar">
        <div className="flex gap-2">
          {[
            { value: 'all' as const, label: '全部' },
            { value: 'linked' as const, label: '已关联导师' },
            { value: 'unlinked' as const, label: '未关联导师' },
          ].map((item) => {
            const active = linked === item.value
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setLinked(item.value)}
                aria-pressed={active}
                className={`inline-flex min-h-11 shrink-0 items-center rounded-md px-3 py-1.5 text-[12px] font-medium ${
                  active
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-muted ring-1 ring-line'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-3 space-y-2.5">
        {query.isLoading ? (
          <LoadingBlock rows={3} />
        ) : query.isError ? (
          <ErrorState
            message="成果加载失败"
            onRetry={() => void query.refetch()}
          />
        ) : achievements.length === 0 ? (
          <EmptyState description="学科竞赛获奖或创新创业项目立项后，由所在学院登记" />
        ) : (
          <>
            {achievements.map((achievement) => (
              <article
                key={achievement.id}
                className="rounded-xl border border-line bg-white p-4 shadow-[0_2px_8px_rgba(31,42,55,0.04)]"
              >
                <div className="flex items-center gap-1.5">
                  <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                    {ACHIEVEMENT_TYPE_LABELS[achievement.type]}
                  </span>
                  <span className="rounded-md bg-[#f7f1e3] px-2 py-0.5 text-xs font-medium text-[#8a6a2f]">
                    {ACHIEVEMENT_LEVEL_LABELS[achievement.level]}
                  </span>
                  {achievement.linkedAt ? (
                    <span className="ml-auto text-xs text-success">
                      已关联导师
                    </span>
                  ) : (
                    <span className="ml-auto text-xs text-muted">
                      未关联导师
                    </span>
                  )}
                </div>
                <h3 className="mt-2 font-serif text-[16px] font-medium text-ink">
                  {achievement.title}
                </h3>
                <p className="mt-2 text-xs text-muted">
                  获奖 / 立项日期：{achievement.awardedAt}
                </p>
              </article>
            ))}
            <ListFooter
              loading={query.isFetchingNextPage}
              hasMore={query.hasNextPage}
              isEmpty={achievements.length === 0}
              onLoadMore={() => void query.fetchNextPage()}
            />
          </>
        )}
      </div>
    </div>
  )
}
