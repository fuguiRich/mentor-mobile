export function BrandMark({
  size = 56,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
    >
      <rect width="64" height="64" rx="14" fill="#1b5e6b" />
      <path
        d="M15 20.5c5.2-2 10.8-2 16.2 1.1v25.2c-5.4-3.1-11-3.1-16.2-1.1V20.5Z"
        fill="#ffffff"
        opacity=".95"
      />
      <path
        d="M49 20.5c-5.2-2-10.8-2-16.2 1.1v25.2c5.4-3.1 11-3.1 16.2-1.1V20.5Z"
        fill="#ffffff"
        opacity=".82"
      />
      <path d="M32 21.8v24.4" stroke="#1b5e6b" strokeWidth="1.4" />
      <circle
        cx="48"
        cy="48"
        r="10"
        fill="#b08d57"
        stroke="#f7f5f0"
        strokeWidth="2"
      />
      <path
        d="M48 42.5v11M42.5 48h11"
        stroke="#1b5e6b"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
