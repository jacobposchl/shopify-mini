// src/components/CompanySelection.tsx
import { useShop } from '@shopify/shop-minis-react'
import type { Company } from '../types'
import { useShopDiscovery } from '../hooks/useShopDiscovery'

interface CompanySelectionProps {
  onCompanySelect: (company: Company) => void
  selectedCompany?: Company
}

export function CompanySelection({ onCompanySelect }: CompanySelectionProps) {
  // Try to discover YoungLA from the discovery hook first, then fetch full shop data with useShop.
  const {
    shops: discoveredFilteredShops,
    allShopsBeforeFilter,
    loading: discoveryLoading
  } = useShopDiscovery()

  // Look for any discovered shop whose name includes "youngla"
  const discoveredCandidateYoung = (allShopsBeforeFilter || []).find(s => (s.name || '').toLowerCase().includes('youngla'))
    || (discoveredFilteredShops || []).find(s => (s.name || '').toLowerCase().includes('youngla'))

  // Look for Comfrt
  const discoveredShopIdYoung = discoveredCandidateYoung?.id

  // Look for Fear of God (match common variants)
  // Only call useShop for YoungLA when we have an id (skip otherwise)
  const { shop: shopYoung, loading: shopLoadingYoung, error: shopErrorYoung, refetch: refetchYoung } = useShop({ id: discoveredShopIdYoung ?? '', skip: !discoveredShopIdYoung })

  // Note: selection handled later using resolvedShop

  // Themed header colors and imagery can be pulled from either shop when available
  const primaryBg = (shopYoung as any)?.brandSettings?.primary || '#550cff'

  const anyLoading = (discoveryLoading && !discoveredShopIdYoung) || shopLoadingYoung

  if (anyLoading && !shopYoung && !discoveredCandidateYoung) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: primaryBg }}>
        <header className="px-4 pt-12 pb-4 text-center">
          <h1 className="text-2xl font-extrabold text-white">Select Shop</h1>
          <p className="text-sm text-white/80">Loading shop...</p>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading shop details...</p>
          </div>
        </div>
      </div>
    )
  }

  if ((shopErrorYoung && discoveredShopIdYoung) || (!discoveredShopIdYoung && !discoveryLoading)) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: primaryBg }}>
        <header className="px-4 pt-12 pb-4 text-center">
          <h1 className="text-2xl font-extrabold text-white">Select Shop</h1>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 text-center">
          <div className="text-white">
            <p className="mb-4">Unable to load the shop from Shopify.</p>
            <div className="space-x-2">
              <button
                onClick={() => { refetchYoung?.(); }}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                Retry
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If useShop provided a shop, prefer its rich data; otherwise fall back to discovery candidate
  const resolvedYoung = shopYoung || discoveredCandidateYoung
  const displayYoung = resolvedYoung as any
  const logoYoung = displayYoung?.logoImage?.url || displayYoung?.logo || ''
  const avgYoung = displayYoung?.reviewAnalytics?.averageRating
  const countYoung = displayYoung?.reviewAnalytics?.reviewCount

  const handleSelect = () => {
    const selected: any = shopYoung ? shopYoung : resolvedYoung
    const company: Company = {
      id: selected.id,
      name: selected.name,
      logo: logoYoung || selected.logoImage?.url || selected.logo || '',
      description: selected.description || ''
    }

    onCompanySelect(company)
  }

  function renderTile(display: any, logo: string, avg: number | undefined, count: number | undefined, _key: string | undefined, fallbackInitial: string) {
    return (
      <button
        onClick={handleSelect}
        className="w-full text-left bg-white/5 p-4 rounded-xl flex items-center gap-4 border border-white/80 hover:border-white shadow-sm hover:shadow-md focus:outline-none focus:ring-4 focus:ring-white/60 hover:scale-[1.01] active:scale-95 active:translate-y-1 transition-transform transition-shadow duration-150"
      >
        <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-white/5 flex items-center justify-center">
          {logo ? (
            <img src={logo} alt={display?.logoImage?.altText || display?.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">{(display?.name || fallbackInitial).charAt(0)}</span>
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">{display?.name || (fallbackInitial || 'SHOP')}</h2>
            {typeof avg === 'number' && (
              <div className="text-sm text-white/90 flex items-center gap-1">
                <span className="font-medium">{avg.toFixed(1)}</span>
                <span className="text-yellow-300">★</span>
              </div>
            )}
          </div>

          {typeof count === 'number' && (
            <p className="text-sm text-white/70 mt-1">{count} review{count !== 1 ? 's' : ''}</p>
          )}

          {display?.description && (
            <p className="text-white/80 mt-2 line-clamp-3">{display.description}</p>
          )}
        </div>
      </button>
    )
  }

  // Render both tiles stacked
  return (
    <div className="min-h-screen flex flex-col" style={{ background: primaryBg }}>
      <header className="px-4 pt-12 pb-6 text-center">
        <h1 className="text-3xl font-extrabold text-white">Select Shop</h1>
      </header>

      <main className="flex-1 px-4">
  <div className="max-w-md mx-auto space-y-4">
          {/* renderTile helper ensures identical rendering */}
          {renderTile(displayYoung, logoYoung, avgYoung, countYoung, 'youngla', 'Y')}
        </div>
      </main>
    </div>
  )
}
