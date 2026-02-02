import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  Timestamp,
  type Firestore,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore'

type TimestampOptions = {
  includeCreatedAt?: boolean
  includeUpdatedAt?: boolean
}

/**
 * Shared Firestore CRUD helper for repository implementations.
 * Not exported publicly to avoid accidental use from stores.
 */
export class FirestoreCollectionHelper {
  constructor(private readonly getDb: () => Firestore) {}

  private withTimestamps<T>(data: T, options: TimestampOptions): T {
    const payload = { ...data } as T & { createdAt?: Timestamp; updatedAt?: Timestamp }

    if (options.includeCreatedAt) {
      payload.createdAt = Timestamp.now()
    }
    if (options.includeUpdatedAt) {
      payload.updatedAt = Timestamp.now()
    }

    return payload as T
  }

  async addDocument<T extends { id?: string }>(
    collectionName: string,
    data: Omit<T, 'id'>,
    options: TimestampOptions = { includeCreatedAt: true },
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.getDb(), collectionName), {
        ...this.withTimestamps(data, options),
      })
      return docRef.id
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error)
      throw error
    }
  }

  async setDocument<T extends { id?: string }>(
    collectionName: string,
    id: string,
    data: Omit<T, 'id'>,
    options: TimestampOptions = { includeCreatedAt: true },
  ): Promise<void> {
    try {
      const docRef = doc(this.getDb(), collectionName, id)
      await setDoc(docRef, {
        ...this.withTimestamps(data, options),
      })
    } catch (error) {
      console.error(`Error setting document ${id} in ${collectionName}:`, error)
      throw error
    }
  }

  async updateDocument<T extends { id: string }>(
    collectionName: string,
    id: string,
    data: Partial<Omit<T, 'id'>>,
    options: TimestampOptions = { includeUpdatedAt: true },
  ): Promise<void> {
    try {
      const docRef = doc(this.getDb(), collectionName, id)
      await updateDoc(docRef, {
        ...this.withTimestamps(data, options),
      })
    } catch (error) {
      console.error(`Error updating document ${id} in ${collectionName}:`, error)
      throw error
    }
  }

  async deleteDocument(collectionName: string, id: string): Promise<void> {
    try {
      const docRef = doc(this.getDb(), collectionName, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error(`Error deleting document ${id} from ${collectionName}:`, error)
      throw error
    }
  }

  async getDocument<T extends { id: string }>(
    collectionName: string,
    id: string,
  ): Promise<T | null> {
    try {
      const docRef = doc(this.getDb(), collectionName, id)
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

  async getDocuments<T extends { id: string }>(
    collectionName: string,
    constraints: QueryConstraint[] = [],
  ): Promise<T[]> {
    try {
      const q = query(collection(this.getDb(), collectionName), ...constraints)
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as T[]
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error)
      throw error
    }
  }

  onCollectionChange<T extends { id: string }>(
    collectionName: string,
    callback: (docs: T[]) => void,
    constraints: QueryConstraint[] = [],
  ): Unsubscribe {
    const q = query(collection(this.getDb(), collectionName), ...constraints)

    return onSnapshot(q, (querySnapshot) => {
      const docs = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as T[]
      callback(docs)
    })
  }
}
