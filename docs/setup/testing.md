# Testing Guide

## Overview
This guide covers testing practices for the ReelAI application, including unit tests, widget tests, and integration tests.

## Test Structure

### Directory Organization
```
test/
├── unit/                 # Unit tests
│   ├── services/        # Service tests
│   ├── models/          # Model tests
│   └── utils/           # Utility tests
├── widget/              # Widget tests
│   ├── screens/         # Screen tests
│   └── components/      # Component tests
└── integration/         # Integration tests
    └── flows/           # User flow tests
```

## Running Tests

### Flutter Tests
```bash
# Run all tests
flutter test

# Run specific test file
flutter test test/widget/screens/video_player_test.dart

# Run with coverage
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
```

### Backend Tests
```bash
# Run all tests
pytest

# Run specific test file
pytest backend/tests/test_video_service.py

# Run with coverage
pytest --cov=app tests/
```

## Writing Tests

### Unit Tests
```dart
void main() {
  group('VideoService', () {
    late VideoService service;
    late MockFirebaseStorage storage;

    setUp(() {
      storage = MockFirebaseStorage();
      service = VideoService(storage: storage);
    });

    test('uploads video successfully', () async {
      final file = File('test.mp4');
      when(() => storage.uploadFile(any()))
          .thenAnswer((_) async => 'video_url');

      final result = await service.uploadVideo(file);
      expect(result, isA<String>());
    });

    test('handles upload failure', () {
      when(() => storage.uploadFile(any())).thenThrow(Exception());
      expect(
        () => service.uploadVideo(File('test.mp4')),
        throwsA(isA<VideoUploadException>()),
      );
    });
  });
}
```

### Widget Tests
```dart
void main() {
  testWidgets('VideoPlayer shows loading state', (tester) async {
    // ARRANGE
    await tester.pumpWidget(
      MaterialApp(
        home: VideoPlayer(videoId: 'test'),
      ),
    );

    // ACT
    await tester.pump();

    // ASSERT
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });

  testWidgets('VideoPlayer shows error on failure', (tester) async {
    // ARRANGE
    final mockVideoService = MockVideoService();
    when(() => mockVideoService.getVideo(any()))
        .thenThrow(VideoNotFoundException());

    await tester.pumpWidget(
      MaterialApp(
        home: VideoPlayer(
          videoId: 'test',
          videoService: mockVideoService,
        ),
      ),
    );

    // ACT
    await tester.pump();

    // ASSERT
    expect(find.text('Video not found'), findsOneWidget);
  });
}
```

### Integration Tests
```dart
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('End-to-end test', () {
    testWidgets('complete video upload flow', (tester) async {
      // ARRANGE
      await tester.pumpWidget(MyApp());

      // ACT - Navigate to upload
      await tester.tap(find.byType(UploadButton));
      await tester.pumpAndSettle();

      // Select video
      await tester.tap(find.byType(VideoPickerButton));
      await tester.pumpAndSettle();

      // Fill metadata
      await tester.enterText(
        find.byType(TextField).first,
        'Test Video',
      );

      // Upload
      await tester.tap(find.text('Upload'));
      await tester.pumpAndSettle();

      // ASSERT
      expect(find.text('Upload Complete'), findsOneWidget);
    });
  });
}
```

## Test Data Management

### Mock Objects
```dart
class MockFirebaseStorage extends Mock implements FirebaseStorage {
  @override
  Future<String> uploadFile(File file) async {
    return 'https://example.com/video.mp4';
  }
}
```

### Test Fixtures
```dart
// fixtures/videos/test_video.json
{
  "id": "test_video",
  "title": "Test Video",
  "url": "https://example.com/video.mp4",
  "duration": 120,
  "creatorId": "test_user"
}

// Load fixture in test
final videoJson = await File(
  'test/fixtures/videos/test_video.json',
).readAsString();
final video = Video.fromJson(jsonDecode(videoJson));
```

## Testing Best Practices

### General Guidelines
1. Follow AAA pattern (Arrange, Act, Assert)
2. Keep tests independent
3. Use meaningful test names
4. Mock external dependencies
5. Test edge cases and error scenarios

### Widget Testing Tips
1. Use `tester.pump()` after state changes
2. Test user interactions
3. Verify widget tree structure
4. Test error states
5. Use `findsOneWidget` for unique elements

### Integration Testing Tips
1. Test complete user flows
2. Use real dependencies when possible
3. Clean up test data
4. Handle async operations
5. Test offline scenarios

## Test Coverage

### Coverage Requirements
- Unit Tests: 80% minimum
- Widget Tests: 70% minimum
- Integration Tests: All critical paths

### Critical Paths to Test
1. Authentication
   - Sign up
   - Sign in
   - Password reset

2. Video Management
   - Upload
   - Processing
   - Playback
   - Deletion

3. Social Features
   - Likes
   - Comments
   - Shares

## CI/CD Integration

### GitHub Actions Setup
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        
      - name: Install dependencies
        run: flutter pub get
        
      - name: Run tests
        run: flutter test --coverage
        
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## Troubleshooting

### Common Issues
1. Widget test failures:
   - Check widget initialization
   - Verify pump() calls
   - Check mock setup

2. Integration test failures:
   - Verify environment setup
   - Check async operations
   - Review test data

3. Coverage issues:
   - Check excluded files
   - Verify test patterns
   - Review untested code

### Getting Help
- Review test documentation
- Check Flutter testing guide
- Use Stack Overflow
- File GitHub issues 