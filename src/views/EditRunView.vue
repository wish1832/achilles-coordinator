<template>
  <div class="edit-run-view">
    <!-- Skip link for keyboard navigation -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- Loading state for initial data -->
    <LoadingUI
      v-if="pageLoading === 'loading'"
      type="spinner"
      text="Loading run..."
      centered
    />

    <!-- Error state for initial data loading -->
    <div v-else-if="pageLoading === 'error'" class="edit-run-error">
      <h1>Unable to load run</h1>
      <p>There was an error loading the run. Please try again.</p>
      <AchillesButton @click="loadFormData">Try Again</AchillesButton>
    </div>

    <!-- Main form content -->
    <template v-else-if="organization && runsStore.currentRun">
      <!-- Header with organization name -->
      <header class="edit-run-header">
        <div class="edit-run-header__content">
          <h1 class="edit-run-title">Edit Run</h1>
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
                <div v-if="errors.description" id="description-error" class="form-error" role="alert">
                  {{ errors.description }}
                </div>
              </div>

              <!-- Max Athletes - optional -->
              <div class="form-field">
                <label for="maxAthletes" class="form-label">
                  Maximum Athletes
                </label>
                <input
                  id="maxAthletes"
                  v-model.number="runsStore.draftRunMaxAthletes"
                  type="number"
                  min="0"
                  class="form-input"
                  :class="{ 'form-input--error': errors.maxAthletes }"
                  :aria-invalid="!!errors.maxAthletes"
                  :aria-describedby="errors.maxAthletes ? 'maxAthletes-error' : 'maxAthletes-helper'"
                  @blur="validateField('maxAthletes')"
                  @input="markDirty"
                />
                <div v-if="errors.maxAthletes" id="maxAthletes-error" class="form-error" role="alert">
                  {{ errors.maxAthletes }}
                </div>
                <div v-else id="maxAthletes-helper" class="form-helper">
                  Leave blank for no limit
                </div>
              </div>

              <!-- Max Guides - optional -->
              <div class="form-field">
                <label for="maxGuides" class="form-label">
                  Maximum Guides
                </label>
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
                <div v-else id="maxGuides-helper" class="form-helper">
                  Leave blank for no limit
                </div>
              </div>

              <!-- Notes - optional -->
              <div class="form-field">
                <label for="notes" class="form-label">
                  Additional Notes
                </label>
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
                <AchillesButton
                  type="button"
                  variant="secondary"
                  @click="handleCancel"
                >
                  Cancel
                </AchillesButton>
                <AchillesButton
                  type="submit"
                  :variant="runsStore.isEditRunDirty ? 'primary' : 'secondary'"
                  :loading="runsStore.isEditRunSaving"
                  :disabled="!runsStore.isEditRunDirty || !isFormValid || runsStore.isEditRunSaving"
                >
                  {{ runsStore.isEditRunSaving ? 'Saving...' : 'Save Changes' }}
                </AchillesButton>
              </div>

              <!-- Global error message for submission failures -->
              <div v-if="runsStore.editRunSaveError" class="form-error form-error--global" role="alert">
                {{ runsStore.editRunSaveError }}
              </div>
            </form>
          </CardUI>
        </div>
      </main>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import CardUI from '@/components/ui/CardUI.vue'
import AchillesButton from '@/components/ui/AchillesButton.vue'
import LoadingUI from '@/components/ui/LoadingUI.vue'
import LocationDropdown from '@/components/ui/LocationDropdown.vue'
import { useOrganizationStore } from '@/stores/organization'
import { useLocationStore } from '@/stores/location'
import { useRunsStore } from '@/stores/runs'
import type { LoadingState } from '@/types'

// Router and route for navigation and params
const route = useRoute()
const router = useRouter()

// Stores for organization, location, and run data
const organizationStore = useOrganizationStore()
const locationStore = useLocationStore()
const runsStore = useRunsStore()

// Get reactive reference to locations from the store
const { locations } = storeToRefs(locationStore)

// Get organization ID and run ID from route params
const orgId = computed(() => route.params.orgId as string)
const runId = computed(() => route.params.id as string)

// Get current organization from store
const organization = computed(() => organizationStore.getOrganizationById(orgId.value))

// Loading state for page initialization
const pageLoading = ref<LoadingState>('idle')

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
 * Load initial data needed for the form:
 * - Run data to populate draft state
 * - Organization details for display
 * - Locations for the dropdown
 */
async function loadFormData(): Promise<void> {
  try {
    pageLoading.value = 'loading'

    // Load the run data
    await runsStore.loadRun(runId.value)

    // Load organization if not already in cache
    if (!organization.value) {
      await organizationStore.loadOrganization(orgId.value)
    }

    // Load locations for this organization to populate the dropdown
    await locationStore.loadLocationsForOrganization(orgId.value)

    // Initialize the draft state from the loaded run
    runsStore.initializeEditRunDraft(runId.value)

    pageLoading.value = 'success'
  } catch {
    pageLoading.value = 'error'
  }
}

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
 * Handle form submission.
 * Saves changes to the database and navigates back to the run view.
 */
async function handleSubmit(): Promise<void> {
  // Validate all fields before attempting to save
  if (!validateAllFields()) {
    return
  }

  try {
    await runsStore.saveEditRunChanges(runId.value)

    // Navigate back to the run view on success
    router.push(`/organizations/${orgId.value}/runs/${runId.value}`)
  } catch {
    // Error is already set in the store by saveEditRunChanges
  }
}

/**
 * Handle cancel button - navigate back without saving
 */
function handleCancel(): void {
  router.push(`/organizations/${orgId.value}/runs/${runId.value}`)
}

// Load form data when component mounts
onMounted(() => {
  loadFormData()
})
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
