import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useOrganizationStore } from '@/stores/organization'
import { useRunsStore } from '@/stores/runs'
import type { UserRole } from '@/types/models'
import LoginView from '@/views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'Login',
      component: LoginView,
      meta: {
        requiresAuth: false,
        title: 'Sign In - Achilles Run Coordinator',
      },
    },
    {
      path: '/runs',
      name: 'Runs',
      component: () => import('@/views/RunsListView.vue'),
      meta: {
        requiresAuth: true,
        roles: ['athlete', 'guide'],
        title: 'Runs - Achilles Run Coordinator',
      },
    },
    {
      path: '/runs/:id',
      name: 'Run',
      component: () => import('@/views/RunView.vue'),
      meta: {
        requiresAuth: true,
        roles: ['athlete', 'guide'],
        title: 'Run Details - Achilles Run Coordinator',
      },
    },
    {
      path: '/admin',
      name: 'Admin',
      component: () => import('@/views/admin/AdminDashboard.vue'),
      meta: {
        requiresAuth: true,
        title: 'Admin Dashboard - Achilles Run Coordinator',
      },
    },
    {
      path: '/runs/:id/pairing',
      name: 'RunPairing',
      component: () => import('@/views/PairingView.vue'),
      meta: {
        requiresAuth: true,
        requiresRunAdmin: true,
        title: 'Manage Pairings - Achilles Run Coordinator',
      },
    },
    // {
    //   path: '/admin/runs',
    //   name: 'AdminRuns',
    //   component: () => import('@/views/admin/RunsView.vue'),
    //   meta: {
    //     requiresAuth: true,
    //     title: 'Manage Runs - Achilles Run Coordinator',
    //   },
    // },
    // {
    //   path: '/admin/users',
    //   name: 'AdminUsers',
    //   component: () => import('@/views/admin/UsersView.vue'),
    //   meta: {
    //     requiresAuth: true,
    //     title: 'Manage Users - Achilles Run Coordinator',
    //   },
    // },
    // {
    //   path: '/admin/pairings',
    //   name: 'AdminPairings',
    //   component: () => import('@/views/admin/PairingView.vue'),
    //   meta: {
    //     requiresAuth: true,
    //     title: 'Manage Pairings - Achilles Run Coordinator',
    //   },
    // },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFoundView.vue'),
      meta: {
        requiresAuth: false,
        title: 'Page Not Found - Achilles Run Coordinator',
      },
    },
  ],
})

// Navigation guards for authentication and role-based access
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // Wait for auth to be initialized before making routing decisions
  // This prevents redirecting to login when a valid session exists in sessionStorage
  if (!authStore.isInitialized) {
    // Poll for initialization with a timeout
    const maxWaitTime = 2000 // 2 seconds max
    const startTime = Date.now()
    while (!authStore.isInitialized && Date.now() - startTime < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }

  // Set page title
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    // Redirect users to login if not authenticated
    if (!authStore.isAuthenticated) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }

    // Check role-based access
    const requiredRoles = to.meta.roles as unknown as UserRole[] | undefined

    // If an authenticated user lacks the required roles, redirect based on their role
    if (requiredRoles?.length && !authStore.hasPermission(requiredRoles)) {
      next({ name: 'Runs' })
      return
    }

    // Check organization admin access for routes that require it
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
        } catch {
          // Organization not found or error loading, redirect to admin dashboard
          next({ name: 'Admin' })
          return
        }
      }

      // Check if current user is admin of this organization
      if (!org) {
        next({ name: 'Admin' })
        return
      }

      const isAdmin = organizationStore.isUserOrgAdmin(orgId, authStore.currentUser!.id)
      if (!isAdmin) {
        // User is not admin of this organization, redirect to admin dashboard
        next({ name: 'Admin' })
        return
      }
    }

    // Check run admin access for routes that require it
    // Run admins are either org admins or users listed in run.runAdminIds
    if (to.meta.requiresRunAdmin) {
      const runId = to.params.id as string
      if (!runId) {
        next({ name: 'Runs' })
        return
      }

      const runsStore = useRunsStore()
      const organizationStore = useOrganizationStore()

      // Load the run to check admin status
      try {
        await runsStore.loadRun(runId)
      } catch {
        next({ name: 'Runs' })
        return
      }

      const run = runsStore.currentRun
      if (!run) {
        next({ name: 'Runs' })
        return
      }

      // Load organization so we can check org admin status
      let org = organizationStore.getOrganizationById(run.organizationId)
      if (!org) {
        try {
          await organizationStore.loadOrganization(run.organizationId)
          org = organizationStore.getOrganizationById(run.organizationId)
        } catch {
          next({ name: 'Runs' })
          return
        }
      }

      // Check if user is an org admin or a run-specific admin
      const userId = authStore.currentUser!.id
      const isOrgAdmin = org
        ? organizationStore.isUserOrgAdmin(run.organizationId, userId)
        : false
      const isRunAdmin = await runsStore.isUserRunAdmin(runId, userId)

      if (!isOrgAdmin && !isRunAdmin) {
        // User is not authorized to manage this run
        next({ name: 'Run', params: { id: runId } })
        return
      }
    }
  }

  // Redirect authenticated users away from login page
  if (to.name === 'Login' && authStore.isAuthenticated) {
    next({ name: 'Runs' })
    return
  }

  next()
})

export default router
