<template>
  <div class="create-run-view">
    <!-- Skip link for keyboard navigation -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- Loading state for initial data -->
    <LoadingUI
      v-if="pageLoading === 'loading'"
      type="spinner"
      text="Loading form..."
      centered
    />

    <!-- Error state for initial data loading -->
    <div v-else-if="pageLoading === 'error'" class="create-run-error">
      <h1>Unable to load form</h1>
      <p>There was an error loading the form. Please try again.</p>
      <AchillesButton @click="loadFormData">Try Again</AchillesButton>
    </div>

    <!-- Main form content -->
    <template v-else-if="organization">
      <!-- Header with organization name -->
      <header class="create-run-header">
        <div class="create-run-header__content">
          <h1 class="create-run-title">Create Run</h1>
          <p class="create-run-subtitle">{{ organization.name }}</p>
        </div>
      </header>

      <!-- Main content area -->
      <main id="main-content" class="create-run-main">
        <div class="create-run-container">
          <CardUI class="create-run-card" title="Run Details">
            <form @submit.prevent="handleSubmit" class="create-run-form">
              <!-- Date field - required -->
              <div class="form-field">
                <label for="date" class="form-label">
                  Date
                  <span class="form-required" aria-label="required">*</span>
                </label>
                <input
                  id="date"
                  v-model="form.date"
                  type="date"
                  class="form-input"
                  :class="{ 'form-input--error': errors.date }"
                  :aria-invalid="!!errors.date"
                  :aria-describedby="errors.date ? 'date-error' : undefined"
                  required
                  @blur="validateField('date')"
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
                  v-model="form.time"
                  type="time"
                  class="form-input"
                  :class="{ 'form-input--error': errors.time }"
                  :aria-invalid="!!errors.time"
                  :aria-describedby="errors.time ? 'time-error' : undefined"
                  required
                  @blur="validateField('time')"
                />
                <div v-if="errors.time" id="time-error" class="form-error" role="alert">
                  {{ errors.time }}
                </div>
              </div>

              <!-- Location dropdown - required, uses custom component for rich display -->
              <LocationDropdown
                v-model="form.locationId"
                :locations="locations"
                label="Location"
                placeholder="Select a location"
                required
                :error="!!errors.locationId"
                :error-message="errors.locationId"
                @blur="validateField('locationId')"
              />

              <!-- Description field - required -->
              <div class="form-field">
                <label for="description" class="form-label">
                  Description
                  <span class="form-required" aria-label="required">*</span>
                </label>
                <textarea
                  id="description"
                  v-model="form.description"
                  class="form-input form-textarea"
                  :class="{ 'form-input--error': errors.description }"
                  :aria-invalid="!!errors.description"
                  :aria-describedby="errors.description ? 'description-error' : undefined"
                  rows="3"
                  required
                  @blur="validateField('description')"
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
                  v-model.number="form.maxAthletes"
                  type="number"
                  min="0"
                  class="form-input"
                  :class="{ 'form-input--error': errors.maxAthletes }"
                  :aria-invalid="!!errors.maxAthletes"
                  :aria-describedby="errors.maxAthletes ? 'maxAthletes-error' : 'maxAthletes-helper'"
                  @blur="validateField('maxAthletes')"
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
                  v-model.number="form.maxGuides"
                  type="number"
                  min="0"
                  class="form-input"
                  :class="{ 'form-input--error': errors.maxGuides }"
                  :aria-invalid="!!errors.maxGuides"
                  :aria-describedby="errors.maxGuides ? 'maxGuides-error' : 'maxGuides-helper'"
                  @blur="validateField('maxGuides')"
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
                  v-model="form.notes"
                  class="form-input form-textarea"
                  rows="2"
                  aria-describedby="notes-helper"
                />
                <div id="notes-helper" class="form-helper">
                  Optional notes visible to participants
                </div>
              </div>

              <!-- Form actions: Cancel and Create buttons -->
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
                  variant="primary"
                  :loading="submitting"
                  :disabled="!isFormValid || submitting"
                >
                  Create
                </AchillesButton>
              </div>

              <!-- Global error message for submission failures -->
              <div v-if="submitError" class="form-error form-error--global" role="alert">
                {{ submitError }}
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
import { useAuthStore } from '@/stores/auth'
import { useDataRepository } from '@/composables/useRepositories'
import type { CreateRunForm, LoadingState, Run } from '@/types'

// Router and route for navigation and params
const route = useRoute()
const router = useRouter()

// Stores for organization, location, and auth data
const organizationStore = useOrganizationStore()
const locationStore = useLocationStore()
const authStore = useAuthStore()

// Repository for creating the run in the database
const dataRepository = useDataRepository()

// Get reactive reference to locations from the store
const { locations } = storeToRefs(locationStore)

// Get organization ID from route params
const orgId = computed(() => route.params.orgId as string)

// Get current organization from store
const organization = computed(() => organizationStore.getOrganizationById(orgId.value))

// Loading states for page initialization and form submission
const pageLoading = ref<LoadingState>('idle')
const submitting = ref(false)
const submitError = ref<string | null>(null)

// Form state with all fields from CreateRunForm interface
// organizationId is set from route params, not user input
const form = ref<CreateRunForm>({
  organizationId: '',
  date: '',
  time: '',
  locationId: '',
  description: '',
  maxAthletes: undefined,
  maxGuides: undefined,
  notes: undefined,
})

// Validation errors keyed by field name
const errors = ref<Record<string, string>>({})

// Computed property to check if form is valid
// Requires all required fields and no validation errors
const isFormValid = computed(() => {
  return (
    form.value.date &&
    form.value.time &&
    form.value.locationId &&
    form.value.description &&
    Object.keys(errors.value).length === 0
  )
})

/**
 * Load initial data needed for the form:
 * - Organization details for display
 * - Locations for the dropdown
 */
async function loadFormData(): Promise<void> {
  try {
    pageLoading.value = 'loading'

    // Set organization ID from route params
    form.value.organizationId = orgId.value

    // Load organization if not already in cache
    if (!organization.value) {
      await organizationStore.loadOrganization(orgId.value)
    }

    // Load locations for this organization to populate the dropdown
    await locationStore.loadLocationsForOrganization(orgId.value)

    pageLoading.value = 'success'
  } catch {
    pageLoading.value = 'error'
  }
}

/**
 * Validate an individual field
 * Called on blur for immediate feedback
 */
function validateField(field: keyof CreateRunForm | string): void {
  switch (field) {
    case 'date':
      if (!form.value.date) {
        errors.value.date = 'Date is required'
      } else {
        delete errors.value.date
      }
      break

    case 'time':
      if (!form.value.time) {
        errors.value.time = 'Time is required'
      } else {
        delete errors.value.time
      }
      break

    case 'locationId':
      if (!form.value.locationId) {
        errors.value.locationId = 'Location is required'
      } else {
        delete errors.value.locationId
      }
      break

    case 'description':
      if (!form.value.description) {
        errors.value.description = 'Description is required'
      } else if (form.value.description.trim().length < 10) {
        errors.value.description = 'Description must be at least 10 characters'
      } else {
        delete errors.value.description
      }
      break

    case 'maxAthletes':
      if (form.value.maxAthletes !== undefined && form.value.maxAthletes < 0) {
        errors.value.maxAthletes = 'Maximum athletes cannot be negative'
      } else {
        delete errors.value.maxAthletes
      }
      break

    case 'maxGuides':
      if (form.value.maxGuides !== undefined && form.value.maxGuides < 0) {
        errors.value.maxGuides = 'Maximum guides cannot be negative'
      } else {
        delete errors.value.maxGuides
      }
      break
  }
}

/**
 * Validate all required fields before submission
 * Returns true if all validations pass
 */
function validateAllFields(): boolean {
  // Clear any existing errors
  errors.value = {}

  // Validate each required field
  const requiredFields: (keyof CreateRunForm)[] = ['date', 'time', 'locationId', 'description']
  requiredFields.forEach(validateField)

  // Also validate optional numeric fields if they have values
  if (form.value.maxAthletes !== undefined) {
    validateField('maxAthletes')
  }
  if (form.value.maxGuides !== undefined) {
    validateField('maxGuides')
  }

  return Object.keys(errors.value).length === 0
}

/**
 * Handle form submission
 * Creates the run in the database and navigates back to the organization page
 */
async function handleSubmit(): Promise<void> {
  // Clear previous submission error
  submitError.value = null

  // Validate all fields before attempting to submit
  if (!validateAllFields()) {
    return
  }

  try {
    submitting.value = true

    // Build the run data object for creation
    // Uses Omit<Run, 'id'> since ID is generated by the database
    const runData: Omit<Run, 'id'> = {
      organizationId: form.value.organizationId,
      date: new Date(form.value.date),
      time: form.value.time,
      locationId: form.value.locationId,
      description: form.value.description.trim(),
      createdBy: authStore.currentUser!.id,
      createdAt: new Date(),
      status: 'upcoming',
      // Only include optional fields if they have values
      ...(form.value.maxAthletes !== undefined && { maxAthletes: form.value.maxAthletes }),
      ...(form.value.maxGuides !== undefined && { maxGuides: form.value.maxGuides }),
      ...(form.value.notes && { notes: form.value.notes.trim() }),
    }

    // Create the run via the data repository
    const newRunId = await dataRepository.createRun(runData)
    console.log('[CreateRunView] Created run with ID:', newRunId)
    console.log('[CreateRunView] Run data:', runData)

    // Navigate back to the organization page on success
    router.push(`/organizations/${orgId.value}`)
  } catch (err) {
    console.error('Failed to create run:', err)
    submitError.value =
      'Unable to create run. Please try again and contact us if the problem persists.'
  } finally {
    submitting.value = false
  }
}

/**
 * Handle cancel button - navigate back without saving
 */
function handleCancel(): void {
  router.push(`/organizations/${orgId.value}`)
}

// Load form data when component mounts
onMounted(() => {
  loadFormData()
})
</script>

<style scoped>
/* Main view container */
.create-run-view {
  min-height: 100vh;
  background-color: var(--color-bg-secondary, #f9fafb);
}

/* Header section with gradient background */
.create-run-header {
  background: linear-gradient(
    135deg,
    var(--color-primary, #0066cc) 0%,
    var(--color-primary-hover, #0052a3) 100%
  );
  color: white;
  padding: 2rem 0;
}

.create-run-header__content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

.create-run-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  line-height: 1.2;
}

.create-run-subtitle {
  font-size: 1.125rem;
  margin: 0;
  opacity: 0.9;
  line-height: 1.4;
}

/* Main content area */
.create-run-main {
  padding: 2rem 0;
}

.create-run-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Form card */
.create-run-card {
  background: white;
}

/* Form layout */
.create-run-form {
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
.create-run-error {
  text-align: center;
  padding: 3rem 1rem;
  max-width: 600px;
  margin: 2rem auto;
  background: white;
  border-radius: 0.5rem;
  box-shadow: var(--shadow, 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06));
}

.create-run-error h1 {
  color: var(--color-error, #dc2626);
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.create-run-error p {
  color: var(--color-text-muted, #6b7280);
  margin: 0 0 1.5rem 0;
}

/* Skip link for keyboard navigation */
.skip-link {
  position: absolute;
  left: -10000px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.skip-link:focus {
  position: fixed;
  top: 0;
  left: 0;
  width: auto;
  height: auto;
  padding: 1rem 2rem;
  background: var(--color-primary, #0066cc);
  color: white;
  z-index: 1000;
  outline: 2px solid var(--color-focus, #0066cc);
  outline-offset: 2px;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .create-run-header {
    padding: 1.5rem 0;
  }

  .create-run-main {
    padding: 1.5rem 0;
  }

  .create-run-container {
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
