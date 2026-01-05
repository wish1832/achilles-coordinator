import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  Timestamp,
  type Firestore,
} from 'firebase/firestore'
import { getFirebaseDb } from '@/firebase/client'
import type { User } from '@/types/models'
import type { IUserRepository } from '../interfaces/IUserRepository'

/**
 * Firebase implementation of the user repository.
 * Handles user profile data stored in Firestore.
 */
export class FirebaseUserRepository implements IUserRepository {
  private getDb(): Firestore {
    return getFirebaseDb()
  }

  async createUser(id: string, userData: Omit<User, 'id'>): Promise<void> {
    const docRef = doc(this.getDb(), 'users', id)
    await setDoc(docRef, {
      ...userData,
      createdAt: Timestamp.now(),
    })
  }

  async createUserWithGeneratedId(userData: Omit<User, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.getDb(), 'users'), {
      ...userData,
      createdAt: Timestamp.now(),
    })
    return docRef.id
  }

  async updateUser(id: string, userData: Partial<Omit<User, 'id'>>): Promise<void> {
    const docRef = doc(this.getDb(), 'users', id)
    await updateDoc(docRef, {
      ...userData,
      updatedAt: Timestamp.now(),
    })
  }

  async getUser(id: string): Promise<User | null> {
    const docRef = doc(this.getDb(), 'users', id)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) {
      return null
    }
    return { id: docSnap.id, ...docSnap.data() } as User
  }

  async getUsers(): Promise<User[]> {
    const q = query(collection(this.getDb(), 'users'), orderBy('displayName'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })) as User[]
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const q = query(
      collection(this.getDb(), 'users'),
      where('email', '==', email),
      limit(1),
    )
    const snapshot = await getDocs(q)
    const docSnap = snapshot.docs[0]
    if (!docSnap) {
      return null
    }
    return { id: docSnap.id, ...docSnap.data() } as User
  }
}

export const firebaseUserRepository = new FirebaseUserRepository()
