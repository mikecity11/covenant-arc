import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Calculator } from '@/components/how/Calculator'
import { Notice } from '@/components/ui'
import { Reveal } from '@/components/Reveal'
import { CHAIN, USDC_ADDRESS } from '@/lib/deployment'

const TOC = [
  ['wallet', 'Wallet and network'],
  ['treasury', 'Creating a treasury'],
  ['deposit', 'Approval and deposit'],
  ['promises', 'Fully funded promises'],
  ['example', 'The worked example'],
  ['spending', 'Safe spending checks'],
  ['claims', 'Claims on the due date'],
  ['release', 'Releasing a promise'],
  ['cancel', 'Cancellation rules'],
  ['gas', 'Gas and failures'],
  ['scope', 'Scope of protection'],
] as const

function Section({ id, n, title, children }: { id: string; n: number; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line py-12 first:border-t-0 first:pt-0">
      <Reveal>
        <p className="eyebrow">{String(n).padStart(2, '0')}</p>
        <h2 className="display mt-2 text-3xl font-light sm:text-4xl">{title}</h2>
        <div className="mt-5 max-w-2xl space-y-4 text-pretty leading-relaxed text-ivory-dim [&_b]:font-semibold [&_b]:text-ivory">{children}</div>
      </Reveal>
    </section>
  )
}

const rights: Array<[string, string, string]> = [
  ['Deposit USDC', 'Yes', 'Anyone'],
  ['Record a promise', 'Yes', 'No'],
  ['Spend available funds', 'Yes', 'No'],
  ['Claim a due promise', 'Only if named recipient', 'Only if named recipient'],
  ['Release your own promise', 'Only if named recipient', 'Only if named recipient'],
  ['Cancel, edit or delay a promise', 'No one', 'No one'],
]

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
      <header className="max-w-3xl">
        <p className="eyebrow">How it works</p>
        <h1 className="display mt-4 text-balance text-5xl font-light leading-[1.05] sm:text-6xl">Every rule, in the order you will meet it.</h1>
        <p className="mt-6 text-lg leading-relaxed text-ivory-dim">
          This page describes what the contract actually does, who is allowed to do it, and where its protection stops.
        </p>
        <div className="mt-8">
          <Notice tone="gold" title="Unaudited prototype">
            Covenant has not been independently audited. It is configured for {CHAIN.name} and real USDC. Mainnet factory deployment must be confirmed before treasury creation is enabled.
          </Notice>
        </div>
      </header>

      <div className="mt-16 grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="On this page" className="hidden lg:block">
          <ul className="sticky top-24 space-y-1 border-l border-line text-sm">
            {TOC.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="-ml-px block border-l border-transparent py-1.5 pl-4 text-ivory-dim transition-colors hover:border-gold hover:text-ivory">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <Section id="wallet" n={1} title="Wallet and network">
            <p>Connect an EVM wallet. Covenant works on <b>{CHAIN.name}</b> only (chain {CHAIN.chainId}). If your wallet is on another network the app says so and offers a switch button before any transaction is possible.</p>
            <p>A treasury is a single vault contract with its own address. The app shows the vault address, its owner and the token it holds, all read from the chain. The only token is USDC at <span className="break-all font-mono text-xs text-ivory">{USDC_ADDRESS}</span>.</p>
            <div className="overflow-x-auto rounded-2xl border border-line">
              <table className="w-full min-w-[420px] text-left text-sm">
                <caption className="sr-only">Who can do what</caption>
                <thead className="bg-ink-3/60 text-xs uppercase tracking-[0.1em] text-ivory-mute">
                  <tr><th scope="col" className="px-4 py-3">Action</th><th scope="col" className="px-4 py-3">Owner</th><th scope="col" className="px-4 py-3">Contributor</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rights.map(([a, o, c]) => (
                    <tr key={a}><th scope="row" className="px-4 py-3 font-medium text-ivory">{a}</th><td className="px-4 py-3">{o}</td><td className="px-4 py-3">{c}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>The owner is fixed when the vault is created and cannot be transferred. If several people should approve spending, make a multisig wallet the owner.</p>
          </Section>

          <Section id="treasury" n={2} title="Creating a treasury">
            <p>A small factory contract creates one vault per treasury. Your connected wallet becomes the permanent owner and the vault is bound to USDC. There is no protocol fee and no factory administrator or upgrade path. Network fees still apply.</p>
            <p>Creating a vault is one transaction. If no factory address is configured, the app shows a setup state and disables creation instead of pretending it worked. You can also open any existing vault by address.</p>
          </Section>

          <Section id="deposit" n={3} title="Approval and deposit">
            <p>Putting USDC in takes <b>two transactions</b>. First you <b>approve</b> the vault to pull an exact amount from your wallet. Approving moves no money. Then you <b>deposit</b>, which pulls that amount into the vault.</p>
            <p>Your <b>wallet balance</b> is what you hold. The <b>vault balance</b> is what the treasury holds. Only the vault balance counts toward spending. Anyone can deposit, so contributors can fund a treasury without being its owner. Sending USDC directly to the vault address also works and counts as available funds, but it will not appear as a deposit event.</p>
          </Section>

          <Section id="promises" n={4} title="Fully funded promises">
            <p>The owner records a promise with a <b>recipient</b>, a fixed <b>amount</b>, a <b>due date</b> and a short description. The app previews the reserved and available balance before you sign.</p>
            <p>The vault refuses a promise that is zero, has no recipient, or is larger than what is currently available. A promise can never be recorded unfunded, so the total protected can never exceed the vault balance.</p>
          </Section>

          <Section id="example" n={5} title="The worked example">
            <p>A vault holds <b>3,000</b> USDC. Promises total <b>1,800</b>. Available is 3,000 − 1,800 = <b>1,200</b>.</p>
            <ul className="list-disc space-y-2 pl-5 marker:text-gold">
              <li>A <b>1,500</b> payment fails: it is 300 more than is available.</li>
              <li>A <b>500</b> payment succeeds. The vault holds 2,500, 1,800 stays protected, and 700 is available.</li>
              <li>A recipient later claims <b>600</b>. The vault holds 1,900, protected falls to 1,200, and available is still 700.</li>
            </ul>
            <p>Try your own numbers below.</p>
          </Section>
          <div className="-mt-6 mb-12"><Reveal><Calculator /></Reveal></div>

          <Section id="spending" n={6} title="Safe spending checks">
            <p>When the owner pays someone, the vault checks, in order: the caller is the owner, the destination is valid, the amount is above zero, and the amount does not exceed <b>vault balance minus protected promises</b>. Only then does it send the USDC. After sending it checks again that the balance still covers every protected promise.</p>
            <p>The vault has no function for arbitrary calls, token approvals, emergency sweeps or other tokens. The app shows a transfer preview and disables the button when a payment would be rejected.</p>
          </Section>

          <Section id="claims" n={7} title="Claims on the due date">
            <p>Reaching a due date does not send anything. <b>The recipient must submit a claim transaction</b> from the named address and pay the network fee. Nobody else can claim for them.</p>
            <p>A claim works once. The vault marks the promise as claimed and lowers the protected total <i>before</i> it sends USDC, so a repeated or re-entrant call cannot pay twice. If the transfer fails, the whole claim is undone and the promise stays claimable.</p>
          </Section>

          <Section id="release" n={8} title="Releasing a promise">
            <p>A recipient may voluntarily <b>release</b> their own unclaimed promise. This <b>forfeits the claim</b>: no USDC is sent to them, the protected amount drops, and the money becomes available to the treasury. It cannot be undone. The app requires an explicit confirmation, and the contract rejects a release that is not confirmed.</p>
          </Section>

          <Section id="cancel" n={9} title="Cancellation rules">
            <p>The owner <b>cannot</b> cancel a promise, change its recipient, lower its amount or move its due date. No function exists to do any of these, and no admin or upgrade can add one to a deployed vault.</p>
            <p>A promise ends in exactly two ways: its recipient <b>claims</b> it, or its recipient <b>releases</b> it. If a recipient loses access to their address, the promise stays reserved indefinitely. That is the cost of making promises the owner cannot undo.</p>
          </Section>

          <Section id="gas" n={10} title="Gas and failures">
            <p>Covenant charges <b>no protocol fee</b>: the contracts have no fee setting and no fee recipient. Network fees still apply to every transaction.</p>
            <p>On Arc, transaction fees are paid in USDC, so every wallet needs a little USDC for gas on top of any amount it moves. In the app you will see states for waiting on your wallet, waiting for a block, confirmed with a receipt link, and failed with a reason. A wallet rejection is shown as a cancellation, not an error.</p>
            <p>Common failures: wrong network, not enough gas, spending more than is available, claiming before the due date, or the token issuer restricting an address. A failed transaction changes nothing in the vault.</p>
          </Section>

          <Section id="scope" n={11} title="Scope of protection">
            <p>Covenant protects <b>recorded, fully funded obligations inside one vault</b>, using rules enforced by the contract.</p>
            <p>It does <b>not</b> guarantee that anyone performs the work a promise is meant to pay for, replace an employment or service agreement, protect the value or availability of USDC (its issuer can pause or restrict transfers), or eliminate smart contract risk. It is an unaudited prototype. <Link to="/demo" className="text-gold-soft underline-offset-4 hover:underline">Try the isolated demo</Link> before touching a wallet.</p>
          </Section>
        </div>
      </div>
    </div>
  )
}
