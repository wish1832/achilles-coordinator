import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

dotenv.config({ path: path.join(projectRoot, '.env'), quiet: true })
dotenv.config({ path: path.join(projectRoot, '.env.emulated'), override: true, quiet: true })

class EmulatorOrganizationScriptError extends Error {
  constructor(message, details = {}) {
    super(message)
    this.name = 'EmulatorOrganizationScriptError'
    this.details = details
  }
}

const allowedOptions = new Set([
  'email',
  'password',
  'name',
  'description',
  'timezone',
  'default-max-athletes',
  'default-max-guides',
  'project-id',
  'auth-host',
  'firestore-host',
  'database-id',
])

function printUsage() {
  console.log(`
Usage:
  pnpm emulator:organization create --email <email> --password <password> --name <org name>

Example:
  pnpm emulator:organization create --email "alex@example.com" --password "secret123" --name "Achilles Denver"

Options:
  --email <email>                 Existing emulator user email. This user becomes the first admin/member.
  --password <password>           Password for the existing emulator user.
  --name <org name>               Organization display name.
  --description <text>            Optional organization description.
  --timezone <iana zone>          Optional timezone, for example "America/Denver".
  --default-max-athletes <n>      Optional default max athletes setting.
  --default-max-guides <n>        Optional default max guides setting.
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
        `Unknown option "${token}". Run \`pnpm emulator:organization\` to see supported flags.`,
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
  if (error instanceof EmulatorOrganizationScriptError) return error

  if (error instanceof TypeError) {
    return new EmulatorOrganizationScriptError(`${step} failed: could not reach ${host}.`, {
      step,
      hint,
      cause: error.message,
    })
  }

  return new EmulatorOrganizationScriptError(`${step} failed.`, {
    step,
    hint,
    cause: error instanceof Error ? error.message : String(error),
  })
}

function buildRequestError({ step, url, response, payload, hint }) {
  const message = payload?.error?.message ?? payload?.rawBody ?? response.statusText

  if (message.includes('INVALID_LOGIN_CREDENTIALS') || message.includes('INVALID_PASSWORD')) {
    return new EmulatorOrganizationScriptError(
      `${step} failed: email/password sign-in to the Auth emulator was rejected.`,
      {
        step,
        hint: 'Check the email and password. The organization bootstrap must sign in as an existing emulator user.',
        cause: message,
        url,
      },
    )
  }

  if (message.includes("false for 'create'") || message.includes("false for 'update'")) {
    return new EmulatorOrganizationScriptError(
      `${step} failed: Firestore security rules rejected the write.`,
      {
        step,
        hint,
        cause: message,
        url,
      },
    )
  }

  return new EmulatorOrganizationScriptError(`${step} failed: ${message}`, {
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

function fromFirestoreValue(value) {
  if (!value || typeof value !== 'object') return undefined
  if ('stringValue' in value) return value.stringValue
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return Number(value.doubleValue)
  if ('booleanValue' in value) return value.booleanValue
  if ('timestampValue' in value) return value.timestampValue
  if ('arrayValue' in value) {
    return (value.arrayValue.values ?? []).map((entry) => fromFirestoreValue(entry))
  }
  if ('mapValue' in value) {
    const result = {}
    for (const [key, nestedValue] of Object.entries(value.mapValue.fields ?? {})) {
      result[key] = fromFirestoreValue(nestedValue)
    }
    return result
  }
  return undefined
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

async function createOrganizationDocument({
  firestoreHost,
  projectId,
  databaseId,
  idToken,
  uid,
  name,
  description,
  timezone,
  defaultMaxAthletes,
  defaultMaxGuides,
}) {
  const now = new Date()
  const organizationData = {
    name,
    description: description || undefined,
    adminIds: [uid],
    memberIds: [uid],
    createdAt: now,
    settings: {
      defaultMaxAthletes,
      defaultMaxGuides,
      timezone,
    },
  }

  const url = `http://${firestoreHost}/v1/projects/${projectId}/databases/${databaseId}/documents/organizations`
  const response = await requestJson(
    'POST',
    url,
    { fields: buildFirestoreDocumentFields(organizationData) },
    {
      step: 'Organization creation',
      host: firestoreHost,
      hint: 'Make sure the Firestore emulator is running and that your rules allow authenticated users to create organizations.',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    },
  )

  return extractDocumentId(response.name)
}

async function getUserProfileDocument({ firestoreHost, projectId, databaseId, idToken, uid }) {
  const url = `http://${firestoreHost}/v1/projects/${projectId}/databases/${databaseId}/documents/users/${encodeURIComponent(uid)}`
  const response = await requestJson(
    'GET',
    url,
    undefined,
    {
      step: 'User profile lookup',
      host: firestoreHost,
      hint: 'Make sure the emulator user already has a Firestore profile. You can create one with `pnpm emulator:user create ...`.',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    },
  )

  return response
}

async function updateUserOrganizationIds({
  firestoreHost,
  projectId,
  databaseId,
  idToken,
  uid,
  userDocument,
  organizationId,
}) {
  const currentOrganizationIds = Array.isArray(fromFirestoreValue(userDocument.fields?.organizationIds))
    ? fromFirestoreValue(userDocument.fields.organizationIds)
    : []

  const updatedOrganizationIds = Array.from(new Set([...currentOrganizationIds, organizationId]))
  const now = new Date()
  const url = `http://${firestoreHost}/v1/projects/${projectId}/databases/${databaseId}/documents/users/${encodeURIComponent(uid)}?updateMask.fieldPaths=organizationIds&updateMask.fieldPaths=updatedAt`

  await requestJson(
    'PATCH',
    url,
    {
      name: userDocument.name,
      fields: buildFirestoreDocumentFields({
        organizationIds: updatedOrganizationIds,
        updatedAt: now,
      }),
    },
    {
      step: 'User profile organization update',
      host: firestoreHost,
      hint: 'The signed-in user must be allowed to update their own `users/{uid}` document.',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    },
  )
}

function parseOptionalInteger(value, optionName) {
  if (value === undefined) return undefined
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) {
    throw new Error(`Option --${optionName} must be an integer.`)
  }
  return parsed
}

async function handleCreateCommand(options) {
  const runtime = getRuntimeConfig(options)
  const email = getRequiredOption(options, 'email').trim().toLowerCase()
  const password = getRequiredOption(options, 'password')
  const name = getRequiredOption(options, 'name').trim()
  const description = options.description?.trim()
  const timezone = options.timezone?.trim()
  const defaultMaxAthletes = parseOptionalInteger(options['default-max-athletes'], 'default-max-athletes')
  const defaultMaxGuides = parseOptionalInteger(options['default-max-guides'], 'default-max-guides')

  const authUser = await signInAuthUser({
    authHost: runtime.authHost,
    email,
    password,
  })

  const organizationId = await createOrganizationDocument({
    firestoreHost: runtime.firestoreHost,
    projectId: runtime.projectId,
    databaseId: runtime.databaseId,
    idToken: authUser.idToken,
    uid: authUser.uid,
    name,
    description,
    timezone,
    defaultMaxAthletes,
    defaultMaxGuides,
  })

  const userDocument = await getUserProfileDocument({
    firestoreHost: runtime.firestoreHost,
    projectId: runtime.projectId,
    databaseId: runtime.databaseId,
    idToken: authUser.idToken,
    uid: authUser.uid,
  })

  await updateUserOrganizationIds({
    firestoreHost: runtime.firestoreHost,
    projectId: runtime.projectId,
    databaseId: runtime.databaseId,
    idToken: authUser.idToken,
    uid: authUser.uid,
    userDocument,
    organizationId,
  })

  console.log(`Created organization "${name}" (${organizationId}) and added it to ${email}.`)
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
  if (error instanceof EmulatorOrganizationScriptError) {
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
