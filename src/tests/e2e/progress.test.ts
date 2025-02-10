import { auth, db } from '../../config/firebase';
import { signInAnonymously, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { ProgressService } from '../../services/progressService';
import { COLLECTIONS } from '../../constants';
import { Progress } from '../../models/Progress';

describe('Progress Tracking E2E Tests', () => {
  const testVideoId = 'test-video-123';
  let userId: string;

  beforeEach(async () => {
    // Sign in anonymously for testing
    const userCred = await signInAnonymously(auth);
    userId = userCred.user.uid;
  });

  afterEach(async () => {
    await signOut(auth);
  });

  it('should create and update progress', async () => {
    // Initial progress update
    await ProgressService.updateProgress(userId, testVideoId, 30, 30000);

    // Verify progress was created
    const progressRef = doc(db, COLLECTIONS.PROGRESS, `${userId}_${testVideoId}`);
    const progressDoc = await getDoc(progressRef);
    
    expect(progressDoc.exists()).toBe(true);
    expect(progressDoc.data()).toMatchObject({
      userId,
      videoId: testVideoId,
      watchedSeconds: 30,
      lastPosition: 30000,
      completed: false
    });

    // Update progress
    await ProgressService.updateProgress(userId, testVideoId, 60, 60000);
    
    // Verify progress was updated
    const updatedDoc = await getDoc(progressRef);
    expect(updatedDoc.data()).toMatchObject({
      watchedSeconds: 60,
      lastPosition: 60000
    });
  });

  it('should record watch history', async () => {
    // Update progress which should record history
    await ProgressService.updateProgress(userId, testVideoId, 45, 45000);

    // Query watch history
    const historyQuery = query(
      collection(db, 'watchHistory'),
      where('userId', '==', userId),
      where('videoId', '==', testVideoId)
    );
    
    const historyDocs = await getDocs(historyQuery);
    expect(historyDocs.empty).toBe(false);
    
    const historyEntry = historyDocs.docs[0].data();
    expect(historyEntry).toMatchObject({
      userId,
      videoId: testVideoId,
      lastPosition: 45000
    });
  });

  it('should mark video as completed', async () => {
    // Create initial progress
    await ProgressService.updateProgress(userId, testVideoId, 0, 0);
    
    // Mark as completed
    await ProgressService.markAsCompleted(userId, testVideoId);

    // Verify completion status
    const progressRef = doc(db, COLLECTIONS.PROGRESS, `${userId}_${testVideoId}`);
    const progressDoc = await getDoc(progressRef);
    
    expect(progressDoc.exists()).toBe(true);
    expect(progressDoc.data()?.completed).toBe(true);
  });

  it('should retrieve user progress', async () => {
    // Create progress for multiple videos
    const testVideos = ['video1', 'video2', 'video3'];
    
    await Promise.all(testVideos.map(videoId => 
      ProgressService.updateProgress(userId, videoId, 30, 30000)
    ));

    // Get all progress for user
    const userProgress = await ProgressService.getUserProgress(userId);
    
    expect(userProgress.length).toBe(testVideos.length);
    userProgress.forEach(progress => {
      expect(progress.userId).toBe(userId);
      expect(testVideos).toContain(progress.videoId);
    });
  });

  it('should update daily metrics', async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Update progress which should update metrics
    await ProgressService.updateProgress(userId, testVideoId, 30, 30000);

    // Check daily metrics
    const metricsRef = doc(db, 'dailyWatchMetrics', `${userId}_${today}`);
    const metricsDoc = await getDoc(metricsRef);
    
    expect(metricsDoc.exists()).toBe(true);
    expect(metricsDoc.data()?.watchCount).toBeGreaterThan(0);
  });

  it('should handle concurrent progress updates', async () => {
    // Simulate multiple concurrent updates
    const updates = [
      ProgressService.updateProgress(userId, testVideoId, 10, 10000),
      ProgressService.updateProgress(userId, testVideoId, 20, 20000),
      ProgressService.updateProgress(userId, testVideoId, 30, 30000)
    ];

    await Promise.all(updates);

    // Verify final state
    const progressRef = doc(db, COLLECTIONS.PROGRESS, `${userId}_${testVideoId}`);
    const progressDoc = await getDoc(progressRef);
    
    expect(progressDoc.exists()).toBe(true);
    const data = progressDoc.data() as Progress;
    expect(data.watchedSeconds).toBe(30);
    expect(data.lastPosition).toBe(30000);
  });
}); 