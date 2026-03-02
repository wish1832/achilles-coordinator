<template>
  <div class="sort-controls">
    <!-- Sort button on the left -->
    <ButtonUI
      variant="secondary"
      :aria-label="`Sort by pace, currently ${sortDirection === 'asc' ? 'slowest to fastest' : 'fastest to slowest'}. Click to toggle.`"
      @click="toggleSort"
    >
      Pace
      <font-awesome-icon v-if="sortDirection === 'asc'" icon="caret-up" />
      <font-awesome-icon v-else icon="caret-down" />
    </ButtonUI>

    <!-- Save indicator and save button grouped on the right -->
    <div class="actions-save-group">
      <!-- Help button to open pairing instructions modal -->
      <button
        class="help-icon-button"
        aria-label="How to pair"
        @click="$emit('open-help')"
      >
        <font-awesome-icon icon="circle-question" />
      </button>
      <!-- Save button with status indicator beneath it -->
      <div class="save-button-group">
        <ButtonUI
          variant="primary"
          :disabled="!hasUnsavedChanges || savingPairings"
          :loading="savingPairings"
          @click="$emit('save-pairings')"
        >
          Save Pairings
        </ButtonUI>
        <div class="actions-status">
          <span v-if="hasSaveError" class="save-error-indicator">Save error</span>
          <span v-else-if="hasUnsavedChanges" class="unsaved-indicator"
            >Unsaved changes</span
          >
          <span v-else class="saved-indicator">All changes saved</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ButtonUI from '@/components/ui/ButtonUI.vue'

interface Props {
  sortDirection: 'asc' | 'desc'
  hasUnsavedChanges: boolean
  savingPairings: boolean
  hasSaveError: boolean
}

interface Emits {
  'update:sortDirection': [direction: 'asc' | 'desc']
  'open-help': []
  'save-pairings': []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Toggle sort direction and emit update
function toggleSort(): void {
  const newDirection = props.sortDirection === 'asc' ? 'desc' : 'asc'
  emit('update:sortDirection', newDirection)
}
</script>

<style scoped>
/* ==========================================
   Sort Controls
   ========================================== */

.sort-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.sort-controls :deep(.button__content) {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Groups the help button, save indicator, and save button together on the right */
.actions-save-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Help icon button for opening pairing instructions */
.help-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1.5rem;
  color: var(--color-text-muted, #6b7280);
  border-radius: 50%;
  transition: color 0.2s ease;
}

.help-icon-button:hover {
  color: var(--color-primary, #0066cc);
}

.help-icon-button:focus {
  color: var(--color-primary, #0066cc);
  outline: 3px solid var(--color-primary, #0066cc);
  outline-offset: 2px;
}

/* Places the save button and status indicator side by side */
.save-button-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
}

.actions-status {
  font-size: 0.875rem;
  font-weight: 500;
}

.save-error-indicator {
  color: var(--color-danger, #dc3545);
}

.unsaved-indicator {
  color: var(--color-warning, #ffc107);
}

.saved-indicator {
  color: var(--color-success, #28a745);
}
</style>
