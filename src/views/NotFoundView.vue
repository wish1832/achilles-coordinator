<template>
  <div class="not-found-view">
    <!-- Skip link for keyboard navigation -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- Main content -->
    <main id="main-content" class="not-found-main">
      <div class="not-found-container">
        <Card class="not-found-card">
          <div class="not-found-content">
            <!-- 404 Icon -->
            <div class="not-found-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8" />
                <path d="M12 8v8" />
              </svg>
            </div>

            <!-- Error message -->
            <h1 class="not-found-title">Page Not Found</h1>
            <p class="not-found-description">
              Sorry, the page you're looking for doesn't exist or has been moved.
            </p>

            <!-- Action buttons -->
            <div class="not-found-actions">
              <AchillesButton variant="primary" size="large" @click="goHome">
                Go Home
              </AchillesButton>
              <AchillesButton variant="secondary" size="large" @click="goBack">
                Go Back
              </AchillesButton>
            </div>
          </div>
        </Card>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import Card from '@/components/ui/CardUI.vue'
import AchillesButton from '@/components/ui/AchillesButton.vue'

// Router
const router = useRouter()

// Navigation functions
function goHome(): void {
  router.push('/')
}

function goBack(): void {
  router.go(-1)
}
</script>

<style scoped>
/* Main layout */
.not-found-view {
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    var(--color-bg-gradient-start, #667eea) 0%,
    var(--color-bg-gradient-end, #764ba2) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.not-found-main {
  width: 100%;
  max-width: 28rem;
}

.not-found-container {
  /* Styles handled by not-found-card */
}

.not-found-card {
  text-align: center;
  background: white;
  box-shadow: var(
    --shadow-xl,
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04)
  );
}

.not-found-content {
  padding: 3rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

/* Icon */
.not-found-icon {
  width: 4rem;
  height: 4rem;
  color: var(--color-text-muted, #6b7280);
  margin-bottom: 0.5rem;
}

.not-found-icon svg {
  width: 100%;
  height: 100%;
}

/* Text content */
.not-found-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text, #111827);
  margin: 0;
  line-height: 1.2;
}

.not-found-description {
  font-size: 1.125rem;
  color: var(--color-text-muted, #6b7280);
  margin: 0;
  line-height: 1.5;
  max-width: 24rem;
}

/* Actions */
.not-found-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 0.5rem;
}

/* Text size support */
.text-size-small .not-found-title {
  font-size: 1.75rem;
}

.text-size-small .not-found-description {
  font-size: 1rem;
}

.text-size-large .not-found-title {
  font-size: 2.25rem;
}

.text-size-large .not-found-description {
  font-size: 1.25rem;
}

.text-size-extra-large .not-found-title {
  font-size: 2.5rem;
}

.text-size-extra-large .not-found-description {
  font-size: 1.375rem;
}

/* High contrast mode */
.high-contrast .not-found-view {
  background: var(--color-bg, #ffffff);
}

.high-contrast .not-found-card {
  border: 2px solid var(--color-text, #000000);
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .not-found-content {
    padding: 2rem 1.5rem;
  }

  .not-found-title {
    font-size: 1.75rem;
  }

  .not-found-description {
    font-size: 1rem;
  }

  .not-found-actions {
    flex-direction: column;
    width: 100%;
  }

  .not-found-actions .button {
    width: 100%;
  }
}
</style>
