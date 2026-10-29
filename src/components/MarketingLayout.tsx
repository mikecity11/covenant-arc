import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import clsx from 'clsx'
import { Wordmark } from '@/components/Logo'
import { PageTransition } from '@/components/PageTransition'

const links = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/demo', label: 'Try the demo' },
]

export function MarketingLayout() {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" aria-label="Covenant home">
            <Wordmark />
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  clsx('text-sm transition-colors hover:text-ivory', isActive ? 'text-ivory' : 'text-ivory-dim')
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Link
              to="/app"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-gold px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 transition-colors hover:bg-gold-soft"
            >
              Open app <ArrowUpRight className="size-4" />
            </Link>
          </nav>
          <button
            className="grid size-11 place-items-center rounded-full text-ivory-dim hover:bg-ink-3 md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {open && (
          <nav aria-label="Mobile" className="border-t border-line px-5 pb-5 pt-2 md:hidden">
            {[...links, { to: '/app', label: 'Open app' }].map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block border-b border-line py-4 text-lg text-ivory">
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main id="main" className="flex-1">
        <PageTransition />
      </main>

      <footer className="border-t border-line bg-ink-2">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ivory-dim">
              Protect what's promised. Spend what's free. A USDC treasury for small Web3 teams, built on Arc.
            </p>
          </div>
          <div className="text-sm">
            <p className="eyebrow mb-3">Explore</p>
            <ul className="space-y-2 text-ivory-dim">
              <li><Link className="hover:text-ivory" to="/how-it-works">How it works</Link></li>
              <li><Link className="hover:text-ivory" to="/demo">Isolated demo</Link></li>
              <li><Link className="hover:text-ivory" to="/app">Treasury app</Link></li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="eyebrow mb-3">Status</p>
            <p className="leading-relaxed text-ivory-dim">
              Unaudited prototype configured for Arc mainnet. Mainnet transactions use real USDC. Check deployment status in the app. No protocol fee; network fees apply.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
