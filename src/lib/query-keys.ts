export const queryKeys = {
  profile: ['auth', 'profile'] as const,
  mentors: (params: Record<string, unknown>) => ['mentors', params] as const,
  mentor: (id: string) => ['mentor', id] as const,
  mentorReviews: (id: string, page: number) =>
    ['mentor', id, 'reviews', page] as const,
  appointments: (params: Record<string, unknown>) =>
    ['appointments', params] as const,
  appointment: (id: string) => ['appointment', id] as const,
  appointmentRecord: (id: string) => ['appointment', id, 'record'] as const,
  appointmentMaterials: (id: string) =>
    ['appointment', id, 'materials'] as const,
  appointmentReview: (id: string) => ['appointment', id, 'review'] as const,
  messages: (params: Record<string, unknown>) => ['messages', params] as const,
  messagesUnread: ['messages', 'unread'] as const,
  achievements: (params: Record<string, unknown>) =>
    ['achievements', params] as const,
  stats: (params: Record<string, unknown>) =>
    ['stats', 'guidance', params] as const,
}
