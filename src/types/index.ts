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

// Pose detection results
export interface PoseResults {
  landmarks: Array<{
    x: number
    y: number
    confidence: number
  }>
  isDetected: boolean
  confidence: number
}

// Pose confidence requirements for different clothing types
export interface PoseConfidenceRequirement {
  keypointIndices: number[] // PoseNet keypoint indices (0-16)
  minConfidence: number // Minimum confidence threshold (0-1)
  requiredDuration: number // Required duration in milliseconds
  description: string // Human-readable description
}

export interface ClothingPoseRequirements {
  styleId: string // e.g., 'shirts', 'pants'
  requirements: PoseConfidenceRequirement[]
}

// Measurement validation status
export interface MeasurementValidation {
  isValid: boolean
  confidence: number // Overall confidence score (0-1)
  progress: number // Progress towards meeting requirements (0-1)
  requirements: {
    [key: string]: {
      met: boolean
      progress: number
      duration: number
      confidence: number
    }
  }
  message: string
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
