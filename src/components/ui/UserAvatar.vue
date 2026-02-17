<template>
  <!--
    Avatar component that displays user initials in a circular badge.
    Initials are derived from the display name: first letter of first two words.
    Size can be configured via the size prop.
  -->
  <span
    class="user-avatar"
    :class="[
      `user-avatar--${size}`,
      `user-avatar--${variant}`,
      { 'user-avatar--inline': inline }
    ]"
    :aria-label="`Avatar for ${displayName}`"
    role="img"
  >
    {{ initials }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props definition
const props = withDefaults(
  defineProps<{
    // The user's display name to derive initials from
    displayName: string
    // Size of the avatar: 'small', 'medium', or 'large'
    size?: 'small' | 'medium' | 'large'
    // Visual variant: 'default' for standard blue background, 'header' for transparent header style
    variant?: 'default' | 'header'
    // Whether the avatar should display inline with text
    inline?: boolean
  }>(),
  {
    size: 'medium',
    variant: 'default',
    inline: false,
  },
)

/**
 * Compute initials from the display name.
 * Takes the first letter of up to the first two words.
 * Returns '?' if the name is empty.
 */
const initials = computed(() => {
  const name = props.displayName.trim()
  if (!name) return '?'

  // Split by whitespace to get individual words, filtering out empty strings
  const words = name.split(/\s+/).filter((word) => word.length > 0)

  // Get the first letter of the first word
  const firstInitial = words[0]?.charAt(0).toUpperCase() ?? '?'

  if (words.length === 1) {
    // Single word: return just the first letter
    return firstInitial
  } else {
    // Multiple words: return first letter of first two words
    const secondInitial = words[1]?.charAt(0).toUpperCase() ?? ''
    return firstInitial + secondInitial
  }
})
</script>

<style scoped>
/* Base avatar styles */
.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: var(--color-primary, #0066cc);
  color: white;
  font-weight: 600;
  text-transform: uppercase;
  user-select: none;
  flex-shrink: 0;
}

/* Inline variant for use within text */
.user-avatar--inline {
  display: inline-flex;
  vertical-align: middle;
}

/* Size variants */
.user-avatar--small {
  width: 1.75rem;
  height: 1.75rem;
  font-size: 0.6875rem;
}

.user-avatar--medium {
  width: 2.25rem;
  height: 2.25rem;
  font-size: 0.8125rem;
}

.user-avatar--large {
  width: 2.75rem;
  height: 2.75rem;
  font-size: 1rem;
}

/* Variant: default (blue background) */
.user-avatar--default {
  background-color: var(--color-primary, #0066cc);
  color: white;
}

/* Variant: header (transparent with border, for use in header) */
.user-avatar--header {
  background-color: transparent;
  color: white;
  border: none;
}

/* High contrast mode */
.high-contrast .user-avatar {
  border: 2px solid var(--color-text, #000000);
}
</style>
