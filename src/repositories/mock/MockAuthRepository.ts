import type { User as FirebaseUser } from 'firebase/auth'
import type { IAuthRepository } from '@/repositories/interfaces/IAuthRepository'
import type { UserRole } from '@/types/models'

type MockAuthUser = {
  uid: string
  email: string
  displayName: string
  password: string
}

const mockUsers: MockAuthUser[] = [
  {
    uid: 'user-admin-1',
    email: 'admin@achilles.local',
    displayName: 'Admin Casey',
    password: 'password',
  },
  {
    uid: 'user-guide-1',
    email: 'guide@achilles.local',
    displayName: 'Guide Riley',
    password: 'password',
  },
  {
    uid: 'user-athlete-1',
    email: 'athlete@achilles.local',
    displayName: 'Athlete Morgan',
    password: 'password',
  },
]

let currentUser: FirebaseUser | null = null
const listeners = new Set<(user: FirebaseUser | null) => void>()
let idCounter = 100

function notifyListeners(user: FirebaseUser | null) {
  for (const listener of listeners) {
    listener(user)
  }
}

function toFirebaseUser(user: MockAuthUser): FirebaseUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  } as FirebaseUser
}

export class MockAuthRepository implements IAuthRepository {
  async signIn(email: string, password: string): Promise<FirebaseUser> {
    const user = mockUsers.find((entry) => entry.email === email)
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password')
    }

    currentUser = toFirebaseUser(user)
    notifyListeners(currentUser)
    return currentUser
  }

  async signOut(): Promise<void> {
    currentUser = null
    notifyListeners(currentUser)
  }

  async createUser(
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
  ): Promise<FirebaseUser> {
    const existing = mockUsers.find((entry) => entry.email === email)
    if (existing) {
      throw new Error('User already exists')
    }

    const newUser: MockAuthUser = {
      uid: `mock-user-${idCounter++}`,
      email,
      displayName,
      password,
    }

    mockUsers.push(newUser)
    currentUser = toFirebaseUser(newUser)
    notifyListeners(currentUser)
    return currentUser
  }

  getCurrentUser(): FirebaseUser | null {
    return currentUser
  }

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void {
    listeners.add(callback)
    callback(currentUser)
    return () => {
      listeners.delete(callback)
    }
  }
}

export const mockAuthRepository = new MockAuthRepository()
