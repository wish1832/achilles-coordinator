import type { Ref } from 'vue'
import { useUsersStore } from '@/stores/users'
import { useSignUpsStore } from '@/stores/signups'
import type { User, SignUp } from '@/types'

type PaceCompatibilitySeverity = 'none' | 'slight' | 'significant'

/**
 * Composable for managing pairing logic and pace compatibility
 * Handles athlete-guide and athlete-athlete pairings with validation
 * Also manages pace compatibility scoring for guide selection
 */
export function usePairingLogic(
  runId: Ref<string>,
  pairings: Ref<Record<string, { guides: string[]; athletes: string[] }>>,
  originalPairings: Ref<Record<string, { guides: string[]; athletes: string[] }>>,
  selectedAthleteId: Ref<string | null>,
  selectedGuideId: Ref<string | null>,
  announceToScreenReader: (message: string) => void,
) {
  const usersStore = useUsersStore()
  const signupsStore = useSignUpsStore()

  // ==========================================
  // Pace Utility Functions
  // ==========================================

  /**
   * Get the signup record for a user in the current run
   */
  function getSignupForUser(userId: string): SignUp | undefined {
    const signups = signupsStore.getSignUpsForRun(runId.value)
    return signups.find((signup) => signup.userId === userId)
  }

  /**
   * Get the pace from a user's signup for the current run
   */
  function getSignupPace(userId: string): { minutes: number; seconds: number } | undefined {
    const signup = getSignupForUser(userId)
    return signup?.pace
  }

  /**
   * Convert a pace object to a decimal number for comparison
   * For example, { minutes: 9, seconds: 30 } becomes 9.5
   */
  function paceToDecimal(pace: { minutes: number; seconds: number } | undefined): number | undefined {
    if (!pace) return undefined
    return pace.minutes + pace.seconds / 60
  }

  /**
   * Format a pace object as a string in "M:SS" format
   */
  function formatPace(pace: { minutes: number; seconds: number } | undefined): string | undefined {
    if (!pace) return undefined
    const formattedSeconds = pace.seconds.toString().padStart(2, '0')
    return `${pace.minutes}:${formattedSeconds}`
  }

  /**
   * Get the formatted pace string for a user based on their signup for the current run
   */
  function getFormattedPaceForUser(userId: string): string | undefined {
    const pace = getSignupPace(userId)
    return formatPace(pace)
  }

  // ==========================================
  // Pace Compatibility Functions
  // ==========================================

  /**
   * Determine the severity of pace incompatibility between an athlete and a guide
   * Uses signup pace data with different thresholds based on athlete pace
   *
   * For paces ≤ 10 min/mile:
   * - 'slight' if guide is 0.5 to under 1 minute slower
   * - 'significant' if guide is 1 minute or more slower
   *
   * For paces > 10 min/mile:
   * - 'slight' if guide is 1 to under 2 minutes slower
   * - 'significant' if guide is 2 minutes or more slower
   */
  function getPaceCompatibilitySeverity(
    athletePace: { minutes: number; seconds: number } | undefined,
    guidePace: { minutes: number; seconds: number } | undefined,
  ): PaceCompatibilitySeverity {
    if (athletePace === undefined || guidePace === undefined) {
      return 'none'
    }

    const athletePaceNum = paceToDecimal(athletePace)
    const guidePaceNum = paceToDecimal(guidePace)

    if (athletePaceNum === undefined || guidePaceNum === undefined) {
      return 'none'
    }

    const paceDifference = guidePaceNum - athletePaceNum

    if (paceDifference <= 0) {
      return 'none'
    }

    if (athletePaceNum <= 10) {
      if (paceDifference >= 1) {
        return 'significant'
      } else if (paceDifference >= 0.5) {
        return 'slight'
      }
    } else {
      if (paceDifference >= 2) {
        return 'significant'
      } else if (paceDifference >= 1) {
        return 'slight'
      }
    }

    return 'none'
  }

  /**
   * Map pace compatibility severity to a background color for visual highlighting
   */
  function getPaceCompatibilityColor(severity: PaceCompatibilitySeverity): string | null {
    switch (severity) {
      case 'significant':
        return '#FFCDBE' // Red highlight
      case 'slight':
        return '#FDFFDC' // Yellow highlight
      default:
        return null
    }
  }

  /**
   * Map pace compatibility severity to a screen reader label
   */
  function getPaceCompatibilityScreenReaderLabel(severity: PaceCompatibilitySeverity): string {
    switch (severity) {
      case 'significant':
        return ', pace mismatch'
      case 'slight':
        return ', slight pace mismatch'
      default:
        return ''
    }
  }

  /**
   * Get the pace compatibility severity for a guide relative to the currently selected athlete
   */
  function getGuideCompatibilitySeverity(guideId: string): PaceCompatibilitySeverity {
    if (!selectedAthleteId.value) {
      return 'none'
    }

    const athletePace = getSignupPace(selectedAthleteId.value)
    const guidePace = getSignupPace(guideId)

    return getPaceCompatibilitySeverity(athletePace, guidePace)
  }

  /**
   * Get inline style object for a guide card based on pace compatibility
   */
  function getGuideCardStyle(guideId: string): Record<string, string> {
    const severity = getGuideCompatibilitySeverity(guideId)
    const backgroundColor = getPaceCompatibilityColor(severity)

    if (backgroundColor) {
      return { backgroundColor }
    }

    return {}
  }

  /**
   * Get the screen reader label for a guide's pace compatibility
   */
  function getGuideCompatibilityLabel(guideId: string): string {
    const severity = getGuideCompatibilitySeverity(guideId)
    return getPaceCompatibilityScreenReaderLabel(severity)
  }

  // ==========================================
  // Pairing Actions
  // ==========================================

  /**
   * Get all users (guides and athletes) paired with a specific athlete
   */
  function getPairedUsers(athleteId: string): User[] {
    const pairing = pairings.value[athleteId]
    if (!pairing) return []

    const allUserIds = [...pairing.guides, ...pairing.athletes]
    return allUserIds
      .map((userId) => usersStore.getUserById(userId))
      .filter((user) => user !== undefined) as User[]
  }

  /**
   * Check if a guide is currently paired with any athlete
   */
  function isGuidePaired(guideId: string): boolean {
    return Object.values(pairings.value).some((pairing) => pairing.guides.includes(guideId))
  }

  /**
   * Validate if two users can be paired together
   */
  function canPairUsers(athleteId: string, userId: string): { allowed: boolean; reason?: string } {
    if (athleteId === userId) {
      return { allowed: false, reason: 'Cannot pair athlete with themselves' }
    }

    const user = usersStore.getUserById(userId)
    if (!user) {
      return { allowed: false, reason: 'User not found' }
    }

    const athletePairing = pairings.value[athleteId]
    if (athletePairing) {
      if (athletePairing.guides.includes(userId) || athletePairing.athletes.includes(userId)) {
        return { allowed: false, reason: 'This pairing already exists' }
      }
    }

    if (user.role === 'guide') {
      return { allowed: true }
    }

    const userPairing = pairings.value[userId]
    if (userPairing && (userPairing.guides.length > 0 || userPairing.athletes.length > 0)) {
      return { allowed: false, reason: 'This athlete already has their own pairings' }
    }

    for (const [otherId, pairing] of Object.entries(pairings.value)) {
      if (otherId !== athleteId) {
        if (pairing.athletes.includes(userId) || pairing.guides.includes(userId)) {
          return { allowed: false, reason: 'This athlete is already paired with another athlete' }
        }
      }
    }

    return { allowed: true }
  }

  /**
   * Select an athlete
   * If the same athlete is already selected, deselects them
   * If a guide is already selected, creates the pairing immediately
   * If another athlete is already selected, creates an athlete-athlete pairing
   */
  function selectAthlete(athleteId: string): void {
    if (selectedAthleteId.value === athleteId) {
      selectedAthleteId.value = null
      const athleteName = usersStore.getUserById(athleteId)?.displayName
      announceToScreenReader(`Deselected athlete: ${athleteName}`)
      return
    }

    if (selectedGuideId.value) {
      createPairing(athleteId, selectedGuideId.value)
      return
    }

    if (selectedAthleteId.value && selectedAthleteId.value !== athleteId) {
      createPairing(athleteId, selectedAthleteId.value)
      return
    }

    selectedAthleteId.value = athleteId
    const athleteName = usersStore.getUserById(athleteId)?.displayName
    announceToScreenReader(
      `Selected athlete: ${athleteName}. Now select a guide or another athlete to create pairing.`,
    )
  }

  /**
   * Select a guide
   * If the same guide is already selected, deselects them
   * If an athlete is already selected, creates the pairing immediately
   */
  function selectGuide(guideId: string): void {
    if (selectedGuideId.value === guideId) {
      selectedGuideId.value = null
      const guideName = usersStore.getUserById(guideId)?.displayName
      announceToScreenReader(`Deselected guide: ${guideName}`)
      return
    }

    if (selectedAthleteId.value) {
      createPairing(selectedAthleteId.value, guideId)
      return
    }

    selectedGuideId.value = guideId
    const guideName = usersStore.getUserById(guideId)?.displayName
    announceToScreenReader(`Selected guide: ${guideName}. Now select an athlete to create pairing.`)
  }

  /**
   * Create a pairing between an athlete and another user (guide or athlete)
   */
  function createPairing(athleteId: string, userId: string): void {
    const validation = canPairUsers(athleteId, userId)
    if (!validation.allowed) {
      announceToScreenReader(validation.reason || 'Cannot create pairing')
      selectedAthleteId.value = null
      selectedGuideId.value = null
      return
    }

    if (!pairings.value[athleteId]) {
      pairings.value[athleteId] = { guides: [], athletes: [] }
    }

    const user = usersStore.getUserById(userId)
    if (!user) {
      announceToScreenReader('User not found')
      selectedAthleteId.value = null
      selectedGuideId.value = null
      return
    }

    if (user.role === 'athlete' && userId in pairings.value) {
      delete pairings.value[userId]
    }

    if (user.role === 'guide') {
      pairings.value[athleteId].guides.push(userId)
    } else {
      pairings.value[athleteId].athletes.push(userId)
    }

    const athleteName = usersStore.getUserById(athleteId)?.displayName
    const userName = user.displayName
    const userRoleLabel = user.role === 'guide' ? 'guide' : 'athlete'
    announceToScreenReader(`Paired athlete ${athleteName} with ${userRoleLabel} ${userName}`)

    selectedAthleteId.value = null
    selectedGuideId.value = null
  }

  /**
   * Remove a specific user (guide or athlete) from an athlete's pairings
   */
  function unpairUserFromAthlete(athleteId: string, userId: string): void {
    const pairing = pairings.value[athleteId]
    if (!pairing) return

    const user = usersStore.getUserById(userId)
    if (!user) return

    if (user.role === 'guide') {
      const index = pairing.guides.indexOf(userId)
      if (index > -1) {
        pairing.guides.splice(index, 1)
      }
    } else {
      const index = pairing.athletes.indexOf(userId)
      if (index > -1) {
        pairing.athletes.splice(index, 1)
      }

      pairings.value[userId] = { guides: [], athletes: [] }
    }

    if (pairing.guides.length === 0 && pairing.athletes.length === 0) {
      delete pairings.value[athleteId]
    }

    const athleteName = usersStore.getUserById(athleteId)?.displayName
    const userName = user.displayName
    const userRoleLabel = user.role === 'guide' ? 'guide' : 'athlete'
    announceToScreenReader(`Unpaired athlete ${athleteName} from ${userRoleLabel} ${userName}`)
  }

  /**
   * Clear the current athlete and guide selection
   */
  function clearSelection(): void {
    selectedAthleteId.value = null
    selectedGuideId.value = null
    announceToScreenReader('Selection cleared')
  }

  return {
    // Pairing actions
    selectAthlete,
    selectGuide,
    createPairing,
    unpairUserFromAthlete,
    clearSelection,
    getPairedUsers,
    isGuidePaired,
    canPairUsers,
    // Pace compatibility
    getPaceCompatibilitySeverity,
    getPaceCompatibilityColor,
    getPaceCompatibilityScreenReaderLabel,
    getGuideCompatibilitySeverity,
    getGuideCardStyle,
    getGuideCompatibilityLabel,
    // Pace utilities
    getSignupPace,
    getFormattedPaceForUser,
    paceToDecimal,
    formatPace,
  }
}
