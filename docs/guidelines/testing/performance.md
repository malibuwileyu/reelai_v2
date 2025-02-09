# Performance Testing Guidelines

> Performance testing standards for the ReelAI project. See [Testing Guidelines](../testing.md) for overview.

## Test Setup

### 1. Performance Monitoring Setup
```typescript
// performance/setup.ts
import perf from '@react-native-firebase/perf';
import { Platform } from 'react-native';

export async function initializePerformanceMonitoring() {
  if (__DEV__) {
    await perf().setPerformanceCollectionEnabled(true);
  }
  
  // Custom trace for video loading
  const videoLoadTrace = await perf().newTrace('video_load');
  await videoLoadTrace.start();
  
  return {
    videoLoadTrace,
    markVideoStart: async () => {
      await videoLoadTrace.putMetric('video_start_time', Date.now());
    },
    markVideoLoaded: async () => {
      await videoLoadTrace.putMetric('video_load_time', Date.now());
      await videoLoadTrace.stop();
    }
  };
}

export const PerformanceThresholds = {
  videoLoadTime: Platform.select({
    ios: 2000, // 2 seconds
    android: 2500 // 2.5 seconds
  }),
  feedScrollFPS: 58, // Target 58+ FPS
  memoryLimit: Platform.select({
    ios: 200, // 200MB
    android: 150 // 150MB
  })
};
```

## Test Patterns

### 1. Video Performance Tests
```typescript
describe('Video Performance', () => {
  let perfMonitor;
  
  beforeAll(async () => {
    perfMonitor = await initializePerformanceMonitoring();
  });
  
  it('should load video within threshold', async () => {
    await perfMonitor.markVideoStart();
    
    await element(by.id('video-player'))
      .tap();
    
    await perfMonitor.markVideoLoaded();
    
    const trace = await perf().getTrace('video_load');
    const loadTime = trace.getMetric('video_load_time') - 
                    trace.getMetric('video_start_time');
    
    expect(loadTime).toBeLessThan(PerformanceThresholds.videoLoadTime);
  });
  
  it('should maintain FPS during playback', async () => {
    const fpsTrace = await perf().newTrace('video_playback_fps');
    await fpsTrace.start();
    
    // Play video for 10 seconds
    await element(by.id('play-button')).tap();
    await new Promise(r => setTimeout(r, 10000));
    
    await fpsTrace.stop();
    const avgFPS = await fpsTrace.getMetric('avg_fps');
    
    expect(avgFPS).toBeGreaterThan(PerformanceThresholds.feedScrollFPS);
  });
});
```

### 2. Feed Performance Tests
```typescript
describe('Feed Performance', () => {
  it('should scroll smoothly', async () => {
    const scrollTrace = await perf().newTrace('feed_scroll');
    await scrollTrace.start();
    
    // Scroll feed for 5 seconds
    await element(by.id('feed-list'))
      .scroll(2000, 'down', NaN, 0.5);
    
    await scrollTrace.stop();
    const avgFPS = await scrollTrace.getMetric('avg_fps');
    
    expect(avgFPS).toBeGreaterThan(PerformanceThresholds.feedScrollFPS);
  });
  
  it('should lazy load videos efficiently', async () => {
    const memoryTrace = await perf().newTrace('feed_memory');
    await memoryTrace.start();
    
    // Scroll through 20 videos
    for (let i = 0; i < 20; i++) {
      await element(by.id('feed-list'))
        .swipe('up', 'slow', 0.8);
      await new Promise(r => setTimeout(r, 500));
    }
    
    await memoryTrace.stop();
    const peakMemory = await memoryTrace.getMetric('peak_memory');
    
    expect(peakMemory).toBeLessThan(PerformanceThresholds.memoryLimit);
  });
});
```

## Performance Metrics

### 1. Video Metrics
```typescript
// performance/metrics/video.ts
export interface VideoMetrics {
  loadTime: number;
  playbackFPS: number;
  bufferingEvents: number;
  memoryUsage: number;
}

export async function measureVideoMetrics(videoId: string): Promise<VideoMetrics> {
  const trace = await perf().newTrace(`video_metrics_${videoId}`);
  await trace.start();
  
  // Play video for measurement duration
  await element(by.id('video-player')).tap();
  await new Promise(r => setTimeout(r, 30000));
  
  await trace.stop();
  
  return {
    loadTime: trace.getMetric('load_time'),
    playbackFPS: trace.getMetric('avg_fps'),
    bufferingEvents: trace.getMetric('buffering_count'),
    memoryUsage: trace.getMetric('memory_usage')
  };
}
```

### 2. Network Metrics
```typescript
// performance/metrics/network.ts
export interface NetworkMetrics {
  responseTime: number;
  transferSize: number;
  errorRate: number;
}

export async function measureNetworkMetrics(): Promise<NetworkMetrics> {
  const trace = await perf().newTrace('network_metrics');
  await trace.start();
  
  // Perform network operations
  await element(by.id('feed-tab')).tap();
  await new Promise(r => setTimeout(r, 5000));
  
  await trace.stop();
  
  return {
    responseTime: trace.getMetric('avg_response_time'),
    transferSize: trace.getMetric('total_bytes'),
    errorRate: trace.getMetric('error_rate')
  };
}
```

## Performance Reports

### 1. Report Generation
```typescript
// performance/reports/generator.ts
import { VideoMetrics, NetworkMetrics } from '../metrics';

export interface PerformanceReport {
  timestamp: number;
  videoMetrics: VideoMetrics;
  networkMetrics: NetworkMetrics;
  thresholdViolations: string[];
}

export async function generatePerformanceReport(): Promise<PerformanceReport> {
  const videoMetrics = await measureVideoMetrics('test_video');
  const networkMetrics = await measureNetworkMetrics();
  
  const violations = [];
  
  if (videoMetrics.loadTime > PerformanceThresholds.videoLoadTime) {
    violations.push('Video load time exceeded threshold');
  }
  
  if (videoMetrics.playbackFPS < PerformanceThresholds.feedScrollFPS) {
    violations.push('Playback FPS below threshold');
  }
  
  return {
    timestamp: Date.now(),
    videoMetrics,
    networkMetrics,
    thresholdViolations: violations
  };
}
```

### 2. Report Analysis
```typescript
// performance/reports/analyzer.ts
export async function analyzePerformanceReport(
  report: PerformanceReport
): Promise<string> {
  const analysis = [];
  
  // Video performance analysis
  if (report.videoMetrics.loadTime > PerformanceThresholds.videoLoadTime) {
    analysis.push(`
      ⚠️ Video load time (${report.videoMetrics.loadTime}ms) exceeds threshold
      - Check video compression settings
      - Verify CDN performance
      - Review caching strategy
    `);
  }
  
  // Network performance analysis
  if (report.networkMetrics.errorRate > 0.01) {
    analysis.push(`
      ⚠️ High network error rate (${report.networkMetrics.errorRate}%)
      - Review API endpoint stability
      - Check error handling
      - Monitor network conditions
    `);
  }
  
  return analysis.join('\n');
}
``` 