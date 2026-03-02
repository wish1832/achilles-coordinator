<template>
  <ModalElement
    :is-open="isOpen"
    title="How to Pair"
    size="large"
    @close="$emit('close')"
  >
    <div class="instructions-content">
      <h3 class="instructions-subheading" tabindex="-1" autofocus>
        Pairing Athletes with Guides
      </h3>
      <ol class="instructions-list">
        <li>
          Click or press Enter/Space on an athlete, then click a guide to create a pairing
        </li>
        <li>
          Or, click or press Enter/Space on a guide, then click an athlete to create a pairing
        </li>
        <li>Athletes can be paired with multiple guides</li>
      </ol>

      <h3 class="instructions-subheading">Pairing Athletes Together</h3>
      <p class="instructions-paragraph">
        When guide availability is limited, multiple athletes may need to share one guide. To
        represent this, you can pair athletes together. The second athlete will be shown under the
        first athlete's pairings.
      </p>
      <p class="instructions-paragraph"><strong>To pair athletes together:</strong></p>
      <ul class="instructions-list">
        <li>
          <strong>With mouse:</strong> Click the first athlete (who will keep their own pairing
          entry), then click the second athlete (who will move under the first athlete's card)
        </li>
        <li>
          <strong>With keyboard:</strong> Press Enter or Space on the first athlete, then press
          Enter or Space on the second athlete
        </li>
      </ul>
      <p class="instructions-paragraph">
        Athletes may also be paired together without a guide. You are responsible for determining
        whether such pairings are appropriate for the run.
      </p>

      <h3 class="instructions-subheading">Navigation & Actions</h3>
      <ul class="instructions-list">
        <li>Press Escape to clear your selection</li>
        <li>Use Arrow Up/Down to navigate between cards in a column</li>
        <li>Use Home/End to jump to the first or last card in a column</li>
        <li>Click "Unpair" on a sub-card to remove that specific pairing</li>
        <li>Click "Save Pairings" to save your changes</li>
      </ul>
    </div>
  </ModalElement>
</template>

<script setup lang="ts">
import ModalElement from '@/components/ui/ModalElement.vue'

interface Props {
  isOpen: boolean
}

interface Emits {
  close: []
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<style scoped>
/* ==========================================
   Instructions Content
   ========================================== */

.instructions-content {
  padding: 0;
}

.instructions-subheading {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text, #111827);
  margin: 1rem 0 0.5rem 0;
}

.instructions-subheading:first-child {
  margin-top: 0;
}

.instructions-paragraph {
  font-size: 1rem;
  color: var(--color-text, #111827);
  line-height: 1.6;
  margin: 0 0 0.75rem 0;
}

.instructions-list {
  margin: 0 0 0.75rem 0;
  padding: 0 0 0 1.5rem;
  list-style-type: disc;
}

.instructions-list li {
  font-size: 1rem;
  color: var(--color-text, #111827);
  line-height: 1.6;
  margin-bottom: 0.5rem;
}

.instructions-list li:last-child {
  margin-bottom: 0;
}
</style>
