import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Font Awesome setup: register icons in the library so they can be used
// via the <font-awesome-icon> component anywhere in the app
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faCaretUp,
  faCaretDown,
  faCircleQuestion,
  faCirclePlus,
  faGear,
  faArrowRightFromBracket,
} from '@fortawesome/free-solid-svg-icons'

library.add(faCaretUp, faCaretDown, faCircleQuestion, faCirclePlus, faGear, faArrowRightFromBracket)

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

// Register FontAwesomeIcon as a global component
app.component('font-awesome-icon', FontAwesomeIcon)

// Initialize Pinia first so stores are available
app.use(createPinia())

// Initialize authentication state before router navigation
// This ensures auth state is loaded from sessionStorage/localStorage before routing decisions are made
const authStore = useAuthStore()
authStore.initializeAuth()

app.use(router)

app.mount('#app')
