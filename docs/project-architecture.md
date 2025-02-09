# Project Architecture

## Directory Structure

```
reel_ai/
├── lib/
│   ├── core/                    # Core application code
│   │   ├── config/             # App configuration
│   │   │   ├── env.dart
│   │   │   └── theme.dart
│   │   ├── services/           # Core services
│   │   │   ├── firebase_service.dart
│   │   │   └── storage_service.dart
│   │   └── utils/              # Utility functions
│   │       ├── validators.dart
│   │       └── formatters.dart
│   │
│   ├── features/               # Feature modules
│   │   ├── auth/              # Authentication feature
│   │   │   ├── data/          # Data layer
│   │   │   ├── domain/        # Business logic
│   │   │   └── presentation/   # UI components
│   │   │
│   │   ├── video/             # Video feature
│   │   │   ├── data/
│   │   │   │   ├── models/
│   │   │   │   └── repositories/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   └── use_cases/
│   │   │   └── presentation/
│   │   │       ├── screens/
│   │   │       ├── widgets/
│   │   │       └── providers/
│   │   │
│   │   └── social/            # Social features
│   │       ├── data/
│   │       ├── domain/
│   │       └── presentation/
│   │
│   ├── shared/                # Shared components
│   │   ├── widgets/           # Common widgets
│   │   │   ├── buttons/
│   │   │   └── cards/
│   │   └── models/            # Shared models
│   │
│   └── app.dart              # App entry point
│
├── backend/                   # FastAPI backend
│   ├── app/
│   │   ├── api/              # API endpoints
│   │   ├── core/             # Core functionality
│   │   ├── models/           # Data models
│   │   └── services/         # Business logic
│   │
│   └── tests/                # Backend tests
│
├── test/                     # Flutter tests
│   ├── unit/
│   ├── widget/
│   └── integration/
│
└── docs/                     # Documentation
    ├── api/
    ├── setup/
    └── architecture/
```

## Key Directories Explained

### Frontend (Flutter)

#### `lib/core/`
- Essential application code
- Configuration management
- Core services
- Utility functions

#### `lib/features/`
Each feature follows Clean Architecture:
- `data/`: API calls, repositories
- `domain/`: Business logic, entities
- `presentation/`: UI components

#### `lib/shared/`
- Reusable widgets
- Common models
- Shared utilities

### Backend (FastAPI)

#### `backend/app/`
- API endpoints
- Core services
- Data models
- Business logic

### Testing

#### `test/`
- Unit tests
- Widget tests
- Integration tests

## Feature Organization

### Auth Feature
```
auth/
├── data/
│   ├── repositories/
│   │   └── auth_repository.dart
│   └── models/
│       └── user_model.dart
├── domain/
│   ├── entities/
│   │   └── user.dart
│   └── use_cases/
│       ├── sign_in.dart
│       └── sign_up.dart
└── presentation/
    ├── screens/
    │   ├── login_screen.dart
    │   └── register_screen.dart
    └── providers/
        └── auth_provider.dart
```

### Video Feature
```
video/
├── data/
│   ├── repositories/
│   │   └── video_repository.dart
│   └── models/
│       └── video_model.dart
├── domain/
│   ├── entities/
│   │   └── video.dart
│   └── use_cases/
│       ├── upload_video.dart
│       └── process_video.dart
└── presentation/
    ├── screens/
    │   ├── video_feed.dart
    │   └── video_upload.dart
    └── providers/
        └── video_provider.dart
```

## State Management

### Provider Organization
```
providers/
├── auth/
│   └── auth_provider.dart
├── video/
│   ├── video_upload_provider.dart
│   └── video_feed_provider.dart
└── social/
    └── interaction_provider.dart
```

## Asset Organization
```
assets/
├── images/
├── fonts/
└── animations/
```

## Configuration Files
```
config/
├── dev/
│   └── firebase_options.dart
├── prod/
│   └── firebase_options.dart
└── env.dart
``` 