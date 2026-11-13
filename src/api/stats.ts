import { api, saveBlob } from '../lib/api'
import { parseCsv } from '../lib/csv'
import { APPOINTMENT_TYPE_LABELS } from '../lib/constants'

export interface GuidanceRecordRow {
  appointmentId: string
  mentorName: string
  typeLabel: string
  topic: string
  actualTime: string
  durationMinutes: number
  score: string
  comment: string
}

const RECORD_COLUMNS = 8

const LEGACY_TYPE_LABELS: Record<string, string> = {
  双创竞赛指导: '创新创业竞赛指导',
  其他双创指导: '其他创新创业指导',
}

function normalizeType(value: string): string {
  const trimmed = value.trim()
  const numeric = Number(trimmed)
  if (
    Number.isInteger(numeric) &&
    numeric >= 1 &&
    numeric <= 5
  ) {
    return APPOINTMENT_TYPE_LABELS[
      numeric as keyof typeof APPOINTMENT_TYPE_LABELS
    ]
  }
  return LEGACY_TYPE_LABELS[trimmed] ?? trimmed
}

export const statsApi = {
  /**
   * The student archive has no JSON list endpoint yet, so the CSV export is
   * parsed for on-screen display. Reported in docs/优化文档-学生端接口缺口.md.
   */
  async records(): Promise<GuidanceRecordRow[]> {
    const blob = await api.download('/me/records/export')
    const text = await blob.text()
    const rows = parseCsv(text)
    if (rows.length === 0 || (rows[0]?.length ?? 0) < RECORD_COLUMNS) return []

    return rows.slice(1).map((row) => ({
      appointmentId: row[0] ?? '',
      mentorName: row[1] ?? '',
      typeLabel: normalizeType(row[2] ?? ''),
      topic: row[3] ?? '',
      actualTime: row[4] ?? '',
      durationMinutes: Number(row[5]) || 0,
      score: row[6] ?? '',
      comment: row[7] ?? '',
    }))
  },
  async exportRecords() {
    const blob = await api.download('/me/records/export')
    saveBlob(blob, '我的指导档案.csv')
  },
}
