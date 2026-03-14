import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDataRepository } from '@/composables/useRepositories'
import type { Run, LoadingState } from '@/types'

/**
 * Runs store using Pinia
 * Centralizes run list loading via the data repository.
 */
export const useRunsStore = defineStore('runs', () => {
  const dataRepository = useDataRepository()

  const runs = ref<Run[]>([])
  const currentRun = ref<Run | null>(null)
  const loading = ref<LoadingState>('idle')
  const error = ref<string | null>(null)

  async function loadUpcomingRuns(): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      runs.value = await dataRepository.getUpcomingRuns()
      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load runs'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Load a single run by ID
   * Sets currentRun state with the loaded run
   * @param id - Run ID to load
   */
  async function loadRun(id: string): Promise<void> {
    try {
      loading.value = 'loading'
      error.value = null

      // Fetch run from Firestore via repository
      const run = await dataRepository.getRun(id)

      if (!run) {
        throw new Error(`Run with id ${id} not found`)
      }

      // Deep-clone the run before storing it so that mutations to nested
      // objects (like pairings) in views do not bleed back into store state
      // through Vue's shared reactive proxy backing.
      // structuredClone is used instead of JSON.parse/stringify to correctly
      // preserve Date objects on the run (date, createdAt, updatedAt).
      currentRun.value = structuredClone(run)

      // Update the run in the runs array if it exists
      const index = runs.value.findIndex((r) => r.id === id)
      if (index !== -1) {
        runs.value[index] = run
      } else {
        // Add to array if not already present
        runs.value.push(run)
      }

      loading.value = 'success'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load run'
      loading.value = 'error'
      throw err
    }
  }

  /**
   * Get run by ID from the loaded runs
   * @param id - Run ID to find
   * @returns Run or undefined if not found
   */
  function getRunById(id: string): Run | undefined {
    return runs.value.find((run) => run.id === id)
  }

  /**
   * Set the current run
   * Used when navigating to run-specific views
   * @param run - Run to set as current
   */
  function setCurrentRun(run: Run | null): void {
    currentRun.value = run
  }

  /**
   * Check if a user is an admin for a specific run.
   * Fetches the run from the repository to ensure up-to-date data,
   * then checks if the user's ID is in the run's runAdminIds array.
   * Note: Organization admins are implicit run admins per DESIGN.md,
   * but that check is handled separately by the organization store.
   * @param runId - Run ID to check
   * @param userId - User ID to check
   * @returns True if user is listed in the run's runAdminIds
   */
  async function isUserRunAdmin(runId: string, userId: string): Promise<boolean> {
    // Prefer runs already loaded in the store before hitting the repository
    let run: Run | null | undefined = null

    // Check currentRun first if it matches the requested runId
    if (currentRun.value?.id === runId) {
      run = currentRun.value
    } else {
      // Fall back to searching in the loaded runs
      run = getRunById(runId) ?? null
    }

    // If not found locally, fetch from the repository
    if (!run) {
      run = await dataRepository.getRun(runId)
    }

    if (!run) {
      return false
    }

    // Check if the user is in the run's runAdminIds array
    return run.runAdminIds?.includes(userId) ?? false
  }

  // --- Edit run draft state ---
  // Draft values track unsaved changes when editing a run.
  // Each field mirrors a user-editable property on the Run model.
  const draftRunDate = ref('')
  const draftRunTime = ref('')
  const draftRunLocationId = ref('')
  const draftRunDescription = ref('')
  const draftRunMaxAthletes = ref<number | undefined>(undefined)
  const draftRunMaxGuides = ref<number | undefined>(undefined)
  const draftRunNotes = ref<string | undefined>(undefined)

  // Tracks whether any draft field differs from the persisted values
  const isEditRunDirty = ref(false)

  // Saving state for the edit run form
  const isEditRunSaving = ref(false)
  const editRunSaveError = ref<string | null>(null)
  const editRunSaveSuccess = ref(false)

  /**
   * Initialize the edit run draft from a run's current values.
   * Call this when navigating to the edit run page.
   * Converts the run's Date to an ISO date string for the date input.
   * @param runId - The ID of the run to initialize the draft from
   */
  function initializeEditRunDraft(runId: string): void {
    const run = getRunById(runId) ?? currentRun.value
    if (!run) return

    // Convert the run date to a YYYY-MM-DD string for the date input
    const runDate = new Date(run.date)
    const year = runDate.getFullYear()
    const month = String(runDate.getMonth() + 1).padStart(2, '0')
    const day = String(runDate.getDate()).padStart(2, '0')
    draftRunDate.value = `${year}-${month}-${day}`

    draftRunTime.value = run.time
    draftRunLocationId.value = run.locationId
    draftRunDescription.value = run.description
    draftRunMaxAthletes.value = run.maxAthletes
    draftRunMaxGuides.value = run.maxGuides
    draftRunNotes.value = run.notes

    // Reset dirty and status flags
    isEditRunDirty.value = false
    editRunSaveError.value = null
    editRunSaveSuccess.value = false
  }

  /**
   * Save edit run draft changes to the database.
   * Updates only the fields that the user can edit, then refreshes
   * the local store state to reflect the saved values.
   * @param runId - The ID of the run to update
   */
  async function saveEditRunChanges(runId: string): Promise<void> {
    try {
      isEditRunSaving.value = true
      editRunSaveError.value = null
      editRunSaveSuccess.value = false

      // Build the partial update object with only the editable fields.
      // Parse date parts manually to avoid UTC interpretation —
      // new Date('YYYY-MM-DD') is treated as UTC midnight, which shifts
      // the day back in US timezones when displayed with toLocaleDateString.
      const dateParts = draftRunDate.value.split('-').map(Number)
      const year = dateParts[0]!
      const month = dateParts[1]!
      const day = dateParts[2]!
      // month - 1 because JS Date months are zero-indexed (0 = Jan, 1 = Feb, etc.)
      // Allow null values for optional fields — the repository layer interprets
      // null as "remove this field from the document" (Firestore deleteField()).
      type ClearableFields = 'maxAthletes' | 'maxGuides' | 'notes'
      const updates: Omit<Partial<Omit<Run, 'id'>>, ClearableFields> & {
        maxAthletes?: number | null
        maxGuides?: number | null
        notes?: string | null
      } = {
        date: new Date(year, month - 1, day),
        time: draftRunTime.value,
        locationId: draftRunLocationId.value,
        description: draftRunDescription.value.trim(),
      }

      // Include optional fields: pass the value when set, or null to clear
      // a previously stored value from the database.
      updates.maxAthletes = draftRunMaxAthletes.value ?? null
      updates.maxGuides = draftRunMaxGuides.value ?? null

      // Normalize empty or whitespace-only notes to null so the field
      // is removed rather than stored as an empty string.
      const trimmedNotes = draftRunNotes.value?.trim()
      updates.notes = trimmedNotes || null

      // Persist to the database
      await dataRepository.updateRun(runId, updates as Partial<Omit<Run, 'id'>>)

      // Reload the run so local state reflects the saved values
      await loadRun(runId)

      isEditRunDirty.value = false
      editRunSaveSuccess.value = true
    } catch (err) {
      editRunSaveError.value =
        err instanceof Error ? err.message : 'Failed to save run changes'
      throw err
    } finally {
      isEditRunSaving.value = false
    }
  }

  /**
   * Save pairings for a run to the database.
   * Updates the run document with the new pairings object,
   * then refreshes local store state to reflect the saved values.
   * @param runId - The ID of the run to update
   * @param newPairings - The pairings object mapping athlete IDs to their paired guides and athletes
   */
  async function savePairings(
    runId: string,
    newPairings: Record<string, { guides: string[]; athletes: string[] }>,
  ): Promise<void> {
    await dataRepository.updateRun(runId, { pairings: newPairings })

    // Reload the run so local state reflects the saved values
    await loadRun(runId)
  }

  function clearError(): void {
    error.value = null
  }

  return {
    runs,
    currentRun,
    loading,
    error,
    loadUpcomingRuns,
    loadRun,
    getRunById,
    setCurrentRun,
    isUserRunAdmin,
    clearError,
    // Edit run draft state
    draftRunDate,
    draftRunTime,
    draftRunLocationId,
    draftRunDescription,
    draftRunMaxAthletes,
    draftRunMaxGuides,
    draftRunNotes,
    isEditRunDirty,
    isEditRunSaving,
    editRunSaveError,
    editRunSaveSuccess,
    initializeEditRunDraft,
    saveEditRunChanges,
    savePairings,
  }
})
