import { db } from '../../config/firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, Firestore } from 'firebase/firestore';

describe('Firestore Integration Tests', () => {
  const TEST_COLLECTION = 'test_collection';
  
  // Ensure db is properly typed
  const firestore: Firestore = db;
  
  // Clean up test data after each test
  afterEach(async () => {
    const querySnapshot = await getDocs(collection(firestore, TEST_COLLECTION));
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  });

  it('should initialize Firestore correctly', () => {
    expect(firestore).toBeDefined();
    expect(firestore.type).toBe('firestore');
  });

  it('should write and read data', async () => {
    const testData = {
      name: 'Test Item',
      timestamp: new Date(),
      value: 42
    };

    // Write data
    const docRef = await addDoc(collection(firestore, TEST_COLLECTION), testData);
    expect(docRef.id).toBeDefined();

    // Read data
    const querySnapshot = await getDocs(
      query(collection(firestore, TEST_COLLECTION), where('name', '==', 'Test Item'))
    );
    
    expect(querySnapshot.empty).toBe(false);
    expect(querySnapshot.size).toBe(1);
    
    const doc = querySnapshot.docs[0];
    expect(doc.data().name).toBe(testData.name);
    expect(doc.data().value).toBe(testData.value);
  });

  it('should handle queries correctly', async () => {
    // Add multiple test documents
    const testData = [
      { category: 'A', value: 1 },
      { category: 'A', value: 2 },
      { category: 'B', value: 3 }
    ];

    await Promise.all(
      testData.map(data => addDoc(collection(firestore, TEST_COLLECTION), data))
    );

    // Query for category A
    const querySnapshot = await getDocs(
      query(collection(firestore, TEST_COLLECTION), where('category', '==', 'A'))
    );

    expect(querySnapshot.size).toBe(2);
    querySnapshot.forEach(doc => {
      expect(doc.data().category).toBe('A');
    });
  });
}); 