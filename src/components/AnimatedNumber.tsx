import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'framer-motion'
import { fmtUsdc } from '@/lib/format'

/**
 * Counts toward a USDC value. During the tween it shows an approximation; once settled it
 * always renders the exact bigint, so the number you read at rest is never a float.
 */
export function AnimatedUsdc({ value, className, dp = 2 }: { value: bigint; className?: string; dp?: number }) {
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState<string>(() => fmtUsdc(value, dp))
  const last = useRef<bigint>(value)

  useEffect(() => {
    const from = Number(last.current) / 1e6
    const to = Number(value) / 1e6
    last.current = value
    if (reduce || from === to) {
      setDisplay(fmtUsdc(value, dp))
      return
    }
    const controls = animate(from, to, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) =>
        setDisplay(v.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })),
      onComplete: () => setDisplay(fmtUsdc(value, dp)),
    })
    return () => controls.stop()
  }, [value, reduce, dp])

  return <span className={`num ${className ?? ''}`}>{display}</span>
}
