# Integration Testing Guidelines

> Detailed integration testing standards for the ReelAI project. See [Testing Guidelines](../testing.md) for overview.

## Test Setup

### 1. Navigation Testing
```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

const TestNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="Feed" component={FeedScreen} />
    <Stack.Screen name="Video" component={VideoScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
  </Stack.Navigator>
);

const renderWithNavigation = (
  component: React.ReactElement
) => {
  return render(
    <NavigationContainer>
      <TestNavigator />
      {component}
    </NavigationContainer>
  );
};
```

### 2. Firebase Integration
```typescript
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe('Video Upload Flow', () => {
  let testEnv;
  
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-test',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8')
      }
    });
  });
  
  afterAll(async () => {
    await testEnv.cleanup();
  });
  
  it('completes upload flow', async () => {
    const { getByTestId, findByText } = render(
      <UploadScreen />
    );
    
    // Select video
    await fireEvent.press(getByTestId('select-video'));
    
    // Verify upload progress
    expect(await findByText('Uploading...')).toBeTruthy();
    
    // Verify completion
    expect(await findByText('Upload Complete')).toBeTruthy();
    
    // Verify Firestore document
    const doc = await testEnv.firestore()
      .collection('videos')
      .doc('test-video')
      .get();
    
    expect(doc.exists).toBe(true);
    expect(doc.data().status).toBe('processing');
  });
});
```

## Testing Patterns

### 1. User Flows
```typescript
describe('Authentication Flow', () => {
  it('completes sign up flow', async () => {
    const { getByTestId, findByText } = render(
      <AuthScreen />
    );
    
    // Fill sign up form
    fireEvent.changeText(
      getByTestId('email-input'),
      'test@example.com'
    );
    fireEvent.changeText(
      getByTestId('password-input'),
      'Password123!'
    );
    
    // Submit form
    fireEvent.press(getByTestId('signup-button'));
    
    // Verify success
    expect(await findByText('Welcome!')).toBeTruthy();
    
    // Verify navigation
    expect(getByTestId('feed-screen')).toBeTruthy();
  });
  
  it('handles validation errors', async () => {
    const { getByTestId, findByText } = render(
      <AuthScreen />
    );
    
    // Submit empty form
    fireEvent.press(getByTestId('signup-button'));
    
    // Verify error messages
    expect(await findByText('Email is required')).toBeTruthy();
    expect(await findByText('Password is required')).toBeTruthy();
  });
});
```

### 2. Data Flow
```typescript
describe('Video Interaction Flow', () => {
  it('handles like interaction', async () => {
    const { getByTestId, findByText } = render(
      <VideoScreen videoId="test-123" />
    );
    
    // Like video
    fireEvent.press(getByTestId('like-button'));
    
    // Verify UI update
    expect(await findByText('1 like')).toBeTruthy();
    
    // Verify Firestore update
    const likeDoc = await testEnv.firestore()
      .collection('likes')
      .doc('test-like')
      .get();
    
    expect(likeDoc.exists).toBe(true);
    expect(likeDoc.data().videoId).toBe('test-123');
  });
  
  it('handles comment flow', async () => {
    const { getByTestId, findByText } = render(
      <VideoScreen videoId="test-123" />
    );
    
    // Add comment
    fireEvent.changeText(
      getByTestId('comment-input'),
      'Great video!'
    );
    fireEvent.press(getByTestId('submit-comment'));
    
    // Verify UI update
    expect(await findByText('Great video!')).toBeTruthy();
    
    // Verify Firestore update
    const commentDoc = await testEnv.firestore()
      .collection('comments')
      .doc('test-comment')
      .get();
    
    expect(commentDoc.exists).toBe(true);
    expect(commentDoc.data().text).toBe('Great video!');
  });
});
```

## Mock Services

### 1. API Mocking
```typescript
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  rest.post('/api/videos', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        videoId: 'test-123',
        status: 'processing'
      })
    );
  }),
  
  rest.get('/api/videos/:id', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: req.params.id,
        title: 'Test Video',
        url: 'https://example.com/video.mp4'
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 2. Storage Mocking
```typescript
jest.mock('@react-native-firebase/storage', () => ({
  storage: () => ({
    ref: (path) => ({
      putFile: jest.fn(() => Promise.resolve({
        ref: { fullPath: path }
      })),
      getDownloadURL: jest.fn(() => 
        Promise.resolve('https://example.com/video.mp4')
      )
    })
  })
}));

describe('Video Upload with Mocks', () => {
  it('handles file upload', async () => {
    const { getByTestId, findByText } = render(
      <UploadScreen />
    );
    
    // Trigger upload
    await fireEvent.press(getByTestId('upload-button'));
    
    // Verify upload completion
    expect(await findByText('Upload Complete')).toBeTruthy();
    
    // Verify storage was called
    const storage = require('@react-native-firebase/storage');
    expect(storage().ref().putFile).toHaveBeenCalled();
  });
});
```

## Test Helpers

### 1. Authentication Helper
```typescript
// test-auth.ts
export const authenticateUser = async () => {
  const auth = testEnv.authenticatedContext('test-user');
  
  await auth.firestore()
    .collection('users')
    .doc('test-user')
    .set({
      email: 'test@example.com',
      displayName: 'Test User'
    });
  
  return auth;
};

// Usage
it('requires authentication', async () => {
  const auth = await authenticateUser();
  const { getByTestId } = render(
    <ProfileScreen />,
    { auth }
  );
  
  expect(getByTestId('profile-data')).toBeTruthy();
});
```

### 2. Data Seeding
```typescript
// test-data.ts
export const seedTestData = async () => {
  const db = testEnv.firestore();
  
  // Create test video
  await db.collection('videos').doc('test-video').set({
    title: 'Test Video',
    creatorId: 'test-user',
    url: 'https://example.com/video.mp4',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  
  // Create test comments
  await db.collection('comments').doc('test-comment').set({
    videoId: 'test-video',
    userId: 'test-user',
    text: 'Test comment',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
};

// Usage
beforeEach(async () => {
  await seedTestData();
});
``` 