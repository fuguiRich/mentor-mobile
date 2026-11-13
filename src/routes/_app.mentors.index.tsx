import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import {
  FilterOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import {
  Button,
  Drawer,
  Input,
  Segmented,
  Select,
} from 'antd'
import { mentorApi } from '../api/mentors'
import type { MentorSearchParams, MentorType } from '../api/types'
import { MentorCard } from '../components/MentorCard'
import {
  EmptyState,
  ErrorState,
  ListFooter,
  LoadingBlock,
} from '../components/common'
import { WEEKDAY_LABELS } from '../lib/constants'
import { queryKeys } from '../lib/query-keys'
import { useDebouncedValue } from '../lib/use-debounced-value'

export const Route = createFileRoute('/_app/mentors/')({
  component: MentorListPage,
})

type TypeFilter = 'all' | MentorType

const PAGE_SIZE = 10

const WEEKDAY_OPTIONS = Object.entries(WEEKDAY_LABELS).map(([value, label]) => ({
  value: Number(value),
  label,
}))

function MentorListPage() {
  const [keywordInput, setKeywordInput] = useState('')
  const keyword = useDebouncedValue(keywordInput.trim(), 350)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [researchField, setResearchField] = useState('')
  const [professionalTitle, setProfessionalTitle] = useState('')
  const [weekday, setWeekday] = useState<number | undefined>(undefined)

  const [draftField, setDraftField] = useState('')
  const [draftTitle, setDraftTitle] = useState('')
  const [draftWeekday, setDraftWeekday] = useState<number | undefined>(undefined)

  const params = useMemo<MentorSearchParams>(
    () => ({
      keyword: keyword || undefined,
      mentorType: typeFilter === 'all' ? undefined : typeFilter,
      researchField: researchField || undefined,
      professionalTitle: professionalTitle || undefined,
      weekday,
      pageSize: PAGE_SIZE,
    }),
    [keyword, typeFilter, researchField, professionalTitle, weekday],
  )

  const query = useInfiniteQuery({
    queryKey: queryKeys.mentors(params as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      mentorApi.list({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.list.length, 0)
      return loaded < lastPage.total ? lastPage.page + 1 : undefined
    },
  })

  const mentors = query.data?.pages.flatMap((page) => page.list) ?? []
  const total = query.data?.pages[0]?.total ?? 0
  const activeFilterCount =
    (researchField ? 1 : 0) + (professionalTitle ? 1 : 0) + (weekday ? 1 : 0)

  const openDrawer = () => {
    setDraftField(researchField)
    setDraftTitle(professionalTitle)
    setDraftWeekday(weekday)
    setDrawerOpen(true)
  }

  const applyFilters = () => {
    setResearchField(draftField.trim())
    setProfessionalTitle(draftTitle.trim())
    setWeekday(draftWeekday)
    setDrawerOpen(false)
  }

  const resetFilters = () => {
    setDraftField('')
    setDraftTitle('')
    setDraftWeekday(undefined)
  }

  return (
    <div className="px-4 pt-3">
      <div className="flex gap-2">
        <Input
          allowClear
          size="large"
          value={keywordInput}
          onChange={(event) => setKeywordInput(event.target.value)}
          placeholder="搜索导师姓名、方向或单位"
          prefix={<SearchOutlined className="text-muted/60" aria-hidden="true" />}
          aria-label="搜索导师"
          className="flex-1"
        />
        <Button
          size="large"
          icon={<FilterOutlined aria-hidden="true" />}
          onClick={openDrawer}
          aria-label={`筛选${activeFilterCount ? `（已选 ${activeFilterCount} 项）` : ''}`}
          className="relative"
        >
          筛选
          {activeFilterCount > 0 ? (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-700 px-1 text-xs font-medium text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </Button>
      </div>

      <div className="mt-3 overflow-x-auto no-scrollbar">
        <Segmented
          value={typeFilter}
          onChange={(value) => setTypeFilter(value as TypeFilter)}
          options={[
            { label: '全部', value: 'all' },
            { label: '校内导师', value: 'internal' },
            { label: '校外导师', value: 'external' },
          ]}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-muted">
          {query.isLoading ? '正在检索…' : `共 ${total} 位导师`}
        </p>
        {(researchField || professionalTitle || weekday) && (
          <button
            type="button"
            className="inline-flex min-h-11 items-center px-2 text-xs font-medium text-brand-700"
            onClick={() => {
              setResearchField('')
              setProfessionalTitle('')
              setWeekday(undefined)
            }}
          >
            清除筛选
          </button>
        )}
      </div>

      <div className="mt-2 space-y-2.5">
        {query.isLoading ? (
          <LoadingBlock rows={4} />
        ) : query.isError ? (
          <ErrorState
            message="导师列表加载失败，请检查网络后重试"
            onRetry={() => void query.refetch()}
          />
        ) : mentors.length === 0 ? (
          <EmptyState
            description="未找到符合条件的导师，请调整检索条件"
            action={
              <Button
                icon={<TeamOutlined aria-hidden="true" />}
                onClick={() => {
                  setKeywordInput('')
                  setTypeFilter('all')
                  setResearchField('')
                  setProfessionalTitle('')
                  setWeekday(undefined)
                }}
              >
                重置条件
              </Button>
            }
          />
        ) : (
          <>
            {mentors.map((mentor) => (
              <MentorCard key={mentor.id} mentor={mentor} />
            ))}
            <ListFooter
              loading={query.isFetchingNextPage}
              hasMore={query.hasNextPage}
              isEmpty={mentors.length === 0}
              onLoadMore={() => void query.fetchNextPage()}
            />
          </>
        )}
      </div>

      <Drawer
        title="筛选导师"
        placement="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        height="auto"
        styles={{ body: { paddingBottom: 24 } }}
        footer={
          <div className="flex gap-2">
            <Button block onClick={resetFilters}>
              重置
            </Button>
            <Button block type="primary" onClick={applyFilters}>
              应用筛选
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="researchField"
              className="mb-1.5 block text-[13px] font-medium text-ink"
            >
              研究方向
            </label>
            <Input
              id="researchField"
              value={draftField}
              onChange={(event) => setDraftField(event.target.value)}
              placeholder="如：人工智能、软件工程"
            />
          </div>
          <div>
            <label
              htmlFor="professionalTitle"
              className="mb-1.5 block text-[13px] font-medium text-ink"
            >
              职称 / 资质
            </label>
            <Input
              id="professionalTitle"
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              placeholder="如：教授、高级工程师"
            />
          </div>
          <div>
            <label
              htmlFor="weekday"
              className="mb-1.5 block text-[13px] font-medium text-ink"
            >
              可指导时间
            </label>
            <Select
              id="weekday"
              allowClear
              value={draftWeekday}
              onChange={(value) => setDraftWeekday(value)}
              placeholder="选择星期"
              options={WEEKDAY_OPTIONS}
              className="w-full"
            />
          </div>
        </div>
      </Drawer>
    </div>
  )
}
