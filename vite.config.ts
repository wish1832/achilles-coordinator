import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
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
  'VITE_FIREBASE_USE_EMULATOR',
  'VITE_FIREBASE_AUTH_EMULATOR_HOST',
  'VITE_FIREBASE_AUTH_EMULATOR_PORT',
  'VITE_FIREBASE_FIRESTORE_EMULATOR_HOST',
  'VITE_FIREBASE_FIRESTORE_EMULATOR_PORT',
]

// Use the function form of defineConfig so we can call loadEnv, which reads
// .env files from disk. The plain process.env approach misses values that are
// only defined in .env (not exported in the shell) when vite.config.ts runs.
export default defineConfig(({ mode }) => {
  // Load all env vars (prefix '' = no filter) from the project root.
  const env = loadEnv(mode, process.cwd(), '')

  console.log(
    `[vite.config.ts debug] VITE_FIREBASE_AUTH_DOMAIN:`,
    env['VITE_FIREBASE_AUTH_DOMAIN']
      ? `***${env['VITE_FIREBASE_AUTH_DOMAIN']}***`
      : 'undefined',
  )

  // Dynamically create the 'define' object. Type it so TypeScript knows the shape.
  const definedEnv: Record<string, string> = {}
  firebaseEnvVars.forEach((key) => {
    // Use JSON.stringify to ensure the value is correctly embedded as a string literal.
    // If the env var is missing, embed 'undefined' as the literal so runtime code
    // can handle it; JSON.stringify(undefined) returns undefined, so coerce to string.
    const raw = env[key]
    definedEnv[`import.meta.env.${key}`] = raw === undefined ? 'undefined' : JSON.stringify(raw)
  })

  // Parse comma-separated VITE_ALLOWED_HOSTS into an array of hostnames.
  // Example: VITE_ALLOWED_HOSTS=el-zorro,myapp.ngrok.io
  const allowedHosts = env['VITE_ALLOWED_HOSTS']
    ? env['VITE_ALLOWED_HOSTS'].split(',').map((h) => h.trim()).filter(Boolean)
    : []

  return {
    plugins: [vue(), vueDevTools()],
    // Make the Firebase env keys available to the client via Vite's define option
    define: definedEnv,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      // Allow additional hosts beyond localhost (e.g. machine hostname, tunnels, LAN).
      // Set VITE_ALLOWED_HOSTS=host1,host2 in your .env to add entries.
      allowedHosts: allowedHosts.length > 0 ? allowedHosts : undefined,
    },
  }
})
