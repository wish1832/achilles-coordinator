import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthRepository, useDataRepository, useUserRepository } from '@/composables/useRepositories'
import { useInvitationService } from '@/composables/useInvitationService'
import type { OrganizationInvite, User, UserRole, LoadingState } from '@/types'

/**
 * Authentication store using Pinia
 * Manages user authentication state and provides methods for login/logout
 * Integrates with Firebase Auth and Firestore for user data via repository pattern
 */
export const useAuthStore = defineStore('auth', () => {
  // Get repository instances via dependency injection
  // This allows for easy testing with mock implementations
  const authRepository = useAuthRepository()
  const dataRepository = useDataRepository()
  const userRepository = useUserRepository()
  const invitationService = useInvitationService()

  // State
  const currentUser = ref<User | null>(null)
  const loading = ref<LoadingState>('idle')
  const error = ref<string | null>(null)
  const isInitialized = ref<boolean>(false)

  // Profile editing state
  // Draft pace values for editing (separate from saved values)
  // Values are undefined when user has no pace set, allowing dropdowns to show empty state
  const draftPaceMinutes = ref<number | undefined>(undefined)
  const draftPaceSeconds = ref<number | undefined>(undefined)
  // Draft activities for editing (stores user's activity preferences)
  const draftActivities = ref<('walk' | 'run' | 'run/walk' | 'roll')[]>([])
  // Tracks whether profile has unsaved changes
  const isProfileDirty = ref(false)
  // Saving state for profile updates
  const isProfileSaving = ref(false)
  const profileSaveError = ref<string | null>(null)
  const profileSaveSuccess = ref(false)

  // Getters (computed properties)
  const isAuthenticated = computed(() => !!currentUser.value)
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

      // Authenticate with Firebase via repository
      const firebaseUser = await authRepository.signIn(email, password)

      // Get user data from Firestore via repository
      let userData = await userRepository.getUser(firebaseUser.uid)

      if (!userData) {
        // If this is a first-time sign-in after an invite, try to accept the invite
        // and create the profile automatically.
        const pendingInvite = await findPendingInviteForEmail(email)
        if (pendingInvite) {
          await acceptOrganizationInvite(pendingInvite.id)
          userData = await userRepository.getUser(firebaseUser.uid)
        }
      }

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

      await authRepository.signOut()
      currentUser.value = null
      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Sign out failed'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Create a new user account
   * Creates the Firebase Auth user and the Firestore profile document.
   * Permission should be enforced by the caller and Firestore rules.
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

      if (!currentUser.value) {
        throw new Error('No user logged in')
      }

      // Create Firebase user via repository and keep the uid for the profile document.
      const firebaseUser = await authRepository.createUser(email, password, displayName)

      // Create user document in Firestore via repository
      const userData: Omit<User, 'id'> = {
        email,
        displayName,
        role,
        organizationIds: [], // New users start with no organizations
        createdAt: new Date(),
        profileDetails: {
          ...profileDetails,
        },
      }

      await userRepository.createUser(firebaseUser.uid, userData)
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

      await userRepository.updateUser(currentUser.value.id, updates)

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
    authRepository.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore via repository
          const userData = await userRepository.getUser(firebaseUser.uid)
          currentUser.value = userData
        } catch (err) {
          console.error('Error loading user data:', err)
          currentUser.value = null
        }
      } else {
        currentUser.value = null
      }

      // Mark auth as initialized after first callback
      // This allows the router to wait for initial auth state
      if (!isInitialized.value) {
        isInitialized.value = true
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
   * Invite a user to join an organization by email.
   * Invitations are stored separately so membership can be granted on acceptance.
   * @param organizationId - Organization ID to invite into
   * @param email - Email address to invite
   * @param role - User role for the invite
   * @param displayName - Optional display name for pre-fill
   * @returns New invitation document ID
   */
  async function inviteUserToOrganization(
    organizationId: string,
    email: string,
    role: UserRole,
    displayName?: string,
  ): Promise<string> {
    try {
      loading.value = 'loading'
      error.value = null

      if (!currentUser.value) {
        throw new Error('No user logged in')
      }

      // Check for an existing profile so we can associate the invite.
      const existingUser = await userRepository.getUserByEmail(email)

      const inviteData: Omit<OrganizationInvite, 'id'> = {
        organizationId,
        email,
        role,
        invitedByUserId: currentUser.value.id,
        status: 'pending',
        createdAt: new Date(),
        userId: existingUser?.id,
        displayName,
      }

      const inviteId = await dataRepository.addDocument<OrganizationInvite>(
        'organizationInvites',
        inviteData,
      )

      await invitationService.sendOrganizationInvite({
        id: inviteId,
        ...inviteData,
      })

      loading.value = 'success'
      return inviteId
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Invite failed'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Find a pending organization invite by email address.
   * This supports first-time sign-ins where the profile is created on acceptance.
   * @param email - Email address to search for
   */
  async function findPendingInviteForEmail(
    email: string,
  ): Promise<OrganizationInvite | null> {
    const invites = await dataRepository.getDocuments<OrganizationInvite>('organizationInvites')
    const normalizedEmail = email.trim().toLowerCase()

    return (
      invites.find(
        (invite) =>
          invite.status === 'pending' &&
          invite.email.trim().toLowerCase() === normalizedEmail,
      ) ?? null
    )
  }

  /**
   * Accept an organization invite for the current authenticated user.
   * Ensures the user is added to the organization and the invite is marked accepted.
   * @param inviteId - Invitation document ID
   */
  async function acceptOrganizationInvite(inviteId: string): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      const authUser = authRepository.getCurrentUser()
      const effectiveUserId = currentUser.value?.id ?? authUser?.uid
      const effectiveEmail = currentUser.value?.email ?? authUser?.email ?? ''

      if (!effectiveUserId || !effectiveEmail) {
        throw new Error('No user logged in')
      }

      const invite = await dataRepository.getDocument<OrganizationInvite>(
        'organizationInvites',
        inviteId,
      )

      if (!invite) {
        throw new Error('Invite not found')
      }

      if (invite.status !== 'pending') {
        throw new Error('Invite is no longer active')
      }

      if (invite.email.toLowerCase() !== effectiveEmail.toLowerCase()) {
        throw new Error('Invite email does not match the current user')
      }

      if (invite.userId && invite.userId !== effectiveUserId) {
        throw new Error('Invite is already associated with a different user')
      }

      let profile = await userRepository.getUser(effectiveUserId)

      if (profile && profile.role !== invite.role) {
        throw new Error('Invite role does not match the current user profile')
      }

      const updatedOrganizationIds = profile
        ? Array.from(new Set([...profile.organizationIds, invite.organizationId]))
        : [invite.organizationId]

      if (!profile) {
        const displayName =
          authUser?.displayName ?? invite.displayName ?? currentUser.value?.displayName ?? ''

        const userData: Omit<User, 'id'> = {
          email: effectiveEmail,
          displayName,
          role: invite.role,
          organizationIds: updatedOrganizationIds,
          createdAt: new Date(),
          profileDetails: {},
        }

        await userRepository.createUser(effectiveUserId, userData)
        profile = { id: effectiveUserId, ...userData }
      } else {
        await userRepository.updateUser(effectiveUserId, {
          organizationIds: updatedOrganizationIds,
        })
        profile = { ...profile, organizationIds: updatedOrganizationIds }
      }

      await dataRepository.addOrganizationMember(invite.organizationId, effectiveUserId)
      await dataRepository.updateDocument<OrganizationInvite>('organizationInvites', inviteId, {
        status: 'accepted',
        acceptedAt: new Date(),
        userId: effectiveUserId,
      })

      currentUser.value = profile
      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Invite acceptance failed'
      loading.value = 'error'
      throw err
    }
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

  // ============================================
  // Profile Editing Methods
  // ============================================

  /**
   * Initialize draft profile values from the current user's profile
   * Call this when entering the profile editing view
   */
  function initializeProfileDraft(): void {
    const profileDetails = currentUser.value?.profileDetails
    // Initialize pace values (undefined if user has no pace set)
    draftPaceMinutes.value = profileDetails?.pace?.minutes
    draftPaceSeconds.value = profileDetails?.pace?.seconds
    // Initialize activities (copy the array to avoid mutation issues)
    draftActivities.value = profileDetails?.activities ? [...profileDetails.activities] : []
    // Reset dirty and status flags
    isProfileDirty.value = false
    profileSaveError.value = null
    profileSaveSuccess.value = false
  }

  /**
   * Update the draft pace minutes value
   * Marks the profile as dirty (having unsaved changes)
   * @param minutes - The new minutes value (6-20)
   */
  function setDraftPaceMinutes(minutes: number): void {
    draftPaceMinutes.value = minutes
    isProfileDirty.value = true
    profileSaveSuccess.value = false
  }

  /**
   * Update the draft pace seconds value
   * Marks the profile as dirty (having unsaved changes)
   * @param seconds - The new seconds value (0, 15, 30, or 45)
   */
  function setDraftPaceSeconds(seconds: number): void {
    draftPaceSeconds.value = seconds
    isProfileDirty.value = true
    profileSaveSuccess.value = false
  }

  /**
   * Toggle an activity in the draft activities array
   * If the activity is already selected, it will be removed; otherwise it will be added
   * Marks the profile as dirty (having unsaved changes)
   * @param activity - The activity to toggle ('walk', 'run', 'run/walk', or 'roll')
   */
  function toggleDraftActivity(activity: 'walk' | 'run' | 'run/walk' | 'roll'): void {
    const index = draftActivities.value.indexOf(activity)
    if (index === -1) {
      // Activity not selected, add it
      draftActivities.value = [...draftActivities.value, activity]
    } else {
      // Activity already selected, remove it
      draftActivities.value = draftActivities.value.filter((a) => a !== activity)
    }
    isProfileDirty.value = true
    profileSaveSuccess.value = false
  }

  /**
   * Save the draft profile changes to the user's record
   * Creates a plain object to avoid reactive proxy serialization issues
   */
  async function saveProfileChanges(): Promise<void> {
    if (!currentUser.value) {
      profileSaveError.value = 'Unable to save profile changes. Please try again and contact us if the problem persists.'
      return
    }

    profileSaveError.value = null
    profileSaveSuccess.value = false
    isProfileSaving.value = true

    try {
      // Build a plain object for profileDetails to avoid reactive proxy issues
      // We explicitly copy each field to ensure no Vue proxies are passed to the repository
      const currentProfile = currentUser.value.profileDetails
      const updatedProfileDetails: User['profileDetails'] = {
        phone: currentProfile?.phone,
        emergencyContact: currentProfile?.emergencyContact,
        emergencyPhone: currentProfile?.emergencyPhone,
        disabilityType: currentProfile?.disabilityType,
        assistanceNeeded: currentProfile?.assistanceNeeded,
        // Set activities from draft state (copy to avoid reactive proxies)
        activities: draftActivities.value.length > 0 ? [...draftActivities.value] : undefined,
        certifications: currentProfile?.certifications ? [...currentProfile.certifications] : undefined,
        // Copy nested objects as new plain objects
        paceRange: currentProfile?.paceRange
          ? { min: currentProfile.paceRange.min, max: currentProfile.paceRange.max }
          : undefined,
        // Set the new pace value from draft state (only if both values are defined)
        pace:
          draftPaceMinutes.value !== undefined && draftPaceSeconds.value !== undefined
            ? { minutes: draftPaceMinutes.value, seconds: draftPaceSeconds.value }
            : undefined,
      }

      await userRepository.updateUser(currentUser.value.id, {
        profileDetails: updatedProfileDetails,
      })

      // Update local state with the new profile details
      currentUser.value = {
        ...currentUser.value,
        profileDetails: updatedProfileDetails,
      }

      isProfileDirty.value = false
      profileSaveSuccess.value = true
    } catch (err) {
      // Log error for debugging, show user-friendly message per STYLE.md
      console.error('Failed to save profile changes:', err)
      profileSaveError.value = 'Unable to save profile changes. Please try again and contact us if the problem persists.'
    } finally {
      isProfileSaving.value = false
    }
  }

  return {
    // State
    currentUser,
    loading,
    error,
    isInitialized,

    // Profile editing state
    draftPaceMinutes,
    draftPaceSeconds,
    draftActivities,
    isProfileDirty,
    isProfileSaving,
    profileSaveError,
    profileSaveSuccess,

    // Getters
    isAuthenticated,
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
    inviteUserToOrganization,
    acceptOrganizationInvite,

    // Profile editing actions
    initializeProfileDraft,
    setDraftPaceMinutes,
    setDraftPaceSeconds,
    toggleDraftActivity,
    saveProfileChanges,
  }
})
