// Core types for the clothing recommendation system

export interface Company {
  id: string
  name: string
  logo: string
  description: string
}

// Shop discovery priority tiers
export enum ShopPriority {
  RECOMMENDED = 'RECOMMENDED',
  FOLLOWED = 'FOLLOWED', 
  RECENT = 'RECENT',
  POPULAR = 'POPULAR',
  DISCOVERY = 'DISCOVERY'
}

export interface DiscoveredShop extends Company {
  priority: ShopPriority
  reason: string
  lastSeen?: Date
  interactionCount?: number
}

// add optional fields (non-breaking)
export interface Style {
  id: string
  name: string
  icon?: string              // fallback emoji (optional)
  iconUrl?: string           // image URL from imports
  iconSelectedUrl?: string   // optional alt art for selected state
  description?: string       // make optional to avoid required copy
}

export interface SubStyle {
  id: string
  name: string
  styleId: string
  iconUrl?: string
  iconSelectedUrl?: string
  description?: string
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
  shopifyProduct?: any // Optional reference to original Shopify product data
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
  userHeight?: number
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
  | 'height-input'
  | 'pose-demo'
  | 'measurements'
  | 'final-recommendation'

export interface FlowState {
  currentStep: FlowStep
  userPreferences: UserPreferences
  measurements?: Measurements
  recommendations?: Recommendation[]
}
