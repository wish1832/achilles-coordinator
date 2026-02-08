# PairingView Implementation Plan

## Overview
Implement a keyboard-accessible pairing interface for Achilles Run Coordinator, allowing organization admins to pair athletes with guides for specific runs. The interface will use the route structure `/admin/organizations/:orgId/runs/:runId/pairings` with side-by-side columns and organization-scoped permissions.

## User Requirements
- Route: `/admin/organizations/:orgId/runs/:runId/pairings`
- Layout: Side-by-side columns (athletes left, guides right)
- Organization-scoped with admin permission checks
- Keyboard-accessible pairing workflow
- Store pairings in `Run.pairings` object (athleteId → guideId)

## Implementation Steps

### Step 1: Add Pairing Route to Router
**File:** `src/router/index.ts`

Add the nested pairing route:
```typescript
{
  path: '/admin/organizations/:orgId/runs/:runId/pairings',
  name: 'AdminPairings',
  component: () => import('@/views/admin/PairingView.vue'),
  meta: {
    requiresAuth: true,
    requiresOrgAdmin: true,
    title: 'Manage Pairings - Achilles Run Coordinator',
  },
}
```

Enhance the `router.beforeEach` guard to check organization admin permissions:
```typescript
// After existing requiresAuth check, add:
if (to.meta.requiresOrgAdmin) {
  const orgId = to.params.orgId as string
  if (!orgId) {
    next({ name: 'Admin' })
    return
  }

  const organizationStore = useOrganizationStore()

  // Load organization if not in cache
  let org = organizationStore.getOrganizationById(orgId)
  if (!org) {
    try {
      await organizationStore.loadOrganization(orgId)
      org = organizationStore.getOrganizationById(orgId)
    } catch (error) {
      next({ name: 'Admin' })
      return
    }
  }

  // Check admin permission
  const isAdmin = organizationStore.isUserOrgAdmin(orgId, authStore.currentUser!.id)
  if (!isAdmin) {
    next({ name: 'Admin' })
    return
  }
}
```

### Step 2: Create PairingView Component
**File:** `src/views/admin/PairingView.vue` (new file)

#### Component Structure

**Template:**
- Skip link for keyboard navigation
- Header with organization and run context
- Loading/error states
- Instructions section
- Two-column layout (athletes left, guides right)
- Save button with unsaved changes indicator
- Confirmation modal for re-pairing

**Script Setup:**
```typescript
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useOrganizationStore } from '@/stores/organization'
import { useRunsStore } from '@/stores/runs'
import { useSignUpsStore } from '@/stores/signups'
import { useUsersStore } from '@/stores/users'
import { useDataRepository } from '@/composables/useRepositories'
import type { User, LoadingState } from '@/types'

// UI Components
import CardUI from '@/components/ui/CardUI.vue'
import ButtonUI from '@/components/ui/ButtonUI.vue'
import LoadingUI from '@/components/ui/LoadingUI.vue'
import ModalElement from '@/components/ui/ModalElement.vue'
```

**State:**
```typescript
// Route params
const route = useRoute()
const router = useRouter()
const orgId = computed(() => route.params.orgId as string)
const runId = computed(() => route.params.runId as string)

// Stores
const authStore = useAuthStore()
const organizationStore = useOrganizationStore()
const runsStore = useRunsStore()
const signupsStore = useSignUpsStore()
const usersStore = useUsersStore()
const dataRepository = useDataRepository()

// Loading and error states
const loading = ref<LoadingState>('idle')
const error = ref<string | null>(null)
const savingPairings = ref(false)

// Pairing state
const selectedAthleteId = ref<string | null>(null)
const pairings = ref<Record<string, string>>({}) // athleteId -> guideId
const originalPairings = ref<Record<string, string>>({})

// Re-pairing modal state
const showRepairModal = ref(false)
const repairGuideId = ref<string | null>(null)

// Screen reader announcement
const srAnnouncement = ref('')
```

**Computed Properties:**
```typescript
// Get current organization
const organization = computed(() =>
  organizationStore.getOrganizationById(orgId.value)
)

// Get current run
const run = computed(() => runsStore.currentRun)

// Get athletes who signed up for the run
const athletes = computed(() => {
  const athleteSignUps = signupsStore
    .getSignUpsForRun(runId.value)
    .filter(s => s.role === 'athlete' && s.status === 'active')

  return athleteSignUps
    .map(s => usersStore.getUserById(s.userId))
    .filter(u => u !== undefined) as User[]
})

// Get guides who signed up for the run
const guides = computed(() => {
  const guideSignUps = signupsStore
    .getSignUpsForRun(runId.value)
    .filter(s => s.role === 'guide' && s.status === 'active')

  return guideSignUps
    .map(s => usersStore.getUserById(s.userId))
    .filter(u => u !== undefined) as User[]
})

// Check if there are unsaved changes
const hasUnsavedChanges = computed(() =>
  JSON.stringify(pairings.value) !== JSON.stringify(originalPairings.value)
)

// Get paired guide for an athlete
function getPairedGuide(athleteId: string): User | null {
  const guideId = pairings.value[athleteId]
  if (!guideId) return null
  return usersStore.getUserById(guideId) || null
}

// Check if a guide is paired
function isGuidePaired(guideId: string): boolean {
  return Object.values(pairings.value).includes(guideId)
}

// Get athlete paired with a guide
function getAthleteForGuide(guideId: string): User | null {
  const athleteId = Object.keys(pairings.value).find(
    key => pairings.value[key] === guideId
  )
  if (!athleteId) return null
  return usersStore.getUserById(athleteId) || null
}
```

**Methods:**

1. **Load Data:**
```typescript
async function loadData(): Promise<void> {
  try {
    loading.value = 'loading'
    error.value = null

    // Load organization (should be cached from router guard)
    if (!organization.value) {
      await organizationStore.loadOrganization(orgId.value)
    }

    // Load run
    await runsStore.loadRun(runId.value)

    // Verify run belongs to organization
    if (run.value?.organizationId !== orgId.value) {
      throw new Error('Run does not belong to this organization')
    }

    // Load sign-ups for run
    await signupsStore.loadSignUpsForRun(runId.value)

    // Get all user IDs from sign-ups
    const signUps = signupsStore.getSignUpsForRun(runId.value)
    const userIds = [...new Set(signUps.map(s => s.userId))]

    // Load all user details in parallel
    await Promise.all(userIds.map(id => usersStore.loadUser(id)))

    // Initialize pairings from run data
    pairings.value = { ...(run.value?.pairings || {}) }
    originalPairings.value = { ...(run.value?.pairings || {}) }

    loading.value = 'success'
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load pairing data'
    loading.value = 'error'
  }
}
```

2. **Pairing Actions:**
```typescript
// Select an athlete (first step in pairing)
function selectAthlete(athleteId: string): void {
  selectedAthleteId.value = athleteId
  announceToScreenReader(`Selected athlete: ${usersStore.getUserById(athleteId)?.displayName}`)
}

// Pair selected athlete with guide (second step)
function pairWithGuide(guideId: string): void {
  if (!selectedAthleteId.value) {
    announceToScreenReader('Please select an athlete first')
    return
  }

  // Check if guide is already paired
  if (isGuidePaired(guideId)) {
    // Show confirmation modal for re-pairing
    repairGuideId.value = guideId
    showRepairModal.value = true
    return
  }

  // Create pairing
  pairings.value[selectedAthleteId.value] = guideId

  const athleteName = usersStore.getUserById(selectedAthleteId.value)?.displayName
  const guideName = usersStore.getUserById(guideId)?.displayName
  announceToScreenReader(`Paired ${athleteName} with ${guideName}`)

  selectedAthleteId.value = null
}

// Confirm re-pairing when guide is already paired
function confirmRepair(): void {
  if (!selectedAthleteId.value || !repairGuideId.value) return

  // Remove old pairing
  const oldAthleteId = Object.keys(pairings.value).find(
    key => pairings.value[key] === repairGuideId.value
  )
  if (oldAthleteId) {
    delete pairings.value[oldAthleteId]
  }

  // Create new pairing
  pairings.value[selectedAthleteId.value] = repairGuideId.value

  const athleteName = usersStore.getUserById(selectedAthleteId.value)?.displayName
  const guideName = usersStore.getUserById(repairGuideId.value)?.displayName
  announceToScreenReader(`Re-paired: ${athleteName} with ${guideName}`)

  selectedAthleteId.value = null
  showRepairModal.value = false
  repairGuideId.value = null
}

// Remove pairing for an athlete
function unpairAthlete(athleteId: string): void {
  const guideName = getPairedGuide(athleteId)?.displayName
  delete pairings.value[athleteId]

  const athleteName = usersStore.getUserById(athleteId)?.displayName
  announceToScreenReader(`Unpaired ${athleteName} from ${guideName}`)
}

// Clear athlete selection
function clearSelection(): void {
  selectedAthleteId.value = null
  announceToScreenReader('Selection cleared')
}
```

3. **Save Pairings:**
```typescript
async function savePairings(): Promise<void> {
  try {
    savingPairings.value = true
    error.value = null

    await dataRepository.updateRun(runId.value, {
      pairings: pairings.value
    })

    // Update original pairings to mark as saved
    originalPairings.value = { ...pairings.value }

    announceToScreenReader('Pairings saved successfully')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save pairings'
    announceToScreenReader('Error saving pairings')
  } finally {
    savingPairings.value = false
  }
}
```

4. **Keyboard Navigation:**
```typescript
// Handle keyboard navigation for athlete cards
function handleAthleteKeydown(event: KeyboardEvent, athleteId: string, index: number): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    selectAthlete(athleteId)
  }
  // Arrow navigation can be added later for enhanced UX
}

// Handle keyboard navigation for guide cards
function handleGuideKeydown(event: KeyboardEvent, guideId: string, index: number): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    pairWithGuide(guideId)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    clearSelection()
  }
  // Arrow navigation can be added later for enhanced UX
}

// Handle keyboard for unpair button
function handleUnpairKeydown(event: KeyboardEvent, athleteId: string): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    unpairAthlete(athleteId)
  }
}
```

5. **Utility Functions:**
```typescript
// Announce to screen reader
function announceToScreenReader(message: string): void {
  srAnnouncement.value = message
  // Clear after a short delay so the same message can be announced again
  setTimeout(() => {
    srAnnouncement.value = ''
  }, 1000)
}

// Retry loading data
function retryLoad(): void {
  loadData()
}
```

6. **Lifecycle:**
```typescript
onMounted(() => {
  loadData()
})
```

#### Styling
Follow AdminDashboard.vue patterns:
- Gradient header with organization and run context
- Two-column grid layout (responsive to single column on mobile)
- Card-based athlete and guide display
- Visual indicators for selected, paired, and unpaired states
- High contrast mode support
- Reduced motion support
- Text sizing support

### Step 3: Update Navigation (Optional)
If needed, update the AdminDashboard to link to the pairing view with the correct route structure. Currently it links to `/admin/pairings`, which should be updated to navigate with organization and run IDs.

## Data Flow

1. **Load:** Organization → Run → Sign-ups → User details
2. **Pair:** Select athlete → Select guide → Update local pairings state
3. **Save:** Call `dataRepository.updateRun(runId, { pairings })`
4. **Success:** Update originalPairings to reflect saved state

## Pairing Data Structure
```typescript
// Stored in Run.pairings
{
  "athlete-user-id-1": "guide-user-id-1",
  "athlete-user-id-2": "guide-user-id-2"
}
```

## Accessibility Features
- Skip link to main content
- Semantic HTML (header, main, section)
- ARIA labels for all interactive elements
- ARIA live region for screen reader announcements
- Keyboard navigation (Tab, Enter, Space, Escape)
- Focus indicators on all cards and buttons
- High contrast mode support
- Reduced motion support
- Text sizing support

## Files to Create/Modify

### Create:
1. `src/views/admin/PairingView.vue` - Main pairing interface component

### Modify:
1. `src/router/index.ts` - Add pairing route and enhance route guard

## Estimated Implementation Time
- Router setup: 30 minutes
- Component structure and data loading: 1 hour
- Pairing logic: 1 hour
- Save functionality: 30 minutes
- Keyboard accessibility: 1 hour
- Styling and polish: 1 hour
- **Total: ~5 hours**

## Testing Checklist
- [ ] Route guard blocks non-admin users
- [ ] Data loads correctly for run
- [ ] Can select athlete
- [ ] Can pair athlete with guide
- [ ] Can unpair athlete
- [ ] Re-pairing shows confirmation modal
- [ ] Save button works and persists pairings
- [ ] Unsaved changes indicator works
- [ ] Keyboard navigation works (Tab, Enter, Space, Escape)
- [ ] Screen reader announcements work
- [ ] Loading and error states display correctly
- [ ] Mobile responsive layout works
- [ ] High contrast mode works
- [ ] Text sizing works
