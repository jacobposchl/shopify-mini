// src/components/CompanySelection.tsx
import React from 'react'
import { Card } from '@shopify/shop-minis-react'
import { Company } from '../types'
import { companies } from '../data/mockData'

interface CompanySelectionProps {
  onCompanySelect: (company: Company) => void
  selectedCompany?: Company // kept for compatibility; no continue button rendered
}

export function CompanySelection({ onCompanySelect }: CompanySelectionProps) {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">Choose Your Brand</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        <div className="grid grid-cols-3 gap-4">
          {companies.map((company) => (
            <div key={company.id} className="aspect-square">
              <Card
                className="w-full h-full p-0 overflow-hidden rounded-[22%] border-0 shadow-sm hover:scale-105 transition-transform"
                onClick={() => onCompanySelect(company)}
              >
                <img
                  src={company.logo}
                  alt={company.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </Card>
            </div>
          ))}
        </div>

        {/* ⛔️ Removed the 'Continue with …' button block */}
      </main>
    </div>
  )
}
