import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ConnectKitButton } from 'connectkit'
import { Activity, ChevronsUpDown, HandCoins, LayoutDashboard, ListChecks, Menu, TriangleAlert, Wallet, X } from 'lucide-react'
import clsx from 'clsx'
import { Wordmark } from '@/components/Logo'
import { PageTransition } from '@/components/PageTransition'
import { TreasuryDialog } from '@/components/TreasuryDialog'
import { Button } from '@/components/ui'
import { useTreasury } from '@/hooks/useTreasury'
import { useWallet } from '@/hooks/useWallet'
import { CHAIN, FACTORY_ADDRESS } from '@/lib/deployment'
import { shortAddr } from '@/lib/format'

const nav = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/commitments', label: 'Commitments', icon: ListChecks, end: false },
  { to: '/app/claims', label: 'My claims', icon: HandCoins, end: false },
  { to: '/app/activity', label: 'Activity', icon: Activity, end: false },
]

function SideContent({ onNavigate, onTreasury }: { onNavigate: () => void; onTreasury: () => void }) {
  const { vault } = useTreasury()
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-5"><Link to="/" onClick={onNavigate} aria-label="Covenant home"><Wordmark /></Link></div>
      <div className="px-3">
        <button
          onClick={() => { onTreasury(); onNavigate() }}
          className="flex min-h-14 w-full items-center justify-between gap-2 rounded-xl border border-line bg-ink-3/60 px-3 text-left transition-colors hover:border-gold/50"
        >
          <span>
            <span className="block text-[11px] uppercase tracking-[0.14em] text-ivory-mute">Treasury</span>
            <span className="block font-mono text-sm">{vault ? shortAddr(vault) : 'Select or create'}</span>
          </span>
          <ChevronsUpDown className="size-4 text-ivory-mute" aria-hidden />
        </button>
      </div>
      <nav aria-label="App" className="mt-5 flex-1 space-y-1 px-3">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              clsx(
                'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors',
                isActive ? 'bg-gold text-white shadow-lg shadow-blue-600/15' : 'text-ivory-dim hover:bg-ink-3 hover:text-ivory',
              )
            }
          >
            <n.icon className="size-4" aria-hidden /> {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-1 border-t border-line p-4 text-sm text-ivory-mute">
        <Link to="/how-it-works" onClick={onNavigate} className="block py-1 hover:text-ivory">How it works</Link>
        <Link to="/demo" onClick={onNavigate} className="block py-1 hover:text-ivory">Isolated demo</Link>
        <p className="pt-2 text-xs leading-relaxed">Unaudited prototype · {CHAIN.name}</p>
      </div>
    </div>
  )
}

export function AppShell() {
  const [drawer, setDrawer] = useState(false)
  const { dialogOpen: treasuryOpen, setDialogOpen: setTreasuryOpen } = useTreasury()
  const { isConnected, wrongChain, switchToArc, switching } = useWallet()

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[272px_1fr]">
      <a href="#app-main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-ink">Skip to content</a>
      <aside className="sticky top-0 hidden h-dvh border-r border-line bg-ink-2/70 backdrop-blur lg:block">
        <SideContent onNavigate={() => undefined} onTreasury={() => setTreasuryOpen(true)} />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[#0b1739]/40" onClick={() => setDrawer(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-line bg-ink-2">
            <button aria-label="Close menu" onClick={() => setDrawer(false)} className="absolute right-2 top-3 grid size-11 place-items-center rounded-full text-ivory-dim hover:bg-ink-3"><X className="size-5" /></button>
            <SideContent onNavigate={() => setDrawer(false)} onTreasury={() => setTreasuryOpen(true)} />
          </div>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-ink/80 px-4 backdrop-blur-xl sm:px-8">
          <button aria-label="Open menu" onClick={() => setDrawer(true)} className="grid size-11 place-items-center rounded-full text-ivory-dim hover:bg-ink-3 lg:hidden"><Menu className="size-5" /></button>
          <div className="hidden text-sm text-ivory-mute lg:block">{CHAIN.name} · Real USDC</div>
          <ConnectKitButton.Custom>
            {({ show, isConnected: c, truncatedAddress }) => (
              <Button variant={c ? 'secondary' : 'primary'} onClick={show} className="ml-auto min-h-10">
                <Wallet className="size-4" /> {c ? truncatedAddress : 'Connect wallet'}
              </Button>
            )}
          </ConnectKitButton.Custom>
        </header>

        {isConnected && wrongChain && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-alert/40 bg-rose-alert/10 px-4 py-3 text-sm sm:px-8">
            <span className="flex items-center gap-2"><TriangleAlert className="size-4 text-rose-alert" /> Your wallet is on the wrong network. Covenant works on {CHAIN.name}.</span>
            <Button variant="secondary" onClick={switchToArc} busy={switching} className="min-h-10">Switch to {CHAIN.name}</Button>
          </div>
        )}
        {!FACTORY_ADDRESS && (
          <div className="border-b border-gold/30 bg-gold/10 px-4 py-3 text-sm text-ivory-dim sm:px-8">
            <b className="text-gold-soft">Mainnet setup pending:</b> a verified factory address has not been configured. Treasury creation stays disabled. <Link to="/deploy" className="font-semibold underline">Open deployment setup</Link>.
          </div>
        )}

        <main id="app-main" className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-8 sm:pt-12">
          <PageTransition />
        </main>
      </div>
      <TreasuryDialog open={treasuryOpen} onClose={() => setTreasuryOpen(false)} />
    </div>
  )
}
