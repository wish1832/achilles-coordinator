<template>
  <div class="location-dropdown" :class="dropdownClasses">
    <!-- Label for the dropdown -->
    <label
      v-if="label"
      :id="labelId"
      :for="buttonId"
      class="location-dropdown__label"
      :class="{ 'location-dropdown__label--required': required }"
    >
      {{ label }}
      <span v-if="required" class="location-dropdown__required" aria-label="required">*</span>
    </label>

    <!-- Dropdown wrapper for positioning -->
    <div class="location-dropdown__wrapper">
      <!-- Trigger button that opens/closes the dropdown -->
      <!-- Uses role="combobox" for accessibility as per ARIA Authoring Practices -->
      <button
        :id="buttonId"
        ref="triggerRef"
        type="button"
        role="combobox"
        :aria-expanded="isOpen"
        aria-haspopup="listbox"
        :aria-controls="listboxId"
        :aria-activedescendant="activeDescendantId"
        :aria-invalid="hasError"
        :aria-required="required"
        :aria-labelledby="label ? labelId : undefined"
        :aria-label="!label ? ariaLabel : undefined"
        :aria-describedby="ariaDescribedby"
        :disabled="disabled"
        class="location-dropdown__trigger"
        :class="{ 'location-dropdown__trigger--open': isOpen }"
        @click="toggleDropdown"
        @keydown="handleTriggerKeydown"
        @blur="handleBlur"
      >
        <!-- Display selected location or placeholder -->
        <span v-if="selectedLocation" class="location-dropdown__selected">
          <span class="location-dropdown__selected-name">{{ selectedLocation.name }}</span>
        </span>
        <span v-else class="location-dropdown__placeholder">
          {{ placeholder || 'Select a location' }}
        </span>

        <!-- Dropdown arrow icon -->
        <span class="location-dropdown__arrow" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            class="location-dropdown__arrow-icon"
            :class="{ 'location-dropdown__arrow-icon--open': isOpen }"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              fill="none"
            />
          </svg>
        </span>
      </button>

      <!-- Dropdown listbox with location options -->
      <!-- Uses role="listbox" for accessibility -->
      <ul
        v-show="isOpen"
        :id="listboxId"
        ref="listboxRef"
        role="listbox"
        :aria-label="ariaLabel || label || 'Locations'"
        class="location-dropdown__listbox"
        tabindex="-1"
        @keydown="handleListboxKeydown"
      >
        <!-- Empty state when no locations available -->
        <li v-if="locations.length === 0" class="location-dropdown__empty">
          No locations available
        </li>

        <!-- Location options -->
        <!-- Each option displays name (bold), address, and city/state in gray text -->
        <li
          v-for="(location, index) in locations"
          :key="location.id"
          :id="`${listboxId}-option-${index}`"
          role="option"
          :aria-selected="location.id === modelValue"
          class="location-dropdown__option"
          :class="{
            'location-dropdown__option--active': activeIndex === index,
            'location-dropdown__option--selected': location.id === modelValue,
          }"
          @click="selectLocation(location)"
          @mouseenter="activeIndex = index"
        >
          <!-- Location name - primary display -->
          <span class="location-dropdown__option-name">{{ location.name }}</span>
          <!-- Address - secondary display in gray -->
          <span v-if="location.address" class="location-dropdown__option-address">
            {{ location.address }}
          </span>
          <!-- City and state - tertiary display in gray -->
          <span
            v-if="location.city || location.state"
            class="location-dropdown__option-city"
          >
            {{ formatCityState(location) }}
          </span>
        </li>
      </ul>
    </div>

    <!-- Helper text or error message below the dropdown -->
    <div v-if="helperText || hasError" class="location-dropdown__helper">
      <span v-if="hasError" class="location-dropdown__error" role="alert">
        {{ errorMessage }}
      </span>
      <span v-else-if="helperText" class="location-dropdown__helper-text">
        {{ helperText }}
      </span>
    </div>
  </div>
</template>

<!--
Component: LocationDropdown

A custom accessible dropdown component for selecting locations with rich HTML display.
Uses ARIA combobox/listbox pattern for full accessibility support.

Props:
  - modelValue?: string - Selected location ID (use v-model for two-way binding)
  - locations: Location[] - Array of location objects to display as options
  - label?: string - Visible label text
  - placeholder?: string - Placeholder text when no location is selected
  - helperText?: string - Helper text below the dropdown
  - disabled?: boolean - Disables the dropdown
  - required?: boolean - Marks as required and shows indicator
  - error?: boolean - Visual error state
  - errorMessage?: string - Error message to display
  - ariaLabel?: string - Accessible label for screen readers (when no visible label)
  - ariaDescribedby?: string - ID(s) of elements describing this dropdown

Emits:
  - update:modelValue (value: string | undefined) - Emitted when selection changes
  - change (value: string | undefined, location: Location | undefined) - Emitted with full location object
  - focus (event: FocusEvent) - Emitted when trigger receives focus
  - blur (event: FocusEvent) - Emitted when trigger loses focus

Keyboard Navigation:
  - Arrow Down/Up: Navigate through options
  - Enter/Space: Select current option and close
  - Escape: Close without selecting
  - Home: Jump to first option
  - End: Jump to last option
  - Type-ahead: Jump to option starting with typed character

Accessibility Features:
  - Full ARIA combobox/listbox pattern implementation
  - Keyboard navigation for all interactions
  - Screen reader announcements for selection changes
  - Focus management when opening/closing
  - Works with global accessibility classes (text size, high contrast)
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useAccessibilityStore } from '@/stores/accessibility'
import type { Location } from '@/types'

// Props interface with comprehensive accessibility support
interface Props {
  modelValue?: string
  locations: Location[]
  label?: string
  placeholder?: string
  helperText?: string
  disabled?: boolean
  required?: boolean
  error?: boolean
  errorMessage?: string
  ariaLabel?: string
  ariaDescribedby?: string
}

// Events emitted by this component
interface Emits {
  'update:modelValue': [value: string | undefined]
  change: [value: string | undefined, location: Location | undefined]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false,
  error: false,
})

const emit = defineEmits<Emits>()

// Template refs for DOM elements
const triggerRef = ref<HTMLButtonElement>()
const listboxRef = ref<HTMLUListElement>()

// Accessibility store for global accessibility classes
const accessibilityStore = useAccessibilityStore()

// Dropdown state
const isOpen = ref(false)
const activeIndex = ref(-1)

// Generate unique IDs for accessibility associations
const uniqueId = Math.random().toString(36).substring(2, 9)
const buttonId = computed(() => `location-dropdown-button-${uniqueId}`)
const listboxId = computed(() => `location-dropdown-listbox-${uniqueId}`)
const labelId = computed(() => `location-dropdown-label-${uniqueId}`)

// Computed: whether there's an error state
const hasError = computed(() => props.error || !!props.errorMessage)

// Computed: ID of the currently active option for aria-activedescendant
const activeDescendantId = computed(() => {
  if (!isOpen.value || activeIndex.value < 0) return undefined
  return `${listboxId.value}-option-${activeIndex.value}`
})

// Computed: the currently selected location object
const selectedLocation = computed(() => {
  if (!props.modelValue) return undefined
  return props.locations.find((loc) => loc.id === props.modelValue)
})

// Computed: CSS classes for the dropdown container
const dropdownClasses = computed(() => {
  const classes = ['location-dropdown', accessibilityStore.accessibilityClasses]

  if (props.disabled) classes.push('location-dropdown--disabled')
  if (hasError.value) classes.push('location-dropdown--error')
  if (isOpen.value) classes.push('location-dropdown--open')

  return classes.join(' ')
})

/**
 * Format city and state for display
 * Handles cases where one or both may be missing
 */
function formatCityState(location: Location): string {
  if (location.city && location.state) {
    return `${location.city}, ${location.state}`
  }
  return location.city || location.state || ''
}

/**
 * Toggle dropdown open/closed state
 */
function toggleDropdown(): void {
  if (props.disabled) return

  if (isOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
  }
}

/**
 * Open the dropdown and set initial active index
 */
function openDropdown(): void {
  if (props.disabled || props.locations.length === 0) return

  isOpen.value = true

  // Set active index to currently selected item, or first item if none selected
  const selectedIndex = props.locations.findIndex((loc) => loc.id === props.modelValue)
  activeIndex.value = selectedIndex >= 0 ? selectedIndex : 0

  // Focus the listbox after it becomes visible
  nextTick(() => {
    listboxRef.value?.focus()
    scrollActiveOptionIntoView()
  })
}

/**
 * Close the dropdown and return focus to trigger
 */
function closeDropdown(): void {
  isOpen.value = false
  activeIndex.value = -1
  triggerRef.value?.focus()
}

/**
 * Select a location and close the dropdown
 */
function selectLocation(location: Location): void {
  emit('update:modelValue', location.id)
  emit('change', location.id, location)
  closeDropdown()
}

/**
 * Scroll the active option into view within the listbox
 */
function scrollActiveOptionIntoView(): void {
  if (activeIndex.value < 0) return

  const optionId = `${listboxId.value}-option-${activeIndex.value}`
  const optionElement = document.getElementById(optionId)
  optionElement?.scrollIntoView({ block: 'nearest' })
}

/**
 * Handle keydown events on the trigger button
 * Opens dropdown on arrow down, space, or enter
 */
function handleTriggerKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowUp':
      event.preventDefault()
      openDropdown()
      break
    case ' ':
    case 'Enter':
      if (!isOpen.value) {
        event.preventDefault()
        openDropdown()
      }
      break
    case 'Escape':
      if (isOpen.value) {
        event.preventDefault()
        closeDropdown()
      }
      break
  }
}

/**
 * Handle keydown events on the listbox
 * Provides full keyboard navigation for option selection
 */
function handleListboxKeydown(event: KeyboardEvent): void {
  const lastIndex = props.locations.length - 1

  switch (event.key) {
    case 'ArrowDown':
      // Move to next option, wrap to first if at end
      event.preventDefault()
      activeIndex.value = activeIndex.value < lastIndex ? activeIndex.value + 1 : 0
      scrollActiveOptionIntoView()
      break

    case 'ArrowUp':
      // Move to previous option, wrap to last if at beginning
      event.preventDefault()
      activeIndex.value = activeIndex.value > 0 ? activeIndex.value - 1 : lastIndex
      scrollActiveOptionIntoView()
      break

    case 'Home':
      // Jump to first option
      event.preventDefault()
      activeIndex.value = 0
      scrollActiveOptionIntoView()
      break

    case 'End':
      // Jump to last option
      event.preventDefault()
      activeIndex.value = lastIndex
      scrollActiveOptionIntoView()
      break

    case 'Enter':
    case ' ':
      // Select the active option
      event.preventDefault()
      if (activeIndex.value >= 0 && activeIndex.value <= lastIndex) {
        // Even though we check the index bounds above, TypeScript cannot guarantee
        // that props.locations[activeIndex.value] is defined (the array could have
        // changed between the check and access). This additional check satisfies
        // TypeScript's strict type checking and guards against edge cases.
        const selectedOption = props.locations[activeIndex.value]
        if (selectedOption) {
          selectLocation(selectedOption)
        }
      }
      break

    case 'Escape':
      // Close without selecting
      event.preventDefault()
      closeDropdown()
      break

    case 'Tab':
      // Close on tab and allow normal tab behavior
      closeDropdown()
      break

    default:
      // Type-ahead: jump to option starting with typed character
      if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
        const char = event.key.toLowerCase()
        const startIndex = activeIndex.value + 1
        // Search from current position to end, then from beginning
        const searchOrder = [
          ...props.locations.slice(startIndex),
          ...props.locations.slice(0, startIndex),
        ]
        const matchIndex = searchOrder.findIndex((loc) =>
          loc.name.toLowerCase().startsWith(char),
        )
        if (matchIndex >= 0) {
          activeIndex.value = (startIndex + matchIndex) % props.locations.length
          scrollActiveOptionIntoView()
        }
      }
      break
  }
}

/**
 * Handle blur event on the trigger
 * Emits blur event for form validation integration
 */
function handleBlur(event: FocusEvent): void {
  // Only emit blur if focus is moving outside the dropdown entirely
  const relatedTarget = event.relatedTarget as HTMLElement | null
  if (relatedTarget && listboxRef.value?.contains(relatedTarget)) {
    return
  }

  // Small delay to allow click events to fire before closing
  setTimeout(() => {
    if (isOpen.value) {
      const activeElement = document.activeElement
      if (!triggerRef.value?.contains(activeElement) && !listboxRef.value?.contains(activeElement)) {
        closeDropdown()
        emit('blur', event)
      }
    } else {
      emit('blur', event)
    }
  }, 150)
}

/**
 * Handle clicks outside the dropdown to close it
 */
function handleClickOutside(event: MouseEvent): void {
  const target = event.target as HTMLElement
  if (
    isOpen.value &&
    !triggerRef.value?.contains(target) &&
    !listboxRef.value?.contains(target)
  ) {
    closeDropdown()
  }
}

// Set up click outside listener when component mounts
onMounted(() => {
  document.addEventListener('click', handleClickOutside, true)
})

// Clean up listener when component unmounts
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside, true)
})

// Reset active index when locations change
watch(
  () => props.locations,
  () => {
    if (isOpen.value) {
      const selectedIndex = props.locations.findIndex((loc) => loc.id === props.modelValue)
      activeIndex.value = selectedIndex >= 0 ? selectedIndex : 0
    }
  },
)
</script>

<style scoped>
/* Base dropdown container styles */
.location-dropdown {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
}

/* Label styles */
.location-dropdown__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text, #374151);
  line-height: 1.4;
}

.location-dropdown__label--required {
  font-weight: 600;
}

.location-dropdown__required {
  color: var(--color-error, #dc2626);
  margin-left: 0.25rem;
}

/* Wrapper for positioning the listbox relative to trigger */
.location-dropdown__wrapper {
  position: relative;
}

/* Trigger button styles - styled to match form inputs */
.location-dropdown__trigger {
  /* Reset button defaults */
  appearance: none;
  background: none;
  border: none;
  outline: none;
  cursor: pointer;
  text-align: left;

  /* Layout */
  width: 100%;
  padding: 0.75rem;
  padding-right: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;

  /* Typography */
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--color-text, #111827);

  /* Visual styling to match SelectInput */
  background-color: var(--color-input-bg, #ffffff);
  border: 1px solid var(--color-input-border, #d1d5db);
  border-radius: 0.375rem;

  /* Focus styles */
  outline: 2px solid transparent;
  outline-offset: 2px;
  transition: all 0.2s ease-in-out;
}

.location-dropdown__trigger:focus {
  outline: 2px solid var(--color-focus, #0066cc);
  outline-offset: 2px;
  border-color: var(--color-focus, #0066cc);
}

.location-dropdown__trigger:disabled {
  background-color: var(--color-input-disabled-bg, #f9fafb);
  color: var(--color-input-disabled-text, #9ca3af);
  cursor: not-allowed;
}

.location-dropdown__trigger--open {
  border-color: var(--color-focus, #0066cc);
}

/* Selected value display */
.location-dropdown__selected {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.location-dropdown__selected-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Placeholder text */
.location-dropdown__placeholder {
  color: var(--color-text-muted, #9ca3af);
  flex: 1;
}

/* Dropdown arrow */
.location-dropdown__arrow {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--color-text-muted, #6b7280);
}

.location-dropdown__arrow-icon {
  width: 1.25rem;
  height: 1.25rem;
  transition: transform 0.2s ease-in-out;
}

.location-dropdown__arrow-icon--open {
  transform: rotate(180deg);
}

/* Listbox (dropdown options container) */
.location-dropdown__listbox {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 50;

  /* Layout */
  list-style: none;
  margin: 0;
  padding: 0.25rem 0;
  max-height: 300px;
  overflow-y: auto;

  /* Visual styling */
  background-color: var(--color-bg, #ffffff);
  border: 1px solid var(--color-input-border, #d1d5db);
  border-radius: 0.375rem;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Empty state message */
.location-dropdown__empty {
  padding: 1rem;
  text-align: center;
  color: var(--color-text-muted, #6b7280);
  font-style: italic;
}

/* Individual option styles */
.location-dropdown__option {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}

.location-dropdown__option:hover,
.location-dropdown__option--active {
  background-color: var(--color-bg-hover, #f3f4f6);
}

.location-dropdown__option--selected {
  background-color: var(--color-primary-light, #e0f2fe);
}

.location-dropdown__option--selected.location-dropdown__option--active {
  background-color: var(--color-primary-light-hover, #bae6fd);
}

/* Option text styles - Name is bold/primary */
.location-dropdown__option-name {
  font-weight: 600;
  color: var(--color-text, #111827);
  line-height: 1.4;
}

/* Address and city/state are small gray text */
.location-dropdown__option-address,
.location-dropdown__option-city {
  font-size: 0.875rem;
  color: var(--color-text-muted, #6b7280);
  line-height: 1.3;
}

/* Helper/error text below dropdown */
.location-dropdown__helper {
  font-size: 0.75rem;
  line-height: 1.4;
}

.location-dropdown__helper-text {
  color: var(--color-text-muted, #6b7280);
}

.location-dropdown__error {
  color: var(--color-error, #dc2626);
  font-weight: 500;
}

/* Error state styling */
.location-dropdown--error .location-dropdown__trigger {
  border-color: var(--color-error, #dc2626);
}

.location-dropdown--error .location-dropdown__trigger:focus {
  outline-color: var(--color-error, #dc2626);
  border-color: var(--color-error, #dc2626);
}

/* Disabled state styling */
.location-dropdown--disabled .location-dropdown__trigger {
  background-color: var(--color-input-disabled-bg, #f9fafb);
  color: var(--color-input-disabled-text, #9ca3af);
  cursor: not-allowed;
}

/* Text size support for accessibility */
.text-size-small .location-dropdown__label {
  font-size: 0.8125rem;
}

.text-size-small .location-dropdown__trigger {
  font-size: 0.875rem;
}

.text-size-small .location-dropdown__option-name {
  font-size: 0.875rem;
}

.text-size-small .location-dropdown__option-address,
.text-size-small .location-dropdown__option-city {
  font-size: 0.75rem;
}

.text-size-large .location-dropdown__label {
  font-size: 0.9375rem;
}

.text-size-large .location-dropdown__trigger {
  font-size: 1.125rem;
}

.text-size-large .location-dropdown__option-name {
  font-size: 1.125rem;
}

.text-size-large .location-dropdown__option-address,
.text-size-large .location-dropdown__option-city {
  font-size: 1rem;
}

.text-size-extra-large .location-dropdown__label {
  font-size: 1rem;
}

.text-size-extra-large .location-dropdown__trigger {
  font-size: 1.25rem;
}

.text-size-extra-large .location-dropdown__option-name {
  font-size: 1.25rem;
}

.text-size-extra-large .location-dropdown__option-address,
.text-size-extra-large .location-dropdown__option-city {
  font-size: 1.125rem;
}

/* High contrast mode */
.high-contrast .location-dropdown__trigger {
  border: 2px solid var(--color-text, #000000);
  background-color: var(--color-bg, #ffffff);
}

.high-contrast .location-dropdown__trigger:focus {
  outline: 3px solid var(--color-focus, #000000);
  outline-offset: 3px;
  border-color: var(--color-focus, #000000);
}

.high-contrast .location-dropdown__listbox {
  border: 2px solid var(--color-text, #000000);
}

.high-contrast .location-dropdown__option--active {
  outline: 2px solid var(--color-text, #000000);
  outline-offset: -2px;
}

.high-contrast .location-dropdown--error .location-dropdown__trigger {
  border-color: var(--color-error, #000000);
}

/* Reduced motion support */
.reduced-motion .location-dropdown__trigger {
  transition: none;
}

.reduced-motion .location-dropdown__arrow-icon {
  transition: none;
}

.reduced-motion .location-dropdown__option {
  transition: none;
}
</style>
