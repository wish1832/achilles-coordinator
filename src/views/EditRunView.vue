<template>
  <div class="edit-run-view">
    <!-- Hidden page heading keeps a level-one heading available during loading and fallback states. -->
    <h1 class="sr-only">Edit Run</h1>

    <!-- Loading state for initial data -->
    <div v-if="pageLoading === 'loading'" id="main-content" class="edit-run-main" tabindex="-1">
      <LoadingUI type="spinner" text="Loading run..." centered />
    </div>

    <!-- Error state for initial data loading -->
    <div
      v-else-if="pageLoading === 'error'"
      id="main-content"
      class="edit-run-main edit-run-error"
      tabindex="-1"
    >
      <h1>Unable to load run</h1>
      <p>There was an error loading the run. Please try again.</p>
      <AchillesButton @click="retryLoad">Try Again</AchillesButton>
    </div>

    <!-- Main form content -->
    <template v-else-if="organization && run">
      <!-- Header with organization name -->
      <header class="edit-run-header">
        <div class="edit-run-header__content">
          <h1 class="edit-run-title">Edit Run</h1>
          <p class="edit-run-subtitle">{{ editRunTitle }}, {{ formattedRunDateTime }}</p>
          <p class="edit-run-subtitle">{{ organization.name }}</p>
        </div>
      </header>

      <!-- Main content area -->
      <main id="main-content" class="edit-run-main">
        <div class="edit-run-container">
          <CardUI class="edit-run-card" title="Run Details">
            <form @submit.prevent="handleSubmit" class="edit-run-form">
              <!-- Date field - required -->
              <div class="form-field">
                <label for="date" class="form-label">
                  Date
                  <span class="form-required" aria-label="required">*</span>
                </label>
                <input
                  id="date"
                  v-model="runsStore.draftRunDate"
                  type="date"
                  class="form-input"
                  :class="{ 'form-input--error': errors.date }"
                  :aria-invalid="!!errors.date"
                  :aria-describedby="errors.date ? 'date-error' : undefined"
                  required
                  @blur="validateField('date')"
                  @input="markDirty"
                />
                <div v-if="errors.date" id="date-error" class="form-error" role="alert">
                  {{ errors.date }}
                </div>
              </div>

              <!-- Time field - required -->
              <div class="form-field">
                <label for="time" class="form-label">
                  Time
                  <span class="form-required" aria-label="required">*</span>
                </label>
                <input
                  id="time"
                  v-model="runsStore.draftRunTime"
                  type="time"
                  class="form-input"
                  :class="{ 'form-input--error': errors.time }"
                  :aria-invalid="!!errors.time"
                  :aria-describedby="errors.time ? 'time-error' : undefined"
                  required
                  @blur="validateField('time')"
                  @input="markDirty"
                />
                <div v-if="errors.time" id="time-error" class="form-error" role="alert">
                  {{ errors.time }}
                </div>
              </div>

              <!-- Location dropdown - required, uses custom component for rich display -->
              <LocationDropdown
                v-model="runsStore.draftRunLocationId"
                :locations="locations"
                label="Location"
                placeholder="Select a location"
                required
                :error="!!errors.locationId"
                :error-message="errors.locationId"
                @blur="validateField('locationId')"
                @update:model-value="markDirty"
              />

              <!-- Description field - required -->
              <div class="form-field">
                <label for="description" class="form-label">
                  Description
                  <span class="form-required" aria-label="required">*</span>
                </label>
                <textarea
                  id="description"
                  v-model="runsStore.draftRunDescription"
                  class="form-input form-textarea"
                  :class="{ 'form-input--error': errors.description }"
                  :aria-invalid="!!errors.description"
                  :aria-describedby="errors.description ? 'description-error' : undefined"
                  rows="3"
                  required
                  @blur="validateField('description')"
                  @input="markDirty"
                />
                <div
                  v-if="errors.description"
                  id="description-error"
                  class="form-error"
                  role="alert"
                >
                  {{ errors.description }}
                </div>
              </div>

              <!-- Max Athletes - optional -->
              <div class="form-field">
                <label for="maxAthletes" class="form-label"> Maximum Athletes </label>
                <input
                  id="maxAthletes"
                  v-model.number="runsStore.draftRunMaxAthletes"
                  type="number"
                  min="0"
                  class="form-input"
                  :class="{ 'form-input--error': errors.maxAthletes }"
                  :aria-invalid="!!errors.maxAthletes"
                  :aria-describedby="
                    errors.maxAthletes ? 'maxAthletes-error' : 'maxAthletes-helper'
                  "
                  @blur="validateField('maxAthletes')"
                  @input="markDirty"
                />
                <div
                  v-if="errors.maxAthletes"
                  id="maxAthletes-error"
                  class="form-error"
                  role="alert"
                >
                  {{ errors.maxAthletes }}
                </div>
                <div v-else id="maxAthletes-helper" class="form-helper">
                  Leave blank for no limit
                </div>
              </div>

              <!-- Max Guides - optional -->
              <div class="form-field">
                <label for="maxGuides" class="form-label"> Maximum Guides </label>
                <input
                  id="maxGuides"
                  v-model.number="runsStore.draftRunMaxGuides"
                  type="number"
                  min="0"
                  class="form-input"
                  :class="{ 'form-input--error': errors.maxGuides }"
                  :aria-invalid="!!errors.maxGuides"
                  :aria-describedby="errors.maxGuides ? 'maxGuides-error' : 'maxGuides-helper'"
                  @blur="validateField('maxGuides')"
                  @input="markDirty"
                />
                <div v-if="errors.maxGuides" id="maxGuides-error" class="form-error" role="alert">
                  {{ errors.maxGuides }}
                </div>
                <div v-else id="maxGuides-helper" class="form-helper">Leave blank for no limit</div>
              </div>

              <!-- Notes - optional -->
              <div class="form-field">
                <label for="notes" class="form-label"> Additional Notes </label>
                <textarea
                  id="notes"
                  v-model="runsStore.draftRunNotes"
                  class="form-input form-textarea"
                  rows="2"
                  aria-describedby="notes-helper"
                  @input="markDirty"
                />
                <div id="notes-helper" class="form-helper">
                  Optional notes visible to participants
                </div>
              </div>

              <!-- Form actions: Cancel and Save Changes buttons -->
              <div class="form-actions">
                <AchillesButton type="button" variant="secondary" @click="handleCancel">
                  Cancel
                </AchillesButton>
                <AchillesButton
                  type="submit"
                  :variant="runsStore.isEditRunDirty ? 'primary' : 'secondary'"
                  :loading="isSaving"
                  :disabled="!runsStore.isEditRunDirty || !isFormValid || isSaving"
                >
                  {{ isSaving ? 'Saving...' : 'Save Changes' }}
                </AchillesButton>
              </div>

              <!-- Global error message for submission failures -->
              <div v-if="saveError" class="form-error form-error--global" role="alert">
                {{ saveError }}
              </div>
            </form>
          </CardUI>
        </div>
      </main>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CardUI from '@/components/ui/CardUI.vue'
import AchillesButton from '@/components/ui/AchillesButton.vue'
import LoadingUI from '@/components/ui/LoadingUI.vue'
import LocationDropdown from '@/components/ui/LocationDropdown.vue'
import { useRunsStore } from '@/stores/runs'
import { useUpdateRunMutation } from '@/composables/mutations/useUpdateRunMutation'
import { useRunQuery } from '@/composables/queries/useRunQuery'
import { useOrganizationQuery } from '@/composables/queries/useOrganizationQuery'
import { useLocationsForOrganizationQuery } from '@/composables/queries/useLocationsForOrganizationQuery'
import type { LoadingState, Location, Run } from '@/types'

// Router and route for navigation and params
const route = useRoute()
const router = useRouter()

// The runs store still owns the edit-form draft state (draftRun*, dirty
// flag, save-success flag, initializeEditRunDraft). Server-state reads are
// handled by TanStack queries below; this remaining store dependency is
// scoped to the draft and will be addressed in a future composable refactor.
const runsStore = useRunsStore()

// Mutation that persists run edits through TanStack Query.
// On success, it invalidates the run detail cache so RunView refetches.
const updateRunMutation = useUpdateRunMutation()

// Saving state is derived from the mutation so the Save button reflects
// the in-flight network request without any store involvement.
const isSaving = computed(() => updateRunMutation.isPending.value)
// Surface the mutation's error (if any) as a user-facing message.
const saveError = computed(() =>
  updateRunMutation.isError.value
    ? updateRunMutation.error.value?.message ?? 'Failed to save run changes'
    : null,
)

// Get organization ID and run ID from route params
const orgId = computed(() => route.params.orgId as string)
const runId = computed(() => route.params.id as string)

// === Server state via TanStack Query ===

// Run detail. Drives the form's initial values via the watch below.
const runQuery = useRunQuery(runId)
const run = computed<Run | undefined>(() => runQuery.data.value ?? undefined)

// Organization detail (for the page subtitle).
const organizationQuery = useOrganizationQuery(orgId)
const organization = computed(() => organizationQuery.data.value ?? undefined)

// Locations for this organization (powers the dropdown and the title's
// location-name lookup). Default to an empty array while loading so the
// LocationDropdown receives a stable shape.
const locationsQuery = useLocationsForOrganizationQuery(orgId)
const locations = computed<Location[]>(() => locationsQuery.data.value ?? [])

// Map for O(1) location-name lookups in the title computed. Recomputes only
// when the locations array reference changes.
const locationsById = computed<Map<string, Location>>(() => {
  const map = new Map<string, Location>()
  for (const location of locations.value) {
    map.set(location.id, location)
  }
  return map
})

// Initialize the runs-store draft once the run query first resolves. We
// gate on a flag so that subsequent refetches (e.g. window-focus refresh)
// don't clobber edits the user has typed but not yet saved.
const draftInitialized = ref(false)
watch(
  run,
  (loadedRun) => {
    if (!loadedRun || draftInitialized.value) return
    // The store's initializeEditRunDraft looks up the run via id; populate
    // currentRun first so the lookup succeeds without depending on the
    // runs store having been independently warmed.
    runsStore.setCurrentRun(loadedRun)
    runsStore.initializeEditRunDraft(loadedRun.id)
    draftInitialized.value = true
  },
  { immediate: true },
)

// Show the current location name in the page title so the edit screen
// identifies the run clearly.
const editRunTitle = computed(() => {
  const locationId = runsStore.draftRunLocationId || run.value?.locationId
  if (!locationId) {
    return 'Run'
  }

  return locationsById.value.get(locationId)?.name || 'Run'
})

// Format the run's date and time for display in the subtitle.
// Uses the draft values (which are initialized from the current run on load).
const formattedRunDateTime = computed(() => {
  const date = runsStore.draftRunDate || run.value?.date
  const time = runsStore.draftRunTime || run.value?.time

  if (!date) {
    return ''
  }

  // Convert date to string if it's a Date object
  let dateString: string | undefined
  if (typeof date === 'string') {
    dateString = date
  } else if (date instanceof Date) {
    dateString = date.toISOString().split('T')[0]
  }

  if (!dateString) {
    return ''
  }

  // Parse the date string (YYYY-MM-DD) into a readable format
  const dateParts = dateString.split('-').map(Number)
  if (dateParts.length !== 3 || dateParts.some(isNaN)) {
    return ''
  }

  const year = dateParts[0] as number
  const month = dateParts[1] as number
  const day = dateParts[2] as number
  const dateObj = new Date(year, month - 1, day)
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  if (!time) {
    return formattedDate
  }

  // Parse the time string (HH:MM) into a readable format
  let timeString: string
  if (typeof time === 'string') {
    timeString = time
  } else {
    timeString = String(time)
  }

  const timeParts = timeString.split(':').map(Number)
  if (timeParts.length < 2 || timeParts.some(isNaN)) {
    return formattedDate
  }

  const hours = timeParts[0] as number
  const minutes = timeParts[1] as number
  const timeObj = new Date(0, 0, 0, hours, minutes)
  const formattedTime = timeObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return `${formattedDate} at ${formattedTime}`
})

// Loading state aggregated across the run, organization, and locations
// queries. The form needs all three before it can render meaningfully —
// the run for the draft, the organization for the subtitle, and the
// locations for the dropdown — so any one being pending blocks the form.
const pageLoading = computed<LoadingState>(() => {
  if (runQuery.isError.value || organizationQuery.isError.value || locationsQuery.isError.value) {
    return 'error'
  }
  if (
    runQuery.isPending.value ||
    organizationQuery.isPending.value ||
    locationsQuery.isPending.value
  ) {
    return 'loading'
  }
  return 'success'
})

// Retry handler used by the template's "Try Again" button. Refetches all
// three underlying queries since any one of them may have failed.
function retryLoad(): void {
  runQuery.refetch()
  organizationQuery.refetch()
  locationsQuery.refetch()
}

// Validation errors keyed by field name
const errors = ref<Record<string, string>>({})

// Computed property to check if form is valid
// Requires all required fields and no validation errors
const isFormValid = computed(() => {
  return (
    runsStore.draftRunDate &&
    runsStore.draftRunTime &&
    runsStore.draftRunLocationId &&
    runsStore.draftRunDescription &&
    Object.keys(errors.value).length === 0
  )
})


/**
 * Mark the draft as dirty when the user changes any field.
 * Called from input/change events on all form fields.
 */
function markDirty(): void {
  runsStore.isEditRunDirty = true
}

/**
 * Validate an individual field.
 * Called on blur for immediate feedback.
 */
function validateField(field: string): void {
  switch (field) {
    case 'date':
      if (!runsStore.draftRunDate) {
        errors.value.date = 'Date is required'
      } else {
        delete errors.value.date
      }
      break

    case 'time':
      if (!runsStore.draftRunTime) {
        errors.value.time = 'Time is required'
      } else {
        delete errors.value.time
      }
      break

    case 'locationId':
      if (!runsStore.draftRunLocationId) {
        errors.value.locationId = 'Location is required'
      } else {
        delete errors.value.locationId
      }
      break

    case 'description':
      if (!runsStore.draftRunDescription) {
        errors.value.description = 'Description is required'
      } else if (runsStore.draftRunDescription.trim().length < 10) {
        errors.value.description = 'Description must be at least 10 characters'
      } else {
        delete errors.value.description
      }
      break

    case 'maxAthletes':
      if (runsStore.draftRunMaxAthletes !== undefined && runsStore.draftRunMaxAthletes < 0) {
        errors.value.maxAthletes = 'Maximum athletes cannot be negative'
      } else {
        delete errors.value.maxAthletes
      }
      break

    case 'maxGuides':
      if (runsStore.draftRunMaxGuides !== undefined && runsStore.draftRunMaxGuides < 0) {
        errors.value.maxGuides = 'Maximum guides cannot be negative'
      } else {
        delete errors.value.maxGuides
      }
      break
  }
}

/**
 * Validate all required fields before submission.
 * Returns true if all validations pass.
 */
function validateAllFields(): boolean {
  // Clear any existing errors
  errors.value = {}

  // Validate each required field
  const requiredFields = ['date', 'time', 'locationId', 'description']
  requiredFields.forEach(validateField)

  // Also validate optional numeric fields if they have values
  if (runsStore.draftRunMaxAthletes !== undefined) {
    validateField('maxAthletes')
  }
  if (runsStore.draftRunMaxGuides !== undefined) {
    validateField('maxGuides')
  }

  return Object.keys(errors.value).length === 0
}

/**
 * Build the run update payload from the current draft state.
 * Lives in the view because the draft-to-payload transform is specific
 * to this form; the mutation itself is a generic run updater.
 */
function buildRunUpdates(): Partial<Omit<Run, 'id'>> {
  // Parse date parts manually to avoid UTC interpretation —
  // new Date('YYYY-MM-DD') is treated as UTC midnight, which shifts
  // the day back in US timezones when displayed with toLocaleDateString.
  const dateParts = runsStore.draftRunDate.split('-').map(Number)
  const year = dateParts[0]!
  const month = dateParts[1]!
  const day = dateParts[2]!

  // month - 1 because JS Date months are zero-indexed (0 = Jan, 1 = Feb).
  // Allow null values for optional fields — the repository layer interprets
  // null as "remove this field from the document" (Firestore deleteField()).
  type ClearableFields = 'maxAthletes' | 'maxGuides' | 'notes'
  const updates: Omit<Partial<Omit<Run, 'id'>>, ClearableFields> & {
    maxAthletes?: number | null
    maxGuides?: number | null
    notes?: string | null
  } = {
    date: new Date(year, month - 1, day),
    time: runsStore.draftRunTime,
    locationId: runsStore.draftRunLocationId,
    description: runsStore.draftRunDescription.trim(),
  }

  // Include optional fields: pass the value when set, or null to clear
  // a previously stored value from the database.
  updates.maxAthletes = runsStore.draftRunMaxAthletes ?? null
  updates.maxGuides = runsStore.draftRunMaxGuides ?? null

  // Normalize empty or whitespace-only notes to null so the field
  // is removed rather than stored as an empty string.
  const trimmedNotes = runsStore.draftRunNotes?.trim()
  updates.notes = trimmedNotes || null

  return updates as Partial<Omit<Run, 'id'>>
}

/**
 * Handle form submission.
 * Saves changes to the database via the update-run mutation and navigates
 * back to the run view. The mutation invalidates the run detail cache on
 * success so RunView reflects the saved values automatically.
 */
async function handleSubmit(): Promise<void> {
  // Validate all fields before attempting to save
  if (!validateAllFields()) {
    return
  }

  try {
    await updateRunMutation.mutateAsync({
      runId: runId.value,
      updates: buildRunUpdates(),
    })

    // Clear the dirty flag and signal success to the run view so it can
    // display the post-edit toast. editRunSaveSuccess is cross-view state
    // the store still owns; the mutation itself is decoupled from it.
    runsStore.isEditRunDirty = false
    runsStore.editRunSaveSuccess = true

    // Navigate back to the run view on success
    router.push(`/organizations/${orgId.value}/runs/${runId.value}`)
  } catch {
    // The mutation's error ref drives the inline error message; nothing
    // else to do here beyond swallowing the rejection so Vue doesn't log
    // an unhandled promise warning.
  }
}

/**
 * Handle cancel button - navigate back without saving
 */
function handleCancel(): void {
  router.push(`/organizations/${orgId.value}/runs/${runId.value}`)
}

</script>

<style scoped>
/* Main view container */
.edit-run-view {
  min-height: 100vh;
  background-color: var(--color-bg-secondary, #f9fafb);
}

/* Header section */
.edit-run-header {
  padding: 2rem 0;
}

.edit-run-header__content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

.edit-run-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  line-height: 1.2;
  color: var(--color-text, #111827);
}

.edit-run-subtitle {
  font-size: 1.125rem;
  margin: 0;
  line-height: 1.4;
  color: var(--color-text-muted, #6b7280);
}

/* Main content area */
.edit-run-main {
  padding: 2rem 0;
}

.edit-run-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Form card */
.edit-run-card {
  background: white;
}

/* Form layout */
.edit-run-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Individual form field wrapper */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Form labels */
.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text, #374151);
  line-height: 1.4;
}

.form-required {
  color: var(--color-error, #dc2626);
  margin-left: 0.25rem;
}

/* Form inputs - styled to match existing SelectInput component */
.form-input {
  /* Reset defaults */
  appearance: none;
  background: none;
  border: none;
  outline: none;

  /* Layout */
  width: 100%;
  padding: 0.75rem;

  /* Typography */
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--color-text, #111827);

  /* Visual styling */
  background-color: var(--color-input-bg, #ffffff);
  border: 1px solid var(--color-input-border, #d1d5db);
  border-radius: 0.375rem;

  /* Focus styles */
  outline: 2px solid transparent;
  outline-offset: 2px;
  transition: all 0.2s ease-in-out;
}

.form-input:focus {
  outline: 2px solid var(--color-focus, #0066cc);
  outline-offset: 2px;
  border-color: var(--color-focus, #0066cc);
}

.form-input--error {
  border-color: var(--color-error, #dc2626);
}

.form-input--error:focus {
  outline-color: var(--color-error, #dc2626);
  border-color: var(--color-error, #dc2626);
}

/* Textarea specific styles */
.form-textarea {
  resize: vertical;
  min-height: 80px;
}

/* Helper text below inputs */
.form-helper {
  font-size: 0.75rem;
  color: var(--color-text-muted, #6b7280);
  line-height: 1.4;
}

/* Error messages */
.form-error {
  font-size: 0.75rem;
  color: var(--color-error, #dc2626);
  font-weight: 500;
  line-height: 1.4;
}

/* Global error message at bottom of form */
.form-error--global {
  padding: 1rem;
  background-color: var(--color-error-bg, #fef2f2);
  border-radius: 0.375rem;
  text-align: center;
}

/* Form action buttons container */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border, #e5e7eb);
}

/* Error page styling */
.edit-run-error {
  text-align: center;
  padding: 3rem 1rem;
  max-width: 600px;
  margin: 2rem auto;
  background: white;
  border-radius: 0.5rem;
  box-shadow: var(--shadow, 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06));
}

.edit-run-error h1 {
  color: var(--color-error, #dc2626);
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.edit-run-error p {
  color: var(--color-text-muted, #6b7280);
  margin: 0 0 1.5rem 0;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .edit-run-header {
    padding: 1.5rem 0;
  }

  .edit-run-main {
    padding: 1.5rem 0;
  }

  .edit-run-container {
    padding: 0 0.5rem;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions > * {
    width: 100%;
  }
}

/* High contrast mode */
.high-contrast .form-input {
  border: 2px solid var(--color-text, #000000);
}

.high-contrast .form-input:focus {
  outline: 3px solid var(--color-focus, #000000);
  outline-offset: 3px;
}

.high-contrast .form-input--error {
  border-color: var(--color-error, #000000);
}

/* Reduced motion support */
.reduced-motion .form-input {
  transition: none;
}
</style>
