import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import App from '../App.vue'

let mockedRouteName = 'Dashboard'
let mockedIsAuthenticated = true
let mockedRouteFullPath = '/dashboard'

vi.mock('vue-router', () => ({
  useRoute: () => ({ name: mockedRouteName, fullPath: mockedRouteFullPath }),
}))

vi.mock('@/stores/accessibility', () => ({
  useAccessibilityStore: () => ({
    accessibilityClasses: '',
  }),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    isAuthenticated: mockedIsAuthenticated,
  }),
}))

const MainContentComponent = defineComponent({
  template: '<main id="main-content">Main content</main>',
})

const LoginContentComponent = defineComponent({
  template: '<main id="main-content">Login content</main>',
})

const MissingMainContentComponent = defineComponent({
  template: '<div>Missing main target</div>',
})

const createRouterViewStub = (routedComponent: object) =>
  defineComponent({
    setup(_, { slots }) {
      return () => slots.default?.({ Component: routedComponent })
    },
  })

describe('App', () => {
  beforeEach(() => {
    mockedRouteName = 'Dashboard'
    mockedIsAuthenticated = true
    mockedRouteFullPath = '/dashboard'
    vi.restoreAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  it('renders skip link as the first focusable element', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          AppHeader: {
            template: '<header><a href="#header-menu">Header Menu</a></header>',
          },
          RouterView: createRouterViewStub(MainContentComponent),
        },
      },
    })

    const firstFocusableElement = wrapper.element.querySelector(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ) as HTMLAnchorElement | null

    expect(firstFocusableElement).not.toBeNull()
    expect(firstFocusableElement?.classList.contains('skip-link')).toBe(true)
    expect(firstFocusableElement?.getAttribute('href')).toBe('#main-content')
  })

  it('still renders the skip link on the login route', () => {
    mockedRouteName = 'Login'
    mockedIsAuthenticated = false
    mockedRouteFullPath = '/login'

    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterView: createRouterViewStub(LoginContentComponent),
        },
      },
    })

    const skipLink = wrapper.find('a.skip-link')
    expect(skipLink.exists()).toBe(true)
    expect(skipLink.attributes('href')).toBe('#main-content')
  })

  it('warns in non-production mode when main-content target is missing', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn')

    mount(App, {
      global: {
        stubs: {
          AppHeader: {
            template: '<header><a href="#header-menu">Header Menu</a></header>',
          },
          RouterView: createRouterViewStub(MissingMainContentComponent),
        },
      },
    })

    await flushPromises()
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Missing #main-content on route "Dashboard"'),
    )
  })
})
