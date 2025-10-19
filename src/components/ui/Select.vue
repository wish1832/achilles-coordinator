<template>
  <div class="select" :class="selectClasses">
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
      class="select__label"
      :class="{ 'select__label--required': required }"
    >
      {{ label }}
      <span v-if="required" class="select__required" aria-label="required">*</span>
    </label>

    <!-- Select wrapper -->
    <div class="select__wrapper">
      <select
        :id="inputId"
        ref="selectRef"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        :aria-label="ariaLabel"
        :aria-describedby="ariaDescribedby"
        :aria-invalid="hasError"
        :aria-required="required"
        class="select__input"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      >
        <!-- Placeholder option -->
        <option v-if="placeholder" value="" disabled :selected="!modelValue">
          {{ placeholder }}
        </option>

        <!-- Options -->
        <option
          v-for="option in options"
          :key="getOptionValue(option)"
          :value="getOptionValue(option)"
          :disabled="getOptionDisabled(option)"
        >
          {{ getOptionLabel(option) }}
        </option>
      </select>

      <!-- Custom dropdown arrow -->
      <div class="select__arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24" class="select__arrow-icon">
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </div>

    <!-- Helper text -->
    <div v-if="helperText || hasError" class="select__helper">
      <span v-if="hasError" class="select__error" role="alert">
        {{ errorMessage }}
      </span>
      <span v-else-if="helperText" class="select__helper-text">
        {{ helperText }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useAccessibilityStore } from '@/stores/accessibility'

// Option type - can be string, object with value/label, or custom object
type SelectOption = string | { value: any; label: string; disabled?: boolean } | Record<string, any>

// Props with comprehensive accessibility support
interface Props {
  // Value
  modelValue?: string | number
  options: SelectOption[]

  // Content
  label?: string
  placeholder?: string
  helperText?: string

  // Behavior
  disabled?: boolean
  required?: boolean
  clearable?: boolean

  // Validation
  error?: boolean
  errorMessage?: string

  // Accessibility
  ariaLabel?: string
  ariaDescribedby?: string

  // Custom option handling
  valueKey?: string
  labelKey?: string
  disabledKey?: string

  // Visual variants
  size?: 'small' | 'medium' | 'large'
  variant?: 'default' | 'filled' | 'outlined'

  // Additional classes
  class?: string
}

// Emits
interface Emits {
  'update:modelValue': [value: string | number | undefined]
  change: [value: string | number | undefined, option: SelectOption | undefined]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false,
  clearable: false,
  error: false,
  size: 'medium',
  variant: 'default',
  valueKey: 'value',
  labelKey: 'label',
  disabledKey: 'disabled',
})

const emit = defineEmits<Emits>()

// Refs
const selectRef = ref<HTMLSelectElement>()

// Accessibility store
const accessibilityStore = useAccessibilityStore()

// Generate unique ID for accessibility
const inputId = computed(() => `select-${Math.random().toString(36).substr(2, 9)}`)

// Computed properties
const hasError = computed(() => props.error || !!props.errorMessage)

const selectClasses = computed(() => {
  const classes = [
    'select',
    `select--${props.size}`,
    `select--${props.variant}`,
    accessibilityStore.accessibilityClasses,
  ]

  if (props.disabled) classes.push('select--disabled')
  if (hasError.value) classes.push('select--error')
  if (props.class) classes.push(props.class)

  return classes.join(' ')
})

// Option handling methods
function getOptionValue(option: SelectOption): string | number {
  if (typeof option === 'string') return option
  if (typeof option === 'object' && option !== null) {
    return option[props.valueKey] ?? option.value ?? option
  }
  return option
}

function getOptionLabel(option: SelectOption): string {
  if (typeof option === 'string') return option
  if (typeof option === 'object' && option !== null) {
    return option[props.labelKey] ?? option.label ?? String(option.value ?? option)
  }
  return String(option)
}

function getOptionDisabled(option: SelectOption): boolean {
  if (typeof option === 'string') return false
  if (typeof option === 'object' && option !== null) {
    return option[props.disabledKey] ?? option.disabled ?? false
  }
  return false
}

// Event handlers
function handleChange(event: Event): void {
  const target = event.target as HTMLSelectElement
  const value = target.value
  const option = props.options.find((opt) => getOptionValue(opt) == value)

  emit('update:modelValue', value || undefined)
  emit('change', value || undefined, option)
}

function handleFocus(event: FocusEvent): void {
  emit('focus', event)
}

function handleBlur(event: FocusEvent): void {
  emit('blur', event)
}

function handleKeydown(event: KeyboardEvent): void {
  // Allow default keyboard navigation
  // The native select element handles arrow keys, space, enter, etc.
}

// Public methods
function focus(): void {
  selectRef.value?.focus()
}

function blur(): void {
  selectRef.value?.blur()
}

// Expose methods for parent components
defineExpose({
  focus,
  blur,
})
</script>

<style scoped>
/* Base select styles with accessibility considerations */
.select {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.select__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text, #374151);
  line-height: 1.4;
}

.select__label--required {
  font-weight: 600;
}

.select__required {
  color: var(--color-error, #dc2626);
  margin-left: 0.25rem;
}

.select__wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.select__input {
  /* Reset default styles */
  appearance: none;
  background: none;
  border: none;
  outline: none;

  /* Layout */
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 0.75rem;

  /* Typography */
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--color-text, #111827);

  /* Visual styling */
  background-color: var(--color-input-bg, #ffffff);
  border: 1px solid var(--color-input-border, #d1d5db);
  border-radius: 0.375rem;

  /* Transitions */
  transition: all 0.2s ease-in-out;

  /* Focus styles */
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.select__input:focus {
  outline: 2px solid var(--color-focus, #0066cc);
  outline-offset: 2px;
  border-color: var(--color-focus, #0066cc);
}

.select__input:disabled {
  background-color: var(--color-input-disabled-bg, #f9fafb);
  color: var(--color-input-disabled-text, #9ca3af);
  cursor: not-allowed;
}

.select__arrow {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--color-text-muted, #6b7280);
}

.select__arrow-icon {
  width: 1.25rem;
  height: 1.25rem;
  transition: transform 0.2s ease-in-out;
}

.select__input:focus + .select__arrow {
  color: var(--color-focus, #0066cc);
}

/* Size variants */
.select--small .select__input {
  padding: 0.5rem 2rem 0.5rem 0.5rem;
  font-size: 0.875rem;
}

.select--small .select__arrow {
  right: 0.5rem;
}

.select--small .select__arrow-icon {
  width: 1rem;
  height: 1rem;
}

.select--large .select__input {
  padding: 1rem 2.5rem 1rem 1rem;
  font-size: 1.125rem;
}

.select--large .select__arrow {
  right: 1rem;
}

.select--large .select__arrow-icon {
  width: 1.5rem;
  height: 1.5rem;
}

/* Visual variants */
.select--default .select__input {
  /* Uses base styles */
}

.select--filled .select__input {
  background-color: var(--color-input-filled-bg, #f3f4f6);
  border: 1px solid transparent;
}

.select--filled .select__input:focus {
  background-color: var(--color-input-bg, #ffffff);
  border-color: var(--color-focus, #0066cc);
}

.select--outlined .select__input {
  background-color: transparent;
  border: 2px solid var(--color-input-border, #d1d5db);
}

/* States */
.select--disabled .select__input {
  background-color: var(--color-input-disabled-bg, #f9fafb);
  color: var(--color-input-disabled-text, #9ca3af);
  cursor: not-allowed;
}

.select--error .select__input {
  border-color: var(--color-error, #dc2626);
}

.select--error .select__input:focus {
  outline-color: var(--color-error, #dc2626);
  border-color: var(--color-error, #dc2626);
}

/* Helper text */
.select__helper {
  font-size: 0.75rem;
  line-height: 1.4;
}

.select__helper-text {
  color: var(--color-text-muted, #6b7280);
}

.select__error {
  color: var(--color-error, #dc2626);
  font-weight: 500;
}

/* Text size support */
.text-size-small .select__label {
  font-size: 0.8125rem;
}

.text-size-small .select__input {
  font-size: 0.875rem;
}

.text-size-large .select__label {
  font-size: 0.9375rem;
}

.text-size-large .select__input {
  font-size: 1.125rem;
}

.text-size-extra-large .select__label {
  font-size: 1rem;
}

.text-size-extra-large .select__input {
  font-size: 1.25rem;
}

/* High contrast mode */
.high-contrast .select__input {
  border: 2px solid var(--color-text, #000000);
  background-color: var(--color-bg, #ffffff);
}

.high-contrast .select__input:focus {
  outline: 3px solid var(--color-focus, #000000);
  outline-offset: 3px;
  border-color: var(--color-focus, #000000);
}

.high-contrast .select--error .select__input {
  border-color: var(--color-error, #000000);
}

.high-contrast .select--error .select__input:focus {
  outline-color: var(--color-error, #000000);
  border-color: var(--color-error, #000000);
}

/* Reduced motion support */
.reduced-motion .select__input {
  transition: none;
}

.reduced-motion .select__arrow-icon {
  transition: none;
}
</style>
