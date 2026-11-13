import { api } from '../lib/api'
import type {
  AchievementSearchParams,
  Page,
  StudentAchievement,
} from './types'

export const achievementApi = {
  list(params: AchievementSearchParams) {
    return api.get<Page<StudentAchievement>>('/student-achievements', params)
  },
}
