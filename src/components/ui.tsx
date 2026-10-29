import { useEffect, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variants: Record<Variant, string> = {
  primary:
    'bg-gold text-ink hover:bg-gold-soft shadow-[0_8px_30px_-12px_rgba(36,87,255,0.7)] disabled:hover:bg-gold',
  secondary: 'border border-line text-ivory hover:border-gold/60 hover:bg-ink-3',
  ghost: 'text-ivory-dim hover:text-ivory hover:bg-ink-3',
  danger: 'border border-rose-alert/50 text-rose-alert hover:bg-rose-alert/10',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  busy?: boolean
}

export function Button({ variant = 'primary', busy, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={clsx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45',
        variants[variant],
        className,
      )}
    >
      {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

export function Pill({ tone = 'neutral', children }: { tone?: 'neutral' | 'gold' | 'mint' | 'alert'; children: ReactNode }) {
  const tones = {
    neutral: 'border-line text-ivory-dim',
    gold: 'border-gold/40 text-gold-soft bg-gold/10',
    mint: 'border-mint/40 text-mint bg-mint/10',
    alert: 'border-rose-alert/40 text-rose-alert bg-rose-alert/10',
  }
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', tones[tone])}>
      {children}
    </span>
  )
}

interface FieldProps {
  label: string
  hint?: ReactNode
  error?: string
  children: ReactNode
  htmlFor: string
}

export function Field({ label, hint, error, children, htmlFor }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-medium uppercase tracking-[0.12em] text-ivory-dim">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-rose-alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-ivory-mute">{hint}</p>
      ) : null}
    </div>
  )
}

const inputBase =
  'w-full rounded-xl border border-line bg-ink-2 px-4 py-3 text-ivory placeholder:text-ivory-mute/70 transition-colors focus:border-gold/70 focus:outline-none focus:ring-2 focus:ring-gold/20'

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={clsx(inputBase, 'min-h-11', className)} />
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={clsx(inputBase, 'min-h-20 resize-y', className)} />
}

/** Modal dialog with Escape-to-close, focus restore and a labelled region. */
export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  // Depends on `open` only, so a parent re-render never steals focus from a field being typed in.
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      previous?.focus()
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <div className="absolute inset-0 bg-[#0b1739]/40 backdrop-blur-sm" aria-hidden />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-line bg-ink-2 p-6 shadow-2xl focus:outline-none sm:rounded-3xl sm:p-8"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <h2 className="display text-2xl font-light">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid size-10 shrink-0 place-items-center rounded-full text-ivory-dim transition-colors hover:bg-ink-3 hover:text-ivory"
              >
                <X className="size-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Notice({ tone = 'neutral', title, children }: { tone?: 'neutral' | 'gold' | 'alert' | 'mint'; title?: string; children: ReactNode }) {
  const tones = {
    neutral: 'border-line bg-ink-3/60 text-ivory-dim',
    gold: 'border-gold/40 bg-gold/10 text-ivory',
    alert: 'border-rose-alert/40 bg-rose-alert/10 text-ivory',
    mint: 'border-mint/40 bg-mint/10 text-ivory',
  }
  return (
    <div className={clsx('rounded-2xl border p-4 text-sm leading-relaxed', tones[tone])}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <div className="text-pretty">{children}</div>
    </div>
  )
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-ivory-dim">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label}
    </span>
  )
}
