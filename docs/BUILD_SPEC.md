# Covenant

Protect what's promised. Spend what's free.

## Status
Planning specification. No application or contract deployed yet. Implementation must originate in Arc Studio for Arc Microgrants eligibility. Record the real Studio project URL and preserve build/testing history. Never invent deployment addresses, transactions, audits or usage metrics.

## Problem and audience
Small Web3 teams need to know which treasury funds are truly available after contributor commitments. A wallet balance is not a spending budget. Covenant reserves fully funded dated USDC obligations and restricts discretionary spending to uncommitted funds.

## MVP contract rules
- One non-upgradeable vault per treasury, configured with one owner and one supported USDC token. Verify Arc token semantics and decimals using official docs before implementation; never assume native gas balance and ERC20 balance are interchangeable.
- Deposits increase assets; anyone may fund. Owner creates fixed-amount commitments with recipient, due timestamp and description reference. Reject zero amount, zero recipient and commitments exceeding available funds.
- Outstanding commitments remain reserved until claimed or voluntarily released by their recipient. Owner cannot unilaterally cancel, change recipient, lower amount, delay due date or withdraw reserved USDC.
- Owner may transfer only unreserved funds. Check the invariant balance >= outstanding reserves after every applicable action.
- After due time, recipient claims once. Update accounting before external transfers; use safe token operations and reentrancy protection. Recipient may voluntarily release their own unclaimed commitment back to available funds through an explicit confirmed action; this sends them no money.
- No arbitrary external execution, approvals, emergency sweep of protected tokens, privileged bypass, yield strategies, borrowing or governance token. No owner-only upgrade that can defeat protections.
- Emit deposit, commitment, claim, release and treasury spend events. Document unsolicited token transfers and unsupported tokens.
- Claims require a transaction; timestamps do not automatically send funds. Account for gas separately.

## App routes
/ Home: substantial introduction, animated allocation diagram, problem, product walkthrough, benefits, practical use cases and FAQ.
/how-it-works: full detailed guide with numerical examples and actual permissions.
/app: treasury overview with balance, reserved, available, upcoming obligations, recent activity and treasury selection/creation.
/app/commitments: create and browse commitments, filters and detail views.
/app/claims: connected recipient's commitments, due dates, claim and optional release with explicit confirmation.
/app/activity: readable event timeline and genuine explorer links.

## Visual direction
Premium editorial finance interface: deep midnight ink, warm ivory text, restrained brushed-gold accents and mint for available funds. Confident typography, generous spacing, deliberate asymmetry, fine borders, no generic purple gradients or oversized identical card grids. Distinct full app shell with sidebar and useful tables. Responsive navigation and forms. Use custom SVG/CSS treasury allocation visuals and subtle motion: funds travel into protected/spendable partitions, counters transition and route changes fade. Respect reduced-motion preferences and keyboard access. No fake social proof, partnerships, audit badges, TVL or users.

## Required How It Works content
1. Connect an EVM wallet, inspect selected network and treasury address; explain owner versus contributor permissions.
2. Create a treasury and deposit USDC: distinguish token approval from deposit and wallet balance from vault balance.
3. Create a fully funded promise: recipient, amount and due date; preview reserved and available balances before signing.
4. Example: 3,000 USDC balance, 1,800 committed, 1,200 spendable. A 1,500 discretionary transfer fails, a 500 transfer leaves 700 available.
5. Due dates make claims available; recipients submit transactions. Claiming 600 reduces both balance and reserved by 600, leaving discretionary available unchanged.
6. Owner cannot reclaim protected payments. Only recipient can voluntarily release a commitment, with a clear warning that this forfeits the claim.
7. USDC gas, approvals, pending/confirmed/failed transactions, wrong-network states and explorer receipts.
8. Scope of protection: only assets in this vault, recorded fully funded commitments and contract-enforced rules. Does not guarantee employment, offchain performance, USDC value or availability, or eliminate contract risk. Unaudited prototype until independently audited.

## Functionality
Real wallet connection and chain reads/writes. Validate addresses and decimal amounts without floating-point arithmetic. Handle account/network changes and transaction errors. No fabricated connected-wallet or successful-payment states. A separate explicitly labelled simulation can be used without a wallet; simulated balances must never appear as live funds.

## Verification
Meaningful contract tests: overcommit rejection; owner and recipient permissions; pre-due rejection; duplicate claim rejection; spend exactly available succeeds; spend above available fails; voluntary release accounting; claim leaves available unchanged; multiple contributors and interleaved deposits/spends/claims; malicious reentrancy and failing token transfers. Check build and mobile/desktop flows. Use small-value testnet flows before user-approved mainnet deployment.

## Submission evidence
Actual Arc Studio project URL, public repo, live app URL, reviewed contract addresses, real mainnet USDC transaction explorer link and walkthrough video showing Studio build and real app transaction. No claim of completion until each artifact exists.
