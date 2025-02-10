import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useProgress } from '../useProgress';
import { AuthProvider } from '../../providers/AuthProvider';
import { auth } from '../../config/firebase';
import { signInAnonymously, signOut } from 'firebase/auth';
import { ProgressService } from '../../services/progressService';

// Mock ProgressService
jest.mock('../../services/progressService');

describe('useProgress Hook Integration Tests', () => {
  const testVideoId = 'test-video-123';
  let userId: string;

  beforeEach(async () => {
    // Sign in anonymously for testing
    const userCred = await signInAnonymously(auth);
    userId = userCred.user.uid;
  });

  afterEach(async () => {
    await signOut(auth);
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('should load initial progress', async () => {
    const mockProgress = {
      userId,
      videoId: testVideoId,
      watchedSeconds: 30,
      lastPosition: 30000,
      completed: false
    };

    (ProgressService.getProgress as jest.Mock).mockResolvedValueOnce(mockProgress);

    const { result } = renderHook(() => useProgress(testVideoId), {
      wrapper
    });

    // Initial state
    expect(result.current.loading).toBe(true);
    expect(result.current.progress).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // After loading
    expect(result.current.progress).toEqual(mockProgress);
    expect(result.current.error).toBeNull();
  });

  it('should handle progress updates', async () => {
    const { result } = renderHook(() => useProgress(testVideoId), {
      wrapper
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Update progress
    await act(async () => {
      await result.current.updateProgress(60, 60000);
    });

    expect(ProgressService.updateProgress).toHaveBeenCalledWith(
      userId,
      testVideoId,
      60,
      60000
    );

    // Local state should be updated
    expect(result.current.progress).toMatchObject({
      watchedSeconds: 60,
      lastPosition: 60000
    });
  });

  it('should handle completion marking', async () => {
    const { result } = renderHook(() => useProgress(testVideoId), {
      wrapper
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mark as completed
    await act(async () => {
      await result.current.markAsCompleted();
    });

    expect(ProgressService.markAsCompleted).toHaveBeenCalledWith(
      userId,
      testVideoId
    );

    // Local state should be updated
    expect(result.current.progress?.completed).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    const testError = new Error('Test error');
    (ProgressService.getProgress as jest.Mock).mockRejectedValueOnce(testError);

    const { result } = renderHook(() => useProgress(testVideoId), {
      wrapper
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(testError);
    expect(result.current.progress).toBeNull();
  });

  it('should handle update errors', async () => {
    const { result } = renderHook(() => useProgress(testVideoId), {
      wrapper
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const testError = new Error('Update error');
    (ProgressService.updateProgress as jest.Mock).mockRejectedValueOnce(testError);

    await act(async () => {
      await result.current.updateProgress(90, 90000);
    });

    expect(result.current.error).toBe(testError);
  });

  it('should not update progress without authentication', async () => {
    await signOut(auth); // Ensure no user is signed in

    const { result } = renderHook(() => useProgress(testVideoId), {
      wrapper
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateProgress(30, 30000);
    });

    expect(ProgressService.updateProgress).not.toHaveBeenCalled();
  });
}); 