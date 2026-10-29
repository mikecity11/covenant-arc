import { Route, Routes, Link } from 'react-router-dom'
import { TreasuryProvider } from '@/hooks/useTreasury'
import { MarketingLayout } from '@/components/MarketingLayout'
import { AppShell } from '@/components/AppShell'
import Home from '@/pages/Home'
import HowItWorks from '@/pages/HowItWorks'
import Demo from '@/pages/Demo'
import Deploy from '@/pages/Deploy'
import Overview from '@/pages/app/Overview'
import Commitments from '@/pages/app/Commitments'
import CommitmentDetail from '@/pages/app/CommitmentDetail'
import Claims from '@/pages/app/Claims'
import Activity from '@/pages/app/Activity'

function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 py-32 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display mt-3 text-4xl font-light">That page isn't in the ledger.</h1>
      <Link to="/" className="mt-8 inline-block text-gold-soft underline-offset-4 hover:underline">
        Return home
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <TreasuryProvider>
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route index element={<Home />} />
          <Route path="how-it-works" element={<HowItWorks />} />
          <Route path="demo" element={<Demo />} />
          <Route path="deploy" element={<Deploy />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="app" element={<AppShell />}>
          <Route index element={<Overview />} />
          <Route path="commitments" element={<Commitments />} />
          <Route path="commitments/:id" element={<CommitmentDetail />} />
          <Route path="claims" element={<Claims />} />
          <Route path="activity" element={<Activity />} />
        </Route>
      </Routes>
    </TreasuryProvider>
  )
}
