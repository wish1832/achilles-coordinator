/**
 * Data models for the Achilles Run Coordinator application
 * These interfaces define the structure of data stored in Firestore
 */

// User roles in the system
export type UserRole = 'athlete' | 'guide' | 'admin'

/**
 * Organization (Achilles chapter)
 * Represents a local Achilles chapter (e.g., Denver, Boulder)
 * Admin status is organization-specific, stored in adminIds array
 */
export interface Organization {
  id: string
  name: string
  adminIds: string[] // Array of user IDs who are admins of this organization
  memberIds: string[] // Array of user IDs who are members of this organization
  createdAt: Date
  updatedAt?: Date
  settings?: {
    // Organization-specific settings
    defaultMaxAthletes?: number
    defaultMaxGuides?: number
    timezone?: string
    notificationPreferences?: {
      emailNotifications?: boolean
      smsNotifications?: boolean
    }
  }
}

// Run status options
export type RunStatus = 'upcoming' | 'completed' | 'cancelled'

// Sign-up status options
export type SignUpStatus = 'active' | 'withdrawn'

/**
 * User profile information
 * Represents both athletes with disabilities and able-bodied guides
 */
export interface User {
  id: string
  email: string
  displayName: string
  role: UserRole
  createdAt: Date
  updatedAt?: Date
  profileDetails: {
    // Common fields for all users
    phone?: string
    emergencyContact?: string
    emergencyPhone?: string

    // Athlete-specific fields
    disabilityType?: string
    assistanceNeeded?: string
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced'

    // Guide-specific fields
    guideExperience?: 'new' | 'experienced' | 'expert'
    certifications?: string[]
    maxAthletesPerRun?: number

    // Admin-specific fields
    permissions?: string[]
  }
}

/**
 * Running event information
 * Represents a scheduled run that athletes and guides can sign up for
 */
export interface Run {
  id: string
  date: Date
  time: string // Format: "HH:MM" (24-hour)
  location: string
  description: string
  createdBy: string // User ID of the admin who created the run
  createdAt: Date
  updatedAt?: Date
  status: RunStatus
  maxAthletes?: number
  maxGuides?: number
  notes?: string // Additional information for the run
}

/**
 * Sign-up record
 * Represents when a user (athlete or guide) signs up for a run
 */
export interface SignUp {
  id: string
  runId: string
  userId: string
  role: 'athlete' | 'guide' // The role they're signing up as for this run
  timestamp: Date
  status: SignUpStatus
  notes?: string // User can add notes when signing up
}

/**
 * Pairing record
 * Represents the pairing of an athlete with a guide for a specific run
 */
export interface Pairing {
  id: string
  runId: string
  athleteId: string
  guideId: string
  createdBy: string // User ID of the admin who created the pairing
  createdAt: Date
  notes?: string // Admin notes about the pairing
  status: 'active' | 'cancelled'
}

/**
 * Extended interfaces that include related data
 * These are used in the UI to display information with related records
 */

/**
 * Run with sign-up counts and pairing information
 */
export interface RunWithDetails extends Run {
  athleteSignUps: number
  guideSignUps: number
  pairings: number
  isUserSignedUp: boolean
  userSignUpRole?: 'athlete' | 'guide'
}

/**
 * Sign-up with user and run information
 */
export interface SignUpWithDetails extends SignUp {
  user: User
  run: Run
}

/**
 * Pairing with user and run information
 */
export interface PairingWithDetails extends Pairing {
  athlete: User
  guide: User
  run: Run
}

/**
 * User statistics for dashboard display
 */
export interface UserStats {
  totalRuns: number
  upcomingRuns: number
  completedRuns: number
  totalSignUps: number
  activeSignUps: number
}

/**
 * Form data interfaces for creating/editing records
 */

export interface CreateUserForm {
  email: string
  displayName: string
  role: UserRole
  password: string
  profileDetails: Partial<User['profileDetails']>
}

export interface CreateRunForm {
  date: string // ISO date string
  time: string
  location: string
  description: string
  maxAthletes?: number
  maxGuides?: number
  notes?: string
}

export interface CreatePairingForm {
  runId: string
  athleteId: string
  guideId: string
  notes?: string
}
