/** Covenant mark: a vessel split into a sealed (gold) and an open (mint) side. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="2.5" y="5.5" width="27" height="21" rx="6" stroke="#f3ecdd" strokeOpacity="0.55" />
      <path d="M2.5 11.5a6 6 0 0 1 6-6H17v21H8.5a6 6 0 0 1-6-6v-9Z" fill="#c9a55c" fillOpacity="0.9" />
      <path d="M17 5.5h6.5a6 6 0 0 1 6 6v9a6 6 0 0 1-6 6H17v-21Z" fill="#6fe3b5" fillOpacity="0.85" />
      <path d="M17 3v26" stroke="#f3ecdd" strokeWidth="1.2" />
    </svg>
  )
}

export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="display text-xl font-normal tracking-tight">Covenant</span>
    </span>
  )
}
