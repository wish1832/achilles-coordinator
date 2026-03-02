<template>
  <div class="pairing-column guides-column">
    <h3 class="column-heading">Unpaired Guides ({{ guides.length }})</h3>

    <!-- No guides message -->
    <div v-if="guides.length === 0" class="empty-message">
      <p>
        {{
          totalGuides === 0
            ? 'No guides have signed up for this run yet.'
            : 'All guides are currently paired.'
        }}
      </p>
    </div>

    <!-- Guides list -->
    <div v-else class="cards-list">
      <div
        v-for="(guide, index) in guides"
        :key="guide.id"
        :ref="(el) => setGuideCardRef(el, index)"
        class="person-card-wrapper guide-card-wrapper"
        :class="{
          'is-selected': selectedGuideId === guide.id,
        }"
        role="button"
        tabindex="0"
        :aria-label="`Guide: ${guide.displayName}, available${getGuideCompatibilityLabel(guide.id)}${selectedGuideId === guide.id ? ', selected' : ''}. ${selectedAthleteId ? 'Press Enter or Space to pair with selected athlete' : ''}`"
        @click="$emit('select-guide', guide.id)"
        @keydown="handleGuideKeydown($event, guide.id, index)"
      >
        <CardUI class="person-card guide-card" :style="getGuideCardStyle(guide.id)">
          <div class="person-card__content">
            <div class="person-info">
              <div class="person-name-wrapper">
                <h4 class="person-name">{{ guide.displayName }}</h4>
                <span class="role-badge role-badge--guide">Guide</span>
              </div>
              <p v-if="formattedPace(guide.id)" class="person-detail">
                Max pace: {{ formattedPace(guide.id) }} min/mile
              </p>
              <p v-if="guide.profileDetails.activities?.length" class="person-detail">
                Activities: {{ guide.profileDetails.activities.join(', ') }}
              </p>
              <p
                v-if="guide.profileDetails.certifications?.length"
                class="person-detail certification"
              >
                <span class="certification-badge">✓</span>
                {{ guide.profileDetails.certifications.join(', ') }}
              </p>
            </div>

            <!-- Pairing status badge -->
            <div class="pairing-badge">
              <span class="badge available-badge">Available</span>
            </div>

            <!-- Selection indicator -->
            <div v-if="selectedGuideId === guide.id" class="selection-indicator">
              <span class="selection-badge">Selected</span>
            </div>
          </div>
        </CardUI>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CardUI from '@/components/ui/CardUI.vue'
import type { User } from '@/types'

interface Props {
  guides: User[] // unpaired only
  totalGuides?: number // total guides (for empty message logic)
  selectedGuideId: string | null
  selectedAthleteId: string | null
  formattedPace: (userId: string) => string | undefined
  getGuideCardStyle: (guideId: string) => Record<string, string>
  getGuideCompatibilityLabel: (guideId: string) => string
}

interface Emits {
  'select-guide': [guideId: string]
  'keydown-navigate': [event: KeyboardEvent, guideId: string, index: number]
}

const props = withDefaults(defineProps<Props>(), {
  totalGuides: 0,
})
const emit = defineEmits<Emits>()

// Refs for card elements to enable keyboard navigation
const guideCardRefs = ref<(HTMLElement | null)[]>([])

/**
 * Set reference to a guide card element
 */
function setGuideCardRef(el: unknown, index: number): void {
  if (el instanceof HTMLElement) {
    guideCardRefs.value[index] = el
  } else {
    guideCardRefs.value[index] = null
  }
}

/**
 * Focus a card element at a specific index
 */
function focusCard(index: number): void {
  if (index < 0 || index >= guideCardRefs.value.length) return

  const card = guideCardRefs.value[index]
  if (card) {
    card.focus()
  }
}

/**
 * Handle keyboard events on guide cards
 * Enter/Space: Select guide (or pair if athlete already selected)
 * ArrowUp/ArrowDown: Navigate between guide cards
 * Home: Jump to first guide
 * End: Jump to last guide
 * Escape: Clear selection
 */
function handleGuideKeydown(event: KeyboardEvent, guideId: string, currentIndex: number): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('select-guide', guideId)
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    emit('keydown-navigate', event, guideId, currentIndex)
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    const prevIndex = currentIndex - 1
    if (prevIndex >= 0) {
      focusCard(prevIndex)
    }
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    const nextIndex = currentIndex + 1
    if (nextIndex < props.guides.length) {
      focusCard(nextIndex)
    }
    return
  }

  if (event.key === 'Home') {
    event.preventDefault()
    focusCard(0)
    return
  }

  if (event.key === 'End') {
    event.preventDefault()
    focusCard(props.guides.length - 1)
    return
  }
}
</script>

<style scoped>
/* ==========================================
   Guide Column
   ========================================== */

.pairing-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.column-heading {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text, #111827);
  margin: 0;
  padding: 0 0 0.5rem 0;
  border-bottom: 2px solid var(--color-border, #e5e7eb);
}

/* ==========================================
   Person Cards (Guides)
   ========================================== */

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.person-card-wrapper {
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
  cursor: pointer;
  border-radius: 0.5rem;
}

.person-card-wrapper:hover {
  transform: translateY(-2px);
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.person-card-wrapper:focus {
  outline: 3px solid var(--color-primary, #0066cc);
  outline-offset: 2px;
}

/* Selected state for guide cards */
.guide-card-wrapper.is-selected {
  border: 2px solid var(--color-primary, #0066cc);
  background-color: var(--color-primary-light, #e6f2ff);
}

.person-card {
  height: 100%;
}

.person-card__content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.person-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.person-name-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.person-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text, #111827);
  margin: 0;
  line-height: 1.3;
}

.role-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  border-radius: 0.25rem;
  line-height: 1.5;
}

.role-badge--guide {
  background-color: var(--color-success-light, #f0f9f4);
  color: var(--color-success-dark, #155724);
  border: 1px solid var(--color-success, #28a745);
}

.person-detail {
  font-size: 0.875rem;
  color: var(--color-text-muted, #6b7280);
  margin: 0;
  line-height: 1.4;
}

.person-detail.certification {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-success, #28a745);
  font-weight: 500;
}

.certification-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  background-color: var(--color-success, #28a745);
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
}

/* ==========================================
   Pairing Badge (guide cards)
   ========================================== */

.pairing-badge {
  display: flex;
  justify-content: center;
}

.badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 0.375rem;
}

.available-badge {
  background-color: var(--color-success-light, #f0f9f4);
  color: var(--color-success-dark, #155724);
  border: 1px solid var(--color-success, #28a745);
}

/* ==========================================
   Selection Indicator (guide cards)
   ========================================== */

.selection-indicator {
  display: flex;
  justify-content: center;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border, #e5e7eb);
}

.selection-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: var(--color-primary, #0066cc);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 9999px;
}

/* ==========================================
   Empty Message
   ========================================== */

.empty-message {
  text-align: center;
  padding: 2rem 1rem;
}

.empty-message p {
  font-size: 1rem;
  color: var(--color-text-muted, #6b7280);
  margin: 0;
}

/* ==========================================
   Reduced Motion Support
   ========================================== */

.reduced-motion .person-card-wrapper {
  transition: none;
}

.reduced-motion .person-card-wrapper:hover {
  transform: none;
}

/* ==========================================
   High Contrast Mode
   ========================================== */

.high-contrast .person-card-wrapper {
  border: 2px solid var(--color-text, #000000);
}

.high-contrast .guide-card-wrapper.is-selected {
  border: 3px solid var(--color-primary, #000000);
}
</style>
