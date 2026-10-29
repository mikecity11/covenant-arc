import { motion, useReducedMotion } from 'framer-motion'
import { availableOf } from '@/lib/ledger'

export interface Outflow {
  /** Attempted outflow as a raw base-unit amount. */
  amount: bigint
}

interface Props {
  assets: bigint
  reserved: bigint
  highlight?: 'protected' | 'available' | null
  outflow?: Outflow | null
  className?: string
  onHover?: (r: 'protected' | 'available' | null) => void
  idle?: boolean
}

const W = 560
const X0 = 40
const spring = { type: 'spring', stiffness: 140, damping: 22 } as const

const ratio = (part: bigint, whole: bigint): number => {
  if (whole <= 0n) return 0
  const r = Number((part * 10000n) / whole) / 10000
  return Math.max(0, Math.min(1, r))
}

/**
 * Treasury vessel. Assets fill the whole bar; the gold, hatched left side is protected by
 * recorded promises, the mint right side is what the owner may spend. An attempted outflow
 * is drawn from the right edge: it is accepted if it stays inside mint, rejected if it
 * reaches into gold.
 */
export function AllocationVisual({ assets, reserved, highlight, outflow, className, onHover, idle }: Props) {
  const reduce = useReducedMotion()
  const protectedFrac = ratio(reserved > assets ? assets : reserved, assets)
  const pw = W * protectedFrac
  const free = availableOf(assets, reserved)
  const rejected = Boolean(outflow && outflow.amount > free)
  const outFrac = outflow && assets > 0n ? ratio(outflow.amount > assets ? assets : outflow.amount, assets) : 0
  const ow = W * outFrac
  const empty = assets <= 0n

  const dim = (r: 'protected' | 'available') => (highlight && highlight !== r ? 0.35 : 1)

  return (
    <svg
      viewBox="0 0 640 300"
      className={className}
      role="img"
      aria-label={`Treasury split into ${protectedFrac >= 1 ? 'fully protected' : 'protected and available'} funds`}
    >
      <defs>
        <clipPath id="vessel-clip">
          <rect x={X0} y="110" width={W} height="110" rx="22" />
        </clipPath>
        <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="rgba(36,87,255,0.14)" />
          <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(36,87,255,0.48)" strokeWidth="1.4" />
        </pattern>
        <linearGradient id="mint-fill" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#007e71" stopOpacity="0.16" />
          <stop offset="1" stopColor="#007e71" stopOpacity="0.34" />
        </linearGradient>
      </defs>

      {/* inflow streams */}
      {[170, 320, 470].map((x, i) => (
        <g key={x}>
          <line x1={x} y1="26" x2={x} y2="108" stroke="rgba(36,87,255,0.2)" strokeDasharray="2 6" />
          <circle cx={x} cy="30" r="3.5" fill="#0b1739" opacity="0.75" />
          {!reduce && idle !== false && (
            <circle
              cx={x}
              cy="34"
              r="3"
              fill={i === 1 ? '#2457ff' : '#007e71'}
              style={{ animation: `drift 3.2s ease-in ${i * 0.9}s infinite` }}
            />
          )}
        </g>
      ))}
      <text x="320" y="14" textAnchor="middle" fill="#586887" fontSize="11" letterSpacing="2.2" fontFamily="Instrument Sans, sans-serif">
        ANYONE CAN DEPOSIT
      </text>

      {/* vessel */}
      <rect x={X0} y="110" width={W} height="110" rx="22" fill="#edf3ff" />
      <g clipPath="url(#vessel-clip)">
        {!empty && (
          <>
            <motion.rect
              y="110"
              height="110"
              x={X0}
              fill="url(#hatch)"
              initial={false}
              animate={{ width: pw }}
              transition={reduce ? { duration: 0 } : spring}
              opacity={dim('protected')}
              style={{ cursor: onHover ? 'pointer' : 'default' }}
              onMouseEnter={() => onHover?.('protected')}
              onMouseLeave={() => onHover?.(null)}
            />
            <motion.rect
              y="110"
              height="110"
              fill="url(#mint-fill)"
              initial={false}
              animate={{ x: X0 + pw, width: W - pw }}
              transition={reduce ? { duration: 0 } : spring}
              opacity={dim('available')}
              style={{ cursor: onHover ? 'pointer' : 'default' }}
              onMouseEnter={() => onHover?.('available')}
              onMouseLeave={() => onHover?.(null)}
            />
          </>
        )}
        {outflow && !empty && (
          <motion.rect
            y="128"
            height="74"
            rx="12"
            initial={false}
            animate={{ x: X0 + W - ow, width: ow }}
            transition={reduce ? { duration: 0 } : spring}
            fill={rejected ? 'rgba(201,54,82,0.18)' : 'rgba(36,87,255,0.2)'}
            stroke={rejected ? '#c93652' : '#0b1739'}
            strokeDasharray="5 5"
            strokeWidth="1.5"
          />
        )}
      </g>
      <rect x={X0} y="110" width={W} height="110" rx="22" fill="none" stroke="rgba(36,87,255,0.28)" strokeWidth="1.2" strokeDasharray={empty ? '4 6' : undefined} />

      {/* seal at the partition */}
      {!empty && protectedFrac > 0 && protectedFrac < 1 && (
        <motion.g initial={false} animate={{ x: X0 + pw }} transition={reduce ? { duration: 0 } : spring}>
          <line y1="104" y2="226" stroke="#2457ff" strokeWidth="1.5" />
          <circle cy="165" r="11" fill="#ffffff" stroke="#2457ff" strokeWidth="1.5" />
          <rect x="-4" y="162" width="8" height="6" rx="1.2" fill="#2457ff" />
          <path d="M-2.4 162v-2.2a2.4 2.4 0 0 1 4.8 0V162" fill="none" stroke="#2457ff" strokeWidth="1.2" />
        </motion.g>
      )}

      {/* spending-limit bracket over the mint side */}
      {!empty && (
        <motion.g initial={false} animate={{ x: X0 + pw }} transition={reduce ? { duration: 0 } : spring} opacity={dim('available')}>
          <motion.rect y="238" height="1.5" fill="#007e71" initial={false} animate={{ width: W - pw }} transition={reduce ? { duration: 0 } : spring} />
          <line y1="232" y2="246" stroke="#007e71" strokeWidth="1.5" />
          <motion.line y1="232" y2="246" stroke="#007e71" strokeWidth="1.5" initial={false} animate={{ x1: W - pw, x2: W - pw }} transition={reduce ? { duration: 0 } : spring} />
        </motion.g>
      )}

      <g fontFamily="Instrument Sans, sans-serif" fontSize="11" letterSpacing="2">
        {!empty && protectedFrac > 0.12 && (
          <motion.text initial={false} animate={{ x: X0 + pw / 2 }} y="170" textAnchor="middle" fill="#2457ff" opacity={dim('protected')}>
            PROTECTED
          </motion.text>
        )}
        {!empty && protectedFrac < 0.88 && (
          <motion.text initial={false} animate={{ x: X0 + pw + (W - pw) / 2 }} y="170" textAnchor="middle" fill="#007e71" opacity={dim('available')}>
            AVAILABLE
          </motion.text>
        )}
        {empty && (
          <text x="320" y="170" textAnchor="middle" fill="#586887">
            EMPTY TREASURY
          </text>
        )}
        {rejected && (
          <text x="320" y="278" textAnchor="middle" fill="#c93652">
            REACHES INTO PROTECTED FUNDS: REJECTED
          </text>
        )}
        {outflow && !rejected && !empty && (
          <text x="320" y="278" textAnchor="middle" fill="#0b1739">
            STAYS INSIDE AVAILABLE: ALLOWED
          </text>
        )}
      </g>
    </svg>
  )
}
