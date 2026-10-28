import { ChevronDown } from 'lucide-react'

const ITEMS: Array<{ q: string; a: string }> = [
  {
    q: 'Is my team\'s money safe?',
    a: 'Covenant is an unaudited prototype configured for Arc Testnet and test USDC. Inside a vault, the contract enforces one rule: the owner can never spend the part of the balance that recorded promises need. That does not remove smart contract risk, and no independent audit has been done. Do not use it with funds you cannot afford to lose.',
  },
  {
    q: 'Can the owner cancel a promise?',
    a: 'No. Once recorded, the amount, recipient and due date cannot be changed, delayed or cancelled by anyone, including the owner. The only way a promise ends early is if its recipient voluntarily releases it, which gives up the claim and returns the money to the treasury.',
  },
  {
    q: 'Do recipients get paid automatically on the due date?',
    a: 'No. Blockchains do not move money by themselves. When a promise is due, the recipient sends a claim transaction from their own wallet and pays the network fee. Until they claim, the money stays reserved for them.',
  },
  {
    q: 'Does Covenant charge a fee?',
    a: 'No. Covenant takes no protocol fee, and the contracts have no fee setting or fee recipient. Network fees still apply to every transaction. On Arc, gas is paid in USDC. Every deposit, promise, claim and spend is a transaction, so the sender needs a little USDC in their wallet for fees as well as the amount they are moving.',
  },
  {
    q: 'What does Covenant not protect against?',
    a: 'It protects recorded obligations inside one vault. It does not guarantee that anyone does the work they were promised money for, does not make a promise an employment contract, does not protect the value or availability of USDC (its issuer can pause or restrict transfers), and does not remove bugs that may exist in the contract.',
  },
  {
    q: 'Who controls a treasury?',
    a: 'One owner address is set when the vault is created and can never change. Use a multisig wallet as the owner if more than one person should approve spending. Anyone can deposit. Only the owner can create promises or spend free funds.',
  },
  {
    q: 'Can I try it without a wallet?',
    a: 'Yes. The demo page runs an isolated simulation in your browser, clearly labelled, with pretend balances. It never touches the chain and its numbers are never shown as live funds.',
  },
]

export function Faq() {
  return (
    <div className="divide-y divide-line border-y border-line">
      {ITEMS.map((item) => (
        <details key={item.q} className="group py-1">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-3 text-left text-lg marker:hidden [&::-webkit-details-marker]:hidden">
            <span className="display text-xl font-light">{item.q}</span>
            <ChevronDown className="size-5 shrink-0 text-gold transition-transform duration-300 group-open:rotate-180" aria-hidden />
          </summary>
          <p className="max-w-2xl pb-5 text-pretty leading-relaxed text-ivory-dim">{item.a}</p>
        </details>
      ))}
    </div>
  )
}
