/**
 * Data models for the Achilles Run Coordinator application
 * These interfaces define the structure of data stored in Firestore
 */

// User roles in the system
export type UserRole = 'athlete' | 'guide'

// Invitation status options
export type OrganizationInviteStatus = 'pending' | 'accepted' | 'revoked'

/**
 * Organization invite
 * Represents an invite for a user to join an organization by email
 */
export interface OrganizationInvite {
  id: string
  organizationId: string
  email: string
  role: UserRole
  invitedByUserId: string
  status: OrganizationInviteStatus
  createdAt: Date
  acceptedAt?: Date
  userId?: string
  displayName?: string
}

/**
 * Organization (Achilles chapter)
 * Represents a local Achilles chapter (e.g., Denver, Boulder)
 * Admin status is organization-specific, stored in adminIds array
 */
export interface Organization {
  id: string
  name: string
  description?: string // Optional description of the organization
  adminIds: string[] // Array of user IDs who are admins of this organization
  memberIds: string[] // Array of user IDs who are members of this organization
  createdAt: Date
  updatedAt?: Date
  settings?: {
    // Organization-specific settings
    defaultMaxAthletes?: number
    defaultMaxGuides?: number
    timezone?: string
  }
}

// Run status options
export type RunStatus = 'upcoming' | 'completed' | 'cancelled'

// Sign-up status options (RSVP response)
export type SignUpStatus = 'yes' | 'maybe' | 'no'

// Activity options for sign-ups
export type SignUpActivity = 'run' | 'run/walk' | 'roll' | 'walk'

/**
 * User profile information
 * Represents both athletes with disabilities and able-bodied guides
 */
export interface User {
  id: string
  email: string
  displayName: string
  role: UserRole
  organizationIds: string[] // Organizations this user belongs to
  createdAt: Date
  updatedAt?: Date
  profileDetails: {
    // Common fields for all users
    phone?: string
    emergencyContact?: string
    emergencyPhone?: string

    // Activity preferences (for both athletes and guides)
    activities?: ('walk' | 'run' | 'run/walk' | 'roll')[]
    pace?: {
      // Pace in minutes:seconds per mile (aligned with SignUp pace format)
      minutes: number // 6-20
      seconds: number // 0, 15, 30, or 45
    }
    paceRange?: { min: number; max: number } // Min/max pace in minutes per mile

    // Athlete-specific fields
    disabilityType?: string
    assistanceNeeded?: string

    // Guide-specific fields
    certifications?: ('visually impaired guiding')[] // Array of certification types

  }
  userNotes?: string // Notes written BY user about themselves, visible to user + admins
}

/**
 * Location information
 * Represents a location where runs can be held
 */
export interface Location {
  id: string
  organizationId: string // Organization this location belongs to
  name: string // e.g., "Washington Park", "Boulder Creek Path"
  address?: string
  city?: string
  state?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  notes?: string
  createdAt: Date
  updatedAt?: Date
}

/**
 * Running event information
 * Represents a scheduled run that athletes and guides can sign up for
 */
export interface Run {
  id: string
  organizationId: string // Organization hosting this run
  date: Date
  time: string // Format: "HH:MM" (24-hour)
  locationId: string // Reference to Location document
  description: string
  createdBy: string // User ID of the admin who created the run
  runAdminIds?: string[] // User IDs of admins for this run (org admins are implicit admins)
  createdAt: Date
  updatedAt?: Date
  status: RunStatus
  maxAthletes?: number
  maxGuides?: number
  notes?: string // Additional information for the run
  pairings?: {
    [athleteId: string]: {
      guides: string[]    // Guide user IDs paired with this athlete
      athletes: string[]  // Athlete user IDs paired with this athlete (for multi-athlete single-guide scenarios)
    }
  }
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
  status: SignUpStatus // RSVP response: 'yes', 'maybe', or 'no'
  activity: SignUpActivity // Activity type: 'run', 'run/walk', 'roll', or 'walk'
  pace?: {
    // Pace in minutes:seconds per mile (only for 'run' or 'roll' activities)
    minutes: number // 6-20
    seconds: number // 0, 15, 30, or 45
  }
  notes?: string // User can add notes when signing up
}

/**
 * Extended interfaces that include related data
 * These are used in the UI to display information with related records
 */

/**
 * Run with sign-up counts and user signup status
 */
export interface RunWithDetails extends Run {
  athleteSignUps: number
  guideSignUps: number
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
  organizationId: string
  date: string // ISO date string
  time: string
  locationId: string
  description: string
  maxAthletes?: number
  maxGuides?: number
  notes?: string
}

export interface CreateLocationForm {
  organizationId: string
  name: string
  address?: string
  city?: string
  state?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  notes?: string
}
