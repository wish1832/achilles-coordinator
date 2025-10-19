import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
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
        roles: ['athlete', 'guide', 'admin'],
        title: 'Runs - Achilles Run Coordinator',
      },
    },
    {
      path: '/admin',
      name: 'Admin',
      component: () => import('@/views/admin/AdminDashboard.vue'),
      meta: {
        requiresAuth: true,
        roles: ['admin'],
        title: 'Admin Dashboard - Achilles Run Coordinator',
      },
    },
    {
      path: '/admin/runs',
      name: 'AdminRuns',
      component: () => import('@/views/admin/RunsView.vue'),
      meta: {
        requiresAuth: true,
        roles: ['admin'],
        title: 'Manage Runs - Achilles Run Coordinator',
      },
    },
    {
      path: '/admin/users',
      name: 'AdminUsers',
      component: () => import('@/views/admin/UsersView.vue'),
      meta: {
        requiresAuth: true,
        roles: ['admin'],
        title: 'Manage Users - Achilles Run Coordinator',
      },
    },
    {
      path: '/admin/pairings',
      name: 'AdminPairings',
      component: () => import('@/views/admin/PairingView.vue'),
      meta: {
        requiresAuth: true,
        roles: ['admin'],
        title: 'Manage Pairings - Achilles Run Coordinator',
      },
    },
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
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Set page title
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // Redirect to login if not authenticated
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }

    // Check role-based access
    const requiredRoles = to.meta.roles as string[]
    if (requiredRoles && !authStore.hasPermission(requiredRoles as any)) {
      // Redirect to appropriate page based on user role
      if (authStore.isAdmin) {
        next({ name: 'Admin' })
      } else {
        next({ name: 'Runs' })
      }
      return
    }
  }

  // Redirect authenticated users away from login page
  if (to.name === 'Login' && authStore.isAuthenticated) {
    if (authStore.isAdmin) {
      next({ name: 'Admin' })
    } else {
      next({ name: 'Runs' })
    }
    return
  }

  next()
})

export default router
