# ReelAI Mobile App

A React Native + Expo mobile application for video content creation and sharing.

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: FastAPI
- **Database**: Firebase (Firestore)
- **Storage**: Firebase Cloud Storage
- **Testing**: Jest, React Native Testing Library
- **Auth**: OAuth2 with Firebase Authentication

## Prerequisites

- Node.js 18+
- Linux development environment
- Python 3.11+
- Firebase Project
- Google Cloud Project (for OAuth2)
- iPhone with Expo Go app installed

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Expo CLI globally:
   ```bash
   npm install -g expo-cli
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up OAuth2 credentials:
   - Create a Google Cloud Project
   - Enable Google Sign-In API
   - Create OAuth2 credentials
   - Configure OAuth2 consent screen

5. Configure Firebase:
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firebase project
   firebase init
   ```

6. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration:
   # - GOOGLE_CLIENT_ID
   # - FIREBASE_CONFIG
   ```

7. Start the development server:
   ```bash
   npx expo start
   ```

## Development

### Mobile App Testing
1. Install Expo Go on your iPhone
2. Connect your iPhone to the same WiFi as your development machine
3. Start the Expo server:
   ```bash
   npx expo start
   ```
4. Scan the QR code with your iPhone camera
5. The app will open in Expo Go

### Troubleshooting
If you can't connect:
```bash
# Try using tunnel
npx expo start --tunnel

# Clear cache
npx expo start -c
```

### Authentication Flow
```typescript
import * as Google from 'expo-auth-session/providers/google';

// Inside your component
const [request, response, promptAsync] = Google.useAuthRequest({
  clientId: process.env.GOOGLE_CLIENT_ID
});
```

## Project Structure
```
src/
├── components/    # Reusable UI components
├── screens/       # Screen components
├── services/      # API and business logic
├── hooks/         # Custom React hooks
├── store/         # Redux store and slices
└── utils/         # Helper functions
```

## Testing

### Unit & Integration Tests
```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.test.ts
```

### Manual Testing
1. Start the development server:
   ```bash
   npx expo start
   ```
2. Use Expo Go on your iPhone
3. Test features manually
4. Check console logs in terminal
5. Use React DevTools for debugging

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 