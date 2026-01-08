import type { QueryConstraint, Unsubscribe } from 'firebase/firestore'

/**
 * Collection repository interface.
 * Generic Firestore operations shared across domain repositories.
 */
export interface ICollectionRepository {
  addDocument<T extends { id?: string }>(
    collectionName: string,
    data: Omit<T, 'id'>,
  ): Promise<string>
  updateDocument<T extends { id: string }>(
    collectionName: string,
    id: string,
    data: Partial<Omit<T, 'id'>>,
  ): Promise<void>
  deleteDocument(collectionName: string, id: string): Promise<void>
  getDocument<T extends { id: string }>(collectionName: string, id: string): Promise<T | null>
  getDocuments<T extends { id: string }>(
    collectionName: string,
    constraints?: QueryConstraint[],
  ): Promise<T[]>
  onCollectionChange<T extends { id: string }>(
    collectionName: string,
    callback: (docs: T[]) => void,
    constraints?: QueryConstraint[],
  ): Unsubscribe
}
