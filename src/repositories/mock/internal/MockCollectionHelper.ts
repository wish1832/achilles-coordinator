import type { QueryConstraint, Unsubscribe } from 'firebase/firestore'
import type { CollectionName } from '../mockState'

type HelperDeps = {
  getCollection: <T>(collectionName: CollectionName) => T[]
  setCollection: <T>(collectionName: CollectionName, items: T[]) => void
  clone: <T>(value: T) => T
  nextId: (prefix: string) => string
}

/**
 * Shared in-memory CRUD helper for mock repositories.
 * Not exported publicly to avoid accidental use from stores.
 */
export class MockCollectionHelper {
  constructor(private readonly deps: HelperDeps) {}

  async addDocument<T extends { id?: string }>(
    collectionName: CollectionName,
    data: Omit<T, 'id'>,
  ): Promise<string> {
    const id = this.deps.nextId(collectionName)
    const items = this.deps.getCollection<T>(collectionName)
    items.push({ ...this.deps.clone(data), id } as T)
    return id
  }

  async setDocument<T extends { id?: string }>(
    collectionName: CollectionName,
    id: string,
    data: Omit<T, 'id'>,
  ): Promise<void> {
    const items = this.deps.getCollection<T>(collectionName)
    const exists = items.some((entry) => (entry as { id?: string }).id === id)
    if (exists) {
      throw new Error(`Document ${id} already exists in ${collectionName}`)
    }
    items.push({ ...this.deps.clone(data), id } as T)
  }

  async updateDocument<T extends { id: string }>(
    collectionName: CollectionName,
    id: string,
    data: Partial<Omit<T, 'id'>>,
  ): Promise<void> {
    const items = this.deps.getCollection<T>(collectionName)
    const index = items.findIndex((entry) => entry.id === id)
    if (index === -1) {
      throw new Error(`Document ${id} not found in ${collectionName}`)
    }
    items[index] = { ...items[index], ...this.deps.clone(data) } as T
  }

  async deleteDocument(collectionName: CollectionName, id: string): Promise<void> {
    const items = this.deps.getCollection<{ id: string }>(collectionName)
    this.deps.setCollection(
      collectionName,
      items.filter((entry) => entry.id !== id),
    )
  }

  async getDocument<T extends { id: string }>(
    collectionName: CollectionName,
    id: string,
  ): Promise<T | null> {
    const items = this.deps.getCollection<T>(collectionName)
    const item = items.find((entry) => entry.id === id)
    return item ? this.deps.clone(item) : null
  }

  async getDocuments<T extends { id: string }>(
    collectionName: CollectionName,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _constraints?: QueryConstraint[],
  ): Promise<T[]> {
    const items = this.deps.getCollection<T>(collectionName)
    return this.deps.clone(items)
  }

  onCollectionChange<T extends { id: string }>(
    collectionName: CollectionName,
    callback: (docs: T[]) => void,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _constraints?: QueryConstraint[],
  ): Unsubscribe {
    void this.getDocuments<T>(collectionName).then(callback)
    return () => {}
  }
}
