// src/components/CompanySelection.tsx
import React from 'react'
import { Card, useAsyncStorage } from '@shopify/shop-minis-react'
import type { Company } from '../types'
import { companies } from '../data/mockData'

// ---------- helpers ----------
function dailySeed(dateStr: string) {
  let h = 0
  for (let i = 0; i < dateStr.length; i++) h = (h * 31 + dateStr.charCodeAt(i)) >>> 0
  return h
}
function pickDeterministic(
  ids: string[],
  n: number,
  seed: number,
  exclude = new Set<string>()
) {
  const pool = ids.filter((id) => !exclude.has(id))
  const out: string[] = []
  let s = seed
  for (let i = 0; i < pool.length && out.length < n; i++) {
    s = (s * 1664525 + 1013904223) >>> 0 // LCG
    const idx = s % pool.length
    const candidate = pool.splice(idx, 1)[0]
    out.push(candidate)
  }
  return out
}
function chunk<T>(arr: T[], size: number) {
  const res: T[][] = []
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size))
  return res
}
function uniqById<T extends { id: string }>(arr: T[]) {
  const seen = new Set<string>()
  return arr.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

interface CompanySelectionProps {
  onCompanySelect: (company: Company) => void
  selectedCompany?: Company
}

export function CompanySelection({ onCompanySelect }: CompanySelectionProps) {
  const { getItem, setItem } = useAsyncStorage()
  const [trendingIds, setTrendingIds] = React.useState<string[]>([])

  // De-dupe to avoid key collisions/gaps
  const uniqueCompanies = React.useMemo(() => uniqById(companies), [])

  // Stable original order for remaining brands
  const originalIndex = React.useMemo(() => {
    const m = new Map<string, number>()
    uniqueCompanies.forEach((c, i) => m.set(c.id, i))
    return m
  }, [uniqueCompanies])

  // Build today's top-3 (local clicks first, then daily rotation)
  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      const raw = await getItem({ key: 'brandClicks' })
      let clicks: Record<string, number> = {}
      try { clicks = raw ? JSON.parse(String(raw)) : {} } catch { clicks = {} }

      const byClicks = Object.entries(clicks)
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id)
        .filter((id) => uniqueCompanies.some((c) => c.id === id))
        .slice(0, 3)

      const need = 3 - byClicks.length
      const today = new Date().toISOString().slice(0, 10)
      const filler =
        need > 0
          ? pickDeterministic(
              uniqueCompanies.map((c) => c.id),
              need,
              dailySeed(today),
              new Set(byClicks)
            )
          : []

      const todaysTop3 = [...byClicks, ...filler].slice(0, 3)
      if (mounted) setTrendingIds(todaysTop3)
    })()
    return () => {
      mounted = false
    }
  }, [getItem, uniqueCompanies])

  // Rank lookup for medals
  const rankById = React.useMemo(() => {
    const m = new Map<string, number>()
    trendingIds.forEach((id, i) => m.set(id, i)) // 0..2
    return m
  }, [trendingIds])

  // Compose pages: page 1 = [Top3] + first six others; rest chunked by 9
  const trendingCompanies = React.useMemo(
    () =>
      trendingIds
        .map((id) => uniqueCompanies.find((c) => c.id === id))
        .filter((c): c is Company => !!c),
    [trendingIds, uniqueCompanies]
  )
  const otherCompanies = React.useMemo(
    () =>
      uniqueCompanies
        .filter((c) => !rankById.has(c.id))
        .sort(
          (a, b) => (originalIndex.get(a.id)! - originalIndex.get(b.id)!)
        ),
    [uniqueCompanies, rankById, originalIndex]
  )
  const firstPage: Company[] = React.useMemo(
    () => [...trendingCompanies, ...otherCompanies.slice(0, 6)],
    [trendingCompanies, otherCompanies]
  )
  const remaining = React.useMemo(() => otherCompanies.slice(6), [otherCompanies])
  const otherPages = React.useMemo(() => chunk(remaining, 9), [remaining])
  const pages: Company[][] = React.useMemo(
    () => [firstPage, ...otherPages],
    [firstPage, otherPages]
  )

  const handleSelect = async (company: Company) => {
    const raw = await getItem({ key: 'brandClicks' })
    let clicks: Record<string, number> = {}
    try { clicks = raw ? JSON.parse(String(raw)) : {} } catch { clicks = {} }
    clicks[company.id] = (clicks[company.id] ?? 0) + 1
    await setItem({ key: 'brandClicks', value: JSON.stringify(clicks) })
    onCompanySelect(company)
  }

  const medalForRank = (r: number) => (r === 0 ? '🥇' : r === 1 ? '🥈' : '🥉')

  const renderCard = (company: Company) => {
    const rank = rankById.has(company.id) ? (rankById.get(company.id) as number) : -1
    const isTrending = rank !== -1
    return (
      <div key={company.id} className="relative aspect-square">
        <Card
          className="relative w-full h-full p-0 overflow-hidden rounded-[22%] border-0 shadow-sm hover:scale-105 active:scale-95 transition-all duration-150 ease-out cursor-pointer"
          onClick={() => handleSelect(company)}
          aria-label={`${company.name}${isTrending ? `, trending #${rank + 1}` : ''}`}
        >
          {isTrending && (
            <div className="pointer-events-none absolute top-2 left-2 z-20">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/95 shadow ring-1 ring-black/5">
                <span className="text-[18px]" aria-hidden>
                  {medalForRank(rank)}
                </span>
                <span className="sr-only">Trending rank {rank + 1}</span>
              </div>
            </div>
          )}
          <img
            src={company.logo}
            alt={company.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#550cff] flex flex-col">
      {/* Header matches Step 2 style (centered) */}
      <header className="relative bg-transparent">
        <div className="px-4 pt-12 pb-4 text-center">
          <div className="mb-1">
            <span className="text-sm font-medium text-white">Step 1 of 6</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Choose Your Brand</h1>
          <p className="text-sm text-white/80">Trending Today</p>
        </div>
      </header>

      {/* Snap scrolling with consistent spacing (no gaps) */}
      <div className="flex-1 overflow-y-auto snap-y snap-mandatory scroll-py-4">
        {pages.map((group, pageIdx) => (
          <section key={pageIdx} className="snap-start h-full px-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              {group.map(renderCard)}
              {/* pad unfinished last page for perfect grid geometry */}
              {group.length < 9 &&
                Array.from({ length: 9 - group.length }).map((_, i) => (
                  <div key={`spacer-${pageIdx}-${i}`} className="aspect-square" />
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
