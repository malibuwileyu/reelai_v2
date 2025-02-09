# Development Environment Setup Guide

## Prerequisites

### System Requirements
- Operating System: Linux/macOS/Windows
- RAM: 8GB minimum, 16GB recommended
- Storage: 20GB free space
- Android Studio or VS Code
- Git

## Step 1: Flutter Setup

### Install Flutter SDK
```bash
# Linux (using snap)
sudo snap install flutter --classic

# Verify installation
flutter doctor
```

### Android Studio Setup
1. Download Android Studio
2. Install required plugins:
   - Flutter
   - Dart
   - Kotlin
3. Configure Android SDK:
   ```bash
   # Install SDK Platform Tools
   sdkmanager "platform-tools"
   
   # Install Android 34 platform
   sdkmanager "platforms;android-34"
   
   # Install system images
   sdkmanager "system-images;android-34;google_apis;x86_64"
   ```

### Create Android Emulator
1. Open Android Studio
2. Go to Tools > Device Manager
3. Click "Create Device"
4. Select "Pixel 4" and Android 34
5. Start the emulator

## Step 2: Python Environment

### Create Virtual Environment
```bash
# Create venv
python -m venv venv

# Activate environment
source venv/bin/activate  # Linux/macOS
.\venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt
```

## Step 3: Firebase Setup

### Install Firebase CLI
```bash
# Install Node.js first if not installed
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login
```

### Initialize Firebase Project
```bash
# Initialize Firebase
firebase init

# Select required features:
# - Authentication
# - Firestore
# - Storage
# - Functions
# - Emulators
```

## Step 4: Project Setup

### Clone Repository
```bash
git clone https://github.com/your-repo/reel-ai.git
cd reel-ai
```

### Install Dependencies
```bash
# Flutter dependencies
flutter pub get

# Backend dependencies
cd backend
pip install -r requirements.txt
```

### Configure Environment Variables
1. Create `.env` file in project root:
```bash
cp .env.example .env
```

2. Update with your Firebase configuration:
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-api-key
```

## Step 5: IDE Setup

### VS Code Configuration
1. Install extensions:
   - Flutter
   - Dart
   - Python
   - Firebase
2. Configure settings:
   ```json
   {
     "editor.formatOnSave": true,
     "dart.lineLength": 80,
     "[dart]": {
       "editor.rulers": [80],
       "editor.formatOnSave": true,
       "editor.formatOnType": true,
       "editor.selectionHighlight": false,
       "editor.suggest.snippetsPreventQuickSuggestions": false,
       "editor.suggestSelection": "first",
       "editor.tabCompletion": "onlySnippets",
       "editor.wordBasedSuggestions": false
     }
   }
   ```

### Android Studio Configuration
1. Configure Flutter SDK path
2. Set up code style
3. Enable auto-import

## Step 6: Running the Project

### Start Backend Server
```bash
# From backend directory
uvicorn app.main:app --reload
```

### Start Flutter App
```bash
# From project root
flutter run
```

### Start Firebase Emulators
```bash
firebase emulators:start
```

## Step 7: Testing Setup

### Run Tests
```bash
# Flutter tests
flutter test

# Backend tests
cd backend
pytest
```

## Troubleshooting

### Common Issues
1. Flutter doctor issues:
   - Run `flutter doctor -v` for detailed output
   - Follow suggested fixes

2. Android Studio not finding Flutter:
   - Verify Flutter SDK path
   - Restart Android Studio

3. Firebase initialization fails:
   - Check `.env` configuration
   - Verify Firebase project setup

4. Emulator issues:
   - Update Android Studio
   - Verify system images installation

### Getting Help
- Check project issues on GitHub
- Join Discord community
- Review Stack Overflow tags

## Next Steps
1. Review project architecture
2. Set up version control
3. Configure CI/CD
4. Start development! 