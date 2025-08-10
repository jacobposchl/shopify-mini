import { useFlowState } from './hooks/useFlowState'
import { generateRecommendation } from './utils/recommendationEngine'
import { CompanySelection } from './components/CompanySelection'
import { StyleSelection } from './components/StyleSelection'
import { SubStyleSelection } from './components/SubStyleSelection'
import { ClothingSelection } from './components/ClothingSelection'
import { MeasurementsStep } from './components/Measurements'
import { FinalRecommendation } from './components/FinalRecommendation'
import { clothingItems } from './data/mockData'

export function App() {
  const {
    flowState,
    selectCompany,
    selectStyle,
    selectSubStyle,
    setMeasurements,
    setRecommendations,
    resetFlow,
    goToNextStep,
    goToPreviousStep
  } = useFlowState()

  const handleBack = () => {
    goToPreviousStep()
  }

  const handleCompanySelect = (company: any) => {
    selectCompany(company)
    goToNextStep()
  }

  const handleStyleSelect = (style: any) => {
    selectStyle(style)
    goToNextStep()
  }

  const handleSubStyleSelect = (subStyle: any) => {
    selectSubStyle(subStyle)
    goToNextStep()
  }

  const handleItemSelect = (item: any) => {
    const selectedItem = clothingItems.find(clothingItem => clothingItem.id === item.id)
    if (selectedItem) {
      setRecommendations([{
        item: selectedItem,
        recommendedSize: 'M',
        confidence: 0.8,
        measurements: flowState.measurements || {
          chest: 42,
          waist: 32,
          hips: 38,
          shoulders: 18,
          armLength: 25,
          inseam: 32,
          height: 70,
          weight: 165
        }
      }])
      goToNextStep()
    }
  }

  const handleMeasurementsComplete = (measurements: any) => {
    setMeasurements(measurements)

    if (flowState.recommendations && flowState.recommendations.length > 0) {
      const selectedItem = flowState.recommendations[0].item
      const recommendation = generateRecommendation(selectedItem, measurements)
      setRecommendations([recommendation])
    }

    goToNextStep()
  }

  const handleStartOver = () => {
    resetFlow()
  }

  const handleAddToCart = () => {
    alert('Item added to cart!')
  }

  const renderCurrentStep = () => {
    switch (flowState.currentStep) {
      case 'company-selection':
        return (
          <CompanySelection
            onCompanySelect={handleCompanySelect}
            selectedCompany={flowState.userPreferences.selectedCompany}
          />
        )

      case 'style-selection':
        return (
          <StyleSelection
            onStyleSelect={handleStyleSelect}
            selectedStyle={flowState.userPreferences.selectedStyle}
            selectedCompanyName={flowState.userPreferences.selectedCompany?.name}
            onBack={handleBack}
          />
        )

      case 'substyle-selection':
        return (
          <SubStyleSelection
            onSubStyleSelect={handleSubStyleSelect}
            selectedSubStyle={flowState.userPreferences.selectedSubStyle}
            selectedStyleId={flowState.userPreferences.selectedStyle?.id}
            selectedCompanyName={flowState.userPreferences.selectedCompany?.name}
            selectedStyleName={flowState.userPreferences.selectedStyle?.name}
            onBack={handleBack}
          />
        )

      case 'clothing-selection':
        return (
          <ClothingSelection
            onItemSelect={handleItemSelect}
            selectedItem={flowState.recommendations?.[0]?.item}
            selectedCompanyId={flowState.userPreferences.selectedCompany?.id}
            selectedStyleId={flowState.userPreferences.selectedStyle?.id}
            selectedSubStyleId={flowState.userPreferences.selectedSubStyle?.id}
            selectedCompanyName={flowState.userPreferences.selectedCompany?.name}
            selectedStyleName={flowState.userPreferences.selectedStyle?.name}
            selectedSubStyleName={flowState.userPreferences.selectedSubStyle?.name}
            onBack={handleBack}
          />
        )

      case 'measurements':
        return (
          <MeasurementsStep
            onMeasurementsComplete={handleMeasurementsComplete}
            onAutoProgress={goToNextStep}
            selectedItemName={flowState.recommendations?.[0]?.item.name}
            selectedCompanyName={flowState.userPreferences.selectedCompany?.name}
            selectedStyleName={flowState.userPreferences.selectedStyle?.name}
            selectedSubStyleName={flowState.userPreferences.selectedSubStyle?.name}
            selectedStyleId={flowState.userPreferences.selectedStyle?.id}
          />
        )

      case 'final-recommendation':
        return flowState.recommendations && flowState.recommendations.length > 0 ? (
          <FinalRecommendation
            recommendation={flowState.recommendations[0]}
            onStartOver={handleStartOver}
            onAddToCart={handleAddToCart}
          />
        ) : (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900 mb-2">Loading...</h1>
              <p className="text-gray-500">Preparing your recommendation</p>
            </div>
          </div>
        )

      default:
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
              <button
                onClick={resetFlow}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Start Over
              </button>
            </div>
          </div>
        )
    }
  }

  return <>{renderCurrentStep()}</>
}
