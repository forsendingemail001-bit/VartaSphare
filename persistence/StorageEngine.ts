
export class StorageEngine {
  private dbName = 'VartaSphere_LocalCloud';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('messages')) {
          db.createObjectStore('messages', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('rooms')) {
          db.createObjectStore('rooms', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('clans')) {
          db.createObjectStore('clans', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        console.log("VartaStorage: Automatic provisioning complete.");
        resolve();
      };

      request.onerror = () => reject("Failed to initialize VartaStorage");
    });
  }

  async save(storeName: string, data: any): Promise<void> {
    if (!this.db) return;
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(data);
  }

  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) return;
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.delete(id);
  }

  async clearByRoom(roomId: string): Promise<void> {
    if (!this.db) return;
    const tx = this.db.transaction('messages', 'readwrite');
    const store = tx.objectStore('messages');
    const request = store.getAll();
    request.onsuccess = () => {
      const messages = request.result;
      messages.forEach((m: any) => {
        if (m.roomId === roomId) {
          store.delete(m.id);
        }
      });
    };
  }

  async getAll(storeName: string): Promise<any[]> {
    if (!this.db) return [];
    return new Promise((resolve) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
    });
  }
}

export const storageEngine = new StorageEngine();
