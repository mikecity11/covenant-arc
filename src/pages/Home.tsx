import { Link } from 'react-router-dom'
import { ArrowRight, CalendarClock, HandCoins, Landmark, Lock, ReceiptText, Scale, UsersRound } from 'lucide-react'
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
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:pb-28 lg:pt-24">
          <div>
            <Reveal>
              <p className="eyebrow">A USDC treasury on Arc</p>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="display mt-5 text-balance text-5xl font-light leading-[1.02] sm:text-6xl lg:text-7xl">
                Protect what's <em className="gold-text pr-1 font-light italic">promised.</em>
                <br />
                Spend what's <em className="font-light italic text-mint">free.</em>
              </h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-7 max-w-xl text-pretty text-lg leading-relaxed text-ivory-dim">
                Covenant is a treasury for small Web3 teams. Contributor commitments are funded and locked in the vault, so
                the balance you see is never mistaken for money you can freely spend.
              </p>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  to="/app"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-gold px-7 text-sm font-semibold text-ink shadow-[0_10px_40px_-14px_rgba(201,165,92,0.8)] transition-all hover:bg-gold-soft active:scale-[0.98]"
                >
                  Open the treasury app <ArrowRight className="size-4" />
                </Link>
                <Link to="/how-it-works" className="inline-flex min-h-12 items-center rounded-full border border-line px-6 text-sm font-medium text-ivory transition-colors hover:border-gold/60 hover:bg-ink-3">
                  How it works
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.24}>
              <p className="mt-8 max-w-md border-l border-gold/40 pl-4 text-sm leading-relaxed text-ivory-mute">
                Unaudited prototype configured for Arc Testnet with test USDC. Not deployed to mainnet, no real funds. No protocol fee; network fees apply.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <Walkthrough />
          </Reveal>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="border-y border-line bg-ink-2/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:py-28">
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
              <p className="display text-2xl font-light italic text-ivory">
                Covenant moves the memory into the contract: <span className="text-gold-soft">3,000</span> minus <span className="text-gold-soft">1,800</span> is <span className="text-mint">1,200</span>, and that is all the owner can spend.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <Reveal>
          <p className="eyebrow">What changes</p>
          <h2 className="display mt-4 max-w-2xl text-balance text-4xl font-light leading-tight sm:text-5xl">Four rules the contract enforces for you.</h2>
        </Reveal>
        <div className="mt-14 grid gap-x-16 gap-y-12 md:grid-cols-2">
          {benefits.map((b, i) => (
            <Reveal key={b.title} delay={(i % 2) * 0.08} className={i % 2 === 1 ? 'md:mt-14' : ''}>
              <b.icon className="size-6 text-gold" aria-hidden />
              <h3 className="display mt-4 text-2xl font-light">{b.title}</h3>
              <p className="mt-3 max-w-md text-pretty leading-relaxed text-ivory-dim">{b.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* USE CASES */}
      <section className="border-y border-line bg-ink-2/60">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
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
      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="panel relative overflow-hidden p-8 sm:p-14">
          <div className="protected-hatch pointer-events-none absolute inset-y-0 left-0 w-1/3 opacity-60" aria-hidden />
          <div className="relative max-w-xl sm:ml-auto">
            <h2 className="display text-balance text-4xl font-light sm:text-5xl">See what is free before you spend it.</h2>
            <p className="mt-4 text-ivory-dim">Run the simulation with pretend money, or connect a wallet on Arc Testnet.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/demo" className="inline-flex min-h-12 items-center rounded-full bg-gold px-7 text-sm font-semibold text-ink transition-colors hover:bg-gold-soft">Try the isolated demo</Link>
              <Link to="/how-it-works" className="inline-flex min-h-12 items-center rounded-full border border-line px-6 text-sm hover:border-gold/60">Read how it works</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
