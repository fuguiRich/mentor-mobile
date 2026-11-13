import { api } from '../lib/api'
import type { MessagePage, MessageType } from './types'

export interface MessageListParams {
  page?: number
  pageSize?: number
  read?: 0 | 1
  type?: MessageType
}

export const messageApi = {
  list(params: MessageListParams) {
    return api.get<MessagePage>('/messages', params)
  },
  markRead(id: string) {
    return api.patch<null>(`/messages/${id}/read`)
  },
  readAll() {
    return api.post<{ updated: number }>('/messages/read-all')
  },
}
