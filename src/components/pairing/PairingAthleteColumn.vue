<template>
  <div class="pairing-column athletes-column">
    <h3 class="column-heading">Athletes ({{ athletes.length }})</h3>

    <!-- No athletes message -->
    <div v-if="athletes.length === 0" class="empty-message">
      <p>No athletes have signed up for this run yet.</p>
    </div>

    <!-- Athletes list -->
    <div v-else class="cards-list">
      <div
        v-for="(athlete, index) in athletes"
        :key="athlete.id"
        :ref="(el) => setAthleteCardRef(el, index)"
        class="person-card-wrapper athlete-card-wrapper"
        :class="{
          'is-selected': selectedAthleteId === athlete.id,
          'is-paired': pairedUsers(athlete.id).length > 0,
        }"
        role="button"
        tabindex="0"
        :aria-label="`Athlete: ${athlete.displayName}${pairedUsers(athlete.id).length > 0 ? `, paired with ${pairedUsers(athlete.id).length} user${pairedUsers(athlete.id).length > 1 ? 's' : ''}` : ', not paired'}${selectedAthleteId === athlete.id ? ', selected' : ''}`"
        @click="$emit('select-athlete', athlete.id)"
        @keydown="handleAthleteKeydown($event, athlete.id, index)"
      >
        <CardUI class="person-card athlete-card">
          <div class="person-card__content">
            <div class="person-info">
              <div class="person-name-wrapper">
                <h4 class="person-name">{{ athlete.displayName }}</h4>
                <span class="role-badge role-badge--athlete">Athlete</span>
              </div>
              <p v-if="formattedPace(athlete.id)" class="person-detail">
                Pace: {{ formattedPace(athlete.id) }} min/mile
              </p>
              <p v-if="athlete.profileDetails.activities?.length" class="person-detail">
                Activities: {{ athlete.profileDetails.activities.join(', ') }}
              </p>
            </div>

            <!-- Pairing status -->
            <div class="pairing-status">
              <!-- Paired users section -->
              <div
                v-if="pairedUsers(athlete.id).length > 0"
                class="paired-guides-section"
              >
                <span class="paired-label">Paired with:</span>

                <!-- Individual user sub-cards (guides and athletes) -->
                <div class="paired-guides-list">
                  <div
                    v-for="user in pairedUsers(athlete.id)"
                    :key="user.id"
                    class="paired-guide-card"
                  >
                    <div class="paired-guide-header">
                      <div class="paired-guide-name-wrapper">
                        <h5 class="paired-guide-name">{{ user.displayName }}</h5>
                        <span class="role-badge" :class="`role-badge--${user.role}`">
                          {{ user.role === 'guide' ? 'Guide' : 'Athlete' }}
                        </span>
                      </div>
                      <ButtonUI
                        variant="danger"
                        size="small"
                        :aria-label="`Unpair ${athlete.displayName} from ${user.role} ${user.displayName}`"
                        @click.stop="$emit('unpair-user', athlete.id, user.id)"
                        @keydown="handleUnpairKeydown($event, athlete.id, user.id)"
                      >
                        Unpair
                      </ButtonUI>
                    </div>
                    <div class="paired-guide-info">
                      <p
                        v-if="formattedPace(user.id)"
                        class="paired-guide-detail"
                      >
                        {{ user.role === 'guide' ? 'Max pace' : 'Pace' }}:
                        {{ formattedPace(user.id) }} min/mile
                      </p>
                      <p
                        v-if="user.profileDetails?.activities?.length"
                        class="paired-guide-detail"
                      >
                        Activities: {{ user.profileDetails?.activities?.join(', ') }}
                      </p>
                      <p
                        v-if="user.profileDetails?.certifications?.length"
                        class="paired-guide-detail certification"
                      >
                        <span class="certification-badge">✓</span>
                        {{ user.profileDetails?.certifications?.join(', ') }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Not paired message -->
              <div v-else class="unpaired">
                <span class="unpaired-label">Not paired</span>
              </div>
            </div>

            <!-- Selection indicator -->
            <div v-if="selectedAthleteId === athlete.id" class="selection-indicator">
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
import ButtonUI from '@/components/ui/ButtonUI.vue'
import type { User } from '@/types'

interface Props {
  athletes: User[]
  selectedAthleteId: string | null
  pairedUsers: (athleteId: string) => User[]
  formattedPace: (userId: string) => string | undefined
}

interface Emits {
  'select-athlete': [athleteId: string]
  'unpair-user': [athleteId: string, userId: string]
  'keydown-navigate': [event: KeyboardEvent, athleteId: string, index: number]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Refs for card elements to enable keyboard navigation
const athleteCardRefs = ref<(HTMLElement | null)[]>([])

/**
 * Set reference to an athlete card element
 */
function setAthleteCardRef(el: unknown, index: number): void {
  if (el instanceof HTMLElement) {
    athleteCardRefs.value[index] = el
  } else {
    athleteCardRefs.value[index] = null
  }
}

/**
 * Focus a card element at a specific index
 */
function focusCard(index: number): void {
  if (index < 0 || index >= athleteCardRefs.value.length) return

  const card = athleteCardRefs.value[index]
  if (card) {
    card.focus()
  }
}

/**
 * Handle keyboard events on athlete cards
 * Enter/Space: Select athlete
 * ArrowUp/ArrowDown: Navigate between athlete cards
 * Home: Jump to first athlete
 * End: Jump to last athlete
 * Escape: Clear selection
 */
function handleAthleteKeydown(event: KeyboardEvent, athleteId: string, currentIndex: number): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('select-athlete', athleteId)
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    emit('keydown-navigate', event, athleteId, currentIndex)
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
    if (nextIndex < props.athletes.length) {
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
    focusCard(props.athletes.length - 1)
    return
  }
}

/**
 * Handle keyboard events on unpair buttons
 * Enter/Space: Unpair specific user from athlete
 */
function handleUnpairKeydown(event: KeyboardEvent, athleteId: string, userId: string): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    event.stopPropagation()
    emit('unpair-user', athleteId, userId)
  }
}
</script>

<style scoped>
/* ==========================================
   Athlete Column
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
   Person Cards (Athletes)
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

/* Selected state for athlete cards */
.athlete-card-wrapper.is-selected {
  border: 2px solid var(--color-primary, #0066cc);
  background-color: var(--color-primary-light, #e6f2ff);
}

/* Paired state visual indicator */
.person-card-wrapper.is-paired {
  background-color: var(--color-success-light, #f0f9f4);
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

.role-badge--athlete {
  background-color: var(--color-info-light, #e3f2fd);
  color: var(--color-info-dark, #0d47a1);
  border: 1px solid var(--color-info, #2196f3);
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
   Pairing Status (in athlete cards)
   ========================================== */

.pairing-status {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Paired guides section */
.paired-guides-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.paired-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-success, #28a745);
}

/* List of paired guide sub-cards */
.paired-guides-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Individual paired guide sub-card */
.paired-guide-card {
  padding: 0.75rem;
  background-color: var(--color-success-light, #f0f9f4);
  border-radius: 0.375rem;
  border: 1px solid var(--color-success, #28a745);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.paired-guide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.paired-guide-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.paired-guide-name-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex: 1;
}

.paired-guide-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text, #111827);
  margin: 0;
  line-height: 1.3;
}

.paired-guide-detail {
  font-size: 0.875rem;
  color: var(--color-text-muted, #6b7280);
  margin: 0;
  line-height: 1.4;
}

.paired-guide-detail.certification {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-success, #28a745);
  font-weight: 500;
}

.unpaired {
  padding: 0.5rem;
  text-align: center;
}

.unpaired-label {
  font-size: 0.875rem;
  color: var(--color-text-muted, #6b7280);
  font-style: italic;
}

/* ==========================================
   Selection Indicator (athlete cards)
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

.high-contrast .athlete-card-wrapper.is-selected {
  border: 3px solid var(--color-primary, #000000);
}
</style>
