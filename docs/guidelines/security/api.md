# API Security Guidelines

> Detailed API security standards for the ReelAI project. See [Security Guidelines](../security.md) for overview.

## Request Security

### 1. Request Validation
```typescript
class RequestValidator {
  /**
   * Validate request parameters
   */
  static validateRequest(
    req: Request,
    schema: ValidationSchema
  ): ValidationResult {
    // Validate headers
    this.validateHeaders(req.headers, schema.headers);
    
    // Validate query parameters
    if (schema.query) {
      this.validateQuery(req.query, schema.query);
    }
    
    // Validate body
    if (schema.body) {
      this.validateBody(req.body, schema.body);
    }
    
    // Validate file uploads
    if (schema.files) {
      this.validateFiles(req.files, schema.files);
    }
  }
  
  /**
   * Validate request headers
   */
  private static validateHeaders(
    headers: Headers,
    schema: HeaderSchema
  ): void {
    // Check required headers
    if (schema.authorization && !headers.authorization) {
      throw new ValidationError('Missing authorization header');
    }
    
    // Validate content type
    if (schema.contentType && 
        headers['content-type'] !== schema.contentType) {
      throw new ValidationError('Invalid content type');
    }
  }
  
  /**
   * Sanitize and validate input
   */
  private static sanitizeInput(input: string): string {
    // Remove potentially dangerous characters
    return input.replace(/[<>'"]/g, '');
  }
}
```

### 2. Rate Limiting
```typescript
class RateLimiter {
  private static readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private static readonly MAX_REQUESTS = 100;
  
  /**
   * Check rate limit for IP
   */
  static async checkRateLimit(
    ip: string,
    endpoint: string
  ): Promise<boolean> {
    const key = `rate_limit:${ip}:${endpoint}`;
    const requests = await redis.get(key) || 0;
    
    if (requests >= this.MAX_REQUESTS) {
      throw new RateLimitError('Too many requests');
    }
    
    await redis.multi()
      .incr(key)
      .expire(key, this.WINDOW_MS / 1000)
      .exec();
    
    return true;
  }
  
  /**
   * Apply rate limiting middleware
   */
  static middleware(): RequestHandler {
    return async (req, res, next) => {
      try {
        await this.checkRateLimit(
          req.ip,
          req.path
        );
        next();
      } catch (error) {
        if (error instanceof RateLimitError) {
          res.status(429).json({
            error: 'Too many requests',
            retryAfter: this.WINDOW_MS / 1000
          });
        } else {
          next(error);
        }
      }
    };
  }
}
```

## Response Security

### 1. Response Headers
```typescript
class SecurityHeaders {
  /**
   * Apply security headers to response
   */
  static applySecurityHeaders(res: Response): void {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Content Security Policy
    res.setHeader('Content-Security-Policy', this.getCSP());
    
    // HSTS (HTTPS only)
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
      );
    }
  }
  
  /**
   * Get Content Security Policy
   */
  private static getCSP(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "media-src 'self' https:",
      "connect-src 'self' https:",
      "font-src 'self'"
    ].join('; ');
  }
}
```

### 2. Error Handling
```typescript
class APIErrorHandler {
  /**
   * Handle API errors securely
   */
  static handleError(
    error: Error,
    req: Request,
    res: Response
  ): void {
    // Log error securely
    this.logError(error, req);
    
    // Send appropriate response
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation Error',
        message: this.sanitizeErrorMessage(error.message)
      });
    } else if (error instanceof AuthError) {
      res.status(401).json({
        error: 'Authentication Error',
        message: 'Invalid credentials'
      });
    } else {
      // Don't expose internal errors
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
    }
  }
  
  /**
   * Log error securely
   */
  private static logError(
    error: Error,
    req: Request
  ): void {
    const sanitizedError = {
      type: error.constructor.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' 
        ? error.stack 
        : undefined,
      request: {
        method: req.method,
        path: req.path,
        ip: req.ip
      }
    };
    
    logger.error('API Error', sanitizedError);
  }
}
```

## API Authentication

### 1. JWT Management
```typescript
class JWTManager {
  private static readonly JWT_SECRET = process.env.JWT_SECRET!;
  private static readonly JWT_EXPIRES = '1h';
  
  /**
   * Generate JWT token
   */
  static generateToken(
    payload: TokenPayload
  ): string {
    return jwt.sign(
      payload,
      this.JWT_SECRET,
      {
        expiresIn: this.JWT_EXPIRES,
        algorithm: 'HS256'
      }
    );
  }
  
  /**
   * Verify JWT token
   */
  static verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(
        token,
        this.JWT_SECRET
      ) as TokenPayload;
    } catch (error) {
      throw new AuthError('Invalid token');
    }
  }
  
  /**
   * JWT middleware
   */
  static middleware(): RequestHandler {
    return (req, res, next) => {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        throw new AuthError('Missing token');
      }
      
      try {
        const payload = this.verifyToken(token);
        req.user = payload;
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}
```

### 2. API Keys
```typescript
class APIKeyManager {
  /**
   * Validate API key
   */
  static async validateAPIKey(
    apiKey: string
  ): Promise<boolean> {
    // Hash API key
    const hashedKey = await this.hashAPIKey(apiKey);
    
    // Check against stored keys
    const storedKey = await db
      .collection('api_keys')
      .doc(hashedKey)
      .get();
    
    if (!storedKey.exists) {
      throw new AuthError('Invalid API key');
    }
    
    // Check if key is active
    const keyData = storedKey.data();
    if (!keyData.active) {
      throw new AuthError('Inactive API key');
    }
    
    return true;
  }
  
  /**
   * Generate new API key
   */
  static async generateAPIKey(
    userId: string
  ): Promise<string> {
    // Generate secure random key
    const apiKey = crypto
      .randomBytes(32)
      .toString('hex');
    
    // Hash for storage
    const hashedKey = await this.hashAPIKey(apiKey);
    
    // Store hashed key
    await db.collection('api_keys').doc(hashedKey).set({
      userId,
      active: true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    return apiKey;
  }
}
``` 