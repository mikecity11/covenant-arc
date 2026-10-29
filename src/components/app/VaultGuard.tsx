import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button, Notice, Spinner } from '@/components/ui'
import { LogoMark } from '@/components/Logo'
import { CHAIN } from '@/lib/deployment'
import type { useActiveVault } from '@/hooks/useActiveVault'

type Active = ReturnType<typeof useActiveVault>

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display mt-2 text-4xl font-light sm:text-5xl">{title}</h1>
      </div>
      {children}
    </header>
  )
}

/** Renders children only when a real, valid USDC vault is selected; otherwise an honest empty state. */
export function VaultGuard({ av, children }: { av: Active; children: ReactNode }) {
  if (!av.vault) {
    return (
      <div className="panel mx-auto max-w-xl p-8 text-center sm:p-12">
        <div className="mx-auto w-fit"><LogoMark size={44} /></div>
        <h1 className="display mt-6 text-3xl font-light">No treasury selected</h1>
        <p className="mt-3 text-ivory-dim">
          Create a treasury or open one by address on {CHAIN.name}. Nothing on this page is shown until a real vault is loaded.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button onClick={av.openSelector}>Select or create treasury</Button>
          <Link to="/demo" className="inline-flex min-h-11 items-center rounded-full border border-line px-5 text-sm hover:border-gold/60">Try the isolated demo</Link>
        </div>
      </div>
    )
  }
  if (av.state.loading) return <div className="py-24 text-center"><Spinner label="Reading the vault…" /></div>
  if (av.state.invalid) {
    return (
      <Notice tone="alert" title="This address is not responding as a Covenant vault">
        <p>It may be on a different network or not a Covenant vault. Select another treasury.</p>
        <Button variant="secondary" className="mt-4" onClick={av.openSelector}>Change treasury</Button>
      </Notice>
    )
  }
  if (av.state.wrongToken) {
    return (
      <Notice tone="alert" title="Unsupported token">
        This vault is bound to a token other than Arc mainnet USDC. Covenant will not display or write to it.
      </Notice>
    )
  }
  return <>{children}</>
}
