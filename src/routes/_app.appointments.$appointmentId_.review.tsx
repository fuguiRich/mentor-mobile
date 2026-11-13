import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Alert, App as AntdApp, Button, Input, Rate } from 'antd'
import { StarFilled } from '@ant-design/icons'
import { appointmentApi } from '../api/appointments'
import type { AppointmentMode, AppointmentType } from '../api/types'
import {
  ErrorState,
  LoadingBlock,
  SectionCard,
} from '../components/common'
import { ApiError } from '../lib/api'
import {
  APPOINTMENT_MODE_LABELS,
  APPOINTMENT_TYPE_LABELS,
  REVIEW_DIMENSIONS,
} from '../lib/constants'
import { formatDateTime } from '../lib/format'
import { queryKeys } from '../lib/query-keys'

export const Route = createFileRoute('/_app/appointments/$appointmentId_/review')({
  component: ReviewPage,
})

const reviewSchema = z.object({
  attitude: z.number().min(1, '请评分').max(5),
  expertise: z.number().min(1, '请评分').max(5),
  effect: z.number().min(1, '请评分').max(5),
  comment: z.string().max(1000, '最多 1000 字').optional(),
})

type ReviewValues = z.infer<typeof reviewSchema>

function ReviewPage() {
  const { appointmentId } = Route.useParams()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()

  const appointmentQuery = useQuery({
    queryKey: queryKeys.appointment(appointmentId),
    queryFn: () => appointmentApi.detail(appointmentId),
  })

  const reviewQuery = useQuery({
    queryKey: queryKeys.appointmentReview(appointmentId),
    queryFn: async () => {
      try {
        return await appointmentApi.review(appointmentId)
      } catch (error) {
        if (
          error instanceof ApiError &&
          (error.code === 34001 || error.status === 404)
        ) {
          return null
        }
        throw error
      }
    },
    retry: false,
    enabled: appointmentQuery.isSuccess,
  })

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    mode: 'onTouched',
    defaultValues: { attitude: 0, expertise: 0, effect: 0, comment: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await appointmentApi.createReview(appointmentId, {
        attitude: values.attitude,
        expertise: values.expertise,
        effect: values.effect,
        comment: values.comment?.trim() || null,
      })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.appointment(appointmentId),
      })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.appointmentReview(appointmentId),
      })
      await queryClient.invalidateQueries({ queryKey: ['appointments'] })
      message.success('评价已提交，感谢你的反馈')
      window.location.replace(`/appointments/${appointmentId}`)
    } catch (error) {
      message.error(
        error instanceof ApiError ? error.message : '提交失败，请稍后重试',
      )
    }
  })

  if (appointmentQuery.isLoading) {
    return (
      <div className="px-4 pt-4">
        <LoadingBlock rows={3} />
      </div>
    )
  }

  if (appointmentQuery.isError || !appointmentQuery.data) {
    return (
      <div className="px-4 pt-4">
        <ErrorState
          message="预约信息加载失败"
          onRetry={() => void appointmentQuery.refetch()}
        />
      </div>
    )
  }

  const appointment = appointmentQuery.data

  if (reviewQuery.data) {
    return (
      <div className="px-4 pt-4">
        <Alert
          type="success"
          showIcon
          message="本次指导已评价"
          description={`综合评分 ${reviewQuery.data.overallScore} / 5.00`}
        />
        <Link
          to="/appointments/$appointmentId"
          params={{ appointmentId }}
          className="mt-4 block"
        >
          <Button block>返回预约详情</Button>
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="px-4 pt-4 pb-28">
      <section className="rounded-xl border border-line bg-white p-4 shadow-[0_2px_8px_rgba(31,42,55,0.04)]">
        <p className="font-serif text-[16px] font-medium text-ink">
          {appointment.mentor.realName}
          <span className="ml-2 text-xs font-normal text-muted">
            {appointment.mentor.orgUnitName}
          </span>
        </p>
        <p className="mt-1 line-clamp-1 text-[13px] text-muted">
          {appointment.topic}
        </p>
        <p className="mt-1.5 text-xs text-muted">
          {formatDateTime(appointment.requestedTime)} ·{' '}
          {APPOINTMENT_MODE_LABELS[appointment.mode as AppointmentMode]} ·{' '}
          {APPOINTMENT_TYPE_LABELS[appointment.type as AppointmentType]}
        </p>
      </section>

      <SectionCard title="分项评分" className="mt-4">
        <div className="space-y-5">
          {REVIEW_DIMENSIONS.map((dimension) => (
            <div key={dimension.key}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[14px] font-medium text-ink">
                    {dimension.label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {dimension.hint}
                  </p>
                </div>
                <Controller
                  control={control}
                  name={dimension.key}
                  render={({ field }) => (
                    <Rate
                      value={field.value}
                      onChange={(value) => field.onChange(value)}
                      character={<StarFilled />}
                      className="!text-[22px]"
                      aria-label={`${dimension.label}评分`}
                      aria-invalid={
                        errors[dimension.key] ? true : undefined
                      }
                      aria-describedby={
                        errors[dimension.key]
                          ? `${dimension.key}-error`
                          : undefined
                      }
                    />
                  )}
                />
              </div>
              {errors[dimension.key] ? (
                <p
                  id={`${dimension.key}-error`}
                  className="mt-1 text-xs text-danger"
                >
                  {errors[dimension.key]?.message}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="文字评价（选填）" className="mt-4">
        <Controller
          control={control}
          name="comment"
          render={({ field }) => (
            <Input.TextArea
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
              rows={4}
              maxLength={1000}
              showCount
              placeholder="请填写对本次指导的评价（选填）"
              aria-label="文字评价"
            />
          )}
        />
        {errors.comment ? (
          <p className="mt-1 text-xs text-danger">{errors.comment.message}</p>
        ) : null}
      </SectionCard>

      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 border-t border-line bg-white px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <Button
          type="primary"
          size="large"
          block
          htmlType="submit"
          loading={isSubmitting}
          className="!h-12 !text-base"
        >
          提交评价
        </Button>
      </div>
    </form>
  )
}
