# Data Security Guidelines

> Detailed data security standards for the ReelAI project. See [Security Guidelines](../security.md) for overview.

## Data Encryption

### 1. Encryption Service
```typescript
class EncryptionService {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  
  /**
   * Generate encryption key
   */
  static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }
  
  /**
   * Encrypt sensitive data
   */
  static async encrypt(
    data: string,
    key: CryptoKey
  ): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv
      },
      key,
      encoder.encode(data)
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }
  
  /**
   * Decrypt sensitive data
   */
  static async decrypt(
    encryptedData: string,
    key: CryptoKey
  ): Promise<string> {
    const combined = new Uint8Array(
      atob(encryptedData)
        .split('')
        .map(char => char.charCodeAt(0))
    );
    
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv
      },
      key,
      data
    );
    
    return new TextDecoder().decode(decrypted);
  }
}
```

### 2. Key Management
```typescript
class KeyManager {
  private static readonly KEY_PREFIX = 'encryption_key_';
  
  /**
   * Store encryption key securely
   */
  static async storeKey(
    keyId: string,
    key: CryptoKey
  ): Promise<void> {
    const exportedKey = await crypto.subtle.exportKey(
      'raw',
      key
    );
    
    await SecureStore.setItemAsync(
      `${this.KEY_PREFIX}${keyId}`,
      btoa(String.fromCharCode(...new Uint8Array(exportedKey))),
      {
        accessible: SecureStore.AFTER_FIRST_UNLOCK,
        requireAuthentication: true
      }
    );
  }
  
  /**
   * Retrieve encryption key
   */
  static async getKey(keyId: string): Promise<CryptoKey> {
    const storedKey = await SecureStore.getItemAsync(
      `${this.KEY_PREFIX}${keyId}`
    );
    
    if (!storedKey) {
      throw new SecurityError('Key not found');
    }
    
    const keyData = new Uint8Array(
      atob(storedKey)
        .split('')
        .map(char => char.charCodeAt(0))
    );
    
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      {
        name: EncryptionService.ALGORITHM,
        length: EncryptionService.KEY_LENGTH
      },
      true,
      ['encrypt', 'decrypt']
    );
  }
}
```

## Secure Storage

### 1. File Security
```typescript
class SecureFileManager {
  /**
   * Securely store file with encryption
   */
  static async storeFile(
    file: File,
    metadata: FileMetadata
  ): Promise<string> {
    // Generate unique file ID
    const fileId = generateSecureId();
    
    // Generate encryption key
    const key = await EncryptionService.generateKey();
    await KeyManager.storeKey(fileId, key);
    
    // Encrypt file data
    const reader = new FileReader();
    const fileData = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    
    const encryptedData = await EncryptionService.encrypt(
      fileData,
      key
    );
    
    // Store encrypted file
    await firebase
      .storage()
      .ref(`encrypted/${fileId}`)
      .putString(encryptedData);
    
    return fileId;
  }
  
  /**
   * Retrieve file with decryption
   */
  static async getFile(fileId: string): Promise<File> {
    // Get encryption key
    const key = await KeyManager.getKey(fileId);
    
    // Get encrypted file
    const encryptedData = await firebase
      .storage()
      .ref(`encrypted/${fileId}`)
      .getDownloadURL();
    
    // Decrypt file data
    const decryptedData = await EncryptionService.decrypt(
      encryptedData,
      key
    );
    
    // Convert back to file
    const byteString = atob(decryptedData.split(',')[1]);
    const mimeType = decryptedData.split(',')[0].split(':')[1].split(';')[0];
    
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    return new File([ab], 'decrypted', { type: mimeType });
  }
}
```

### 2. Secure Cache
```typescript
class SecureCache {
  private static readonly CACHE_PREFIX = 'secure_cache_';
  private static readonly MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
  
  /**
   * Store data in secure cache
   */
  static async set(
    key: string,
    data: any,
    options: CacheOptions = {}
  ): Promise<void> {
    const cacheData = {
      data,
      timestamp: Date.now(),
      maxAge: options.maxAge || this.MAX_AGE
    };
    
    await SecureStore.setItemAsync(
      `${this.CACHE_PREFIX}${key}`,
      JSON.stringify(cacheData),
      {
        accessible: SecureStore.AFTER_FIRST_UNLOCK
      }
    );
  }
  
  /**
   * Retrieve data from secure cache
   */
  static async get<T>(key: string): Promise<T | null> {
    const cached = await SecureStore.getItemAsync(
      `${this.CACHE_PREFIX}${key}`
    );
    
    if (!cached) return null;
    
    const { data, timestamp, maxAge } = JSON.parse(cached);
    
    // Check if cache is expired
    if (Date.now() - timestamp > maxAge) {
      await this.remove(key);
      return null;
    }
    
    return data as T;
  }
  
  /**
   * Remove data from secure cache
   */
  static async remove(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(
      `${this.CACHE_PREFIX}${key}`
    );
  }
}
```

## Data Privacy

### 1. Data Sanitization
```typescript
class DataSanitizer {
  /**
   * Sanitize user data for storage
   */
  static sanitizeUserData(data: UserData): UserData {
    return {
      ...data,
      email: this.maskEmail(data.email),
      phone: this.maskPhone(data.phone)
    };
  }
  
  /**
   * Mask sensitive data
   */
  private static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    return `${local[0]}***@${domain}`;
  }
  
  private static maskPhone(phone: string): string {
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }
}
```

### 2. Data Retention
```typescript
class DataRetentionManager {
  /**
   * Apply data retention policies
   */
  static async applyRetentionPolicy(
    data: StoredData
  ): Promise<void> {
    const retentionPeriod = this.getRetentionPeriod(
      data.type
    );
    
    if (this.isExpired(data.timestamp, retentionPeriod)) {
      await this.deleteData(data.id);
    }
  }
  
  /**
   * Get retention period by data type
   */
  private static getRetentionPeriod(
    type: DataType
  ): number {
    switch (type) {
      case 'user_activity':
        return 30 * 24 * 60 * 60 * 1000; // 30 days
      case 'analytics':
        return 90 * 24 * 60 * 60 * 1000; // 90 days
      default:
        return Infinity;
    }
  }
} 