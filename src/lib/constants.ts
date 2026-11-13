import type {
  AchievementLevel,
  AchievementType,
  AppointmentStatus,
  AppointmentType,
  AppointmentMode,
  MessageType,
} from '../api/types'

export const UNIVERSITY_NAME = '长沙医学院'
export const UNIVERSITY_NAME_EN = 'CHANGSHA MEDICAL UNIVERSITY'
export const PLATFORM_NAME = '创新创业导师指导平台'

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  1: '创新创业竞赛指导',
  2: '科研项目指导',
  3: '创业实践指导',
  4: '论文·专利指导',
  5: '其他创新创业指导',
}

export const APPOINTMENT_MODE_LABELS: Record<AppointmentMode, string> = {
  1: '线上',
  2: '线下',
}

export type StatusTone =
  | 'warning'
  | 'info'
  | 'purple'
  | 'success'
  | 'danger'
  | 'neutral'

export interface StatusMeta {
  label: string
  tone: StatusTone
  hint: string
}

export const APPOINTMENT_STATUS_META: Record<AppointmentStatus, StatusMeta> = {
  0: { label: '待导师确认', tone: 'warning', hint: '预约已提交，等待导师确认' },
  1: { label: '已确认', tone: 'info', hint: '导师已确认，请按约定时间参加指导' },
  2: { label: '指导中', tone: 'info', hint: '本次指导进行中' },
  3: { label: '记录待确认', tone: 'purple', hint: '导师已提交指导记录，请核对确认' },
  4: { label: '待评价', tone: 'success', hint: '指导记录已确认，可提交本次评价' },
  5: { label: '有异议', tone: 'danger', hint: '异议已提交，等待学院复核' },
  6: { label: '已完成', tone: 'success', hint: '本次指导已完成' },
  7: { label: '已拒绝', tone: 'neutral', hint: '导师未接受本次预约，可查看原因后重新预约' },
  8: { label: '已取消', tone: 'neutral', hint: '本次预约已取消' },
  9: { label: '已过期', tone: 'neutral', hint: '预约已过期，可重新发起预约' },
}

export const APPOINTMENT_STATUS_FILTERS: {
  key: string
  label: string
  statuses?: AppointmentStatus[]
}[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中', statuses: [0, 1, 2] },
  { key: 'confirm', label: '待确认', statuses: [3, 5] },
  { key: 'review', label: '待评价', statuses: [4] },
  { key: 'done', label: '已完成', statuses: [6] },
  { key: 'closed', label: '已结束', statuses: [7, 8, 9] },
]

export const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  1: '预约提醒',
  2: '记录提醒',
  3: '考核提醒',
  4: '系统通知',
}

export const ACHIEVEMENT_TYPE_LABELS: Record<AchievementType, string> = {
  1: '学科竞赛获奖',
  2: '创新创业项目立项',
  3: '其他成果',
}

export const ACHIEVEMENT_LEVEL_LABELS: Record<AchievementLevel, string> = {
  1: '国家级',
  2: '省级',
  3: '市级',
  4: '校级',
  5: '院级',
}

export const MATERIAL_KIND_LABELS: Record<number, string> = {
  1: '项目计划书',
  2: '学科竞赛备赛资料',
  3: '其他材料',
}

export const WEEKDAY_LABELS: Record<number, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
}

export const REVIEW_DIMENSIONS = [
  { key: 'attitude', label: '指导态度', hint: '沟通是否耐心、及时' },
  { key: 'expertise', label: '专业能力', hint: '建议是否专业、可落地' },
  { key: 'effect', label: '指导效果', hint: '对项目推进是否有帮助' },
] as const

export const ACTIVE_STATUSES: AppointmentStatus[] = [0, 1, 2, 3, 4, 5]
