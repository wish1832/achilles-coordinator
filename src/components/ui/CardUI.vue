<template>
  <article
    :class="cardClasses"
    :aria-labelledby="ariaLabelledby"
    :aria-describedby="ariaDescribedby"
    :role="role"
  >
    <!-- Optional header section -->
    <header v-if="$slots.header || title" class="card__header">
      <slot name="header">
        <h2 v-if="title" :id="titleId" class="card__title">{{ title }}</h2>
        <p v-if="subtitle" class="card__subtitle">{{ subtitle }}</p>
      </slot>
    </header>

    <!-- Main content area -->
    <div class="card__content">
      <slot />
    </div>

    <!-- Optional footer section -->
    <footer v-if="$slots.footer" class="card__footer">
      <slot name="footer" />
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAccessibilityStore } from '@/stores/accessibility'

// Props with accessibility support
interface Props {
  // Content
  title?: string
  subtitle?: string

  // Accessibility
  ariaLabelledby?: string
  ariaDescribedby?: string
  role?: string

  // Visual variants
  variant?: 'default' | 'elevated' | 'outlined' | 'filled'
  size?: 'small' | 'medium' | 'large'

  // Interactive states
  clickable?: boolean
  selected?: boolean

  // Additional classes
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'medium',
  clickable: false,
  selected: false,
  role: 'article',
})

// Accessibility store for theme classes
const accessibilityStore = useAccessibilityStore()

// Generate unique ID for title if provided
const titleId = computed(() => {
  return props.title ? `card-title-${Math.random().toString(36).substr(2, 9)}` : undefined
})

// Computed classes for styling
const cardClasses = computed(() => {
  const classes = [
    'card',
    `card--${props.variant}`,
    `card--${props.size}`,
    accessibilityStore.accessibilityClasses,
  ]

  if (props.clickable) classes.push('card--clickable')
  if (props.selected) classes.push('card--selected')
  if (props.class) classes.push(props.class)

  return classes.join(' ')
})
</script>

<style scoped>
/* Base card styles with accessibility considerations */
.card {
  /* Layout */
  display: flex;
  flex-direction: column;

  /* Visual styling */
  background-color: var(--color-card-bg, #ffffff);
  border: 1px solid var(--color-card-border, #e5e7eb);
  border-radius: 0.5rem;

  /* Spacing */
  overflow: hidden;

  /* Focus styles for clickable cards */
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.card--clickable {
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.card--clickable:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-hover, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
}

.card--clickable:focus-visible {
  outline: 2px solid var(--color-focus, #0066cc);
  outline-offset: 2px;
}

.card--selected {
  border-color: var(--color-primary, #0066cc);
  box-shadow: 0 0 0 1px var(--color-primary, #0066cc);
}

/* Visual variants */
.card--default {
  /* Uses base styles */
}

.card--elevated {
  box-shadow: var(
    --shadow-elevated,
    0 1px 3px 0 rgba(0, 0, 0, 0.1),
    0 1px 2px 0 rgba(0, 0, 0, 0.06)
  );
}

.card--outlined {
  border: 2px solid var(--color-card-border, #e5e7eb);
  background-color: transparent;
}

.card--filled {
  background-color: var(--color-card-filled, #f8f9fa);
  border: none;
}

/* Card sections */
/* Header extends to full width without negative margins */
.card__header {
  padding: 1rem 1.5rem;
  background: linear-gradient(
    135deg,
    var(--color-primary, #0066cc) 0%,
    var(--color-primary-hover, #0052a3) 100%
  );
}

/* Adjust header padding for different card sizes */
.card--small .card__header {
  padding: 0.75rem 1rem;
}

.card--large .card__header {
  padding: 1.25rem 2rem;
}

.card__title {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.4;
}

.card__subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
}

/* Content section - padding depends on card size and whether header exists */
.card__content {
  flex: 1;
  padding: 1.5rem;
  color: var(--color-text, #111827);
  line-height: 1.6;
}

/* If header exists, reduce top padding of content */
.card__header + .card__content {
  padding-top: 1rem;
}

/* Size-specific content padding */
.card--small .card__content {
  padding: 1rem;
}

.card--small .card__header + .card__content {
  padding-top: 1rem;
}

.card--large .card__content {
  padding: 2rem;
}

.card--large .card__header + .card__content {
  padding-top: 1rem;
}

/* Footer section */
.card__footer {
  padding: 0 1.5rem 1.5rem 1.5rem;
  border-top: 1px solid var(--color-card-border, #e5e7eb);
}

/* Size-specific footer padding */
.card--small .card__footer {
  padding: 0 1rem 1rem 1rem;
}

.card--large .card__footer {
  padding: 0 2rem 2rem 2rem;
}

/* Text size support */
.text-size-small .card__title {
  font-size: 1.125rem;
}

.text-size-small .card__subtitle {
  font-size: 0.8125rem;
}

.text-size-large .card__title {
  font-size: 1.375rem;
}

.text-size-large .card__subtitle {
  font-size: 0.9375rem;
}

.text-size-extra-large .card__title {
  font-size: 1.5rem;
}

.text-size-extra-large .card__subtitle {
  font-size: 1rem;
}

/* High contrast mode */
.high-contrast .card {
  border: 2px solid var(--color-text, #000000);
  background-color: var(--color-bg, #ffffff);
}

.high-contrast .card--clickable:focus-visible {
  outline: 3px solid var(--color-focus, #000000);
  outline-offset: 3px;
}

.high-contrast .card--selected {
  border-color: var(--color-primary, #000000);
  box-shadow: 0 0 0 2px var(--color-primary, #000000);
}

.high-contrast .card__header {
  background: var(--color-primary, #000000);
}

.high-contrast .card__title {
  color: #ffffff;
}

.high-contrast .card__subtitle {
  color: rgba(255, 255, 255, 0.9);
}

.high-contrast .card__footer {
  border-top-color: var(--color-text, #000000);
}

/* Reduced motion support */
.reduced-motion .card--clickable {
  transition: none;
}

.reduced-motion .card--clickable:hover {
  transform: none;
}
</style>
