import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'

export interface UseDraftStateOptions<T> {
  /**
   * Initial/source data to initialize the draft from.
   * Pass a ref or computed for reactive updates.
   */
  data: Ref<T | undefined> | ComputedRef<T | undefined> | T | undefined
  /**
   * Function to persist draft changes to the server.
   * Called by saveChanges().
   */
  onSave: (draft: T) => Promise<void>
}

/**
 * Generalized composable for managing draft state with automatic initialization,
 * dirty tracking, and persistence.
 *
 * Useful for forms, settings pages, and other views that need to:
 * - Load data from a source (prop, query hook, etc)
 * - Allow edits without immediately persisting
 * - Track whether there are unsaved changes
 * - Save changes with error/success feedback
 *
 * @example
 * const { draft, isDirty, isSaving, error, success, saveChanges } = useDraftState({
 *   data: organization,
 *   onSave: (draft) => organizationRepository.updateOrganization(id, draft),
 * })
 */
export function useDraftState<T extends Record<string, any>>(
  options: UseDraftStateOptions<T>,
) {
  const draft = ref<T | undefined>()
  const isDirty = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)
  const success = ref(false)

  // Compute the data source (unwrap if it's a ref/computed)
  const sourceData = computed(() => {
    const data = options.data
    if (data && typeof data === 'object' && 'value' in data) {
      return data.value
    }
    return data as T | undefined
  })

  // Initialize draft from source data
  function initializeDraft(source: T | undefined) {
    if (source) {
      // Deep clone to avoid mutating source
      draft.value = JSON.parse(JSON.stringify(source))
      isDirty.value = false
      error.value = null
      success.value = false
    }
  }

  // Update a field in the draft
  function updateField<K extends keyof T>(key: K, value: T[K]): void {
    if (draft.value) {
      draft.value[key] = value
      isDirty.value = true
      success.value = false
    }
  }

  // Reset draft to source data
  function reset(): void {
    initializeDraft(sourceData.value)
  }

  // Save draft changes
  async function saveChanges(): Promise<void> {
    if (!draft.value) return

    error.value = null
    success.value = false
    isSaving.value = true

    try {
      await options.onSave(draft.value)
      isDirty.value = false
      success.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save changes'
    } finally {
      isSaving.value = false
    }
  }

  // Watch source data and reinitialize draft when it changes
  watch(sourceData, (newSource) => {
    if (newSource && !isDirty.value) {
      initializeDraft(newSource)
    }
  })

  // Initialize on setup
  initializeDraft(sourceData.value)

  return {
    draft,
    isDirty,
    isSaving,
    error,
    success,
    initializeDraft,
    updateField,
    reset,
    saveChanges,
  }
}
