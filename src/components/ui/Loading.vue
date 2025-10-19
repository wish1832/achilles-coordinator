<template>
  <div :class="loadingClasses" :aria-label="ariaLabel" :aria-live="ariaLive" role="status">
    <!-- Spinner -->
    <div v-if="type === 'spinner'" class="loading__spinner" aria-hidden="true">
      <svg class="loading__spinner-icon" viewBox="0 0 24 24">
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
    </div>

    <!-- Dots -->
    <div v-else-if="type === 'dots'" class="loading__dots" aria-hidden="true">
      <span class="loading__dot"></span>
      <span class="loading__dot"></span>
      <span class="loading__dot"></span>
    </div>

    <!-- Pulse -->
    <div v-else-if="type === 'pulse'" class="loading__pulse" aria-hidden="true">
      <div class="loading__pulse-circle"></div>
    </div>

    <!-- Text -->
    <span v-if="text" class="loading__text">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAccessibilityStore } from '@/stores/accessibility'

// Props
interface Props {
  // Loading type
  type?: 'spinner' | 'dots' | 'pulse'

  // Content
  text?: string

  // Accessibility
  ariaLabel?: string
  ariaLive?: 'polite' | 'assertive' | 'off'

  // Visual variants
  size?: 'small' | 'medium' | 'large'
  color?: 'primary' | 'secondary' | 'muted'

  // Layout
  centered?: boolean
  fullscreen?: boolean

  // Additional classes
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'spinner',
  ariaLabel: 'Loading',
  ariaLive: 'polite',
  size: 'medium',
  color: 'primary',
  centered: false,
  fullscreen: false,
})

// Accessibility store
const accessibilityStore = useAccessibilityStore()

// Computed classes
const loadingClasses = computed(() => {
  const classes = [
    'loading',
    `loading--${props.type}`,
    `loading--${props.size}`,
    `loading--${props.color}`,
    accessibilityStore.accessibilityClasses,
  ]

  if (props.centered) classes.push('loading--centered')
  if (props.fullscreen) classes.push('loading--fullscreen')
  if (props.class) classes.push(props.class)

  return classes.join(' ')
})
</script>

<style scoped>
/* Base loading styles */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: var(--color-text, #374151);
}

/* Loading types */
.loading__spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading__spinner-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-primary, #0066cc);
}

.loading__dots {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.loading__dot {
  width: 0.5rem;
  height: 0.5rem;
  background-color: var(--color-primary, #0066cc);
  border-radius: 50%;
  animation: loadingDots 1.4s ease-in-out infinite both;
}

.loading__dot:nth-child(1) {
  animation-delay: -0.32s;
}

.loading__dot:nth-child(2) {
  animation-delay: -0.16s;
}

.loading__pulse {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading__pulse-circle {
  width: 1.5rem;
  height: 1.5rem;
  background-color: var(--color-primary, #0066cc);
  border-radius: 50%;
  animation: loadingPulse 1.5s ease-in-out infinite;
}

.loading__text {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text, #374151);
}

/* Size variants */
.loading--small .loading__spinner-icon {
  width: 1rem;
  height: 1rem;
}

.loading--small .loading__dot {
  width: 0.375rem;
  height: 0.375rem;
}

.loading--small .loading__pulse-circle {
  width: 1rem;
  height: 1rem;
}

.loading--small .loading__text {
  font-size: 0.75rem;
}

.loading--large .loading__spinner-icon {
  width: 2rem;
  height: 2rem;
}

.loading--large .loading__dot {
  width: 0.75rem;
  height: 0.75rem;
}

.loading--large .loading__pulse-circle {
  width: 2rem;
  height: 2rem;
}

.loading--large .loading__text {
  font-size: 1rem;
}

/* Color variants */
.loading--primary {
  color: var(--color-primary, #0066cc);
}

.loading--primary .loading__spinner-icon,
.loading--primary .loading__dot,
.loading--primary .loading__pulse-circle {
  color: var(--color-primary, #0066cc);
  background-color: var(--color-primary, #0066cc);
}

.loading--secondary {
  color: var(--color-secondary, #6b7280);
}

.loading--secondary .loading__spinner-icon,
.loading--secondary .loading__dot,
.loading--secondary .loading__pulse-circle {
  color: var(--color-secondary, #6b7280);
  background-color: var(--color-secondary, #6b7280);
}

.loading--muted {
  color: var(--color-text-muted, #9ca3af);
}

.loading--muted .loading__spinner-icon,
.loading--muted .loading__dot,
.loading--muted .loading__pulse-circle {
  color: var(--color-text-muted, #9ca3af);
  background-color: var(--color-text-muted, #9ca3af);
}

/* Layout variants */
.loading--centered {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.loading--fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-overlay, rgba(255, 255, 255, 0.8));
  backdrop-filter: blur(2px);
  z-index: 1000;
}

/* Text size support */
.text-size-small .loading__text {
  font-size: 0.75rem;
}

.text-size-large .loading__text {
  font-size: 1rem;
}

.text-size-extra-large .loading__text {
  font-size: 1.125rem;
}

/* High contrast mode */
.high-contrast .loading__spinner-icon,
.high-contrast .loading__dot,
.high-contrast .loading__pulse-circle {
  color: var(--color-text, #000000);
  background-color: var(--color-text, #000000);
}

.high-contrast .loading__text {
  color: var(--color-text, #000000);
}

/* Reduced motion support */
.reduced-motion .loading__spinner-icon,
.reduced-motion .loading__dot,
.reduced-motion .loading__pulse-circle {
  animation: none;
}

/* Animations */
@keyframes loadingDots {
  0%,
  80%,
  100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes loadingPulse {
  0% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
}
</style>
