import { Link } from 'react-router-dom'
import { ArrowRight, CalendarClock, HandCoins, Landmark, Lock, ReceiptText, Scale, UsersRound } from 'lucide-react'
import { HeroVault } from '@/components/HeroVault'
import { Walkthrough } from '@/components/home/Walkthrough'
import { Faq } from '@/components/home/Faq'
import { Reveal } from '@/components/Reveal'

const benefits = [
  { icon: Lock, title: 'Promises are reserved, not just recorded', body: 'A promise only exists if the money for it is already in the vault. It cannot be created unfunded, and it cannot be quietly spent elsewhere.' },
  { icon: Scale, title: 'One honest number: available', body: 'The dashboard leads with what can actually be spent. Wallet balance is a number; available is a budget.' },
  { icon: CalendarClock, title: 'Dated and fixed', body: 'Amount, recipient and due date are set once. The owner cannot lower, delay or cancel them. Recipients can plan around a promise.' },
  { icon: ReceiptText, title: 'Every move leaves a receipt', body: 'Deposits, promises, claims, releases and spends emit events and link to real explorer transactions.' },
]

const useCases = [
  { icon: UsersRound, title: 'Contributor retainers', body: 'A DAO tooling team sets aside next quarter\'s stipends for three contributors, then spends the remainder on infrastructure without second-guessing the balance.' },
  { icon: HandCoins, title: 'Milestone grants', body: 'A grants committee funds a milestone payment with a due date, so the builder can see the money is held for them.' },
  { icon: Landmark, title: 'Small team payroll runway', body: 'A five-person protocol team reserves two months of salaries in a vault and treats only the rest as discretionary budget.' },
]

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="hero-premium">
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 pb-12 pt-14 sm:px-8 lg:grid-cols-[1.04fr_1fr] lg:gap-16 lg:pb-20 lg:pt-20">
          <div className="relative z-10">
            <Reveal><span className="hero-pill">Money with a promise</span></Reveal>
            <Reveal delay={0.06}>
              <h1 className="hero-title mt-7">
                Big plans.<br />
                <span className="gold-text">Kept promises.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-7 max-w-lg text-pretty text-lg leading-relaxed text-ivory-dim">
                Your treasury has a balance. Your team has commitments.
                Covenant protects what you owe, so you know exactly what you can spend.
              </p>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link to="/app" className="inline-flex min-h-13 items-center gap-3 rounded-xl bg-gold px-7 py-4 text-sm font-semibold text-white shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-gold-soft">
                  Open your treasury <ArrowRight className="size-4" />
                </Link>
                <Link to="/demo" className="inline-flex min-h-13 items-center gap-2 rounded-xl border border-line bg-white px-6 py-4 text-sm font-semibold transition-colors hover:border-gold/50 hover:bg-ink-2">
                  Explore the demo <span aria-hidden="true">↗</span>
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3">
                <span className="hero-feature"><Lock className="size-3.5" /> Fully funded promises</span>
                <span className="hero-feature"><ReceiptText className="size-3.5" /> Onchain receipts</span>
              </div>
              <p className="mt-5 max-w-md text-xs leading-relaxed text-ivory-mute">
                Arc Testnet prototype · Test USDC only · Not independently audited
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.12}><HeroVault /></Reveal>
        </div>
      </section>

      <div className="product-strip">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-line px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8">
          <div className="product-strip-item sm:pr-8"><Lock /><div><strong>Commit with confidence</strong><span>Every promise is funded upfront.</span></div></div>
          <div className="product-strip-item sm:px-8"><Scale /><div><strong>See your real spending power</strong><span>Protected funds stay out of reach.</span></div></div>
          <div className="product-strip-item sm:pl-8"><HandCoins /><div><strong>Put contributors in control</strong><span>They claim when payment is due.</span></div></div>
        </div>
      </div>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[.75fr_1.25fr] lg:gap-20 lg:py-28">
        <Reveal>
          <p className="eyebrow">Clarity, built into the contract</p>
          <h2 className="display mt-4 text-balance text-4xl leading-[1.08] sm:text-5xl">One balance.<br />Two very different jobs.</h2>
          <p className="mt-6 max-w-md leading-relaxed text-ivory-dim">Set aside what is promised. Put the rest to work. Step through an example to see how Covenant keeps the two apart.</p>
          <Link to="/how-it-works" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold">See how it works <ArrowRight className="size-4" /></Link>
        </Reveal>
        <Reveal delay={0.1}><Walkthrough /></Reveal>
      </section>

      {/* PROBLEM */}
      <section className="border-y border-line bg-ink-2/60">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:py-28">
          <Reveal>
            <p className="eyebrow">The problem</p>
            <h2 className="display mt-4 text-balance text-4xl font-light leading-tight sm:text-5xl">
              A wallet balance is not a spending budget.
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="space-y-6 text-lg leading-relaxed text-ivory-dim">
              <p className="text-pretty">
                A multisig shows 3,000 USDC. Three contributors are owed 1,800 of it next month. A signer approves a 1,500
                USDC invoice because the balance looks big enough, and now somebody is not getting paid.
              </p>
              <p className="text-pretty">
                Nothing in a normal wallet knows about the promise. The number on screen mixes money that is free with money
                that is already spoken for, and a team has to remember the difference in a spreadsheet.
              </p>
              <p className="display text-2xl font-semibold text-ivory">
                Covenant moves the memory into the contract: <span className="text-gold-soft">3,000</span> minus <span className="text-gold-soft">1,800</span> is <span className="text-mint">1,200</span>, and that is all the owner can spend.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <Reveal>
          <p className="eyebrow">What changes</p>
          <h2 className="display mt-4 max-w-2xl text-balance text-4xl font-light leading-tight sm:text-5xl">Four rules the contract enforces for you.</h2>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {benefits.map((b, i) => (
            <Reveal key={b.title} delay={(i % 2) * 0.08} className="feature-tile">
              <b.icon className="size-6 text-gold" aria-hidden />
              <h3 className="display mt-4 text-2xl font-light">{b.title}</h3>
              <p className="mt-3 max-w-md text-pretty leading-relaxed text-ivory-dim">{b.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* USE CASES */}
      <section className="border-y border-line bg-ink-2/60">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <Reveal>
            <p className="eyebrow">Where it fits</p>
            <h2 className="display mt-4 text-balance text-4xl font-light sm:text-5xl">Built for teams of two to twenty.</h2>
          </Reveal>
          <div className="mt-12 divide-y divide-line border-y border-line">
            {useCases.map((u) => (
              <Reveal key={u.title}>
                <div className="grid gap-4 py-8 md:grid-cols-[auto_1fr_1.4fr] md:items-baseline md:gap-10">
                  <u.icon className="size-6 text-mint" aria-hidden />
                  <h3 className="display text-2xl font-light">{u.title}</h3>
                  <p className="text-pretty leading-relaxed text-ivory-dim">{u.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-sm text-ivory-mute">These are scenarios for illustration. They are not customers or case studies.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-5 py-20 sm:px-8 lg:py-28">
        <Reveal>
          <p className="eyebrow">Questions</p>
          <h2 className="display mb-10 mt-4 text-4xl font-light sm:text-5xl">Plain answers.</h2>
        </Reveal>
        <Faq />
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="product-cta p-8 sm:p-16">
          <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[.16em] text-blue-100">A clearer kind of treasury</p>
              <h2 className="display max-w-2xl text-balance text-4xl leading-tight sm:text-5xl">Protect what is promised.<br />Make room for what is next.</h2>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-blue-100">Explore Covenant with simulated funds, or create a treasury with test USDC on Arc Testnet.</p>
            </div>
            <Link to="/app" className="inline-flex min-h-13 w-fit items-center gap-3 rounded-xl bg-white px-7 py-4 text-sm font-semibold text-[#1844d9] shadow-xl transition-transform hover:-translate-y-1">
              Open your treasury <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
