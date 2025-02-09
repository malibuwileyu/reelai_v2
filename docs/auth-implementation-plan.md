# Authentication Implementation Plan

## 1. Core Structure

### Auth Service Interface
```dart
abstract class AuthService {
  Future<User?> signIn(AuthCredential credential);
  Future<User?> signInWithEmail(String email, String password);
  Future<User?> signUp(String email, String password, String displayName);
  Future<void> resetPassword(String email);
  Future<void> signOut();
  Stream<User?> get authStateChanges;
  User? get currentUser;
}
```

### Firebase Implementation
```dart
class FirebaseAuthService implements AuthService {
  final FirebaseAuth _auth;
  
  // Implementation will support both email and future OAuth2
  @override
  Future<User?> signIn(AuthCredential credential) async {
    final result = await _auth.signInWithCredential(credential);
    return result.user;
  }
}
```

## 2. Implementation Steps

### Phase 1: Core Authentication
1. Create auth service interface and implementation
2. Implement email authentication methods
3. Set up secure token storage
4. Create auth state provider
5. Implement error handling

### Phase 2: UI Components
1. Create login screen
2. Create registration screen
3. Create password reset screen
4. Implement form validation
5. Add loading states and error messages

### Phase 3: Testing
1. Unit tests for auth service
2. Widget tests for auth screens
3. Integration tests for auth flow
4. OAuth2 placeholder tests
5. Error handling tests

## 3. Test Structure

### Unit Tests
```dart
group('AuthService', () {
  late FirebaseAuthService authService;
  late MockFirebaseAuth mockAuth;

  setUp(() {
    mockAuth = MockFirebaseAuth();
    authService = FirebaseAuthService(auth: mockAuth);
  });

  // Email Auth Tests
  group('email authentication', () {
    test('sign in with email', () async {
      // Test implementation
    });
  });

  // OAuth2 Tests (Placeholder)
  group('oauth authentication', () {
    test('sign in with google', () {
      if (authService is OAuth2Support) {
        // Test OAuth2 implementation
      } else {
        // Skip test if OAuth2 not implemented
        markTestSkipped('OAuth2 not implemented yet');
      }
    });
  });
});
```

### Widget Tests
```dart
testWidgets('LoginScreen shows email/password fields', (tester) async {
  await tester.pumpWidget(MaterialApp(home: LoginScreen()));
  
  expect(find.byType(EmailField), findsOneWidget);
  expect(find.byType(PasswordField), findsOneWidget);
  expect(find.byType(LoginButton), findsOneWidget);
});
```

## 4. File Structure
```
lib/
├── features/
│   └── auth/
│       ├── data/
│       │   └── services/
│       │       ├── auth_service.dart
│       │       └── firebase_auth_service.dart
│       ├── domain/
│       │   ├── entities/
│       │   │   └── user.dart
│       │   └── repositories/
│       │       └── auth_repository.dart
│       └── presentation/
│           ├── screens/
│           │   ├── login_screen.dart
│           │   ├── register_screen.dart
│           │   └── reset_password_screen.dart
│           ├── widgets/
│           │   ├── email_field.dart
│           │   ├── password_field.dart
│           │   └── auth_button.dart
│           └── providers/
│               └── auth_provider.dart
test/
└── features/
    └── auth/
        ├── unit/
        │   └── auth_service_test.dart
        ├── widget/
        │   └── login_screen_test.dart
        └── integration/
            └── auth_flow_test.dart
```

## 5. Error Handling

### Custom Exceptions
```dart
class AuthException implements Exception {
  final String code;
  final String message;
  
  const AuthException(this.code, this.message);
  
  factory AuthException.fromFirebaseException(FirebaseAuthException e) {
    // Map Firebase errors to our custom errors
    return AuthException(e.code, e.message ?? 'Authentication error');
  }
}
```

### Error Codes
```dart
class AuthErrorCode {
  static const String invalidEmail = 'invalid-email';
  static const String wrongPassword = 'wrong-password';
  static const String userNotFound = 'user-not-found';
  static const String emailInUse = 'email-already-in-use';
  static const String weakPassword = 'weak-password';
}
```

## 6. Security Considerations
1. Secure token storage using flutter_secure_storage
2. Input validation and sanitization
3. Rate limiting for password reset
4. Session management
5. Error message security (no sensitive info in errors)

## 7. Future OAuth2 Preparation
1. Abstract credential handling
2. Prepare UI for additional sign-in buttons
3. Set up provider configuration structure
4. Implement placeholder OAuth2 tests 