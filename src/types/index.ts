/**
 * Re-export all types from models for easier importing
 * This allows other files to import types with: import { User, Run } from '@/types'
 */

export * from './models'

/**
 * Common utility types used throughout the application
 */

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
}

// Pagination parameters
export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Filter parameters for searching/filtering data
export interface FilterParams {
  search?: string
  role?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

// Theme and accessibility settings
export interface AccessibilitySettings {
  highContrast: boolean
  textSize: 'small' | 'medium' | 'large' | 'extra-large'
  reducedMotion: boolean
  focusVisible: boolean
}

// Navigation menu item structure
export interface MenuItem {
  id: string
  label: string
  icon?: string
  route?: string
  children?: MenuItem[]
  roles?: string[] // Which user roles can see this menu item
  requiresAuth?: boolean
}

// Form validation error
export interface ValidationError {
  field: string
  message: string
}

// Loading states for async operations
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

// Generic state interface for stores
export interface StoreState<T> {
  data: T[]
  loading: LoadingState
  error: string | null
  lastUpdated: Date | null
}
