import React from 'react'
import { Card } from '@shopify/shop-minis-react'
import { Company } from '../types'
import { companies } from '../data/mockData'

interface CompanySelectionProps {
  onCompanySelect: (company: Company) => void
  selectedCompany?: Company
}

export function CompanySelection({ onCompanySelect, selectedCompany }: CompanySelectionProps) {
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

        {/* Continue Button */}
        {selectedCompany && (
          <div className="mt-8 px-4 max-w-md mx-auto">
            <button
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              onClick={() => onCompanySelect(selectedCompany)}
            >
              Continue with {selectedCompany.name}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}