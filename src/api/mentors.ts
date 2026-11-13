import { api } from '../lib/api'
import type {
  MentorDetail,
  MentorListItem,
  MentorSearchParams,
  Page,
  ReviewPage,
} from './types'

export const mentorApi = {
  list(params: MentorSearchParams) {
    return api.get<Page<MentorListItem>>('/mentors', {
      page: params.page,
      pageSize: params.pageSize,
      name: params.name,
      mentorType: params.mentorType,
      researchField: params.researchField,
      professionalTitle: params.professionalTitle,
      weekday: params.weekday,
      deptId: params.deptId,
      keyword: params.keyword,
    })
  },
  detail(id: string) {
    return api.get<MentorDetail>(`/mentors/${id}`)
  },
  reviews(mentorId: string, params: { page?: number; pageSize?: number } = {}) {
    return api.get<ReviewPage>(`/mentors/${mentorId}/reviews`, params)
  },
}
