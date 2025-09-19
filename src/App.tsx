import { useFlowState } from './hooks/useFlowState'
import { generateRecommendation } from './utils/recommendationEngine'
import { CompanySelection } from './components/CompanySelection'
import { ClothingSelection } from './components/ClothingSelection'
import { HeightInputStep } from './components/HeightInputStep'
import { PoseEstimationDemo } from './components/PoseEstimationDemo'
import { MeasurementsStep } from './components/Measurements'
import { FinalRecommendation } from './components/FinalRecommendation'


export function App() {
  const {
    flowState,
    selectCompany,
    setUserHeight,
    setMeasurements,
    setRecommendations,
    resetFlow,
    goToNextStep,
    goToPreviousStep,
    goToStep
  } = useFlowState()

  // ClothingSelection now uses useProductSearch directly, so no need for this hook here

  const handleBack = () => {
    goToPreviousStep()
  }

  const handleCompanySelect = (company: any) => {
    selectCompany(company)
    goToNextStep()
  }

  const handleItemSelect = (item: any) => {
    // The item is now passed directly from ClothingSelection component
    // which uses useProductSearch and transforms the data to our ClothingItem format
    if (item) {
      setRecommendations([{
        item: item,
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
      goToNextStep() // This will now go to height-input step
    }
  }

  const handleHeightSubmit = (height: number) => {
    setUserHeight(height)
    goToNextStep() // This will go to measurements step
  }

  const handlePoseDemo = () => {
    goToStep('pose-demo')
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

      case 'clothing-selection':
        return (
          <ClothingSelection
            onBack={handleBack}
            onItemSelect={handleItemSelect}
            selectedCompany={flowState.userPreferences.selectedCompany}
          />
        )

      case 'height-input':
        return (
          <HeightInputStep
            onHeightSubmit={handleHeightSubmit}
            onBack={handleBack}
            onPoseDemo={handlePoseDemo}
            selectedItemName={flowState.recommendations?.[0]?.item.name}
            selectedCompanyName={flowState.userPreferences.selectedCompany?.name}
          />
        )

      case 'pose-demo':
        return (
          <PoseEstimationDemo
            onBack={handleBack}
          />
        )

      case 'measurements':
        return (
          <MeasurementsStep
            onMeasurementsComplete={handleMeasurementsComplete}
            onAutoProgress={goToNextStep}
            onCancel={handleBack}
            selectedItemName={flowState.recommendations?.[0]?.item.name}
            selectedCompanyName={flowState.userPreferences.selectedCompany?.name}
            selectedStyleName={flowState.userPreferences.selectedCompany?.name}
            selectedSubStyleName={flowState.userPreferences.selectedCompany?.name}
            selectedStyleId={flowState.userPreferences.selectedCompany?.id}
            userHeight={flowState.userPreferences.userHeight}
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
