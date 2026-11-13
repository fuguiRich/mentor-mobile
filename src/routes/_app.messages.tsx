import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { App as AntdApp, Button, Segmented, Select } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import { useRouter } from '@tanstack/react-router'
import { messageApi } from '../api/messages'
import type { Message, MessageType } from '../api/types'
import {
  EmptyState,
  ErrorState,
  ListFooter,
  LoadingBlock,
} from '../components/common'
import { MESSAGE_TYPE_LABELS } from '../lib/constants'
import { formatRelative } from '../lib/format'
import { queryKeys } from '../lib/query-keys'

export const Route = createFileRoute('/_app/messages')({
  component: MessagesPage,
})

const PAGE_SIZE = 15

const TYPE_OPTIONS = Object.entries(MESSAGE_TYPE_LABELS).map(
  ([value, label]) => ({ value: Number(value), label }),
)

function MessagesPage() {
  const { message: toast } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [readFilter, setReadFilter] = useState<'all' | 'unread'>('all')
  const [type, setType] = useState<MessageType | undefined>(undefined)

  const params = useMemo(
    () => ({
      read: readFilter === 'unread' ? (0 as const) : undefined,
      type,
    }),
    [readFilter, type],
  )

  const query = useInfiniteQuery({
    queryKey: queryKeys.messages(params as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      messageApi.list({ ...params, page: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.list.length, 0)
      return loaded < lastPage.total ? lastPage.page + 1 : undefined
    },
  })

  const messages = query.data?.pages.flatMap((page) => page.list) ?? []
  const unread = query.data?.pages[0]?.unread ?? 0

  const invalidateMessages = () => {
    void queryClient.invalidateQueries({ queryKey: ['messages'] })
  }

  const markReadMutation = useMutation({
    mutationFn: (id: string) => messageApi.markRead(id),
    onSuccess: invalidateMessages,
  })

  const readAllMutation = useMutation({
    mutationFn: () => messageApi.readAll(),
    onSuccess: (result) => {
      invalidateMessages()
      toast.success(result.updated > 0 ? `已将 ${result.updated} 条标为已读` : '没有未读消息')
    },
    onError: () => toast.error('操作失败，请稍后重试'),
  })

  const openMessage = (item: Message) => {
    if (!item.readAt) markReadMutation.mutate(item.id)

    if (item.bizType === 'Appointment' && item.bizId) {
      router.history.push(`/appointments/${item.bizId}`)
    } else if (item.bizType === 'MentorProfile' && item.bizId) {
      router.history.push(`/mentors/${item.bizId}`)
    }
  }

  return (
    <div className="px-4 pt-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {unread > 0 ? (
            <span className="rounded-md bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger">
              {unread} 条未读
            </span>
          ) : (
            <span className="text-xs text-muted">暂无未读消息</span>
          )}
        </div>
        <Button
          size="small"
          icon={<CheckOutlined aria-hidden="true" />}
          onClick={() => readAllMutation.mutate()}
          loading={readAllMutation.isPending}
          disabled={unread === 0}
        >
          全部已读
        </Button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Segmented
          value={readFilter}
          onChange={(value) => setReadFilter(value as 'all' | 'unread')}
          options={[
            { label: '全部', value: 'all' },
            { label: '未读', value: 'unread' },
          ]}
        />
        <Select
          allowClear
          value={type}
          onChange={(value) => setType(value)}
          placeholder="消息类型"
          options={TYPE_OPTIONS}
          className="min-w-28 flex-1"
          aria-label="消息类型"
        />
      </div>

      <div className="mt-3 space-y-2.5">
        {query.isLoading ? (
          <LoadingBlock rows={4} />
        ) : query.isError ? (
          <ErrorState
            message="消息加载失败"
            onRetry={() => void query.refetch()}
          />
        ) : messages.length === 0 ? (
          <EmptyState
            description={
              readFilter === 'unread' ? '暂无未读消息' : '暂无消息'
            }
          />
        ) : (
          <>
            {messages.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openMessage(item)}
                className={`pressable block w-full rounded-xl border bg-white p-4 text-left shadow-[0_2px_8px_rgba(31,42,55,0.04)] ${
                  item.readAt ? 'border-line' : 'border-brand-200 bg-brand-50/40'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {!item.readAt ? (
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-700"
                      aria-label="未读"
                    />
                  ) : (
                    <span className="mt-1.5 h-2 w-2 shrink-0" aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[14px] font-medium text-ink">
                        {item.title}
                      </p>
                      <span className="shrink-0 text-xs text-muted">
                        {formatRelative(item.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-muted">
                      {item.content}
                    </p>
                    <span className="mt-2 inline-block rounded bg-brand-50 px-1.5 py-0.5 text-xs text-brand-600">
                      {MESSAGE_TYPE_LABELS[item.type]}
                    </span>
                  </div>
                </div>
              </button>
            ))}
            <ListFooter
              loading={query.isFetchingNextPage}
              hasMore={query.hasNextPage}
              isEmpty={messages.length === 0}
              onLoadMore={() => void query.fetchNextPage()}
            />
          </>
        )}
      </div>
    </div>
  )
}
