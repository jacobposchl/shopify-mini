import { useState, useCallback } from 'react'
import { FlowState, FlowStep, UserPreferences, Company, Style, SubStyle, Measurements, Recommendation } from '../types'

const initialFlowState: FlowState = {
  currentStep: 'company-selection',
  userPreferences: {},
  measurements: undefined,
  recommendations: undefined
}

export function useFlowState() {
  const [flowState, setFlowState] = useState<FlowState>(initialFlowState)

  const goToStep = useCallback((step: FlowStep) => {
    setFlowState(prev => ({
      ...prev,
      currentStep: step
    }))
  }, [])

  const selectCompany = useCallback((company: Company) => {
    setFlowState(prev => ({
      ...prev,
      userPreferences: {
        ...prev.userPreferences,
        selectedCompany: company
      }
    }))
  }, [])

  const selectStyle = useCallback((style: Style) => {
    setFlowState(prev => ({
      ...prev,
      userPreferences: {
        ...prev.userPreferences,
        selectedStyle: style
      }
    }))
  }, [])

  const selectSubStyle = useCallback((subStyle: SubStyle) => {
    setFlowState(prev => ({
      ...prev,
      userPreferences: {
        ...prev.userPreferences,
        selectedSubStyle: subStyle
      }
    }))
  }, [])

  const setMeasurements = useCallback((measurements: Measurements) => {
    setFlowState(prev => ({
      ...prev,
      measurements
    }))
  }, [])

  const setRecommendations = useCallback((recommendations: Recommendation[]) => {
    setFlowState(prev => ({
      ...prev,
      recommendations
    }))
  }, [])

  const resetFlow = useCallback(() => {
    setFlowState(initialFlowState)
  }, [])

  const goToNextStep = useCallback(() => {
    const stepOrder: FlowStep[] = [
      'company-selection',
      'style-selection',
      'substyle-selection',
      'clothing-selection',
      'measurements',
      'final-recommendation'
    ]
    
    const currentIndex = stepOrder.indexOf(flowState.currentStep)
    if (currentIndex < stepOrder.length - 1) {
      goToStep(stepOrder[currentIndex + 1])
    }
  }, [flowState.currentStep, goToStep])

  const goToPreviousStep = useCallback(() => {
    const stepOrder: FlowStep[] = [
      'company-selection',
      'style-selection',
      'substyle-selection',
      'clothing-selection',
      'measurements',
      'final-recommendation'
    ]
    
    const currentIndex = stepOrder.indexOf(flowState.currentStep)
    if (currentIndex > 0) {
      goToStep(stepOrder[currentIndex - 1])
    }
  }, [flowState.currentStep, goToStep])

  return {
    flowState,
    goToStep,
    selectCompany,
    selectStyle,
    selectSubStyle,
    setMeasurements,
    setRecommendations,
    resetFlow,
    goToNextStep,
    goToPreviousStep
  }
}
