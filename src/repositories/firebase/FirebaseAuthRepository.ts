import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb } from '@/firebase/client'
import type { UserRole } from '@/types/models'
import type { IAuthRepository } from '../interfaces/IAuthRepository'

export class FirebaseAuthRepository implements IAuthRepository {
  async signIn(email: string, password: string): Promise<FirebaseUser> {
    const auth = getFirebaseAuth()
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  }

  async signOut(): Promise<void> {
    const auth = getFirebaseAuth()
    await firebaseSignOut(auth)
  }

  async createUser(
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
  ): Promise<FirebaseUser> {
    const auth = getFirebaseAuth()
    const db = getFirebaseDb()

    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    await updateProfile(user, { displayName })

    await setDoc(doc(db, 'users', user.uid), {
      email: user.email ?? email,
      displayName,
      role,
      createdAt: Timestamp.now(),
      profileDetails: {},
    })

    return user
  }

  getCurrentUser(): FirebaseUser | null {
    const auth = getFirebaseAuth()
    return auth.currentUser
  }

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void {
    const auth = getFirebaseAuth()
    return firebaseOnAuthStateChanged(auth, callback)
  }
}

export const firebaseAuthRepository = new FirebaseAuthRepository()
