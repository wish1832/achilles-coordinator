<template>
  <ModalElement
    :is-open="isOpen"
    :title="modalTitle"
    size="medium"
    close-button-label="Close RSVP form"
    @close="handleClose"
    @update:is-open="$emit('update:isOpen', $event)"
  >
    <form class="rsvp-form" @submit.prevent="handleSubmit">
      <!-- Attendance question -->
      <fieldset class="rsvp-section">
        <legend class="rsvp-section__label">Will you attend?</legend>
        <div class="rsvp-button-group" role="group" aria-label="Attendance selection">
          <button
            v-for="option in attendanceOptions"
            :key="option.value"
            type="button"
            class="rsvp-option-button"
            :class="{ 'rsvp-option-button--selected': attendance === option.value }"
            :aria-pressed="attendance === option.value"
            @click="attendance = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </fieldset>

      <!-- Activity question -->
      <fieldset class="rsvp-section">
        <legend class="rsvp-section__label">Activity</legend>
        <div class="rsvp-button-group" role="group" aria-label="Activity selection">
          <button
            v-for="option in activityOptions"
            :key="option.value"
            type="button"
            class="rsvp-option-button"
            :class="{ 'rsvp-option-button--selected': activity === option.value }"
            :aria-pressed="activity === option.value"
            @click="activity = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </fieldset>

      <!-- Pace question (only for run or roll activities) -->
      <fieldset v-if="showPaceSection" class="rsvp-section">
        <legend class="rsvp-section__label">{{ paceQuestionLabel }}</legend>
        <p class="rsvp-pace-description">{{ paceDescription }}</p>

        <div class="rsvp-pace-inputs">
          <div class="rsvp-pace-field">
            <label :for="minutesSelectId" class="visually-hidden">Minutes</label>
            <SelectInput
              :id="minutesSelectId"
              v-model="paceMinutes"
              :options="minutesOptions"
              placeholder="Min"
              aria-label="Pace minutes"
              size="medium"
            />
            <span class="rsvp-pace-unit" aria-hidden="true">m</span>
          </div>

          <div class="rsvp-pace-field">
            <label :for="secondsSelectId" class="visually-hidden">Seconds</label>
            <SelectInput
              :id="secondsSelectId"
              v-model="paceSeconds"
              :options="secondsOptions"
              placeholder="Sec"
              aria-label="Pace seconds"
              size="medium"
            />
            <span class="rsvp-pace-unit" aria-hidden="true">s</span>
          </div>
        </div>
      </fieldset>

      <!-- Error message display -->
      <div v-if="submitError" class="rsvp-error" role="alert">
        {{ submitError }}
      </div>

      <!-- Footer with submit button -->
      <div class="rsvp-footer">
        <AchillesButton
          type="submit"
          variant="primary"
          size="medium"
          :disabled="!isFormValid || isSubmitting"
        >
          {{ isSubmitting ? 'Saving...' : submitButtonLabel }}
        </AchillesButton>
      </div>
    </form>
  </ModalElement>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import ModalElement from '@/components/ui/ModalElement.vue'
import SelectInput from '@/components/ui/SelectInput.vue'
import AchillesButton from '@/components/ui/AchillesButton.vue'
import { useAuthStore } from '@/stores/auth'
import { useSignUpsStore } from '@/stores/signups'
import type { SignUpStatus, SignUpActivity, Run } from '@/types'

// Props definition
interface Props {
  // Whether the modal is open
  isOpen: boolean
  // The run data for the modal title
  run: Run | null
  // Location name for the modal title
  locationName?: string
  // Whether this is editing an existing RSVP
  isEditing?: boolean
  // Existing signup data for editing
  existingSignUp?: {
    status: SignUpStatus
    activity: SignUpActivity
    pace?: { minutes: number; seconds: number }
  }
}

// Emits definition
interface Emits {
  'update:isOpen': [value: boolean]
  close: []
  // Emitted after a successful submission with the sign-up ID
  submitted: [signUpId: string]
}

const props = withDefaults(defineProps<Props>(), {
  isEditing: false,
  locationName: 'Unknown Location',
})

const emit = defineEmits<Emits>()

// Stores
const authStore = useAuthStore()
const signUpsStore = useSignUpsStore()

// Submission state
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

// Form state
const attendance = ref<SignUpStatus | null>(null)
const activity = ref<SignUpActivity | null>(null)
const paceMinutes = ref<number | undefined>(undefined)
const paceSeconds = ref<number | undefined>(undefined)

// Generate unique IDs for accessibility
const minutesSelectId = computed(() => `pace-minutes-${Math.random().toString(36).substring(2, 11)}`)
const secondsSelectId = computed(() => `pace-seconds-${Math.random().toString(36).substring(2, 11)}`)

// Attendance options
const attendanceOptions = [
  { value: 'yes' as SignUpStatus, label: 'Yes' },
  { value: 'maybe' as SignUpStatus, label: 'Maybe' },
  { value: 'no' as SignUpStatus, label: 'No' },
]

// Activity options with Title case labels mapping to lowercase values
const activityOptions = [
  { value: 'run' as SignUpActivity, label: 'Run' },
  { value: 'run/walk' as SignUpActivity, label: 'Run/Walk' },
  { value: 'roll' as SignUpActivity, label: 'Roll' },
  { value: 'walk' as SignUpActivity, label: 'Walk' },
]

// Minutes options (6-20)
const minutesOptions = computed(() => {
  const options = []
  for (let i = 6; i <= 20; i++) {
    options.push({ value: i, label: String(i) })
  }
  return options
})

// Seconds options (0, 15, 30, 45)
const secondsOptions = [
  { value: 0, label: '00' },
  { value: 15, label: '15' },
  { value: 30, label: '30' },
  { value: 45, label: '45' },
]

// Computed: Check if user is a guide
const isGuide = computed(() => authStore.isGuide)

// Computed: Show pace section only for run or roll activities
const showPaceSection = computed(() => {
  return activity.value === 'run' || activity.value === 'roll'
})

// Computed: Pace question label based on user role
const paceQuestionLabel = computed(() => {
  if (isGuide.value) {
    return 'What is the max pace you\'re comfortable with?'
  }
  return 'What pace do you plan to run?'
})

// Computed: Pace description text based on user role
const paceDescription = computed(() => {
  if (isGuide.value) {
    return 'You will be paired with athletes with a pace up to the pace you enter below. Please edit your RSVP if this changes for any reason!'
  }
  return 'This is used to pair you with guides that can run up to the pace you provide here. Please answer as close as you can to get paired with a guide that can match pace with you! Edit your RSVP if this changes for any reason.'
})

// Computed: Format the run date for display
const formattedDate = computed(() => {
  if (!props.run?.date) return ''
  const runDate = new Date(props.run.date)
  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }
  return runDate.toLocaleDateString('en-US', options)
})

// Computed: Modal title
const modalTitle = computed(() => {
  const name = props.locationName || 'Unknown Location'
  const date = formattedDate.value
  const time = props.run?.time || ''
  return `RSVP for ${name} (${date}, ${time})`
})

// Computed: Submit button label
const submitButtonLabel = computed(() => {
  return props.isEditing ? 'Update RSVP' : 'Submit RSVP'
})

// Computed: Form validation
const isFormValid = computed(() => {
  // Must have attendance and activity selected
  if (!attendance.value || !activity.value) {
    return false
  }
  // If pace section is shown, must have pace values
  if (showPaceSection.value) {
    if (paceMinutes.value === undefined || paceSeconds.value === undefined) {
      return false
    }
  }
  return true
})

// Watch for modal open to reset or populate form
watch(
  () => props.isOpen,
  (newIsOpen) => {
    if (newIsOpen) {
      // If editing, populate with existing values
      if (props.isEditing && props.existingSignUp) {
        attendance.value = props.existingSignUp.status
        activity.value = props.existingSignUp.activity
        if (props.existingSignUp.pace) {
          paceMinutes.value = props.existingSignUp.pace.minutes
          paceSeconds.value = props.existingSignUp.pace.seconds
        }
      } else {
        // Reset form for new RSVP
        attendance.value = null
        activity.value = null
        // Pre-populate pace with the user's default pace from their profile
        const userDefaultPace = authStore.currentUser?.profileDetails?.pace
        paceMinutes.value = userDefaultPace?.minutes
        paceSeconds.value = userDefaultPace?.seconds
      }
    }
  },
)

// Handle close
function handleClose(): void {
  emit('close')
}

// Handle form submission
// Creates or updates a sign-up record using the signups store
async function handleSubmit(): Promise<void> {
  // Validate form and required data
  if (!isFormValid.value || !attendance.value || !activity.value) {
    return
  }

  if (!props.run || !authStore.currentUser) {
    submitError.value = 'Missing run or user data'
    return
  }

  // Clear any previous error and set submitting state
  submitError.value = null
  isSubmitting.value = true

  try {
    // Build the sign-up data object
    const signUpData = {
      runId: props.run.id,
      userId: authStore.currentUser.id,
      role: authStore.currentUser.role as 'athlete' | 'guide',
      timestamp: new Date(),
      status: attendance.value,
      activity: activity.value,
      pace:
        showPaceSection.value && paceMinutes.value !== undefined && paceSeconds.value !== undefined
          ? { minutes: paceMinutes.value, seconds: paceSeconds.value }
          : undefined,
    }

    // Create or update the sign-up using the store
    const signUpId = await signUpsStore.createOrUpdateSignUp(signUpData)

    // Emit success event and close the modal
    emit('submitted', signUpId)
    emit('close')
  } catch (error) {
    // Log the error for debugging purposes
    console.error('Failed to save RSVP:', error)
    // Display a user-friendly error message
    submitError.value = 'An error occurred. Please try again later and contact us if the issue persists.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
/* RSVP Form layout */
.rsvp-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Section styling */
.rsvp-section {
  border: none;
  padding: 0;
  margin: 0;
}

.rsvp-section__label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text, #111827);
  margin-bottom: 0.75rem;
  display: block;
}

/* Button group for attendance and activity */
.rsvp-button-group {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* Option buttons */
.rsvp-option-button {
  /* Reset button styles */
  appearance: none;
  border: none;
  background: none;
  cursor: pointer;

  /* Layout */
  padding: 0.75rem 1.25rem;

  /* Typography */
  font-family: inherit;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.4;

  /* Visual styling */
  background-color: var(--color-bg-secondary, #f3f4f6);
  color: var(--color-text, #111827);
  border: 2px solid var(--color-border, #d1d5db);
  border-radius: 0.375rem;

  /* Transitions */
  transition: all 0.2s ease-in-out;
}

.rsvp-option-button:hover {
  background-color: var(--color-bg-hover, #e5e7eb);
  border-color: var(--color-primary, #0066cc);
}

.rsvp-option-button:focus {
  outline: 2px solid var(--color-focus, #0066cc);
  outline-offset: 2px;
}

.rsvp-option-button--selected {
  background-color: var(--color-primary, #0066cc);
  color: white;
  border-color: var(--color-primary, #0066cc);
}

.rsvp-option-button--selected:hover {
  background-color: var(--color-primary-hover, #0052a3);
  border-color: var(--color-primary-hover, #0052a3);
}

/* Pace description */
.rsvp-pace-description {
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--color-text-muted, #6b7280);
  line-height: 1.5;
  margin: 0 0 1rem 0;
}

/* Pace inputs layout */
.rsvp-pace-inputs {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.rsvp-pace-field {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Style the select to be narrower */
.rsvp-pace-field :deep(.select) {
  width: 5rem;
}

.rsvp-pace-unit {
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text, #111827);
}

/* Error message */
.rsvp-error {
  padding: 0.75rem 1rem;
  background-color: var(--color-error-bg, #fef2f2);
  border: 1px solid var(--color-error, #dc2626);
  border-radius: 0.375rem;
  color: var(--color-error, #dc2626);
  font-size: 0.875rem;
  line-height: 1.4;
}

/* Footer */
.rsvp-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border, #e5e7eb);
}

/* Visually hidden utility */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* High contrast mode */
.high-contrast .rsvp-option-button {
  border: 2px solid var(--color-text, #000000);
}

.high-contrast .rsvp-option-button--selected {
  background-color: var(--color-text, #000000);
  border-color: var(--color-text, #000000);
}

.high-contrast .rsvp-option-button:focus {
  outline: 3px solid var(--color-focus, #000000);
  outline-offset: 3px;
}

/* Text size support */
.text-size-small .rsvp-section__label {
  font-size: 0.875rem;
}

.text-size-small .rsvp-option-button {
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
}

.text-size-small .rsvp-pace-description {
  font-size: 0.8125rem;
}

.text-size-large .rsvp-section__label {
  font-size: 1.125rem;
}

.text-size-large .rsvp-option-button {
  font-size: 1.125rem;
  padding: 0.875rem 1.5rem;
}

.text-size-large .rsvp-pace-description {
  font-size: 0.9375rem;
}

.text-size-extra-large .rsvp-section__label {
  font-size: 1.25rem;
}

.text-size-extra-large .rsvp-option-button {
  font-size: 1.25rem;
  padding: 1rem 1.75rem;
}

.text-size-extra-large .rsvp-pace-description {
  font-size: 1rem;
}

/* Reduced motion support */
.reduced-motion .rsvp-option-button {
  transition: none;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .rsvp-button-group {
    flex-direction: column;
  }

  .rsvp-option-button {
    width: 100%;
    text-align: center;
  }

  .rsvp-pace-inputs {
    flex-wrap: wrap;
  }
}
</style>
