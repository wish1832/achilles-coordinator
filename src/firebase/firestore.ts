import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  type DocumentData,
  type QuerySnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import type { User, Run, SignUp, Pairing } from '@/types/models'

/**
 * Firestore service wrapper with type-safe collection operations
 * Provides CRUD operations for all data models
 */
export class FirestoreService {
  /**
   * Generic method to add a document to a collection
   * @param collectionName - Name of the Firestore collection
   * @param data - Data to add (without id)
   * @returns Promise resolving to the document reference
   */
  async addDocument<T extends { id?: string }>(
    collectionName: string,
    data: Omit<T, 'id'>,
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error)
      throw error
    }
  }

  /**
   * Generic method to update a document
   * @param collectionName - Name of the Firestore collection
   * @param id - Document ID
   * @param data - Data to update
   * @returns Promise that resolves when update is complete
   */
  async updateDocument<T extends { id: string }>(
    collectionName: string,
    id: string,
    data: Partial<Omit<T, 'id'>>,
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id)
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error(`Error updating document ${id} in ${collectionName}:`, error)
      throw error
    }
  }

  /**
   * Generic method to delete a document
   * @param collectionName - Name of the Firestore collection
   * @param id - Document ID
   * @returns Promise that resolves when deletion is complete
   */
  async deleteDocument(collectionName: string, id: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error(`Error deleting document ${id} from ${collectionName}:`, error)
      throw error
    }
  }

  /**
   * Generic method to get a single document
   * @param collectionName - Name of the Firestore collection
   * @param id - Document ID
   * @returns Promise resolving to the document data or null if not found
   */
  async getDocument<T extends { id: string }>(
    collectionName: string,
    id: string,
  ): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T
      }
      return null
    } catch (error) {
      console.error(`Error getting document ${id} from ${collectionName}:`, error)
      throw error
    }
  }

  /**
   * Generic method to get multiple documents with optional query constraints
   * @param collectionName - Name of the Firestore collection
   * @param constraints - Array of query constraints (where, orderBy, limit)
   * @returns Promise resolving to array of documents
   */
  async getDocuments<T extends { id: string }>(
    collectionName: string,
    constraints: any[] = [],
  ): Promise<T[]> {
    try {
      const q = query(collection(db, collectionName), ...constraints)
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[]
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error)
      throw error
    }
  }

  /**
   * Listen to real-time updates for a collection
   * @param collectionName - Name of the Firestore collection
   * @param callback - Function to call when data changes
   * @param constraints - Array of query constraints
   * @returns Unsubscribe function to stop listening
   */
  onCollectionChange<T extends { id: string }>(
    collectionName: string,
    callback: (docs: T[]) => void,
    constraints: any[] = [],
  ): Unsubscribe {
    const q = query(collection(db, collectionName), ...constraints)

    return onSnapshot(q, (querySnapshot) => {
      const docs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[]
      callback(docs)
    })
  }

  // User-specific methods
  async createUser(userData: Omit<User, 'id'>): Promise<string> {
    return this.addDocument<User>('users', userData)
  }

  async updateUser(id: string, userData: Partial<Omit<User, 'id'>>): Promise<void> {
    return this.updateDocument<User>('users', id, userData)
  }

  async getUser(id: string): Promise<User | null> {
    return this.getDocument<User>('users', id)
  }

  async getUsers(): Promise<User[]> {
    return this.getDocuments<User>('users', [orderBy('displayName')])
  }

  // Run-specific methods
  async createRun(runData: Omit<Run, 'id'>): Promise<string> {
    return this.addDocument<Run>('runs', runData)
  }

  async updateRun(id: string, runData: Partial<Omit<Run, 'id'>>): Promise<void> {
    return this.updateDocument<Run>('runs', id, runData)
  }

  async deleteRun(id: string): Promise<void> {
    return this.deleteDocument('runs', id)
  }

  async getRun(id: string): Promise<Run | null> {
    return this.getDocument<Run>('runs', id)
  }

  async getRuns(): Promise<Run[]> {
    return this.getDocuments<Run>('runs', [orderBy('date', 'asc')])
  }

  async getUpcomingRuns(): Promise<Run[]> {
    const now = Timestamp.now()
    return this.getDocuments<Run>('runs', [where('date', '>=', now), orderBy('date', 'asc')])
  }

  // SignUp-specific methods
  async createSignUp(signUpData: Omit<SignUp, 'id'>): Promise<string> {
    return this.addDocument<SignUp>('signups', signUpData)
  }

  async updateSignUp(id: string, signUpData: Partial<Omit<SignUp, 'id'>>): Promise<void> {
    return this.updateDocument<SignUp>('signups', id, signUpData)
  }

  async deleteSignUp(id: string): Promise<void> {
    return this.deleteDocument('signups', id)
  }

  async getSignUpsForRun(runId: string): Promise<SignUp[]> {
    return this.getDocuments<SignUp>('signups', [
      where('runId', '==', runId),
      orderBy('timestamp', 'desc'),
    ])
  }

  async getUserSignUps(userId: string): Promise<SignUp[]> {
    return this.getDocuments<SignUp>('signups', [
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
    ])
  }

  // Pairing-specific methods
  async createPairing(pairingData: Omit<Pairing, 'id'>): Promise<string> {
    return this.addDocument<Pairing>('pairings', pairingData)
  }

  async updatePairing(id: string, pairingData: Partial<Omit<Pairing, 'id'>>): Promise<void> {
    return this.updateDocument<Pairing>('pairings', id, pairingData)
  }

  async deletePairing(id: string): Promise<void> {
    return this.deleteDocument('pairings', id)
  }

  async getPairingsForRun(runId: string): Promise<Pairing[]> {
    return this.getDocuments<Pairing>('pairings', [
      where('runId', '==', runId),
      orderBy('createdAt', 'desc'),
    ])
  }
}

// Export a singleton instance
export const firestoreService = new FirestoreService()
