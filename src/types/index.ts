// Core types for the clothing recommendation system

export interface Company {
  id: string
  name: string
  logo: string
  description: string
}

export interface Style {
  id: string
  name: string
  icon: string
  description: string
}

export interface SubStyle {
  id: string
  name: string
  description: string
  styleId: string // references Style.id
}

export interface ClothingItem {
  id: string
  name: string
  brand: string
  style: string
  subStyle: string
  price: string
  image: string
  colors: string[]
  sizes: string[]
  companyId: string
  styleId: string
  subStyleId: string
}

export interface UserPreferences {
  selectedCompany?: Company
  selectedStyle?: Style
  selectedSubStyle?: SubStyle
}

export interface Measurements {
  chest: number
  waist: number
  hips: number
  shoulders: number
  armLength: number
  inseam: number
  height: number
  weight: number
}

export interface Recommendation {
  item: ClothingItem
  recommendedSize: string
  confidence: number
  measurements: Measurements
}

// Step types for the flow
export type FlowStep = 
  | 'company-selection'
  | 'style-selection' 
  | 'substyle-selection'
  | 'clothing-selection'
  | 'measurements'
  | 'final-recommendation'

export interface FlowState {
  currentStep: FlowStep
  userPreferences: UserPreferences
  measurements?: Measurements
  recommendations?: Recommendation[]
}
