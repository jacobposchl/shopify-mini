import { ClothingPoseRequirements, PoseConfidenceRequirement } from '../types'

// PoseNet keypoint indices for reference:
// 0: nose, 1: leftEye, 2: rightEye, 3: leftEar, 4: rightEar
// 5: leftShoulder, 6: rightShoulder, 7: leftElbow, 8: rightElbow
// 9: leftWrist, 10: rightWrist, 11: leftHip, 12: rightHip
// 13: leftKnee, 14: rightKnee, 15: leftAnkle, 16: rightAnkle

export const POSE_CONFIDENCE_REQUIREMENTS: ClothingPoseRequirements[] = [
  {
    styleId: 'shirts',
    requirements: [
      {
        keypointIndices: [5, 6], // leftShoulder, rightShoulder
        minConfidence: 0.7,
        requiredDuration: 3000, // 3 seconds
        description: 'Shoulders visible and stable'
      },
      {
        keypointIndices: [7, 8], // leftElbow, rightElbow
        minConfidence: 0.6,
        requiredDuration: 2000, // 2 seconds
        description: 'Arms visible for sleeve measurement'
      },
      {
        keypointIndices: [11, 12], // leftHip, rightHip
        minConfidence: 0.6,
        requiredDuration: 2000, // 2 seconds
        description: 'Hips visible for fit assessment'
      }
    ]
  },
  {
    styleId: 'pants',
    requirements: [
      {
        keypointIndices: [11, 12], // leftHip, rightHip
        minConfidence: 0.7,
        requiredDuration: 3000, // 3 seconds
        description: 'Hips visible and stable'
      },
      {
        keypointIndices: [13, 14], // leftKnee, rightKnee
        minConfidence: 0.6,
        requiredDuration: 2000, // 2 seconds
        description: 'Knees visible for length measurement'
      },
      {
        keypointIndices: [15, 16], // leftAnkle, rightAnkle
        minConfidence: 0.6,
        requiredDuration: 2000, // 2 seconds
        description: 'Ankles visible for fit assessment'
      }
    ]
  },
  {
    styleId: 'shorts',
    requirements: [
      {
        keypointIndices: [11, 12], // leftHip, rightHip
        minConfidence: 0.7,
        requiredDuration: 3000, // 3 seconds
        description: 'Hips visible and stable'
      },
      {
        keypointIndices: [13, 14], // leftKnee, rightKnee
        minConfidence: 0.6,
        requiredDuration: 2000, // 2 seconds
        description: 'Knees visible for length measurement'
      }
    ]
  },
  {
    styleId: 'jackets',
    requirements: [
      {
        keypointIndices: [5, 6], // leftShoulder, rightShoulder
        minConfidence: 0.7,
        requiredDuration: 3000, // 3 seconds
        description: 'Shoulders visible and stable'
      },
      {
        keypointIndices: [7, 8], // leftElbow, rightElbow
        minConfidence: 0.6,
        requiredDuration: 2000, // 2 seconds
        description: 'Arms visible for sleeve measurement'
      },
      {
        keypointIndices: [11, 12], // leftHip, rightHip
        minConfidence: 0.6,
        requiredDuration: 2000, // 2 seconds
        description: 'Hips visible for fit assessment'
      }
    ]
  },
  {
    styleId: 'activewear',
    requirements: [
      {
        keypointIndices: [5, 6], // leftShoulder, rightShoulder
        minConfidence: 0.7,
        requiredDuration: 3000, // 3 seconds
        description: 'Shoulders visible and stable'
      },
      {
        keypointIndices: [11, 12], // leftHip, rightHip
        minConfidence: 0.7,
        requiredDuration: 3000, // 3 seconds
        description: 'Hips visible and stable'
      },
      {
        keypointIndices: [13, 14], // leftKnee, rightKnee
        minConfidence: 0.6,
        requiredDuration: 2000, // 2 seconds
        description: 'Knees visible for fit assessment'
      }
    ]
  }
]

// Default requirements for unknown clothing types
export const DEFAULT_POSE_REQUIREMENTS: PoseConfidenceRequirement[] = [
  {
    keypointIndices: [5, 6], // leftShoulder, rightShoulder
    minConfidence: 0.6,
    requiredDuration: 2000, // 2 seconds
    description: 'Basic pose detection'
  }
]

// Helper function to get requirements for a specific style
export function getPoseRequirements(styleId: string): PoseConfidenceRequirement[] {
  const styleRequirements = POSE_CONFIDENCE_REQUIREMENTS.find(
    req => req.styleId === styleId
  )
  return styleRequirements?.requirements || DEFAULT_POSE_REQUIREMENTS
}

// Helper function to get clothing-specific instruction text
export function getClothingInstructions(styleId: string): string {
  const instructions: { [key: string]: string } = {
    'shirts': 'Please ensure your upper body is in frame for measurements. Stand naturally with shoulders visible.',
    'pants': 'Please ensure your lower body is in frame for measurements. Stand naturally with hips and legs visible.',
    'shorts': 'Please ensure your lower body is in frame for measurements. Stand naturally with hips and legs visible.',
    'jackets': 'Please ensure your upper body is in frame for measurements. Stand naturally with shoulders and arms visible.',
    'activewear': 'Please ensure your full body is in frame for measurements. Stand naturally in an athletic pose.'
  }
  
  return instructions[styleId] || 'Please ensure your body is in frame for measurements. Stand naturally.'
}
