import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'

// App.vue reads the current route name to decide whether the authenticated header should show.
// The smoke test fixes the route to Login so it can verify the app shell without real router setup.
vi.mock('vue-router', () => ({
  useRoute: () => ({ name: 'Login' }),
}))

// The app shell applies whatever CSS utility classes the accessibility store exposes.
// This mock keeps the test focused on that binding instead of testing store implementation details.
vi.mock('@/stores/accessibility', () => ({
  useAccessibilityStore: () => ({
    accessibilityClasses: ['text-size-medium'],
  }),
}))

// The header is only shown for authenticated users on non-login routes.
// Keeping auth false makes this a narrow shell-render smoke test.
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    isAuthenticated: false,
  }),
}))

describe('App shell smoke test', () => {
  it('renders routed content and applies accessibility classes from the store output', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          AppHeader: true,
          RouterView: {
            // App.vue uses RouterView's slot API, so the stub provides a simple component target.
            template: '<div data-test="router-view"><slot :Component="\'main\'" /></div>',
          },
        },
      },
    })

    // This only checks that App.vue renders routed content into its shell.
    expect(wrapper.find('[data-test="router-view"]').exists()).toBe(true)

    // This verifies the shell keeps binding accessibility classes from the store onto #app.
    expect(wrapper.find('#app').classes()).toContain('text-size-medium')
  })
})
