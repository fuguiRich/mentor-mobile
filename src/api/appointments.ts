import { api } from '../lib/api'
import type {
  Appointment,
  AppointmentDetail,
  AppointmentListItem,
  AppointmentMaterial,
  AppointmentStatus,
  AppointmentType,
  AttachMaterialPayload,
  CreateAppointmentPayload,
  CreateReviewPayload,
  GuidanceRecord,
  Page,
  Review,
} from './types'

export interface AppointmentListParams {
  page?: number
  pageSize?: number
  status?: AppointmentStatus
  type?: AppointmentType
}

function materialPath(
  appointmentId: string,
  material: AppointmentMaterial,
  action: 'preview' | 'download',
): string {
  const base =
    material.source === 'record'
      ? `/appointments/${appointmentId}/record/materials/${material.id}`
      : `/appointments/${appointmentId}/materials/${material.id}`
  return `${base}/${action}`
}

export const appointmentApi = {
  list(params: AppointmentListParams) {
    return api.get<Page<AppointmentListItem>>('/appointments', params)
  },
  detail(id: string) {
    return api.get<AppointmentDetail>(`/appointments/${id}`)
  },
  create(payload: CreateAppointmentPayload) {
    return api.post<Appointment>('/appointments', payload)
  },
  cancel(id: string) {
    return api.post<Appointment>(`/appointments/${id}/cancel`, {})
  },
  record(id: string) {
    return api.get<GuidanceRecord>(`/appointments/${id}/record`)
  },
  confirmRecord(id: string) {
    return api.post<Appointment>(`/appointments/${id}/confirm-record`, {})
  },
  dispute(id: string, reason: string) {
    return api.post<Appointment>(`/appointments/${id}/dispute`, { reason })
  },
  materials(id: string) {
    return api.get<Page<AppointmentMaterial>>(`/appointments/${id}/materials`)
  },
  attachMaterial(id: string, payload: AttachMaterialPayload) {
    return api.post<AppointmentMaterial>(
      `/appointments/${id}/materials`,
      payload,
    )
  },
  detachMaterial(id: string, materialId: string) {
    return api.delete<{ id: string; source: string }>(
      `/appointments/${id}/materials/${materialId}`,
    )
  },
  materialPreview(id: string, material: AppointmentMaterial) {
    return api.download(materialPath(id, material, 'preview'))
  },
  materialDownload(id: string, material: AppointmentMaterial) {
    return api.download(materialPath(id, material, 'download'))
  },
  review(id: string) {
    return api.get<Review>(`/appointments/${id}/review`)
  },
  createReview(id: string, payload: CreateReviewPayload) {
    return api.post<Review>(`/appointments/${id}/review`, payload)
  },
}
