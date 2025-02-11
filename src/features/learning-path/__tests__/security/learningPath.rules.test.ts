import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, collection, addDoc, deleteDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

describe('Learning Path Security Rules', () => {
  const projectId = 'learning-path-rules-test';
  
  beforeAll(async () => {
    // Initialize test environment
    testEnv = await initializeTestEnvironment({
      projectId,
      firestore: {
        host: '127.0.0.1',
        port: 8082,
        rules: `
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              // Helper functions
              function isAuthenticated() {
                return request.auth != null;
              }
              
              function isCreator(pathId) {
                return resource != null && 
                  request.auth.uid == resource.data.creatorId;
              }
              
              function hasAdminClaim() {
                return request.auth != null && 
                  'admin' in request.auth.token && 
                  request.auth.token.admin == true;
              }

              function isValidPath() {
                let data = request.resource.data;
                return data.keys().hasAll(['title', 'description', 'difficulty', 'creatorId']) &&
                       data.creatorId is string &&
                       ['beginner', 'intermediate', 'advanced'].hasAny([data.difficulty]);
              }
              
              function canModifyPath(pathId) {
                return hasAdminClaim() || isCreator(pathId);
              }

              function canUpdatePath() {
                return hasAdminClaim() || (
                  resource != null &&
                  resource.data.creatorId == request.auth.uid
                );
              }

              function hasValidCreatorId() {
                return !('creatorId' in request.resource.data) ||
                  request.resource.data.creatorId == resource.data.creatorId;
              }
              
              // Learning paths rules
              match /learningPaths/{pathId} {
                allow read: if isAuthenticated();
                allow create: if isAuthenticated() && isValidPath() && (
                  hasAdminClaim() || request.resource.data.creatorId == request.auth.uid
                );
                allow update: if isAuthenticated() && (
                  hasAdminClaim() || (
                    request.auth.uid == resource.data.creatorId
                  )
                );
                allow delete: if isAuthenticated() && canModifyPath(pathId);
                
                // Milestones subcollection
                match /milestones/{milestoneId} {
                  allow read: if isAuthenticated();
                  allow write: if isAuthenticated() && canModifyPath(pathId);
                }
              }
              
              // Progress tracking rules
              match /learningPathProgress/{progressId} {
                allow read: if isAuthenticated() && (
                  hasAdminClaim() || progressId.matches(request.auth.uid + "_.*")
                );
                allow write: if isAuthenticated() && (
                  hasAdminClaim() || progressId.matches(request.auth.uid + "_.*")
                );
              }
            }
          }
        `
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  // Test cases for unauthenticated users
  describe('Unauthenticated Users', () => {
    let unauthedDb: any;

    beforeEach(() => {
      unauthedDb = testEnv.unauthenticatedContext().firestore();
    });

    test('cannot read learning paths', async () => {
      const ref = doc(unauthedDb, 'learningPaths/path1');
      await assertFails(getDoc(ref));
    });

    test('cannot create learning paths', async () => {
      const ref = collection(unauthedDb, 'learningPaths');
      await assertFails(addDoc(ref, {
        title: 'Test Path',
        creatorId: 'user1'
      }));
    });
  });

  // Test cases for authenticated users
  describe('Authenticated Users', () => {
    const userId = 'user123';
    let authedDb: any;

    beforeEach(() => {
      authedDb = testEnv.authenticatedContext(userId).firestore();
    });

    test('can read learning paths', async () => {
      const ref = doc(authedDb, 'learningPaths/path1');
      await assertSucceeds(getDoc(ref));
    });

    test('can create learning paths', async () => {
      const ref = collection(authedDb, 'learningPaths');
      await assertSucceeds(addDoc(ref, {
        title: 'Test Path',
        description: 'Test Description',
        difficulty: 'beginner',
        creatorId: userId,
        isPublic: true,
        category: 'test',
        tags: []
      }));
    });

    test('can update own learning paths', async () => {
      const pathRef = doc(authedDb, 'learningPaths/path1');
      await setDoc(pathRef, { 
        title: 'Original',
        description: 'Original Description',
        difficulty: 'beginner',
        creatorId: userId,
        isPublic: true,
        category: 'test',
        tags: []
      });
      
      await assertSucceeds(setDoc(pathRef, { 
        title: 'Updated',
        description: 'Updated Description',
        difficulty: 'intermediate',
        creatorId: userId,
        isPublic: true,
        category: 'test',
        tags: []
      }, { merge: true }));
    });

    test('cannot update others learning paths', async () => {
      const pathRef = doc(authedDb, 'learningPaths/path1');
      const adminDb = testEnv.authenticatedContext('admin', { admin: true }).firestore();
      
      // First create a path owned by another user using admin context
      await setDoc(doc(adminDb, 'learningPaths/path1'), {
        title: 'Original',
        description: 'Original Description',
        difficulty: 'beginner',
        creatorId: 'otherUser',
        isPublic: true,
        category: 'test',
        tags: []
      });
      
      // Try to update it with non-admin user (should fail)
      await assertFails(setDoc(pathRef, {
        title: 'Updated',
        description: 'Updated Description',
        difficulty: 'intermediate',
        creatorId: 'otherUser',
        isPublic: true,
        category: 'test',
        tags: []
      }, { merge: true }));
    });
  });

  // Test cases for progress tracking
  describe('Progress Tracking', () => {
    const userId = 'user123';
    let authedDb: any;

    beforeEach(() => {
      authedDb = testEnv.authenticatedContext(userId).firestore();
    });

    test('can read own progress', async () => {
      const ref = doc(authedDb, 'learningPathProgress', `${userId}_path1`);
      await assertSucceeds(getDoc(ref));
    });

    test('cannot read others progress', async () => {
      const ref = doc(authedDb, 'learningPathProgress', 'otherUser_path1');
      await assertFails(getDoc(ref));
    });

    test('can update own progress', async () => {
      const ref = doc(authedDb, 'learningPathProgress', `${userId}_path1`);
      await assertSucceeds(setDoc(ref, {
        completedMilestones: ['milestone1']
      }));
    });

    test('cannot update others progress', async () => {
      const ref = doc(authedDb, 'learningPathProgress', 'otherUser_path1');
      await assertFails(setDoc(ref, {
        completedMilestones: ['milestone1']
      }));
    });
  });

  // Test cases for admin users
  describe('Admin Users', () => {
    const adminId = 'admin123';
    let adminDb: any;

    beforeEach(() => {
      adminDb = testEnv.authenticatedContext(adminId, { admin: true }).firestore();
    });

    test('can create learning path for others', async () => {
      const ref = collection(adminDb, 'learningPaths');
      await assertSucceeds(addDoc(ref, {
        title: 'Admin Created Path',
        description: 'Created by admin for another user',
        difficulty: 'beginner',
        creatorId: 'otherUser',
        isPublic: true,
        category: 'test',
        tags: []
      }));
    });

    test('can update any learning path', async () => {
      const pathRef = doc(adminDb, 'learningPaths/path1');
      
      // First create the document
      await setDoc(pathRef, {
        title: 'Original',
        description: 'Original Description',
        difficulty: 'beginner',
        creatorId: 'otherUser',
        isPublic: true,
        category: 'test',
        tags: []
      });
      
      // Then update it
      await assertSucceeds(setDoc(pathRef, {
        title: 'Updated by Admin',
        description: 'Updated Description',
        difficulty: 'intermediate',
        creatorId: 'otherUser', // Keep original creator
        isPublic: true,
        category: 'test',
        tags: []
      }, { merge: true }));
    });

    test('can delete any learning path', async () => {
      const pathRef = doc(adminDb, 'learningPaths/path1');
      
      // First create the document
      await setDoc(pathRef, {
        title: 'To Delete',
        description: 'Will be deleted',
        difficulty: 'beginner',
        creatorId: 'otherUser',
        isPublic: true,
        category: 'test',
        tags: []
      });
      
      // Then delete it
      await assertSucceeds(deleteDoc(pathRef));
    });
  });
}); 