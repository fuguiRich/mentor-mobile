import { useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Alert, App as AntdApp, Button, Input, Segmented, Select } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import { appointmentApi } from '../api/appointments'
import { mentorApi } from '../api/mentors'
import type { AppointmentMode, AppointmentType } from '../api/types'
import {
  EmptyState,
  ErrorState,
  InitialAvatar,
  LoadingBlock,
  SectionCard,
} from '../components/common'
import { ApiError } from '../lib/api'
import {
  APPOINTMENT_MODE_LABELS,
  APPOINTMENT_TYPE_LABELS,
  WEEKDAY_LABELS,
} from '../lib/constants'
import {
  isPastInstant,
  slotToUtcIso,
  upcomingDatesForWeekday,
} from '../lib/format'
import { queryKeys } from '../lib/query-keys'

export const Route = createFileRoute('/_app/mentors/$mentorId_/book')({
  component: BookAppointmentPage,
})

const bookingSchema = z.object({
  slotId: z.string().min(1, '请选择可预约时段'),
  date: z.string().min(1, '请选择预约日期'),
  type: z.number().int().min(1).max(5),
  mode: z.union([z.literal(1), z.literal(2)]),
  topic: z.string().trim().min(1, '请填写指导主题').max(200, '最多 200 字'),
  questions: z
    .string()
    .trim()
    .min(1, '请填写拟咨询的问题')
    .max(2000, '最多 2000 字'),
})

type BookingValues = z.infer<typeof bookingSchema>

const TYPE_OPTIONS = Object.entries(APPOINTMENT_TYPE_LABELS).map(
  ([value, label]) => ({ value: Number(value), label }),
)

function BookAppointmentPage() {
  const { mentorId } = Route.useParams()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()

  const mentorQuery = useQuery({
    queryKey: queryKeys.mentor(mentorId),
    queryFn: () => mentorApi.detail(mentorId),
  })

  const slots = useMemo(
    () => (mentorQuery.data?.timeSlots ?? []).filter((slot) => slot.status === 1),
    [mentorQuery.data],
  )

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BookingValues>({
    resolver: zodResolver(bookingSchema),
    mode: 'onTouched',
    defaultValues: {
      slotId: '',
      date: '',
      type: 1,
      mode: 1,
      topic: '',
      questions: '',
    },
  })

  const slotId = watch('slotId')
  const date = watch('date')
  const selectedSlot = slots.find((slot) => slot.id === slotId)
  const availableDates = selectedSlot
    ? upcomingDatesForWeekday(selectedSlot.weekday).filter(
        (value) => !isPastInstant(slotToUtcIso(value, selectedSlot.startTime)),
      )
    : []

  const onSubmit = handleSubmit(async (values) => {
    const slot = slots.find((item) => item.id === values.slotId)
    if (!slot) {
      setError('slotId', { message: '请选择可预约时段' })
      return
    }

    try {
      const created = await appointmentApi.create({
        mentorProfileId: mentorId,
        type: values.type as AppointmentType,
        slotId: values.slotId,
        requestedTime: slotToUtcIso(values.date, slot.startTime),
        topic: values.topic.trim(),
        questions: values.questions.trim(),
        mode: values.mode as AppointmentMode,
      })
      await queryClient.invalidateQueries({ queryKey: ['appointments'] })
      message.success('预约已提交，等待导师确认')
      window.location.replace(`/appointments/${created.id}`)
    } catch (error) {
      if (error instanceof ApiError) {
        for (const field of error.fields) {
          if (field.field in bookingSchema.shape) {
            setError(field.field as keyof BookingValues, {
              message: field.message,
            })
          }
        }
        message.error(error.message)
      } else {
        message.error('提交失败，请稍后重试')
      }
    }
  })

  if (mentorQuery.isLoading) {
    return (
      <div className="px-4 pt-4">
        <LoadingBlock rows={4} />
      </div>
    )
  }

  if (mentorQuery.isError || !mentorQuery.data) {
    return (
      <div className="px-4 pt-4">
        <ErrorState
          message="导师信息加载失败"
          onRetry={() => void mentorQuery.refetch()}
        />
      </div>
    )
  }

  const mentor = mentorQuery.data

  return (
    <div className="px-4 pt-4 pb-28">
      <section className="flex items-center gap-3 rounded-xl border border-line bg-white p-4 shadow-[0_2px_8px_rgba(31,42,55,0.04)]">
        <InitialAvatar name={mentor.name} size={48} />
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-ink">
            {mentor.name}
            {mentor.professionalTitle ? (
              <span className="ml-2 text-xs font-normal text-muted">
                {mentor.professionalTitle}
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted">{mentor.deptName}</p>
        </div>
      </section>

      {slots.length === 0 ? (
        <div className="mt-4">
          <Alert
            type="info"
            showIcon
            message="该导师暂未开放可预约时段"
            description="导师开放时段后即可发起预约，请稍后再来看看。"
            className="mb-4"
          />
          <EmptyState
            description="暂无可选时段"
            action={
              <Link to="/mentors/$mentorId" params={{ mentorId }}>
                <Button>返回导师详情</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="mt-4 space-y-4">
          <SectionCard title="选择时段">
            <Controller
              control={control}
              name="slotId"
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onChange={(value) => {
                    field.onChange(value)
                    setValue('date', '', { shouldValidate: false })
                  }}
                  placeholder="选择导师开放的时段"
                  className="w-full"
                  size="large"
                  options={slots.map((slot) => ({
                    value: slot.id,
                    label: `${WEEKDAY_LABELS[slot.weekday]} ${slot.startTime}–${slot.endTime}`,
                  }))}
                  status={errors.slotId ? 'error' : undefined}
                  aria-label="可预约时段"
                  aria-invalid={errors.slotId ? true : undefined}
                  aria-describedby={
                    errors.slotId ? 'slotId-error' : undefined
                  }
                />
              )}
            />
            {errors.slotId ? (
              <p id="slotId-error" className="mt-1.5 text-xs text-danger">
                {errors.slotId.message}
              </p>
            ) : null}

            {selectedSlot ? (
              <div className="mt-4">
                <p className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-ink">
                  <ClockCircleOutlined aria-hidden="true" />
                  选择日期
                </p>
                {availableDates.length === 0 ? (
                  <p className="text-xs text-muted">
                    该时段近期没有可预约的日期，请换一个时段。
                  </p>
                ) : (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {availableDates.map((value) => {
                      const selected = value === date
                      const [, month, day] = value.split('-')
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setValue('date', value, { shouldValidate: true })
                          }
                          aria-pressed={selected}
                          aria-label={`${value} ${selectedSlot.startTime}`}
                          className={`flex min-h-16 w-14 shrink-0 flex-col items-center justify-center rounded-lg border text-center transition-colors ${
                            selected
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : 'border-line bg-white text-muted hover:border-brand-300'
                          }`}
                        >
                          <span className="text-xs opacity-80">
                            {Number(month)} 月
                          </span>
                          <span className="text-lg leading-tight font-medium">
                            {Number(day)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
                {errors.date ? (
                  <p className="mt-1.5 text-xs text-danger">{errors.date.message}</p>
                ) : null}
                {date && selectedSlot ? (
                  <p className="mt-2 text-xs text-muted">
                    预约时间：{date} {selectedSlot.startTime}（北京时间）
                  </p>
                ) : null}
              </div>
            ) : null}
          </SectionCard>

          <SectionCard title="指导信息">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink">
                  指导类型
                </label>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onChange={(value) => field.onChange(value)}
                      options={TYPE_OPTIONS}
                      size="large"
                      className="w-full"
                      aria-label="指导类型"
                    />
                  )}
                />
              </div>

              <div>
                <span className="mb-1.5 block text-[13px] font-medium text-ink">
                  对接方式
                </span>
                <Controller
                  control={control}
                  name="mode"
                  render={({ field }) => (
                    <Segmented
                      block
                      value={field.value}
                      onChange={(value) => field.onChange(value)}
                      options={[
                        { label: APPOINTMENT_MODE_LABELS[1], value: 1 },
                        { label: APPOINTMENT_MODE_LABELS[2], value: 2 },
                      ]}
                    />
                  )}
                />
              </div>

              <div>
                <label
                  htmlFor="topic"
                  className="mb-1.5 block text-[13px] font-medium text-ink"
                >
                  指导主题
                </label>
                <Controller
                  control={control}
                  name="topic"
                  render={({ field }) => (
                    <Input
                      id="topic"
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.value)}
                      placeholder="一句话说明希望得到的指导"
                      maxLength={200}
                      showCount
                      status={errors.topic ? 'error' : undefined}
                      aria-invalid={errors.topic ? true : undefined}
                      aria-describedby={
                        errors.topic ? 'topic-error' : undefined
                      }
                    />
                  )}
                />
                {errors.topic ? (
                  <p id="topic-error" className="mt-1 text-xs text-danger">
                    {errors.topic.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="questions"
                  className="mb-1.5 block text-[13px] font-medium text-ink"
                >
                  拟咨询的问题
                </label>
                <Controller
                  control={control}
                  name="questions"
                  render={({ field }) => (
                    <Input.TextArea
                      id="questions"
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.value)}
                      placeholder="描述项目现状、遇到的困难，以及希望导师重点解答的问题"
                      rows={5}
                      maxLength={2000}
                      showCount
                      status={errors.questions ? 'error' : undefined}
                      aria-invalid={errors.questions ? true : undefined}
                      aria-describedby={
                        errors.questions ? 'questions-error' : undefined
                      }
                    />
                  )}
                />
                {errors.questions ? (
                  <p id="questions-error" className="mt-1 text-xs text-danger">
                    {errors.questions.message}
                  </p>
                ) : null}
              </div>
            </div>
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
              提交预约
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
