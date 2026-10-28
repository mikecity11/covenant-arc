import { ArrowDownToLine, ArrowUpFromLine, CalendarPlus, ExternalLink, HandCoins, Undo2 } from 'lucide-react'
import type { ActivityItem, ActivityKind } from '@/hooks/useActivity'
import { txUrl } from '@/lib/deployment'
import { fmtDateTime, fmtUsdc, shortAddr } from '@/lib/format'

const META: Record<ActivityKind, { label: string; icon: typeof HandCoins; tone: string }> = {
  Deposited: { label: 'Deposit', icon: ArrowDownToLine, tone: 'text-mint' },
  CommitmentCreated: { label: 'Promise recorded', icon: CalendarPlus, tone: 'text-gold-soft' },
  Claimed: { label: 'Claimed', icon: HandCoins, tone: 'text-ivory' },
  Released: { label: 'Released (forfeited)', icon: Undo2, tone: 'text-ivory-dim' },
  Spent: { label: 'Payment', icon: ArrowUpFromLine, tone: 'text-ivory' },
}

function detail(i: ActivityItem): string {
  const who = i.actor ? shortAddr(i.actor) : ''
  switch (i.kind) {
    case 'Deposited':
      return `${who} deposited ${fmtUsdc(i.amount)} USDC`
    case 'CommitmentCreated':
      return `#${i.id} · ${fmtUsdc(i.amount)} USDC to ${who}${i.dueAt ? ` · due ${fmtDateTime(i.dueAt)}` : ''}${i.text ? ` · ${i.text}` : ''}`
    case 'Claimed':
      return `#${i.id} · ${who} claimed ${fmtUsdc(i.amount)} USDC`
    case 'Released':
      return `#${i.id} · ${who} released ${fmtUsdc(i.amount)} USDC back to the treasury`
    case 'Spent':
      return `${fmtUsdc(i.amount)} USDC to ${who}${i.text ? ` · ${i.text}` : ''}`
  }
}

export function ActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((i) => {
        const m = META[i.kind]
        return (
          <li key={`${i.txHash}-${i.logIndex}`} className="group flex items-start gap-4 py-4">
            <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full border border-line bg-ink-3 ${m.tone}`}><m.icon className="size-4" aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{m.label}</p>
              <p className="mt-0.5 break-words text-sm text-ivory-dim">{detail(i)}</p>
              <p className="mt-1 text-xs text-ivory-mute">{i.timestamp ? fmtDateTime(i.timestamp) : `Block ${i.blockNumber}`}</p>
            </div>
            <a href={txUrl(i.txHash)} target="_blank" rel="noopener noreferrer" aria-label={`View ${m.label} transaction on explorer`} className="grid size-10 shrink-0 place-items-center rounded-full text-ivory-mute transition-colors hover:bg-ink-3 hover:text-gold-soft">
              <ExternalLink className="size-4" />
            </a>
          </li>
        )
      })}
    </ul>
  )
}
