import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ClockCircleOutlined,
  PhoneOutlined,
  RightOutlined,
  StarFilled,
} from '@ant-design/icons'
import { Button, Rate } from 'antd'
import { mentorApi } from '../api/mentors'
import type { MentorType } from '../api/types'
import {
  EmptyState,
  ErrorState,
  InfoRow,
  InitialAvatar,
  LoadingBlock,
  SectionCard,
} from '../components/common'
import { WEEKDAY_LABELS } from '../lib/constants'
import { formatDate } from '../lib/format'
import { queryKeys } from '../lib/query-keys'

export const Route = createFileRoute('/_app/mentors/$mentorId')({
  component: MentorDetailPage,
})

function MentorTypeBadge({ type }: { type: MentorType }) {
  const internal = type === 'internal'
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        internal
          ? 'bg-brand-50 text-brand-700 ring-brand-200'
          : 'bg-[#f7f1e3] text-[#8a6a2f] ring-[#e8dcc2]'
      }`}
    >
      {internal ? '校内导师' : '校外导师'}
    </span>
  )
}

function MentorDetailPage() {
  const { mentorId } = Route.useParams()

  const mentorQuery = useQuery({
    queryKey: queryKeys.mentor(mentorId),
    queryFn: () => mentorApi.detail(mentorId),
  })

  const reviewsQuery = useQuery({
    queryKey: queryKeys.mentorReviews(mentorId, 1),
    queryFn: () => mentorApi.reviews(mentorId, { page: 1, pageSize: 5 }),
    enabled: mentorQuery.isSuccess,
  })

  if (mentorQuery.isLoading) {
    return (
      <div className="px-4 pt-4">
        <LoadingBlock rows={5} />
      </div>
    )
  }

  if (mentorQuery.isError || !mentorQuery.data) {
    return (
      <div className="px-4 pt-4">
        <ErrorState
          message="导师信息加载失败，可能已下架"
          onRetry={() => void mentorQuery.refetch()}
        />
      </div>
    )
  }

  const mentor = mentorQuery.data
  const reviews = reviewsQuery.data
  const summary = reviews?.summary

  return (
    <div className="space-y-4 px-4 pt-4 pb-28">
      <section className="rounded-xl border border-line bg-white p-5 shadow-[0_2px_8px_rgba(31,42,55,0.04)]">
        <div className="flex items-start gap-4">
          <InitialAvatar name={mentor.name} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-[24px] leading-tight font-medium text-ink">
                {mentor.name}
              </h1>
              <MentorTypeBadge type={mentor.mentorType} />
            </div>
            <p className="mt-1 text-[13px] text-muted">
              {[mentor.professionalTitle, mentor.deptName]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {summary && summary.count > 0 && summary.avg !== null ? (
              <p className="mt-2 flex items-center gap-1.5 text-[13px]">
                <StarFilled className="text-gold" aria-hidden="true" />
                <span className="font-medium text-ink">
                  {summary.avg.toFixed(1)}
                </span>
                <span className="text-muted">（{summary.count} 条评价）</span>
              </p>
            ) : (
              <p className="mt-2 text-[13px] text-muted">暂无评价</p>
            )}
          </div>
        </div>

        {mentor.researchFields.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {mentor.researchFields.map((field) => (
              <span
                key={field}
                className="rounded bg-brand-50 px-2.5 py-1 text-[12px] font-medium text-brand-600"
              >
                {field}
              </span>
            ))}
          </div>
        ) : null}

        {mentor.mobile ? (
          <a href={`tel:${mentor.mobile}`} className="mt-4 inline-flex no-underline">
            <span className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-brand-50 px-3 py-1.5 text-[12px] font-medium text-brand-700">
              <PhoneOutlined aria-hidden="true" />
              {mentor.mobile}
            </span>
          </a>
        ) : null}
      </section>

      {mentor.timeSlots && mentor.timeSlots.length > 0 ? (
        <SectionCard title="可预约时段">
          <div className="flex flex-wrap gap-2">
            {mentor.timeSlots
              .filter((slot) => slot.status === 1)
              .map((slot) => (
                <span
                  key={slot.id}
                  className="inline-flex items-center gap-1.5 rounded-md bg-brand-50/40 px-3 py-2 text-[12px] text-ink/85 ring-1 ring-line"
                >
                  <ClockCircleOutlined aria-hidden="true" />
                  {WEEKDAY_LABELS[slot.weekday]} {slot.startTime}–{slot.endTime}
                </span>
              ))}
          </div>
        </SectionCard>
      ) : null}

      {mentor.summary ? (
        <SectionCard title="个人简介">
          <p className="whitespace-pre-line text-[14px] leading-7 text-ink/85">
            {mentor.summary}
          </p>
        </SectionCard>
      ) : null}

      {mentor.researchAchievements ? (
        <SectionCard title="研究成果">
          <p className="whitespace-pre-line text-[14px] leading-7 text-ink/85">
            {mentor.researchAchievements}
          </p>
        </SectionCard>
      ) : null}

      {mentor.guidanceExperience ? (
        <SectionCard title="指导经历">
          <p className="whitespace-pre-line text-[14px] leading-7 text-ink/85">
            {mentor.guidanceExperience}
          </p>
        </SectionCard>
      ) : null}

      {mentor.affiliateOrg || mentor.socialRoles ? (
        <SectionCard title="校外信息">
          {mentor.affiliateOrg ? (
            <InfoRow label="合作单位">{mentor.affiliateOrg}</InfoRow>
          ) : null}
          {mentor.socialRoles ? (
            <InfoRow label="社会任职">{mentor.socialRoles}</InfoRow>
          ) : null}
        </SectionCard>
      ) : null}

      <SectionCard
        title="学生评价"
        extra={
          summary && summary.count > 0 ? (
            <span className="text-xs text-muted">共 {summary.count} 条</span>
          ) : null
        }
      >
        {reviewsQuery.isLoading ? (
          <LoadingBlock rows={2} />
        ) : reviewsQuery.isError ? (
          <ErrorState
            message="评价加载失败"
            onRetry={() => void reviewsQuery.refetch()}
          />
        ) : !summary || summary.count === 0 ? (
          <EmptyState description="暂无评价" />
        ) : (
          <>
            <div className="mb-4 flex items-center gap-4 rounded-xl bg-brand-50/60 p-3">
              <div className="text-center">
                <p className="font-serif text-[28px] leading-none font-medium text-ink">
                  {summary.avg !== null ? summary.avg.toFixed(1) : '—'}
                </p>
                <Rate
                  disabled
                  allowHalf
                  value={summary.avg ?? 0}
                  className="mt-1 !text-[12px]"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                {[
                  { label: '指导态度', value: summary.attitudeAvg },
                  { label: '专业能力', value: summary.expertiseAvg },
                  { label: '指导效果', value: summary.effectAvg },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-xs text-muted">
                      {item.label}
                    </span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                      <span
                        className="block h-full rounded-full bg-brand-600"
                        style={{
                          width: `${((item.value ?? 0) / 5) * 100}%`,
                        }}
                      />
                    </span>
                    <span className="w-7 text-right text-xs font-medium text-muted">
                      {item.value !== null ? item.value.toFixed(1) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {reviews?.list.map((review) => (
                <div
                  key={review.id}
                  className="border-t border-line pt-3 first:border-t-0 first:pt-0"
                >
                  <div className="flex items-center justify-between">
                    <Rate
                      disabled
                      allowHalf
                      value={Number(review.overallScore)}
                      className="!text-[13px]"
                    />
                    <span className="text-xs text-muted">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12px] text-muted">
                    态度 {review.attitude} · 专业 {review.expertise} · 效果{' '}
                    {review.effect}
                  </p>
                  {review.comment ? (
                    <p className="mt-1.5 text-[13px] leading-6 text-ink/85">
                      {review.comment}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        )}
      </SectionCard>

      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 border-t border-line bg-white px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <Link
          to="/mentors/$mentorId/book"
          params={{ mentorId: mentor.id }}
          className="block no-underline"
        >
          <Button type="primary" size="large" block className="!h-12 !text-base">
            发起预约
            <RightOutlined style={{ fontSize: 12 }} aria-hidden="true" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
