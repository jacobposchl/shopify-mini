import { Company } from '../types'
import { companies } from '../data/mockData'

interface CompanySelectionProps {
  onCompanySelect: (company: Company) => void
  selectedCompany?: Company
}

export function CompanySelection({ onCompanySelect, selectedCompany }: CompanySelectionProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">Choose Your Brand</h1>
          <p className="text-sm text-gray-500">Select a company you're interested in</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => onCompanySelect(company)}
              className={`bg-white rounded-lg shadow-sm overflow-hidden transition-all ${
                selectedCompany?.id === company.id
                  ? 'ring-2 ring-blue-500 shadow-md'
                  : 'hover:shadow-md'
              }`}
            >
              <div className="p-4">
                <img
                  src={company.logo}
                  alt={company.name}
                  className="w-full h-24 object-cover rounded-lg mb-3"
                />
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  {company.name}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {company.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Continue Button */}
        {selectedCompany && (
          <div className="mt-8">
            <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Continue with {selectedCompany.name}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
