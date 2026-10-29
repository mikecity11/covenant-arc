import { ArrowDownLeft, Check, LockKeyhole, ShieldCheck, Wallet } from 'lucide-react'

/** Decorative worked example. No wallet state or live balances. */
export function HeroVault() {
  return (
    <div className="hero-art" role="img" aria-label="Illustration: 1,800 USDC protected and 1,200 USDC available in an example treasury">
      <div className="vault-stage" aria-hidden="true"><div className="vault-grid" /><div className="vault-orbit" /></div>
      <div className="vault-core" aria-hidden="true"><ShieldCheck /></div>
      <div className="vault-chip" aria-hidden="true">A promise, protected.</div>
      <div className="vault-card vault-card--protected" aria-hidden="true">
        <div className="vault-card-head"><LockKeyhole /> PROTECTED FUNDS</div>
        <strong>1,800.00 <small>USDC</small></strong>
        <div className="vault-mini-bar"><span /><span /></div>
        <div className="vault-card-foot"><Check /> Reserved for contributors</div>
      </div>
      <div className="vault-card vault-card--available" aria-hidden="true">
        <div className="vault-card-head"><Wallet /> AVAILABLE TO SPEND</div>
        <strong>1,200.00 <small>USDC</small></strong>
        <div className="vault-card-foot"><ArrowDownLeft /> Yours to put to work</div>
      </div>
      <p className="vault-note" aria-hidden="true">Illustrative treasury · Not live funds</p>
    </div>
  )
}
