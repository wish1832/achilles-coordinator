import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

// Initialize Pinia first so stores are available
app.use(createPinia())

// Initialize authentication state before router navigation
// This ensures auth state is loaded from sessionStorage/localStorage before routing decisions are made
const authStore = useAuthStore()
authStore.initializeAuth()

app.use(router)

app.mount('#app')
