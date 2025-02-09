# Authentication Security Guidelines

> Detailed authentication security standards for the ReelAI project. See [Security Guidelines](../security.md) for overview.

## Authentication Flow

### 1. Firebase Authentication
```typescript
/**
 * Firebase Auth Configuration
 * 
 * Providers:
 * - Email/Password
 * - Google OAuth
 * - Apple Sign In
 */
const authConfig = {
  signInOptions: [
    EmailAuthProvider.PROVIDER_ID,
    GoogleAuthProvider.PROVIDER_ID,
    AppleAuthProvider.PROVIDER_ID
  ],
  signInFlow: 'redirect',
  callbacks: {
    signInSuccessWithAuthResult: (result) => {
      // Validate user and create profile
      return false; // Don't redirect
    }
  }
};
```

### 2. Token Management
```typescript
class TokenManager {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_KEY = 'refresh_token';
  
  /**
   * Store authentication tokens securely
   * Uses SecureStore with encryption
   */
  static async storeTokens(
    tokens: AuthTokens
  ): Promise<void> {
    await SecureStore.setItemAsync(
      this.TOKEN_KEY,
      tokens.accessToken,
      {
        accessible: SecureStore.AFTER_FIRST_UNLOCK,
        requireAuthentication: true
      }
    );
    
    await SecureStore.setItemAsync(
      this.REFRESH_KEY,
      tokens.refreshToken,
      {
        accessible: SecureStore.AFTER_FIRST_UNLOCK,
        requireAuthentication: true
      }
    );
  }
  
  /**
   * Retrieve tokens with validation
   */
  static async getTokens(): Promise<AuthTokens> {
    const accessToken = await SecureStore.getItemAsync(
      this.TOKEN_KEY
    );
    const refreshToken = await SecureStore.getItemAsync(
      this.REFRESH_KEY
    );
    
    if (!accessToken || !refreshToken) {
      throw new AuthError('Missing tokens');
    }
    
    return { accessToken, refreshToken };
  }
  
  /**
   * Clear tokens on logout
   */
  static async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(this.TOKEN_KEY);
    await SecureStore.deleteItemAsync(this.REFRESH_KEY);
  }
}
```

### 3. Session Management
```typescript
class SessionManager {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  
  /**
   * Monitor session activity and refresh tokens
   */
  static startSessionMonitor(): void {
    let lastActivity = Date.now();
    
    // Monitor user activity
    document.addEventListener('click', () => {
      lastActivity = Date.now();
    });
    
    // Check session status
    setInterval(async () => {
      const inactive = Date.now() - lastActivity;
      if (inactive >= this.SESSION_TIMEOUT) {
        await this.handleSessionTimeout();
      }
    }, 60 * 1000); // Check every minute
  }
  
  /**
   * Handle session timeout
   */
  private static async handleSessionTimeout(): Promise<void> {
    try {
      await this.refreshSession();
    } catch {
      await this.logout();
      navigation.navigate('Login');
    }
  }
}
```

## Security Measures

### 1. Password Security
```typescript
class PasswordValidator {
  /**
   * Validate password strength
   * - Minimum 8 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   * - At least one special character
   */
  static validatePassword(password: string): boolean {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);
    
    return minLength && hasUpper && hasLower && 
           hasNumber && hasSpecial;
  }
  
  /**
   * Check password against common patterns
   */
  static checkCommonPatterns(password: string): boolean {
    const commonPatterns = [
      /^password\d*$/i,
      /^12345\d*$/,
      /qwerty/i
    ];
    
    return !commonPatterns.some(pattern => 
      pattern.test(password)
    );
  }
}
```

### 2. OAuth Security
```typescript
class OAuthManager {
  /**
   * Configure OAuth providers with security best practices
   */
  static configureProviders(): void {
    const googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
    
    // State parameter for CSRF protection
    const state = generateSecureRandomString();
    googleProvider.setCustomParameters({
      state,
      prompt: 'select_account'
    });
  }
  
  /**
   * Validate OAuth response
   */
  static validateOAuthResponse(
    response: OAuthResponse
  ): boolean {
    // Verify state parameter
    if (response.state !== storedState) {
      throw new AuthError('Invalid state parameter');
    }
    
    // Validate ID token
    return verifyIdToken(response.idToken);
  }
}
```

### 3. Multi-Factor Authentication
```typescript
class MFAManager {
  /**
   * Enable MFA for user
   */
  static async enableMFA(
    user: User,
    phoneNumber: string
  ): Promise<void> {
    // Enroll phone number
    const multiFactorSession = await user.multiFactor
      .getSession();
    
    const phoneAuthProvider = new PhoneAuthProvider(auth);
    const verificationId = await phoneAuthProvider
      .verifyPhoneNumber(phoneNumber, multiFactorSession);
    
    // Store verification ID securely
    await SecureStore.setItemAsync(
      'mfa_verification_id',
      verificationId
    );
  }
  
  /**
   * Handle MFA challenge
   */
  static async handleMFAChallenge(
    error: MultiFactorError
  ): Promise<UserCredential> {
    const resolver = getMultiFactorResolver(auth, error);
    const verificationId = await SecureStore
      .getItemAsync('mfa_verification_id');
    
    // Get code from user
    const code = await promptForCode();
    
    const credential = PhoneAuthProvider.credential(
      verificationId,
      code
    );
    
    return resolver.resolveSignIn(
      PhoneMultiFactorGenerator.assertion(credential)
    );
  }
}
```

## Error Handling

### 1. Authentication Errors
```typescript
class AuthErrorHandler {
  /**
   * Handle authentication errors securely
   */
  static handleError(error: AuthError): void {
    // Log error securely (no sensitive data)
    secureLogger.error({
      code: error.code,
      message: this.sanitizeMessage(error.message)
    });
    
    // Show user-friendly message
    switch (error.code) {
      case 'auth/wrong-password':
        showError('Invalid credentials');
        break;
      case 'auth/user-not-found':
        showError('Invalid credentials');
        break;
      default:
        showError('Authentication failed');
    }
  }
  
  /**
   * Sanitize error messages
   */
  private static sanitizeMessage(
    message: string
  ): string {
    // Remove sensitive information
    return message.replace(
      /email: [^\s]+/g,
      'email: [REDACTED]'
    );
  }
}
```

### 2. Rate Limiting
```typescript
class AuthRateLimiter {
  private static attempts = new Map<string, number>();
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
  
  /**
   * Check and update login attempts
   */
  static async checkRateLimit(
    identifier: string
  ): Promise<boolean> {
    const attempts = this.attempts.get(identifier) || 0;
    
    if (attempts >= this.MAX_ATTEMPTS) {
      const lockoutEnd = await SecureStore
        .getItemAsync(`lockout_${identifier}`);
      
      if (lockoutEnd && Date.now() < Number(lockoutEnd)) {
        throw new AuthError('Account temporarily locked');
      }
      
      // Reset after lockout
      this.attempts.delete(identifier);
      await SecureStore.deleteItemAsync(
        `lockout_${identifier}`
      );
      return true;
    }
    
    this.attempts.set(identifier, attempts + 1);
    return true;
  }
  
  /**
   * Handle successful login
   */
  static clearAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }
}
``` 