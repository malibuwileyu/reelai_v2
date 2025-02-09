# Testing Guidelines Overview

> Master document for testing standards in the ReelAI project. This document provides an overview of all testing approaches and links to detailed guidelines for each type.

## Testing Philosophy

### Core Principles
1. **Test Pyramid**
   - Unit Tests: 70% of test suite
   - Integration Tests: 20% of test suite
   - E2E Tests: 10% of test suite

2. **Coverage Requirements**
   - Minimum 80% coverage for all new code
   - Critical paths require 100% coverage
   - UI components require visual regression tests

3. **Testing Priorities**
   - Video playback functionality
   - Authentication flows
   - Data persistence
   - Network operations
   - Performance metrics

## Testing Types

### 1. [Unit Tests](./unit.md)
- Component testing
- Hook testing
- Service testing
- Utility function testing
- State management testing

### 2. [Integration Tests](./integration.md)
- Feature flow testing
- API integration testing
- Database integration testing
- Service interaction testing
- State management integration

### 3. [E2E Tests](./e2e.md)
- User flow testing
- Cross-screen navigation
- Device interaction testing
- Network condition testing
- Platform-specific testing

### 4. [Performance Tests](./performance.md)
- Video loading performance
- Feed scrolling performance
- Memory usage monitoring
- Network performance
- Animation performance

## Test Organization

### 1. Directory Structure
```
src/
├── __tests__/           # Global test utilities
├── components/
│   └── __tests__/      # Component tests
├── hooks/
│   └── __tests__/      # Hook tests
├── services/
│   └── __tests__/      # Service tests
└── e2e/                # E2E test suite
```

### 2. Naming Conventions
```typescript
// Component tests
ComponentName.test.tsx
ComponentName.spec.tsx

// Hook tests
useHookName.test.ts
useHookName.spec.ts

// Service tests
serviceName.test.ts
serviceName.spec.ts

// E2E tests
feature.e2e.ts
flow.e2e.ts
```

## Testing Tools

### 1. Core Testing Stack
```json
{
  "dependencies": {
    "@testing-library/react-native": "^8.0.0",
    "@testing-library/jest-native": "^4.0.0",
    "jest": "^27.0.0",
    "detox": "^19.0.0",
    "@react-native-firebase/perf": "^14.0.0"
  }
}
```

### 2. Testing Commands
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "detox test -c ios.debug",
    "test:perf": "jest performance",
    "test:integration": "jest integration"
  }
}
```

## Best Practices

### 1. Test Structure
```typescript
describe('Component/Feature', () => {
  // Setup
  beforeAll(() => {
    // Global setup
  });
  
  beforeEach(() => {
    // Per-test setup
  });
  
  // Test cases
  it('should handle primary use case', () => {
    // Arrange
    // Act
    // Assert
  });
  
  // Cleanup
  afterEach(() => {
    // Per-test cleanup
  });
  
  afterAll(() => {
    // Global cleanup
  });
});
```

### 2. Testing Guidelines
1. **Isolation**
   - Tests should be independent
   - Use fresh test data
   - Mock external dependencies
   - Reset state between tests

2. **Readability**
   - Clear test descriptions
   - Consistent naming
   - Organized test structure
   - Documented test data

3. **Maintenance**
   - DRY test helpers
   - Shared test fixtures
   - Centralized mocks
   - Version-controlled snapshots

## Quality Gates

### 1. Pull Request Requirements
- All tests must pass
- Coverage requirements met
- Performance benchmarks met
- No flaky tests
- Code review approval

### 2. Continuous Integration
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Dependencies
        run: yarn install
      
      - name: Unit Tests
        run: yarn test
      
      - name: Integration Tests
        run: yarn test:integration
      
      - name: E2E Tests
        run: yarn test:e2e
      
      - name: Performance Tests
        run: yarn test:perf
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v2
```

## Testing Resources

### 1. Documentation
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Detox Documentation](https://wix.github.io/Detox/)
- [Jest Documentation](https://jestjs.io/)
- [Firebase Test Lab](https://firebase.google.com/docs/test-lab)

### 2. Testing Checklist
- [ ] Unit tests written for new code
- [ ] Integration tests for feature flows
- [ ] E2E tests for critical paths
- [ ] Performance benchmarks met
- [ ] Test coverage requirements met
- [ ] Documentation updated
- [ ] CI pipeline passing 