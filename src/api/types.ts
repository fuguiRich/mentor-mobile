export interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
  traceId?: string
}

export interface Page<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface FieldError {
  field: string
  message: string
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export interface LoginPayload {
  username: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
  loginSource?: 'sso' | 'local' | 'local-fallback'
  ssoUnavailable?: boolean
  isDefaultPwd?: boolean | null
}

export type AuthSource = 'local' | 'sso'

export interface UserProfile {
  id: string
  username: string
  realName: string
  employeeNo: string
  mobile: string | null
  deptId: string
  deptName: string | null
  status: number
  isSuperAdmin: boolean
  authSource?: AuthSource
  personType?: string | null
  mentorType?: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
  roleIds: string[]
}

export interface MenuNode {
  id: string
  parentId: string | null
  type: 'DIR' | 'MENU' | 'BUTTON'
  code: string | null
  name: string
  path: string | null
  component: string | null
  icon: string | null
  sortOrder: number
  status: number
  children: MenuNode[]
}

export interface AuthProfile {
  user: UserProfile
  permissions: string[]
  menus: MenuNode[]
}

export interface ChangePasswordPayload {
  oldPassword: string
  newPassword: string
}

/* ------------------------------------------------------------------ */
/* Mentors                                                             */
/* ------------------------------------------------------------------ */

export type MentorType = 'internal' | 'external'

export interface MentorSearchParams {
  page?: number
  pageSize?: number
  name?: string
  mentorType?: MentorType
  researchField?: string
  professionalTitle?: string
  weekday?: number
  deptId?: string
  keyword?: string
}

export interface MentorListItem {
  id: string
  name: string
  mentorType: MentorType
  deptName: string
  professionalTitle: string | null
  researchFields: string[]
  summary: string | null
}

export interface MentorDetail extends MentorListItem {
  researchAchievements: string | null
  guidanceExperience: string | null
  affiliateOrg: string | null
  socialRoles: string | null
  mobile: string | null
  /**
   * The student-facing doc says the detail response includes the mentor's open
   * slots, but `MentorSearchDetailResponseDto` currently does not return them.
   * Typed as optional so the UI degrades gracefully if the backend adds it.
   */
  timeSlots?: MentorTimeSlot[]
}

export interface MentorTimeSlot {
  id: string
  mentorProfileId: string
  weekday: number
  startTime: string
  endTime: string
  status: number
}

/* ------------------------------------------------------------------ */
/* Appointments                                                        */
/* ------------------------------------------------------------------ */

export type AppointmentStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type AppointmentType = 1 | 2 | 3 | 4 | 5
export type AppointmentMode = 1 | 2

export interface AppointmentStudent {
  personId: string
  login: string
  realName: string
  orgUnitName: string
}

export interface AppointmentStudentDetail extends AppointmentStudent {
  major: string | null
  className: string | null
  mobile: string | null
}

export interface AppointmentMentor {
  mentorProfileId: string
  realName: string
  orgUnitName: string
}

export interface Appointment {
  id: string
  studentPersonId: string
  mentorProfileId: string
  type: AppointmentType
  status: AppointmentStatus
  requestedTime: string
  proposedTime: string | null
  topic: string
  questions: string
  mode: AppointmentMode
  handleComment: string | null
  rejectReason: string | null
  disputeReason: string | null
  adjudicateComment: string | null
  slotId: string | null
}

export interface AppointmentListItem extends Appointment {
  student: AppointmentStudent
  mentor: AppointmentMentor
}

export interface AppointmentDetail extends Appointment {
  student: AppointmentStudentDetail
  mentor: AppointmentMentor
}

export interface CreateAppointmentPayload {
  mentorProfileId: string
  type: AppointmentType
  slotId: string
  requestedTime: string
  topic: string
  questions: string
  mode: AppointmentMode
}

export interface GuidanceRecord {
  id: string
  appointmentId: string
  actualTime: string
  mode: AppointmentMode
  coreContent: string
  followUp: string
  submittedBy: string
  submittedAt: string
  student: {
    realName: string
    login: string
    major: string | null
    className: string | null
    mobile: string | null
  }
  durationMinutes: number
}

export type AppointmentMaterialSource = 'appointment' | 'record'

export interface AppointmentMaterial {
  id: string
  source: AppointmentMaterialSource
  fileId: string
  kind: number | null
  originName: string
  mimeType: string
  size: number
  createdAt: string
}

export interface AttachMaterialPayload {
  fileId: string
  kind: number
}

export interface UploadedFile {
  id: string
  originName: string
  ext: string
  mimeType: string
  size: number
  sha256: string
  uploaderId: string
  ownerType: string | null
  ownerId: string | null
  createdAt: string
  previewUrl: string
  downloadUrl: string
}

/* ------------------------------------------------------------------ */
/* Reviews                                                             */
/* ------------------------------------------------------------------ */

export interface CreateReviewPayload {
  attitude: number
  expertise: number
  effect: number
  comment?: string | null
}

export interface Review {
  id: string
  appointmentId: string
  mentorProfileId: string
  attitude: number
  expertise: number
  effect: number
  overallScore: string
  comment: string | null
  createdAt: string
}

export interface ReviewSummary {
  count: number
  avg: number | null
  attitudeAvg: number | null
  expertiseAvg: number | null
  effectAvg: number | null
}

export interface ReviewPage extends Page<Review> {
  summary: ReviewSummary
}

/* ------------------------------------------------------------------ */
/* Messages                                                            */
/* ------------------------------------------------------------------ */

export type MessageType = 1 | 2 | 3 | 4

export interface Message {
  id: string
  type: MessageType
  title: string
  content: string
  bizType: string | null
  bizId: string | null
  readAt: string | null
  createdAt: string
}

export interface MessagePage extends Page<Message> {
  unread: number
}

/* ------------------------------------------------------------------ */
/* Achievements                                                        */
/* ------------------------------------------------------------------ */

export type AchievementType = 1 | 2 | 3
export type AchievementLevel = 1 | 2 | 3 | 4 | 5

export interface StudentAchievement {
  id: string
  studentPersonId: string
  studentName: string
  mentorProfileId: string | null
  achievementId: string | null
  deptId: string | null
  type: AchievementType
  title: string
  level: AchievementLevel
  awardedAt: string
  proofFileId: string | null
  linkedAt: string | null
  createdAt: string
}

export interface AchievementSearchParams {
  page?: number
  pageSize?: number
  type?: AchievementType
  year?: number
  linked?: 0 | 1
}

/* ------------------------------------------------------------------ */
/* Stats                                                               */
/* ------------------------------------------------------------------ */

export interface GuidanceTypeCount {
  type: AppointmentType
  count: number
  minutes: number
}

export interface MentorGuidance {
  mentorProfileId: string
  mentorName: string
  guidanceCount: number
  guidanceMinutes: number
  studentCount: number
  achievementCount: number
}

export interface GuidanceStats {
  guidanceCount: number
  guidanceMinutes: number
  studentCount: number
  achievementCount: number
  byType: GuidanceTypeCount[]
  byMentor: MentorGuidance[]
  byMentorTotal: number
  page: number
  pageSize: number
}

export interface GuidanceStatsParams {
  period?: string
  from?: string
  to?: string
  type?: AppointmentType
  page?: number
  pageSize?: number
}
