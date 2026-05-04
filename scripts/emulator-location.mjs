import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

dotenv.config({ path: path.join(projectRoot, '.env'), quiet: true })
dotenv.config({ path: path.join(projectRoot, '.env.emulated'), override: true, quiet: true })

class EmulatorLocationScriptError extends Error {
  constructor(message, details = {}) {
    super(message)
    this.name = 'EmulatorLocationScriptError'
    this.details = details
  }
}

const allowedOptions = new Set([
  'email',
  'password',
  'organization-id',
  'name',
  'address',
  'city',
  'state',
  'notes',
  'latitude',
  'longitude',
  'project-id',
  'auth-host',
  'firestore-host',
  'database-id',
])

function printUsage() {
  console.log(`
Usage:
  pnpm emulator:location create --email <email> --password <password> --organization-id <orgId> --name <location name>

Example:
  pnpm emulator:location create --email "alex@example.com" --password "secret123" --organization-id "abc123" --name "Washington Park"

Options:
  --email <email>                 Existing emulator user email. This user must be an org admin.
  --password <password>           Password for the existing emulator user.
  --organization-id <orgId>       Target organization document ID.
  --name <location name>          Location display name.
  --address <text>                Optional street address.
  --city <text>                   Optional city.
  --state <text>                  Optional state.
  --notes <text>                  Optional location notes.
  --latitude <number>             Optional coordinate latitude.
  --longitude <number>            Optional coordinate longitude.
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
      throw new Error(
        `Unknown option "${token}". Run \`pnpm emulator:location\` to see supported flags.`,
      )
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
  if (!rawBody) return {}

  try {
    return JSON.parse(rawBody)
  } catch {
    return { rawBody }
  }
}

function formatTransportError(error, { step, host, hint }) {
  if (error instanceof EmulatorLocationScriptError) return error

  if (error instanceof TypeError) {
    return new EmulatorLocationScriptError(`${step} failed: could not reach ${host}.`, {
      step,
      hint,
      cause: error.message,
    })
  }

  return new EmulatorLocationScriptError(`${step} failed.`, {
    step,
    hint,
    cause: error instanceof Error ? error.message : String(error),
  })
}

function buildRequestError({ step, url, response, payload, hint }) {
  const message = payload?.error?.message ?? payload?.rawBody ?? response.statusText

  if (message.includes('INVALID_LOGIN_CREDENTIALS') || message.includes('INVALID_PASSWORD')) {
    return new EmulatorLocationScriptError(
      `${step} failed: email/password sign-in to the Auth emulator was rejected.`,
      {
        step,
        hint: 'Check the email and password. This script must sign in as an existing org admin.',
        cause: message,
        url,
      },
    )
  }

  if (message.includes("false for 'create'") || message.includes("false for 'update'")) {
    return new EmulatorLocationScriptError(
      `${step} failed: Firestore security rules rejected the write.`,
      {
        step,
        hint,
        cause: message,
        url,
      },
    )
  }

  return new EmulatorLocationScriptError(`${step} failed: ${message}`, {
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
      body: body === undefined ? undefined : JSON.stringify(body),
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
  if (value === null || value === undefined) return null

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

function buildFirestoreDocumentFields(data) {
  const fields = {}
  for (const [key, value] of Object.entries(data)) {
    const serializedValue = toFirestoreValue(value)
    if (serializedValue !== null) {
      fields[key] = serializedValue
    }
  }
  return fields
}

function extractDocumentId(documentName) {
  return documentName.split('/').at(-1)
}

function parseOptionalFloat(value, optionName) {
  if (value === undefined) return undefined
  const parsed = Number.parseFloat(value)
  if (Number.isNaN(parsed)) {
    throw new Error(`Option --${optionName} must be a number.`)
  }
  return parsed
}

async function createLocationDocument({
  firestoreHost,
  projectId,
  databaseId,
  idToken,
  organizationId,
  name,
  address,
  city,
  state,
  notes,
  latitude,
  longitude,
}) {
  const now = new Date()
  const hasCoordinates = latitude !== undefined && longitude !== undefined

  const locationData = {
    organizationId,
    name,
    address: address || undefined,
    city: city || undefined,
    state: state || undefined,
    notes: notes || undefined,
    createdAt: now,
    coordinates: hasCoordinates
      ? {
          latitude,
          longitude,
        }
      : undefined,
  }

  const url = `http://${firestoreHost}/v1/projects/${projectId}/databases/${databaseId}/documents/locations`
  const response = await requestJson(
    'POST',
    url,
    { fields: buildFirestoreDocumentFields(locationData) },
    {
      step: 'Location creation',
      host: firestoreHost,
      hint: 'Make sure the Firestore emulator is running and that the signed-in user is an admin of the target organization.',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    },
  )

  return extractDocumentId(response.name)
}

async function handleCreateCommand(options) {
  const runtime = getRuntimeConfig(options)
  const email = getRequiredOption(options, 'email').trim().toLowerCase()
  const password = getRequiredOption(options, 'password')
  const organizationId = getRequiredOption(options, 'organization-id').trim()
  const name = getRequiredOption(options, 'name').trim()
  const address = options.address?.trim()
  const city = options.city?.trim()
  const state = options.state?.trim()
  const notes = options.notes?.trim()
  const latitude = parseOptionalFloat(options.latitude, 'latitude')
  const longitude = parseOptionalFloat(options.longitude, 'longitude')

  if ((latitude === undefined) !== (longitude === undefined)) {
    throw new Error('Provide both --latitude and --longitude together, or omit both.')
  }

  const authUser = await signInAuthUser({
    authHost: runtime.authHost,
    email,
    password,
  })

  const locationId = await createLocationDocument({
    firestoreHost: runtime.firestoreHost,
    projectId: runtime.projectId,
    databaseId: runtime.databaseId,
    idToken: authUser.idToken,
    organizationId,
    name,
    address,
    city,
    state,
    notes,
    latitude,
    longitude,
  })

  console.log(`Created location "${name}" (${locationId}) in organization ${organizationId}.`)
}

async function main() {
  const { command, options } = parseArguments(process.argv.slice(2))

  if (command !== 'create') {
    printUsage()
    process.exitCode = 1
    return
  }

  await handleCreateCommand(options)
}

main().catch((error) => {
  if (error instanceof EmulatorLocationScriptError) {
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
