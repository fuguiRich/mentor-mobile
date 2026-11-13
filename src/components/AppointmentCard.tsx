import { Link } from '@tanstack/react-router'
import { ClockCircleOutlined } from '@ant-design/icons'
import type { AppointmentListItem } from '../api/types'
import {
  APPOINTMENT_MODE_LABELS,
  APPOINTMENT_TYPE_LABELS,
} from '../lib/constants'
import { formatDateTime } from '../lib/format'
import { StatusTag } from './common'

export function AppointmentCard({
  appointment,
}: {
  appointment: AppointmentListItem
}) {
  return (
    <Link
      to="/appointments/$appointmentId"
      params={{ appointmentId: appointment.id }}
      className="block no-underline"
    >
      <div className="pressable rounded-xl border border-line bg-white p-4 shadow-[0_2px_8px_rgba(31,42,55,0.04)] hover:bg-brand-50/30">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-serif text-[16px] font-medium text-ink">
              {appointment.mentor.realName}
              <span className="ml-2 text-xs font-normal text-muted">
                {appointment.mentor.orgUnitName}
              </span>
            </p>
            <p className="mt-1 line-clamp-1 text-[13px] text-muted">
              {appointment.topic}
            </p>
          </div>
          <StatusTag status={appointment.status} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <ClockCircleOutlined aria-hidden="true" />
            {formatDateTime(appointment.requestedTime)}
          </span>
          <span>{APPOINTMENT_MODE_LABELS[appointment.mode]}</span>
          <span>{APPOINTMENT_TYPE_LABELS[appointment.type]}</span>
        </div>
      </div>
    </Link>
  )
}
