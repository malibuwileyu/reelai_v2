# Project Structure Guidelines

> Detailed project structure guidelines for the ReelAI project. See [Coding Guidelines](../coding.md) for overview.

## Directory Structure
```
src/
├── core/                    # Core application code
│   ├── config/             # App configuration
│   │   ├── firebase.ts     # Firebase configuration
│   │   └── theme.ts        # App theming
│   ├── services/           # Core services
│   │   ├── auth.ts         # Firebase Auth service
│   │   ├── storage.ts      # Firebase Storage service
│   │   └── firestore.ts    # Firestore service
│   └── utils/              # Utility functions
│       ├── validators.ts
│       └── formatters.ts
│
├── features/               # Feature modules
│   ├── auth/              # Authentication feature
│   │   ├── components/    # Feature-specific components
│   │   ├── hooks/         # Custom hooks
│   │   ├── screens/       # Screen components
│   │   └── types.ts       # Type definitions
│   │
│   ├── video/            # Video feature
│   │   ├── components/   
│   │   ├── hooks/       
│   │   ├── screens/     
│   │   ├── services/     # Video-specific services
│   │   └── types.ts
│   │
│   └── social/           # Social features
│       ├── components/
│       ├── hooks/
│       ├── screens/
│       └── types.ts
│
├── shared/               # Shared components and utilities
│   ├── components/       # Reusable components
│   │   ├── Button/
│   │   ├── Card/
│   │   └── Loading/
│   ├── hooks/           # Shared hooks
│   └── types/           # Shared type definitions
│
└── navigation/          # Navigation configuration
    ├── AppNavigator.tsx
    └── types.ts
```

## Core Directory Guidelines

### `core/`
- Essential application code
- Configuration management
- Core services
- Utility functions

### `features/`
Each feature module should:
- Be self-contained
- Follow consistent structure
- Minimize cross-feature dependencies
- Export public API through index.ts

### `shared/`
- Reusable components
- Common hooks
- Shared types
- No feature-specific code

## Feature Module Structure

### Required Files
```
feature/
├── index.ts              # Public API
├── types.ts              # Type definitions
└── constants.ts          # Feature constants
```

### Optional Directories
```
feature/
├── components/          # UI components
├── hooks/              # Custom hooks
├── screens/            # Screen components
├── services/           # Business logic
└── utils/             # Feature utilities
```

## File Organization

### Component Files
```typescript
// VideoPlayer/
├── index.ts           # Exports
├── VideoPlayer.tsx    # Component
├── styles.ts         # Styles
└── types.ts          # Types
```

### Screen Files
```typescript
// VideoScreen/
├── index.ts          # Exports
├── VideoScreen.tsx   # Screen
├── components/       # Screen-specific components
└── hooks/           # Screen-specific hooks
```

## Import Guidelines

### Absolute Imports
```typescript
// Use absolute imports for features/shared
import { Button } from '@shared/components';
import { useAuth } from '@features/auth';
```

### Relative Imports
```typescript
// Use relative imports within feature
import { styles } from './styles';
import { VideoPlayerProps } from './types';
```

## Module Guidelines

### Feature Module Exports
```typescript
// feature/index.ts
export * from './components';
export * from './hooks';
export * from './types';
```

### Component Module Exports
```typescript
// components/index.ts
export * from './Button';
export * from './Card';
export * from './Loading';
``` 