import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/firebase/auth'
import { firestoreService } from '@/firebase/firestore'
import type { User, UserRole, LoadingState } from '@/types'

/**
 * Authentication store using Pinia
 * Manages user authentication state and provides methods for login/logout
 * Integrates with Firebase Auth and Firestore for user data
 */
export const useAuthStore = defineStore('auth', () => {
  // State
  const currentUser = ref<User | null>(null)
  const loading = ref<LoadingState>('idle')
  const error = ref<string | null>(null)

  // Getters (computed properties)
  const isAuthenticated = computed(() => !!currentUser.value)
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const isAthlete = computed(() => currentUser.value?.role === 'athlete')
  const isGuide = computed(() => currentUser.value?.role === 'guide')
  const userDisplayName = computed(() => currentUser.value?.displayName || '')
  const userRole = computed(() => currentUser.value?.role || null)

  /**
   * Sign in with email and password
   * @param email - User's email address
   * @param password - User's password
   */
  async function signIn(email: string, password: string): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      // Authenticate with Firebase
      const firebaseUser = await authService.signIn(email, password)

      // Get user data from Firestore
      const userData = await firestoreService.getUser(firebaseUser.uid)

      if (!userData) {
        throw new Error('User data not found. Please contact an administrator.')
      }

      currentUser.value = userData
      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Sign in failed'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Sign out the current user
   */
  async function signOut(): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      await authService.signOut()
      currentUser.value = null
      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Sign out failed'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Create a new user account (admin only)
   * @param email - User's email address
   * @param password - User's password
   * @param displayName - User's display name
   * @param role - User's role
   * @param profileDetails - Additional profile information
   */
  async function createUser(
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
    profileDetails: Partial<User['profileDetails']> = {},
  ): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      // Check if current user is admin
      if (!isAdmin.value) {
        throw new Error('Only administrators can create new users')
      }

      // Create Firebase user
      const firebaseUser = await authService.createUser(email, password, displayName, role)

      // Create user document in Firestore
      const userData: Omit<User, 'id'> = {
        email,
        displayName,
        role,
        createdAt: new Date(),
        profileDetails: {
          ...profileDetails,
        },
      }

      await firestoreService.createUser(userData)
      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'User creation failed'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Update current user's profile
   * @param updates - Partial user data to update
   */
  async function updateProfile(updates: Partial<Omit<User, 'id'>>): Promise<void> {
    try {
      if (!currentUser.value) {
        throw new Error('No user logged in')
      }

      loading.value = 'loading'
      error.value = null

      await firestoreService.updateUser(currentUser.value.id, updates)

      // Update local state
      currentUser.value = { ...currentUser.value, ...updates }
      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Profile update failed'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Initialize authentication state
   * Sets up the auth state listener to automatically update when auth state changes
   */
  function initializeAuth(): void {
    authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userData = await firestoreService.getUser(firebaseUser.uid)
          currentUser.value = userData
        } catch (err) {
          console.error('Error loading user data:', err)
          currentUser.value = null
        }
      } else {
        currentUser.value = null
      }
    })
  }

  /**
   * Clear any error messages
   */
  function clearError(): void {
    error.value = null
  }

  /**
   * Check if user has permission to access a route
   * @param requiredRoles - Array of roles that can access the route
   * @returns True if user has permission
   */
  function hasPermission(requiredRoles: UserRole[]): boolean {
    if (!currentUser.value) return false
    return requiredRoles.includes(currentUser.value.role)
  }

  return {
    // State
    currentUser,
    loading,
    error,

    // Getters
    isAuthenticated,
    isAdmin,
    isAthlete,
    isGuide,
    userDisplayName,
    userRole,

    // Actions
    signIn,
    signOut,
    createUser,
    updateProfile,
    initializeAuth,
    clearError,
    hasPermission,
  }
})
