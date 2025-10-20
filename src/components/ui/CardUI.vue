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
        <h3 v-if="title" :id="titleId" class="card__title">{{ title }}</h3>
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

/* Size variants */
.card--small {
  padding: 1rem;
}

.card--medium {
  padding: 1.5rem;
}

.card--large {
  padding: 2rem;
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
.card__header {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-card-border, #e5e7eb);
}

.card__title {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text, #111827);
  line-height: 1.4;
}

.card__subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted, #6b7280);
  line-height: 1.4;
}

.card__content {
  flex: 1;
  color: var(--color-text, #111827);
  line-height: 1.6;
}

.card__footer {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-card-border, #e5e7eb);
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
  border-bottom-color: var(--color-text, #000000);
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
