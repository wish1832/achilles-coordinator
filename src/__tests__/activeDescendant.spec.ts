import { beforeAll, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import LocationDropdown from '@/components/ui/LocationDropdown.vue'
import ActionMenu from '@/components/ui/ActionMenu.vue'
import type { Location } from '@/types'

vi.mock('@/stores/accessibility', () => ({
  useAccessibilityStore: () => ({
    accessibilityClasses: ['text-size-medium'],
  }),
}))

beforeAll(() => {
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    value: vi.fn(),
    writable: true,
  })
})

describe('active descendant accessibility wiring', () => {
  it('keeps focus on the combobox trigger and points aria-activedescendant at the active option', async () => {
    const locations: Location[] = [
      {
        id: 'loc-1',
        organizationId: 'org-1',
        name: 'Washington Park',
        createdAt: new Date('2026-03-16T00:00:00Z'),
      },
      {
        id: 'loc-2',
        organizationId: 'org-1',
        name: 'City Park',
        createdAt: new Date('2026-03-16T00:00:00Z'),
      },
    ]

    const wrapper = mount(LocationDropdown, {
      attachTo: document.body,
      props: {
        label: 'Location',
        locations,
      },
    })

    const trigger = wrapper.get('button[role="combobox"]')
    await trigger.trigger('click')
    await nextTick()

    expect(document.activeElement).toBe(trigger.element)

    const firstOptionId = wrapper.findAll('li[role="option"]')[0]?.attributes('id')
    expect(firstOptionId).toBeTruthy()
    expect(trigger.attributes('aria-activedescendant')).toBe(firstOptionId)

    await trigger.trigger('keydown', { key: 'ArrowDown' })
    await nextTick()

    const secondOptionId = wrapper.findAll('li[role="option"]')[1]?.attributes('id')
    expect(trigger.attributes('aria-activedescendant')).toBe(secondOptionId)

    wrapper.unmount()
  })

  it('exposes the active menu item through aria-activedescendant on the focused menu', async () => {
    const wrapper = mount(ActionMenu, {
      attachTo: document.body,
      props: {
        items: [
          { id: 'edit', label: 'Edit' },
          { id: 'delete', label: 'Delete', danger: true },
        ],
      },
      global: {
        stubs: {
          'font-awesome-icon': true,
        },
      },
    })

    await wrapper.get('button').trigger('click')
    await nextTick()

    const menu = wrapper.get('ul[role="menu"]')
    const menuItems = wrapper.findAll('li[role="menuitem"]')

    expect(menu.attributes('aria-activedescendant')).toBe(menuItems[0]?.attributes('id'))

    await menu.trigger('keydown', { key: 'ArrowDown' })
    await nextTick()

    expect(menu.attributes('aria-activedescendant')).toBe(menuItems[1]?.attributes('id'))

    wrapper.unmount()
  })
})
