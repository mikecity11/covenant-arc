/** Covenant: an open C surrounding a protected core. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="#2457ff" />
      <path d="M27 12.5a10 10 0 1 0 0 15" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
      <path d="m20 14 5.5 3.2v6.1L20 26.5l-5.5-3.2v-6.1L20 14Z" fill="#84f0db" />
    </svg>
  )
}

export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="text-xl font-semibold tracking-[-0.05em]">covenant<span className="text-gold">.</span></span>
    </span>
  )
}
