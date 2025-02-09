# E2E Testing Guidelines

> Detailed end-to-end testing standards for the ReelAI project. See [Testing Guidelines](../testing.md) for overview.

## Test Setup

### 1. Detox Configuration
```javascript
// .detoxrc.js
module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/config.json',
  specs: 'e2e',
  behavior: {
    init: {
      exposeGlobals: true,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/ReelAI.app',
      build: 'xcodebuild -workspace ios/ReelAI.xcworkspace -scheme ReelAI -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/ReelAI.app',
      build: 'xcodebuild -workspace ios/ReelAI.xcworkspace -scheme ReelAI -configuration Release -sdk iphonesimulator -derivedDataPath ios/build'
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14'
      }
    }
  }
};
```

### 2. Test Environment
```typescript
// e2e/environment.js
const { DetoxCircusEnvironment } = require('detox/runners/jest');

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(config, context) {
    super(config, context);
    
    this.initTimeout = 300000;
    this.testTimeout = 120000;
    
    this.registerListeners({
      testStart: async () => {
        await device.reloadReactNative();
        await device.setURLBlacklist(['.*google.*']);
      },
      testFailed: async () => {
        await device.takeScreenshot('test-failed');
      }
    });
  }
}

module.exports = CustomDetoxEnvironment;
```

## Test Patterns

### 1. Authentication Flow
```typescript
describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' }
    });
  });
  
  beforeEach(async () => {
    await device.reloadReactNative();
  });
  
  it('should login successfully', async () => {
    await element(by.id('email-input'))
      .typeText('test@example.com');
    
    await element(by.id('password-input'))
      .typeText('Password123!');
    
    await element(by.id('login-button')).tap();
    
    await expect(element(by.id('feed-screen')))
      .toBeVisible();
  });
  
  it('should show validation errors', async () => {
    await element(by.id('login-button')).tap();
    
    await expect(element(by.text('Email is required')))
      .toBeVisible();
    
    await expect(element(by.text('Password is required')))
      .toBeVisible();
  });
});
```

### 2. Video Upload Flow
```typescript
describe('Video Upload Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { camera: 'YES', photos: 'YES' }
    });
    await loginUser();
  });
  
  it('should upload video successfully', async () => {
    await element(by.id('upload-tab')).tap();
    
    await element(by.id('select-video')).tap();
    
    await element(by.type('UIImagePickerController'))
      .atIndex(0)
      .tap();
    
    await expect(element(by.id('upload-progress')))
      .toBeVisible();
    
    await waitFor(element(by.text('Upload Complete')))
      .toBeVisible()
      .withTimeout(30000);
    
    await expect(element(by.id('video-player')))
      .toBeVisible();
  });
  
  it('should handle upload errors', async () => {
    await element(by.id('upload-tab')).tap();
    
    // Simulate network error
    await device.setURLBlacklist(['.*firebase.*']);
    
    await element(by.id('select-video')).tap();
    
    await expect(element(by.text('Upload failed')))
      .toBeVisible();
  });
});
```

## Device Interaction

### 1. Gesture Handling
```typescript
describe('Video Player Gestures', () => {
  it('should handle player gestures', async () => {
    await element(by.id('video-player'))
      .tap();
    
    await expect(element(by.id('player-controls')))
      .toBeVisible();
    
    // Double tap to seek
    await element(by.id('video-player'))
      .multiTap(2);
    
    await expect(element(by.id('progress-bar')))
      .toHaveValue('10');
    
    // Swipe to adjust volume
    await element(by.id('video-player'))
      .swipe('up', 'slow', 0.5);
    
    await expect(element(by.id('volume-indicator')))
      .toBeVisible();
  });
  
  it('should handle scroll behavior', async () => {
    await element(by.id('feed-list'))
      .scroll(500, 'down');
    
    await expect(element(by.id('video-player')))
      .toBeVisible();
    
    await element(by.id('feed-list'))
      .swipe('up', 'slow', 0.8);
    
    await waitFor(element(by.id('next-video')))
      .toBeVisible()
      .withTimeout(2000);
  });
});
```

### 2. Device Conditions
```typescript
describe('Network Conditions', () => {
  it('should handle offline mode', async () => {
    await device.setStatusBar({
      networkConnection: 'wifi',
      wifiMode: 'offline'
    });
    
    await element(by.id('feed-tab')).tap();
    
    await expect(element(by.text('No internet connection')))
      .toBeVisible();
    
    await device.setStatusBar({
      networkConnection: 'wifi',
      wifiMode: 'active'
    });
    
    await expect(element(by.id('feed-list')))
      .toBeVisible();
  });
  
  it('should handle background/foreground', async () => {
    await device.sendToHome();
    await device.launchApp({ newInstance: false });
    
    await expect(element(by.id('video-player')))
      .toBeVisible();
    
    await expect(element(by.id('play-button')))
      .toBeVisible();
  });
});
```

## Test Helpers

### 1. Authentication Helper
```typescript
// e2e/helpers/auth.ts
export async function loginUser() {
  await element(by.id('email-input'))
    .typeText('test@example.com');
  
  await element(by.id('password-input'))
    .typeText('Password123!');
  
  await element(by.id('login-button')).tap();
  
  await waitFor(element(by.id('feed-screen')))
    .toBeVisible()
    .withTimeout(2000);
}

export async function logoutUser() {
  await element(by.id('profile-tab')).tap();
  await element(by.id('logout-button')).tap();
  
  await expect(element(by.id('login-screen')))
    .toBeVisible();
}
```

### 2. Video Helper
```typescript
// e2e/helpers/video.ts
export async function uploadTestVideo() {
  await element(by.id('upload-tab')).tap();
  
  // Select test video
  await element(by.id('select-video')).tap();
  await element(by.type('UIImagePickerController'))
    .atIndex(0)
    .tap();
  
  // Wait for upload
  await waitFor(element(by.text('Upload Complete')))
    .toBeVisible()
    .withTimeout(30000);
  
  return getVideoId();
}

export async function playVideo() {
  await element(by.id('video-player')).tap();
  
  await expect(element(by.id('player-controls')))
    .toBeVisible();
  
  await element(by.id('play-button')).tap();
  
  await expect(element(by.id('progress-bar')))
    .toHaveValue('0');
}
``` 