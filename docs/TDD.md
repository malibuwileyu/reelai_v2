# Technical Design Document (TDD)

## Tech Stack Overview

### Frontend (Mobile)
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **UI Components**: React Native Paper & Custom Components
- **State Management**: Redux Toolkit
- **Dependencies**:
  - expo
  - expo-av (audio/video)
  - expo-camera
  - expo-document-picker
  - expo-image
  - @react-navigation/native
  - @reduxjs/toolkit
  - react-native-paper
  - @react-native-firebase/app
  - @react-native-firebase/auth
  - @react-native-firebase/storage
  - expo-auth-session
  - expo-web-browser
  - @react-native-google-signin/google-signin
  - langchain (for AI integration)

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **API Documentation**: OpenAPI/Swagger
- **Dependencies**:
  - LangChain
  - OpenAI
  - Tavily
  - Firebase Admin SDK
  - Pydantic
  - asyncio
  - pytest (testing)

### Database & Storage
- **Primary Database**: Firebase Firestore
  - Real-time data sync
  - User profiles
  - Video metadata
  - Social interactions
  
- **File Storage**: Firebase Cloud Storage
  - Video content
  - Thumbnails
  - User assets
  - Temporary processing files

### Authentication & Security
- **Auth Provider**: Firebase Authentication with OAuth2
  - Google Sign-in (Primary)
  - Email/Password (Fallback)
  
- **Security Measures**:
  - Firebase Security Rules
  - API Key management in FastAPI
  - JWT token validation
  - Rate limiting
  - OAuth2 token management
  - Secure token storage with Expo SecureStore

### AI Integration
1. **Video Processing**:
   - OpenShot API (AWS-hosted)
   - Firebase ML Kit
   - Custom FastAPI endpoints

2. **Content Analysis**:
   - OpenAI GPT-4
   - LangChain
   - Tavily Search API

3. **Recommendation Engine**:
   - Firebase ML
   - Custom Python algorithms

## System Architecture

### Data Flow
```
[React Native App] ←→ [Firebase Auth/Storage/Firestore]
        ↕               ↕
[FastAPI Backend] ←→ [AI Services]
```

### Key Components
1. **Mobile Client**:
   - Video playback interface
   - Learning progress tracking
   - Quiz/assessment system
   - Progress visualization
   - Cross-platform compatibility

2. **FastAPI Backend**:
   - AI-powered learning assessment
   - Progress tracking
   - Learning path optimization
   - Content recommendation

3. **Firebase Services**:
   - Authentication
   - Learning data persistence
   - Progress synchronization
   - Real-time updates

4. **AI Processing Pipeline**:
   - Content summarization
   - Quiz generation
   - Learning path optimization
   - Personalized recommendations

## Implementation Strategy

### Phase 1: Core Infrastructure
1. Setup React Native with Expo
   - Initialize project with Expo CLI
   - Configure TypeScript
   - Setup development environment
2. Initialize FastAPI backend
3. Setup Firebase project
4. Implement OAuth2 auth flow

### Phase 2: Learning Experience
1. Subject taxonomy implementation
2. Learning progress tracking
3. Quiz generation system
4. Assessment framework

### Phase 3: AI Integration
1. OpenAI/LangChain setup
2. Content summarization
3. Automated quiz generation
4. Learning path optimization

### Phase 4: Social Learning
1. Study group features
2. Peer assessments
3. Discussion threads
4. Progress sharing

## Performance Considerations
- Video streaming optimization
- Quiz response time
- Progress tracking sync
- Memory management
- Background processing
- Rate limiting
- Error handling

## Monitoring & Analytics
- Learning progress metrics
- Quiz performance tracking
- Content effectiveness
- User engagement
- Learning patterns
- Completion rates

## Testing Strategy

### Local Development (Linux)
1. **Environment Setup**:
   ```bash
   # Install dependencies
   npm install
   
   # Start development server
   npx expo start
   ```

2. **Device Testing**:
   - Install Expo Go on iPhone
   - Connect via same WiFi network
   - Scan QR code to load app

1. **Unit Tests**:
   - React Native component tests
   - TypeScript unit tests
   - Python pytest
   - API endpoint tests

2. **Integration Tests**:
   - React Native Testing Library
   - API integration
   - Firebase integration
   - AI service integration

3. **UI Tests**:
   - Component testing
   - Snapshot tests
   - User flow validation

### Test Types
1. **Unit Tests**:
   - Learning progress tracking
   - Quiz generation
   - Assessment scoring
   - Content recommendation

2. **Integration Tests**:
   - Learning flow
   - Quiz system
   - Progress tracking
   - AI integration

3. **UI Tests**:
   - Learning interface
   - Quiz interactions
   - Progress visualization
   - Accessibility

## Deployment Strategy
1. **Backend**:
   - Cloud Run deployment
   - CI/CD with GitHub Actions
   - Staging/Production environments

2. **Mobile**:
   - EAS Build for Expo
   - Android Play Store
   - iOS App Store
   - Firebase App Distribution
   - Automated builds

## Security Measures
1. **API Security**:
   - Rate limiting
   - JWT validation
   - API key rotation
   - Input validation

2. **Data Security**:
   - Encryption at rest
   - Secure file transfer
   - Access control
   - Privacy compliance

# Test-Driven Development Guide

## TDD Process

### 1. Red-Green-Refactor Cycle
1. **Red**: Write a failing test
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Clean up the code while keeping tests green

### 2. Development Flow
```typescript
// 1. Write the test first
describe('AuthService', () => {
  it('should sign in with email and return user', async () => {
    const authService = new MockAuthService();
    jest.spyOn(authService, 'signInWithEmail').mockResolvedValue(mockUser);
    
    const result = await authService.signInWithEmail(
      'test@example.com',
      'password'
    );
    
    expect(result).toEqual(mockUser);
  });
});

// 2. Write the interface
interface AuthService {
  signInWithEmail(email: string, password: string): Promise<User | null>;
}

// 3. Implement the concrete class
class FirebaseAuthService implements AuthService {
  async signInWithEmail(email: string, password: string): Promise<User | null> {
    // Implementation
  }
}
```

## Current TDD Status

### Completed TDD Cycles
- [ ] AuthService interface
- [ ] AuthException handling
- [ ] FirebaseAuthService implementation
- [ ] Token storage

### In Progress
- [ ] Login screen
- [ ] Form validation
- [ ] Error handling UI

### Next Up
- Registration screen
- Password reset flow
- Auth state management

## TDD Best Practices

### 1. Test Structure
```typescript
group('AuthService', () => {
  // Setup common test dependencies
  setUp(() => {
    // Common setup
  });

  // Group related test cases
  group('signInWithEmail', () => {
    test('successful sign in', () => {
      // Test case
    });

    test('handles invalid credentials', () => {
      // Test case
    });
  });
});
```

### 2. Mocking Guidelines
```typescript
// Create mocks for external dependencies
@GenerateMocks([FirebaseAuth, UserCredential])
void main() {
  late MockFirebaseAuth mockAuth;
  
  setUp(() {
    mockAuth = MockFirebaseAuth();
  });
}
```

### 3. Test Coverage Requirements
- Unit Tests: Must be written before implementation
- Widget Tests: Must cover all user interactions
- Integration Tests: Must verify feature workflows

## Feature Implementation Process

### 1. Authentication Module
1. ✅ Write auth service tests
2. ✅ Create auth service interface
3. ✅ Implement Firebase auth service
4. 🔄 Write auth UI component tests
5. 🔄 Implement auth UI components

### 2. Video Upload Module (Next)
1. Write upload service tests
2. Create upload service interface
3. Implement Firebase upload service
4. Write upload UI component tests
5. Implement upload UI components

### 3. Search Feature Implementation

#### UI Components
- [x] Add search screen to navigation stack
- [x] Connect search icon in footer to search screen
- [x] Create basic search UI with search bar
- [x] Add filter dropdowns for category, difficulty, and language
- [x] Make language dropdown scrollable with 7 items visible
- [x] Add display area for search results

#### Search Service
- [x] Implement basic text search functionality
- [x] Add proper error handling
- [x] Create necessary Firestore indexes
- [x] Implement filter support
- [x] Add proper null checks and default values
- [x] Optimize query construction
- [x] Implement proper sorting

#### Remaining Tasks
- [ ] Add search analytics tracking
- [ ] Add loading states during search
- [ ] Add empty state UI for no results
- [ ] Implement pagination for search results
- [ ] Add search result caching
- [ ] Add search filters persistence
- [ ] Implement search history
- [ ] Add search suggestions
- [ ] Add unit tests for search functionality
- [ ] Add integration tests for search UI
- [ ] Add performance monitoring for search queries

#### Performance Optimizations
- [ ] Implement debouncing for search input
- [ ] Add client-side caching for frequent searches
- [ ] Optimize Firestore indexes for common queries
- [ ] Add query result size limits
- [ ] Implement lazy loading for search results

#### Error Handling
- [x] Add try/catch blocks for all async operations
- [x] Add proper error messages for failed searches
- [x] Handle null/undefined values in search results
- [ ] Add retry logic for failed searches
- [ ] Add fallback UI for error states

## Testing Tools

### Required Packages
```yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
  mockito: ^5.4.4
  build_runner: ^2.4.8
  test_coverage: ^0.5.0
```

### Test Commands
```bash
# Run tests with coverage
flutter test --coverage

# Generate coverage report
genhtml coverage/lcov.info -o coverage/html

# Watch tests during development
flutter test --watch
```

## TDD Validation Steps

### Before Implementation
1. Write failing test
2. Verify test fails for expected reason
3. Document expected behavior

### During Implementation
1. Write minimal code to pass test
2. Run all tests to verify no regressions
3. Commit after each passing test

### After Implementation
1. Refactor if needed
2. Verify all tests still pass
3. Review test coverage

## Code Review Guidelines

### TDD Checklist
- [ ] Tests written before implementation
- [ ] Tests cover edge cases
- [ ] Tests are readable and maintainable
- [ ] Implementation satisfies tests
- [ ] No unnecessary code
- [ ] Tests run in CI pipeline 