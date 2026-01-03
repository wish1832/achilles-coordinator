<template>
  <div class="login-view">
    <!-- Skip link for keyboard navigation -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- Main content -->
    <main id="main-content" class="login-main">
      <div class="login-container">
        <!-- Header -->
        <header class="login-header">
          <h1 class="login-title">Achilles Run Coordinator</h1>
          <p class="login-subtitle">Sign in to coordinate runs for Achilles International</p>
        </header>

        <!-- Login form -->
        <CardUI class="login-card" title="Sign In">
          <form @submit.prevent="handleSubmit" class="login-form">
            <!-- Email field -->
            <div class="form-field">
              <label for="email" class="form-label">
                Email Address
                <span class="form-required" aria-label="required">*</span>
              </label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                class="form-input"
                :class="{ 'form-input--error': errors.email }"
                :aria-invalid="!!errors.email"
                :aria-describedby="errors.email ? 'email-error' : undefined"
                autocomplete="email"
                required
                @blur="validateField('email')"
              />
              <div v-if="errors.email" id="email-error" class="form-error" role="alert">
                {{ errors.email }}
              </div>
            </div>

            <!-- Password field -->
            <div class="form-field">
              <label for="password" class="form-label">
                Password
                <span class="form-required" aria-label="required">*</span>
              </label>
              <div class="password-wrapper">
                <input
                  id="password"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-input"
                  :class="{ 'form-input--error': errors.password }"
                  :aria-invalid="!!errors.password"
                  :aria-describedby="errors.password ? 'password-error' : undefined"
                  autocomplete="current-password"
                  required
                  @blur="validateField('password')"
                />
                <AchillesButton
                  type="button"
                  variant="ghost"
                  size="small"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  class="password-toggle"
                  @click="togglePassword"
                >
                  <svg
                    v-if="showPassword"
                    class="password-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <line
                      x1="1"
                      y1="1"
                      x2="23"
                      y2="23"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <svg v-else class="password-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </AchillesButton>
              </div>
              <div v-if="errors.password" id="password-error" class="form-error" role="alert">
                {{ errors.password }}
              </div>
            </div>

            <!-- Error message -->
            <div v-if="authStore.error" class="form-error form-error--global" role="alert">
              {{ authStore.error }}
            </div>

            <!-- Submit button -->
            <AchillesButton
              type="submit"
              variant="primary"
              size="large"
              :loading="authStore.loading === 'loading'"
              :disabled="!isFormValid"
              class="login-submit"
            >
              Sign In
            </AchillesButton>
          </form>
        </CardUI>

        <!-- Footer -->
        <footer class="login-footer">
          <p class="login-footer-text">
            This is an invite-only system. Contact your administrator for access.
          </p>
        </footer>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAccessibilityStore } from '@/stores/accessibility'
import CardUI from '@/components/ui/CardUI.vue'
import AchillesButton from '@/components/ui/AchillesButton.vue'

// Router and stores
const router = useRouter()
const authStore = useAuthStore()
const accessibilityStore = useAccessibilityStore()

// Form state
const form = ref({
  email: '',
  password: '',
})

const errors = ref<Record<string, string>>({})
const showPassword = ref(false)

// Computed properties
const isFormValid = computed(() => {
  return form.value.email && form.value.password && Object.keys(errors.value).length === 0
})

// Form validation
function validateField(field: string): void {
  switch (field) {
    case 'email':
      if (!form.value.email) {
        errors.value.email = 'Email is required'
      } else if (!isValidEmail(form.value.email)) {
        errors.value.email = 'Please enter a valid email address'
      } else {
        delete errors.value.email
      }
      break
    case 'password':
      if (!form.value.password) {
        errors.value.password = 'Password is required'
      } else if (form.value.password.length < 6) {
        errors.value.password = 'Password must be at least 6 characters'
      } else {
        delete errors.value.password
      }
      break
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Event handlers
function togglePassword(): void {
  showPassword.value = !showPassword.value
}

async function handleSubmit(): Promise<void> {
  // Clear previous errors
  authStore.clearError()
  errors.value = {}

  // Validate all fields
  validateField('email')
  validateField('password')

  if (!isFormValid.value) {
    return
  }

  try {
    await authStore.signIn(form.value.email, form.value.password)

    // Redirect based on user role
    router.push('/runs')
  } catch (error) {
    // Error is handled by the auth store
    console.error('Login failed:', error)
  }
}

// Initialize accessibility settings on mount
onMounted(() => {
  accessibilityStore.initializeAuth?.()
})
</script>

<style scoped>
/* Skip link for keyboard navigation */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--color-focus, #0066cc);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
  transition: top 0.3s;
}

.skip-link:focus {
  top: 6px;
}

/* Main layout */
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    var(--color-bg-gradient-start, #667eea) 0%,
    var(--color-bg-gradient-end, #764ba2) 100%
  );
  padding: 1rem;
}

.login-main {
  width: 100%;
  max-width: 28rem;
}

.login-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Header */
.login-header {
  text-align: center;
  color: white;
}

.login-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.login-subtitle {
  font-size: 1.125rem;
  margin: 0;
  opacity: 0.9;
  line-height: 1.4;
}

/* Login card */
.login-card {
  background: white;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Form styles */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text, #374151);
  line-height: 1.4;
}

.form-required {
  color: var(--color-error, #dc2626);
  margin-left: 0.25rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-input-border, #d1d5db);
  border-radius: 0.375rem;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--color-text, #111827);
  background-color: var(--color-input-bg, #ffffff);
  transition: all 0.2s ease-in-out;
}

.form-input:focus {
  outline: 2px solid var(--color-focus, #0066cc);
  outline-offset: 2px;
  border-color: var(--color-focus, #0066cc);
}

.form-input--error {
  border-color: var(--color-error, #dc2626);
}

.form-input--error:focus {
  outline-color: var(--color-error, #dc2626);
  border-color: var(--color-error, #dc2626);
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-toggle {
  position: absolute;
  right: 0.5rem;
  padding: 0.5rem;
}

.password-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-text-muted, #6b7280);
}

.form-error {
  font-size: 0.75rem;
  color: var(--color-error, #dc2626);
  font-weight: 500;
}

.form-error--global {
  padding: 0.75rem;
  background-color: var(--color-error-bg, #fef2f2);
  border: 1px solid var(--color-error-border, #fecaca);
  border-radius: 0.375rem;
  text-align: center;
}

.login-submit {
  width: 100%;
  margin-top: 0.5rem;
}

/* Footer */
.login-footer {
  text-align: center;
}

.login-footer-text {
  color: white;
  font-size: 0.875rem;
  margin: 0;
  opacity: 0.8;
  line-height: 1.4;
}

/* Text size support */
.text-size-small .login-title {
  font-size: 1.75rem;
}

.text-size-small .login-subtitle {
  font-size: 1rem;
}

.text-size-large .login-title {
  font-size: 2.25rem;
}

.text-size-large .login-subtitle {
  font-size: 1.25rem;
}

.text-size-extra-large .login-title {
  font-size: 2.5rem;
}

.text-size-extra-large .login-subtitle {
  font-size: 1.375rem;
}

/* High contrast mode */
.high-contrast .login-view {
  background: var(--color-bg, #ffffff);
}

.high-contrast .login-header {
  color: var(--color-text, #000000);
}

.high-contrast .login-footer-text {
  color: var(--color-text, #000000);
}

.high-contrast .login-card {
  border: 2px solid var(--color-text, #000000);
}

/* Reduced motion support */
.reduced-motion .skip-link {
  transition: none;
}

.reduced-motion .form-input {
  transition: none;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .login-view {
    padding: 0.5rem;
  }

  .login-title {
    font-size: 1.75rem;
  }

  .login-subtitle {
    font-size: 1rem;
  }
}
</style>
