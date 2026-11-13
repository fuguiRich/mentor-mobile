import { Link } from '@tanstack/react-router'
import { RightOutlined } from '@ant-design/icons'
import type { MentorListItem, MentorType } from '../api/types'
import { InitialAvatar } from './common'

function MentorTypeTag({ type }: { type: MentorType }) {
  const internal = type === 'internal'
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        internal
          ? 'bg-brand-50 text-brand-700 ring-brand-200'
          : 'bg-[#f7f1e3] text-[#8a6a2f] ring-[#e8dcc2]'
      }`}
    >
      {internal ? '校内导师' : '校外导师'}
    </span>
  )
}

export function MentorCard({ mentor }: { mentor: MentorListItem }) {
  return (
    <Link
      to="/mentors/$mentorId"
      params={{ mentorId: mentor.id }}
      className="block no-underline"
    >
      <div className="pressable rounded-xl border border-line bg-white p-4 shadow-[0_2px_8px_rgba(31,42,55,0.04)] hover:bg-brand-50/30">
        <div className="flex gap-3">
          <InitialAvatar name={mentor.name} size={48} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-serif text-[17px] font-medium text-ink">
                {mentor.name}
              </span>
              {mentor.professionalTitle ? (
                <span className="text-xs text-muted">
                  {mentor.professionalTitle}
                </span>
              ) : null}
              <MentorTypeTag type={mentor.mentorType} />
            </div>
            <p className="mt-0.5 truncate text-xs text-muted">
              {mentor.deptName}
            </p>

            {mentor.researchFields.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {mentor.researchFields.slice(0, 4).map((field) => (
                  <span
                    key={field}
                    className="rounded bg-brand-50 px-2 py-0.5 text-xs text-brand-600"
                  >
                    {field}
                  </span>
                ))}
              </div>
            ) : null}

            {mentor.summary ? (
              <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-muted">
                {mentor.summary}
              </p>
            ) : null}
          </div>
          <RightOutlined
            className="mt-1 text-xs text-muted/60"
            aria-hidden="true"
          />
        </div>
      </div>
    </Link>
  )
}
