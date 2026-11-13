import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  App as AntdApp,
  Button,
  Input,
  Modal,
  Select,
  Upload,
} from 'antd'
import {
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  PaperClipOutlined,
  PlusOutlined,
  StarOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { appointmentApi } from '../api/appointments'
import { fileApi } from '../api/files'
import type {
  AppointmentMaterial,
  GuidanceRecord,
  Review,
} from '../api/types'
import {
  EmptyState,
  ErrorState,
  InfoRow,
  InitialAvatar,
  LoadingBlock,
  SectionCard,
  StatusTag,
} from '../components/common'
import { ApiError, saveBlob } from '../lib/api'
import {
  APPOINTMENT_MODE_LABELS,
  APPOINTMENT_STATUS_META,
  APPOINTMENT_TYPE_LABELS,
  MATERIAL_KIND_LABELS,
} from '../lib/constants'
import {
  formatDateTime,
  formatDuration,
  formatFileSize,
} from '../lib/format'
import { queryKeys } from '../lib/query-keys'

export const Route = createFileRoute('/_app/appointments/$appointmentId')({
  component: AppointmentDetailPage,
})

function AppointmentDetailPage() {
  const { appointmentId } = Route.useParams()
  const { message, modal } = AntdApp.useApp()
  const queryClient = useQueryClient()

  const [disputeOpen, setDisputeOpen] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<
    { uid: string; file: File }[]
  >([])
  const [materialKind, setMaterialKind] = useState(1)
  const [preview, setPreview] = useState<{
    url: string
    name: string
    mimeType: string
  } | null>(null)

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url)
    }
  }, [preview])

  const appointmentQuery = useQuery({
    queryKey: queryKeys.appointment(appointmentId),
    queryFn: () => appointmentApi.detail(appointmentId),
  })

  const appointment = appointmentQuery.data

  const recordQuery = useQuery({
    queryKey: queryKeys.appointmentRecord(appointmentId),
    queryFn: async (): Promise<GuidanceRecord | null> => {
      try {
        return await appointmentApi.record(appointmentId)
      } catch (error) {
        if (
          error instanceof ApiError &&
          (error.code === 33001 || error.status === 404)
        ) {
          return null
        }
        throw error
      }
    },
    retry: false,
    enabled: appointmentQuery.isSuccess,
  })

  const materialsQuery = useQuery({
    queryKey: queryKeys.appointmentMaterials(appointmentId),
    queryFn: () => appointmentApi.materials(appointmentId),
    enabled: appointmentQuery.isSuccess,
  })

  const reviewQuery = useQuery({
    queryKey: queryKeys.appointmentReview(appointmentId),
    queryFn: async (): Promise<Review | null> => {
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

  const syncAppointment = () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.appointment(appointmentId),
    })
    void queryClient.invalidateQueries({ queryKey: ['appointments'] })
  }

  const cancelMutation = useMutation({
    mutationFn: () => appointmentApi.cancel(appointmentId),
    onSuccess: () => {
      syncAppointment()
      message.success('预约已取消')
    },
    onError: (error) =>
      message.error(error instanceof ApiError ? error.message : '取消失败'),
  })

  const confirmMutation = useMutation({
    mutationFn: () => appointmentApi.confirmRecord(appointmentId),
    onSuccess: () => {
      syncAppointment()
      message.success('已确认指导记录')
    },
    onError: (error) =>
      message.error(error instanceof ApiError ? error.message : '确认失败'),
  })

  const disputeMutation = useMutation({
    mutationFn: () => appointmentApi.dispute(appointmentId, disputeReason.trim()),
    onSuccess: () => {
      setDisputeOpen(false)
      setDisputeReason('')
      syncAppointment()
      message.success('异议已提交，等待管理员复核')
    },
    onError: (error) =>
      message.error(error instanceof ApiError ? error.message : '提交失败'),
  })

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (pendingFiles.length === 0) throw new Error('请选择文件')
      const uploaded = await fileApi.upload(
        pendingFiles.map((item) => item.file),
        'Appointment',
        appointmentId,
      )
      await Promise.all(
        uploaded.map((file) =>
          appointmentApi.attachMaterial(appointmentId, {
            fileId: file.id,
            kind: materialKind,
          }),
        ),
      )
      return uploaded.length
    },
    onSuccess: (count) => {
      setUploadOpen(false)
      setPendingFiles([])
      void queryClient.invalidateQueries({
        queryKey: queryKeys.appointmentMaterials(appointmentId),
      })
      message.success(`已上传 ${count} 份材料`)
    },
    onError: (error) =>
      message.error(error instanceof ApiError ? error.message : '上传失败'),
  })

  const detachMutation = useMutation({
    mutationFn: (materialId: string) =>
      appointmentApi.detachMaterial(appointmentId, materialId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.appointmentMaterials(appointmentId),
      })
      message.success('材料已移除')
    },
    onError: (error) =>
      message.error(error instanceof ApiError ? error.message : '移除失败'),
  })

  const downloadMaterial = async (material: AppointmentMaterial) => {
    message.loading({ content: '下载中…', key: 'material-download', duration: 0 })
    try {
      const blob = await appointmentApi.materialDownload(appointmentId, material)
      saveBlob(blob, material.originName)
      message.success({ content: '已开始下载', key: 'material-download' })
    } catch (error) {
      message.error({
        content: error instanceof ApiError ? error.message : '下载失败',
        key: 'material-download',
      })
    }
  }

  const previewMaterial = async (material: AppointmentMaterial) => {
    message.loading({ content: '加载中…', key: 'material-preview', duration: 0 })
    try {
      const blob = await appointmentApi.materialPreview(appointmentId, material)
      const url = URL.createObjectURL(blob)
      message.destroy('material-preview')
      setPreview({ url, name: material.originName, mimeType: material.mimeType })
    } catch (error) {
      message.error({
        content: error instanceof ApiError ? error.message : '预览失败',
        key: 'material-preview',
      })
    }
  }

  const closePreview = () => {
    if (preview) URL.revokeObjectURL(preview.url)
    setPreview(null)
  }

  const closeUpload = () => {
    setUploadOpen(false)
    setPendingFiles([])
  }

  if (appointmentQuery.isLoading) {
    return (
      <div className="px-4 pt-4">
        <LoadingBlock rows={5} />
      </div>
    )
  }

  if (appointmentQuery.isError || !appointment) {
    return (
      <div className="px-4 pt-4">
        <ErrorState
          message="预约详情加载失败"
          onRetry={() => void appointmentQuery.refetch()}
        />
      </div>
    )
  }

  const statusMeta = APPOINTMENT_STATUS_META[appointment.status]
  const canCancel = appointment.status === 0 || appointment.status === 1
  const canHandleRecord = appointment.status === 3
  const canReview =
    appointment.status === 4 ||
    (appointment.status === 6 && appointment.adjudicateComment !== null)
  const materials = materialsQuery.data?.list ?? []
  const record = recordQuery.data

  const onCancel = () => {
    modal.confirm({
      title: '取消这次预约？',
      content: '取消后如需继续指导，需要重新发起预约。',
      okText: '取消预约',
      okButtonProps: { danger: true },
      cancelText: '返回',
      onOk: () => cancelMutation.mutateAsync(),
    })
  }

  const onConfirmRecord = () => {
    modal.confirm({
      title: '确认指导记录？',
      content: '确认后记录将归档，并可以对本此指导进行评价。',
      okText: '确认无误',
      cancelText: '返回',
      onOk: () => confirmMutation.mutateAsync(),
    })
  }

  return (
    <div className="space-y-4 px-4 pt-4 pb-8">
      <section className="rounded-xl border border-line bg-white p-5 shadow-[0_2px_8px_rgba(31,42,55,0.04)]">
        <div className="flex items-center justify-between gap-3">
          <StatusTag status={appointment.status} />
          <span className="text-xs text-muted">
            {APPOINTMENT_TYPE_LABELS[appointment.type]}
          </span>
        </div>
        <p className="mt-3 font-serif text-[24px] leading-tight font-medium text-ink">
          {formatDateTime(appointment.requestedTime)}
        </p>
        <p className="mt-1 text-[13px] text-muted">{statusMeta.hint}</p>
        {appointment.proposedTime ? (
          <p className="mt-2 rounded-md bg-[#f7f1e3] px-3 py-2 text-xs text-[#8a6a2f]">
            导师建议改期至 {formatDateTime(appointment.proposedTime)}
          </p>
        ) : null}
      </section>

      <SectionCard title="导师信息">
        <Link
          to="/mentors/$mentorId"
          params={{ mentorId: appointment.mentorProfileId }}
          className="flex items-center gap-3 no-underline"
        >
          <InitialAvatar name={appointment.mentor.realName} size={44} />
          <div className="min-w-0">
            <p className="font-serif text-[16px] font-medium text-ink">
              {appointment.mentor.realName}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted">
              {appointment.mentor.orgUnitName}
            </p>
          </div>
          <span className="ml-auto text-xs font-medium text-brand-700">
            查看导师主页
          </span>
        </Link>
      </SectionCard>

      <SectionCard title="学生信息">
        <InfoRow label="学号">{appointment.student.login}</InfoRow>
        <InfoRow label="姓名">{appointment.student.realName}</InfoRow>
        <InfoRow label="学院">{appointment.student.orgUnitName}</InfoRow>
        <InfoRow label="专业">{appointment.student.major || '—'}</InfoRow>
        <InfoRow label="行政班级">
          {appointment.student.className || '—'}
        </InfoRow>
        <InfoRow label="联系电话">{appointment.student.mobile || '—'}</InfoRow>
      </SectionCard>

      <SectionCard title="预约内容">
        <InfoRow label="指导主题">{appointment.topic}</InfoRow>
        <InfoRow label="对接方式">
          {APPOINTMENT_MODE_LABELS[appointment.mode]}
        </InfoRow>
        <InfoRow label="拟咨询问题">
          <span className="whitespace-pre-line">{appointment.questions}</span>
        </InfoRow>
        {appointment.handleComment ? (
          <InfoRow label="导师意见">{appointment.handleComment}</InfoRow>
        ) : null}
        {appointment.rejectReason ? (
          <InfoRow label="拒绝原因">
            <span className="text-danger">{appointment.rejectReason}</span>
          </InfoRow>
        ) : null}
        {appointment.disputeReason ? (
          <InfoRow label="我的异议">{appointment.disputeReason}</InfoRow>
        ) : null}
        {appointment.adjudicateComment ? (
          <InfoRow label="复核意见">{appointment.adjudicateComment}</InfoRow>
        ) : null}
      </SectionCard>

      {appointment.status >= 3 ? (
        <SectionCard title="指导记录">
          {recordQuery.isLoading ? (
            <LoadingBlock rows={1} />
          ) : recordQuery.isError ? (
            <ErrorState
              message="指导记录加载失败"
              onRetry={() => void recordQuery.refetch()}
            />
          ) : !record ? (
            <EmptyState description="导师还没有提交指导记录" />
          ) : (
            <div>
              <InfoRow label="实际时间">
                {formatDateTime(record.actualTime)}
              </InfoRow>
              <InfoRow label="指导方式">
                {APPOINTMENT_MODE_LABELS[record.mode]}
              </InfoRow>
              <InfoRow label="指导时长">
                {formatDuration(record.durationMinutes)}
              </InfoRow>
              <InfoRow label="核心内容">
                <span className="whitespace-pre-line">{record.coreContent}</span>
              </InfoRow>
              <InfoRow label="后续建议">
                <span className="whitespace-pre-line">{record.followUp}</span>
              </InfoRow>

              {canHandleRecord ? (
                <div className="mt-4 flex gap-2">
                  <Button
                    block
                    type="primary"
                    onClick={onConfirmRecord}
                    loading={confirmMutation.isPending}
                  >
                    确认记录
                  </Button>
                  <Button block danger onClick={() => setDisputeOpen(true)}>
                    提出异议
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </SectionCard>
      ) : null}

      <SectionCard
        title="预约材料"
        extra={
          <Button
            size="small"
            type="text"
            icon={<PlusOutlined aria-hidden="true" />}
            onClick={() => setUploadOpen(true)}
          >
            上传
          </Button>
        }
      >
        {materialsQuery.isLoading ? (
          <LoadingBlock rows={1} />
        ) : materialsQuery.isError ? (
          <ErrorState
            message="材料加载失败"
            onRetry={() => void materialsQuery.refetch()}
          />
        ) : materials.length === 0 ? (
          <EmptyState description="还没有上传材料" />
        ) : (
          <ul className="space-y-2">
            {materials.map((material) => (
              <li
                key={material.id}
                className="flex items-center gap-3 rounded-lg bg-brand-50/60 px-3 py-2.5"
              >
                <PaperClipOutlined className="text-muted/60" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">
                    {material.originName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {material.source === 'appointment' ? '我的材料' : '导师材料'}
                    {material.kind
                      ? ` · ${MATERIAL_KIND_LABELS[material.kind] ?? '其他材料'}`
                      : ''}
                    {' · '}
                    {formatFileSize(material.size)}
                  </p>
                </div>
                <Button
                  size="small"
                  type="text"
                  aria-label={`预览 ${material.originName}`}
                  icon={<EyeOutlined aria-hidden="true" />}
                  onClick={() => void previewMaterial(material)}
                />
                <Button
                  size="small"
                  type="text"
                  aria-label={`下载 ${material.originName}`}
                  icon={<DownloadOutlined aria-hidden="true" />}
                  onClick={() => void downloadMaterial(material)}
                />
                {material.source === 'appointment' ? (
                  <Button
                    size="small"
                    type="text"
                    danger
                    aria-label={`移除 ${material.originName}`}
                    icon={<DeleteOutlined aria-hidden="true" />}
                    onClick={() => detachMutation.mutate(material.id)}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {appointment.status >= 4 ? (
        <SectionCard title="我的评价">
          {reviewQuery.isLoading ? (
            <LoadingBlock rows={1} />
          ) : reviewQuery.data ? (
            <div>
              <InfoRow label="综合评分">
                <span className="font-serif text-xl font-medium text-[#8a6a2f]">
                  {reviewQuery.data.overallScore}
                </span>
                <span className="ml-1 text-xs text-muted">/ 5.00</span>
              </InfoRow>
              <InfoRow label="分项评分">
                态度 {reviewQuery.data.attitude} · 专业{' '}
                {reviewQuery.data.expertise} · 效果 {reviewQuery.data.effect}
              </InfoRow>
              {reviewQuery.data.comment ? (
                <InfoRow label="文字评价">
                  <span className="whitespace-pre-line">
                    {reviewQuery.data.comment}
                  </span>
                </InfoRow>
              ) : null}
              <p className="mt-2 text-xs text-muted">
                评价于 {formatDateTime(reviewQuery.data.createdAt)}
              </p>
            </div>
          ) : canReview ? (
            <div className="py-2 text-center">
              <p className="mb-3 text-[13px] text-muted">
                指导已完成，可提交本次指导评价
              </p>
              <Link
                to="/appointments/$appointmentId/review"
                params={{ appointmentId }}
              >
                <Button type="primary" icon={<StarOutlined aria-hidden="true" />}>
                  提交评价
                </Button>
              </Link>
            </div>
          ) : (
            <EmptyState description="还没有评价" />
          )}
        </SectionCard>
      ) : null}

      {canCancel ? (
        <Button block danger onClick={onCancel} loading={cancelMutation.isPending}>
          取消预约
        </Button>
      ) : null}

      {appointment.status === 7 ||
      appointment.status === 8 ||
      appointment.status === 9 ? (
        <Link
          to="/mentors/$mentorId/book"
          params={{ mentorId: appointment.mentorProfileId }}
          className="block no-underline"
        >
          <Button type="primary" block className="!h-11">
            重新发起预约
          </Button>
        </Link>
      ) : null}

      <Modal
        title="提交异议"
        open={disputeOpen}
        onCancel={() => setDisputeOpen(false)}
        okText="提交异议"
        cancelText="取消"
        confirmLoading={disputeMutation.isPending}
        okButtonProps={{ disabled: disputeReason.trim().length === 0 }}
        onOk={() => disputeMutation.mutate()}
      >
        <p className="mb-2 text-[13px] text-muted">
          请说明记录中与实际不符的地方，管理员会复核处理。
        </p>
        <Input.TextArea
          value={disputeReason}
          onChange={(event) => setDisputeReason(event.target.value)}
          rows={4}
          maxLength={500}
          showCount
          placeholder="例如：记录中的实际指导时间与当天安排不符"
          aria-label="异议原因"
        />
      </Modal>

      <Modal
        title="上传预约材料"
        open={uploadOpen}
        onCancel={closeUpload}
        onOk={() => uploadMutation.mutate()}
        okText="上传"
        cancelText="取消"
        confirmLoading={uploadMutation.isPending}
        okButtonProps={{ disabled: pendingFiles.length === 0 }}
      >
        <div className="space-y-4">
          <p className="text-[13px] leading-5 text-muted">
            支持图片 / PDF，单次最多 10 份。上传后会统一归入所选材料分类。
          </p>
          <Upload
            accept="image/*,.pdf"
            multiple
            maxCount={10}
            beforeUpload={(file) => {
              const isSupported =
                file.type === 'application/pdf' || file.type.startsWith('image/')
              if (!isSupported) {
                message.error('仅支持图片或 PDF 文件')
                return Upload.LIST_IGNORE
              }
              if (pendingFiles.length >= 10) {
                message.error('单次最多上传 10 份材料')
                return Upload.LIST_IGNORE
              }
              const uid = `${file.name}-${file.size}-${file.lastModified}`
              setPendingFiles((prev) =>
                prev.some((item) => item.uid === uid)
                  ? prev
                  : [...prev, { uid, file }],
              )
              return false
            }}
            onRemove={(file) =>
              setPendingFiles((prev) =>
                prev.filter((item) => item.uid !== file.uid),
              )
            }
            fileList={
              pendingFiles.map(({ uid, file }) => ({
                uid,
                name: file.name,
                size: file.size,
                status: 'done' as const,
              })) as UploadFile[]
            }
          >
            <Button icon={<UploadOutlined aria-hidden="true" />}>
              选择图片或 PDF（可多选）
            </Button>
          </Upload>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-ink">
              材料分类
            </label>
            <Select
              value={materialKind}
              onChange={(value) => setMaterialKind(value)}
              className="w-full"
              options={Object.entries(MATERIAL_KIND_LABELS).map(
                ([value, label]) => ({ value: Number(value), label }),
              )}
            />
          </div>
        </div>
      </Modal>

      <Modal
        title={preview?.name ?? '材料预览'}
        open={preview !== null}
        onCancel={closePreview}
        footer={null}
        width="92%"
      >
        {preview ? (
          preview.mimeType.startsWith('image/') ? (
            <img
              src={preview.url}
              alt={preview.name}
              className="max-h-[70vh] w-full object-contain"
            />
          ) : preview.mimeType === 'application/pdf' ? (
            <iframe
              src={preview.url}
              title={preview.name}
              className="h-[70vh] w-full border-0"
            />
          ) : (
            <p className="py-6 text-center text-sm text-muted">
              该文件类型不支持在线预览，请下载查看。
            </p>
          )
        ) : null}
      </Modal>
    </div>
  )
}
