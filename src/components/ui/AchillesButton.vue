<template>
  <button
    :class="buttonClasses"
    :type="type"
    :disabled="disabled || loading"
    :aria-label="ariaLabel"
    :aria-describedby="ariaDescribedby"
    :aria-pressed="ariaPressed"
    :aria-expanded="ariaExpanded"
    :aria-haspopup="ariaHaspopup"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <!-- Loading spinner for loading state -->
    <span v-if="loading" class="button__spinner" aria-hidden="true">
      <svg class="button__spinner-icon" viewBox="0 0 24 24">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
          stroke-dasharray="31.416"
          stroke-dashoffset="31.416"
        >
          <animate
            attributeName="stroke-dasharray"
            dur="2s"
            values="0 31.416;15.708 15.708;0 31.416"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-dashoffset"
            dur="2s"
            values="0;-15.708;-31.416"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </span>

    <!-- Button content -->
    <span class="button__content" :class="{ 'button__content--loading': loading }">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAccessibilityStore } from '@/stores/accessibility'

// Props with comprehensive accessibility support
interface Props {
  // Button behavior
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean

  // Visual variants
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link'
  size?: 'small' | 'medium' | 'large'

  // Accessibility props
  ariaLabel?: string
  ariaDescribedby?: string
  ariaPressed?: boolean | 'true' | 'false'
  ariaExpanded?: boolean | 'true' | 'false'
  ariaHaspopup?: boolean | 'true' | 'false' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'

  // Additional classes
  class?: string
}

// Emits
interface Emits {
  click: [event: MouseEvent]
  keydown: [event: KeyboardEvent]
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  disabled: false,
  loading: false,
  variant: 'primary',
  size: 'medium',
  ariaPressed: undefined,
  ariaExpanded: undefined,
  ariaHaspopup: undefined,
})

const emit = defineEmits<Emits>()

// Accessibility store for theme classes
const accessibilityStore = useAccessibilityStore()

// Computed classes for styling
const buttonClasses = computed(() => {
  const classes = [
    'button',
    `button--${props.variant}`,
    `button--${props.size}`,
    accessibilityStore.accessibilityClasses,
  ]

  if (props.disabled) classes.push('button--disabled')
  if (props.loading) classes.push('button--loading')
  if (props.class) classes.push(props.class)

  return classes.join(' ')
})

// Event handlers with accessibility considerations
function handleClick(event: MouseEvent): void {
  if (props.disabled || props.loading) {
    event.preventDefault()
    return
  }
  emit('click', event)
}

function handleKeydown(event: KeyboardEvent): void {
  // Ensure proper keyboard interaction
  if (props.disabled || props.loading) {
    event.preventDefault()
    return
  }

  // Handle space and enter keys for button activation
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    // Trigger click programmatically for consistency
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    })
    handleClick(clickEvent)
  }

  emit('keydown', event)
}
</script>

<style scoped>
/* Base button styles with accessibility considerations */
.button {
  /* Reset default button styles */
  border: none;
  background: none;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  cursor: pointer;

  /* Layout */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  position: relative;

  /* Typography */
  font-weight: 500;
  text-decoration: none;

  /* Transitions */
  transition: all 0.2s ease-in-out;

  /* Focus styles - always visible for accessibility */
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.button:focus-visible {
  outline: 2px solid var(--color-focus, #0066cc);
  outline-offset: 2px;
}

/* High contrast mode support */
.high-contrast .button:focus-visible {
  outline: 3px solid var(--color-focus, #ffffff);
  outline-offset: 3px;
}

/* Size variants */
.button--small {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  min-height: 2rem;
}

.button--medium {
  padding: 0.75rem 1rem;
  font-size: 1rem;
  min-height: 2.5rem;
}

.button--large {
  padding: 1rem 1.5rem;
  font-size: 1.125rem;
  min-height: 3rem;
}

/* Text size support */
.text-size-small .button {
  font-size: calc(1rem * 0.875);
}

.text-size-large .button {
  font-size: calc(1rem * 1.125);
}

.text-size-extra-large .button {
  font-size: calc(1rem * 1.25);
}

/* Variant styles */
.button--primary {
  background-color: var(--color-primary, #0066cc);
  color: var(--color-primary-text, #ffffff);
  border-radius: 0.375rem;
}

.button--primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover, #0052a3);
}

.button--secondary {
  background-color: var(--color-secondary, #f8f9fa);
  color: var(--color-secondary-text, #212529);
  border: 1px solid var(--color-border, #dee2e6);
  border-radius: 0.375rem;
}

.button--secondary:hover:not(:disabled) {
  background-color: var(--color-secondary-hover, #e9ecef);
}
</style>
