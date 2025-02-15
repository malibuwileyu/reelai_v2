import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  setDoc,
  writeBatch,
  DocumentData,
  QuerySnapshot,
  CollectionReference,
  DocumentReference,
  WriteBatch,
  Firestore
} from 'firebase/firestore';

export class FirestoreService {
  private db = getFirestore();

  /**
   * Get a document from Firestore
   */
  async get<T>(path: string): Promise<T | null> {
    const docRef = doc(this.db, path);
    const docSnap = await getDoc(docRef);
    return (docSnap.exists() ? docSnap.data() : null) as T | null;
  }

  /**
   * Set a document in Firestore
   */
  async set<T extends DocumentData>(path: string, data: T): Promise<void> {
    const docRef = doc(this.db, path);
    await setDoc(docRef, data);
  }

  /**
   * Get a document reference
   */
  doc(path: string): DocumentReference {
    return doc(this.db, path);
  }

  /**
   * Get a collection reference with get method
   */
  collection(path: string): CollectionReference & { get(): Promise<QuerySnapshot> } {
    const collectionRef = collection(this.db, path);
    return Object.assign(collectionRef, {
      get: () => getDocs(collectionRef)
    });
  }

  /**
   * Create a write batch
   */
  batch(): WriteBatch {
    return writeBatch(this.db);
  }
} 