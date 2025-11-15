import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// Get a list of the Firebase environment variables we expect
const firebaseEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID', // Include if you have it
]

// Dynamically create the 'define' object. Type it so TypeScript knows the shape.
const definedEnv: Record<string, string> = {}
firebaseEnvVars.forEach((key) => {
  // Use JSON.stringify to ensure the value is correctly embedded as a string literal
  // process.env[key] is available here because vite.config.ts runs in Node.js
  // If the env var is missing, embed 'undefined' as the literal so runtime code
  // can handle it; JSON.stringify(undefined) returns undefined, so coerce to 'undefined'.
  const raw = process.env[key]
  definedEnv[`import.meta.env.${key}`] = raw === undefined ? 'undefined' : JSON.stringify(raw)
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  // Make the env keys available to the client via Vite's define option
  define: definedEnv,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
