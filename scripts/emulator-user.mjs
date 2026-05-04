import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// Load the base app config first, then layer emulator-specific values on top.
// This matches how the app is run via `pnpm dev:firebase`.
dotenv.config({ path: path.join(projectRoot, '.env'), quiet: true })
dotenv.config({ path: path.join(projectRoot, '.env.emulated'), override: true, quiet: true })

const validCommands = new Set(['create', 'ensure-profile'])
const validRoles = new Set(['athlete', 'guide'])
const allowedOptions = new Set([
  'email',
  'password',
  'display-name',
  'role',
  'organizations',
  'phone',
  'project-id',
  'auth-host',
  'firestore-host',
  'database-id',
])

class EmulatorUserScriptError extends Error {
  constructor(message, details = {}) {
    super(message)
    this.name = 'EmulatorUserScriptError'
    this.details = details
  }
}

function printUsage() {
  console.log(`
Usage:
  pnpm emulator:user create --email <email> --password <password> --display-name <name> --role <athlete|guide>
  pnpm emulator:user ensure-profile --email <email> --password <password> --display-name <name> --role <athlete|guide>

Examples:
  pnpm emulator:user create --email "mr@example.com" --password "secret123" --display-name "Mr Bitch" --role guide
  pnpm emulator:user ensure-profile --email "mr@example.com" --password "secret123" --display-name "Mr Bitch" --role guide

Options:
  --email <email>                 Email address for the Firebase Auth account and Firestore user profile
  --password <password>           Password for Firebase Auth. Required for "create", or for "ensure-profile" when resolving UID by sign-in
  --display-name <name>           Display name stored in Auth and Firestore
  --role <athlete|guide>          Application role stored in Firestore
  --organizations <id1,id2>       Comma-separated organization IDs. Defaults to empty
  --phone <phone>                 Optional phone number stored under profileDetails.phone
  --project-id <projectId>        Defaults to VITE_FIREBASE_PROJECT_ID from .env
  --auth-host <host:port>         Defaults to 127.0.0.1:9099
  --firestore-host <host:port>    Defaults to 127.0.0.1:8080
  --database-id <databaseId>      Defaults to (default)
`.trim())
}

function parseArguments(argv) {
  const [command, ...rest] = argv
  const options = {}

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index]
    if (!token.startsWith('--')) {
      throw new Error(`Unexpected argument "${token}". All options must use --name value format.`)
    }

    const key = token.slice(2)
    if (!allowedOptions.has(key)) {
      throw new Error(`Unknown option "${token}". Run \`pnpm emulator:user\` to see supported flags.`)
    }

    const value = rest[index + 1]
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for option "${token}".`)
    }

    options[key] = value
    index += 1
  }

  return { command, options }
}

function getRequiredOption(options, key) {
  const value = options[key]
  if (!value) {
    throw new Error(`Missing required option --${key}.`)
  }

  return value
}

function getRuntimeConfig(options) {
  const projectId = options['project-id'] ?? process.env.VITE_FIREBASE_PROJECT_ID
  const authHost = options['auth-host'] ?? '127.0.0.1:9099'
  const firestoreHost = options['firestore-host'] ?? '127.0.0.1:8080'
  const databaseId = options['database-id'] ?? '(default)'

  if (!projectId) {
    throw new Error(
      'No Firebase project ID found. Set VITE_FIREBASE_PROJECT_ID in .env or pass --project-id.',
    )
  }

  return { projectId, authHost, firestoreHost, databaseId }
}

async function readJsonResponse(response) {
  const rawBody = await response.text()
  if (!rawBody) {
    return {}
  }

  try {
    return JSON.parse(rawBody)
  } catch {
    return { rawBody }
  }
}

function formatTransportError(error, { step, host, hint }) {
  if (error instanceof EmulatorUserScriptError) {
    return error
  }

  if (error instanceof TypeError) {
    return new EmulatorUserScriptError(`${step} failed: could not reach ${host}.`, {
      step,
      hint,
      cause: error.message,
    })
  }

  return new EmulatorUserScriptError(`${step} failed.`, {
    step,
    hint,
    cause: error instanceof Error ? error.message : String(error),
  })
}

function buildRequestError({ step, url, response, payload, hint }) {
  const message = payload?.error?.message ?? payload?.rawBody ?? response.statusText

  if (message.includes('EMAIL_EXISTS')) {
    return new EmulatorUserScriptError(`${step} failed: that email already exists in the Auth emulator.`, {
      step,
      hint: 'Use a different email, clear the emulator data, or use `pnpm emulator:user ensure-profile ...` if Auth already exists and only the Firestore profile is missing.',
      cause: message,
      url,
    })
  }

  if (message.includes('INVALID_LOGIN_CREDENTIALS') || message.includes('INVALID_PASSWORD')) {
    return new EmulatorUserScriptError(`${step} failed: email/password sign-in to the Auth emulator was rejected.`, {
      step,
      hint: 'Check the email and password, or recreate the user with `pnpm emulator:user create ...`.',
      cause: message,
      url,
    })
  }

  if (message.includes("false for 'create'") || message.includes("false for 'update'")) {
    return new EmulatorUserScriptError(`${step} failed: Firestore security rules rejected the profile write.`, {
      step,
      hint,
      cause: message,
      url,
    })
  }

  return new EmulatorUserScriptError(`${step} failed: ${message}`, {
    step,
    hint,
    cause: message,
    url,
  })
}

async function requestJson(method, url, body, { headers = {}, step, host, hint }) {
  let response

  try {
    response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    })
  } catch (error) {
    throw formatTransportError(error, { step, host, hint })
  }

  const payload = await readJsonResponse(response)
  if (!response.ok) {
    throw buildRequestError({ step, url, response, payload, hint })
  }

  return payload
}

function buildAuthBaseUrl(authHost) {
  return `http://${authHost}/identitytoolkit.googleapis.com/v1`
}

async function createAuthUser({ authHost, email, password, displayName }) {
  const authBaseUrl = buildAuthBaseUrl(authHost)
  const signUpResponse = await requestJson(
    'POST',
    `${authBaseUrl}/accounts:signUp?key=fake-api-key`,
    {
      email,
      password,
      returnSecureToken: true,
    },
    {
      step: 'Auth user creation',
      host: authHost,
      hint: 'Make sure the Firebase Auth emulator is running on the configured host and port.',
    },
  )

  // The REST create call gives us an ID token for the new user. We immediately
  // use it to set displayName so Auth and Firestore stay in sync.
  const updateResponse = await requestJson(
    'POST',
    `${authBaseUrl}/accounts:update?key=fake-api-key`,
    {
      idToken: signUpResponse.idToken,
      displayName,
      returnSecureToken: true,
    },
    {
      step: 'Auth profile update',
      host: authHost,
      hint: 'The Auth emulator created the user but failed while applying the display name.',
    },
  )

  return {
    uid: signUpResponse.localId,
    email: updateResponse.email ?? email,
    idToken: updateResponse.idToken ?? signUpResponse.idToken,
  }
}

async function signInAuthUser({ authHost, email, password }) {
  const authBaseUrl = buildAuthBaseUrl(authHost)
  const response = await requestJson(
    'POST',
    `${authBaseUrl}/accounts:signInWithPassword?key=fake-api-key`,
    {
      email,
      password,
      returnSecureToken: true,
    },
    {
      step: 'Auth sign-in',
      host: authHost,
      hint: 'Make sure the Auth emulator is running and the provided credentials are correct.',
    },
  )

  return {
    uid: response.localId,
    email: response.email ?? email,
    idToken: response.idToken,
  }
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) {
    return null
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value
          .map((entry) => toFirestoreValue(entry))
          .filter((entry) => entry !== null),
      },
    }
  }

  if (value instanceof Date) {
    return { timestampValue: value.toISOString() }
  }

  switch (typeof value) {
    case 'string':
      return { stringValue: value }
    case 'boolean':
      return { booleanValue: value }
    case 'number':
      return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
    case 'object': {
      const fields = {}
      for (const [key, nestedValue] of Object.entries(value)) {
        const serializedValue = toFirestoreValue(nestedValue)
        if (serializedValue !== null) {
          fields[key] = serializedValue
        }
      }

      return { mapValue: { fields } }
    }
    default:
      throw new Error(`Unsupported Firestore value type: ${typeof value}`)
  }
}

function buildFirestoreUserDocument({ email, displayName, role, organizationIds, phone }) {
  const now = new Date()

  return {
    email,
    displayName,
    role,
    organizationIds,
    createdAt: now,
    profileDetails: phone ? { phone } : {},
  }
}

function buildFirestorePatchUrl({ firestoreHost, projectId, databaseId, uid }) {
  const encodedUid = encodeURIComponent(uid)
  return `http://${firestoreHost}/v1/projects/${projectId}/databases/${databaseId}/documents/users/${encodedUid}`
}

async function upsertFirestoreUserProfile({
  firestoreHost,
  projectId,
  databaseId,
  uid,
  idToken,
  email,
  displayName,
  role,
  organizationIds,
  phone,
}) {
  const documentData = buildFirestoreUserDocument({
    email,
    displayName,
    role,
    organizationIds,
    phone,
  })

  const fields = {}
  for (const [key, value] of Object.entries(documentData)) {
    const serializedValue = toFirestoreValue(value)
    if (serializedValue !== null) {
      fields[key] = serializedValue
    }
  }

  const patchUrl = buildFirestorePatchUrl({
    firestoreHost,
    projectId,
    databaseId,
    uid,
  })

  await requestJson(
    'PATCH',
    patchUrl,
    {
      name: `projects/${projectId}/databases/${databaseId}/documents/users/${uid}`,
      fields,
    },
    {
      step: 'Firestore profile write',
      host: firestoreHost,
      hint: 'Make sure the Firestore emulator is running and that your Firestore rules allow this authenticated user to create `users/{uid}`.',
      headers: {
        // Firestore emulator REST requests still flow through security rules.
        // Use the user's Auth emulator ID token so the create is evaluated as an
        // authenticated self-write instead of an anonymous request.
        Authorization: `Bearer ${idToken}`,
      },
    },
  )
}

function normalizeOrganizationIds(rawValue) {
  if (!rawValue) {
    return []
  }

  return rawValue
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

async function handleCreateCommand(options) {
  const runtime = getRuntimeConfig(options)
  const email = getRequiredOption(options, 'email').trim().toLowerCase()
  const password = getRequiredOption(options, 'password')
  const displayName = getRequiredOption(options, 'display-name')
  const role = getRequiredOption(options, 'role')
  const organizationIds = normalizeOrganizationIds(options.organizations)
  const phone = options.phone?.trim()

  if (!validRoles.has(role)) {
    throw new Error(`Invalid role "${role}". Expected one of: athlete, guide.`)
  }

  const authUser = await createAuthUser({
    authHost: runtime.authHost,
    email,
    password,
    displayName,
  })

  await upsertFirestoreUserProfile({
    firestoreHost: runtime.firestoreHost,
    projectId: runtime.projectId,
    databaseId: runtime.databaseId,
    uid: authUser.uid,
    idToken: authUser.idToken,
    email: authUser.email,
    displayName,
    role,
    organizationIds,
    phone,
  })

  console.log(`Created emulator user ${email} (${authUser.uid}) and synced Firestore profile.`)
}

async function handleEnsureProfileCommand(options) {
  const runtime = getRuntimeConfig(options)
  const email = getRequiredOption(options, 'email').trim().toLowerCase()
  const displayName = getRequiredOption(options, 'display-name')
  const role = getRequiredOption(options, 'role')
  const organizationIds = normalizeOrganizationIds(options.organizations)
  const phone = options.phone?.trim()
  let idToken = options['id-token']?.trim()

  if (!validRoles.has(role)) {
    throw new Error(`Invalid role "${role}". Expected one of: athlete, guide.`)
  }

  let uid = undefined

  // If the caller does not know the UID, resolve it by signing into the Auth
  // emulator with the user's email/password. This is useful when Auth already
  // exists but the matching Firestore profile document does not.
  const password = getRequiredOption(options, 'password')
  const authUser = await signInAuthUser({
    authHost: runtime.authHost,
    email,
    password,
  })
  uid = authUser.uid
  idToken = authUser.idToken

  if (!idToken) {
    throw new Error(
      'Missing Auth token for Firestore write. Either provide --password so the script can sign in, or use the create command.',
    )
  }

  await upsertFirestoreUserProfile({
    firestoreHost: runtime.firestoreHost,
    projectId: runtime.projectId,
    databaseId: runtime.databaseId,
    uid,
    idToken,
    email,
    displayName,
    role,
    organizationIds,
    phone,
  })

  console.log(`Ensured Firestore profile for emulator user ${email} (${uid}).`)
}

async function main() {
  const { command, options } = parseArguments(process.argv.slice(2))

  if (!command || !validCommands.has(command)) {
    printUsage()
    process.exitCode = 1
    return
  }

  await (command === 'create' ? handleCreateCommand(options) : handleEnsureProfileCommand(options))
}

main().catch((error) => {
  if (error instanceof EmulatorUserScriptError) {
    console.error(error.message)
    if (error.details?.hint) {
      console.error(`Hint: ${error.details.hint}`)
    }
    if (error.details?.cause) {
      console.error(`Cause: ${error.details.cause}`)
    }
  } else {
    console.error(error instanceof Error ? error.message : error)
  }
  process.exitCode = 1
})
