import { renderHook, act } from '@testing-library/react-hooks';
import { useAudioExtractor } from '../useAudioExtractor';
import { AudioExtractor } from '../../services/audioExtractor';
import { VideoError, VideoErrorCode } from '../../types/video';

// Mock the AudioExtractor class
jest.mock('../../services/audioExtractor');

// Mock the VideoError class if it's not being recognized
jest.mock('../../types/video', () => ({
  VideoError: class VideoError extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.name = 'VideoError';
      this.code = code;
    }
  }
}));

describe('useAudioExtractor', () => {
  let mockExtractAudio: jest.Mock;
  let mockDestroy: jest.Mock;

  beforeEach(() => {
    mockExtractAudio = jest.fn();
    mockDestroy = jest.fn();

    // Setup mock implementation
    (AudioExtractor as jest.Mock).mockImplementation(() => ({
      extractAudio: mockExtractAudio,
      destroy: mockDestroy
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAudioExtractor());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isExtracting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.progress).toBe(0);
    expect(typeof result.current.extractAudio).toBe('function');
  });

  it('should handle successful audio extraction', async () => {
    const mockAudioBlob = new Blob(['test'], { type: 'audio/mp3' });
    mockExtractAudio.mockResolvedValue(mockAudioBlob);

    const onComplete = jest.fn();
    const onProgress = jest.fn();
    const onError = jest.fn();

    const { result } = renderHook(() =>
      useAudioExtractor({ onComplete, onProgress, onError })
    );

    const mockVideoFile = new Blob(['test'], { type: 'video/mp4' });

    let extractedBlob;
    await act(async () => {
      extractedBlob = await result.current.extractAudio(mockVideoFile);
    });

    expect(mockExtractAudio).toHaveBeenCalledWith(mockVideoFile, expect.any(Function));
    expect(onComplete).toHaveBeenCalledWith(mockAudioBlob);
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.isExtracting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(extractedBlob).toBe(mockAudioBlob);
  });

  it('should handle extraction errors', async () => {
    const testError = new VideoError('Test error', 'audio/extraction-failed' as VideoErrorCode);
    mockExtractAudio.mockRejectedValue(testError);

    const onComplete = jest.fn();
    const onError = jest.fn();

    const { result } = renderHook(() =>
      useAudioExtractor({ onComplete, onError })
    );

    const mockVideoFile = new Blob(['test'], { type: 'video/mp4' });

    try {
      await act(async () => {
        await result.current.extractAudio(mockVideoFile);
      });
      fail('Should have thrown an error');
    } catch (error) {
      if (error instanceof Error) {
        expect(error).toBeInstanceOf(VideoError);
        expect((error as VideoError).code).toBe('audio/extraction-failed');
      } else {
        fail('Error should be an instance of Error');
      }
    }

    expect(onComplete).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(testError);
    expect(result.current.isExtracting).toBe(false);
    expect(result.current.error).toEqual(testError);
  });

  it('should clean up on unmount', () => {
    const { unmount } = renderHook(() => useAudioExtractor());

    unmount();

    expect(mockDestroy).toHaveBeenCalled();
  });

  it('should update progress during extraction', async () => {
    const mockAudioBlob = new Blob(['test'], { type: 'audio/mp3' });
    mockExtractAudio.mockImplementation(async (_, progressCallback) => {
      progressCallback(50);
      return mockAudioBlob;
    });

    const onProgress = jest.fn();
    const { result } = renderHook(() => useAudioExtractor({ onProgress }));

    const mockVideoFile = new Blob(['test'], { type: 'video/mp4' });

    await act(async () => {
      await result.current.extractAudio(mockVideoFile);
    });

    expect(onProgress).toHaveBeenCalledWith(50);
    expect(result.current.progress).toBe(100);
  });
}); 