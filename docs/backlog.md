# ReelAI Development Backlog

This file tracks features, improvements, and tasks that are not currently prioritized but may be implemented in the future.

## Critical Issues 🚨

### Continue Watching Video Playback
- Current state: Videos from continue watching section open in broken video player with small nav bar and no playback
- Required: Videos should open directly in the video feed for proper playback
- Impact: Users cannot resume watching videos from continue watching section
- Priority: High (Critical UX Issue)
- Implementation Plan:
  1. Update Video Navigation:
     - Modify ContinueWatchingItem navigation to use VerticalFeed
     - Pass video index or ID to VerticalFeed for proper positioning
     - Ensure video starts playing automatically
  2. Video Feed Updates:
     - Add support for starting at specific video
     - Implement proper video positioning
     - Handle resume position from watch history
  3. Testing:
     - Test navigation flow
     - Verify video positioning
     - Validate playback state
     - Check watch history integration
- Target completion: Immediate (Sprint 3)
- Dependencies:
  - VerticalFeed component
  - Video navigation system
  - Watch history service

## Feature Ideas
- None yet

## Technical Debt

- ⚠️ Watch Streak Achievement System
  - Current state: Watch streak achievement not properly tracking consecutive days
  - Required: Fix watch streak calculation and achievement tracking
  - Impact: Users' learning streaks not being properly recognized
  - Priority: High (affects user engagement)
  - Implementation Plan:
    1. Fix Daily Watch Metrics:
       - Verify dailyWatchMetrics collection updates
       - Ensure proper date handling for streaks
       - Add data validation for watch records
    2. Update Progress Service:
       - Review getWatchStreak implementation
       - Add proper date comparison logic
       - Implement streak validation
    3. Achievement Integration:
       - Verify achievement triggers
       - Test streak calculations
       - Add proper progress updates
  - Dependencies:
    - ProgressService
    - AchievementService
    - Daily watch metrics collection
  - Target completion: Sprint 3
  - Current status: Partially implemented but not functioning correctly

- Email Verification Flow
  - Current state: No email verification system implemented
  - Required: Full email verification system using Firebase Auth
  - Impact: Users can't verify emails or update email addresses
  - Priority: High (blocking feature)
  - Implementation Plan:
    1. Firebase Configuration:
       - Enable email verification in Firebase Console
       - Configure email templates for verification
       - Set up custom action URL handling

    2. Registration Flow:
       - Send verification email after registration
       - Add verification status UI indicator
       - Implement email verification check
       - Add resend verification option
       - Handle verification success/failure

    3. Email Management:
       - Implement email change request flow
       - Verify new email before updating
       - Handle verification timeouts
       - Manage concurrent verification requests

    4. UI Components:
       - Add verification status banner
       - Create verification reminder dialog
       - Add email verification screen
       - Implement verification success screen
       - Add verification error handling

    5. Security Measures:
       - Rate limit verification requests
       - Validate verification tokens
       - Implement secure token storage
       - Add verification attempt tracking

    6. Testing:
       - Unit tests for verification logic
       - Integration tests for email flow
       - UI tests for verification screens
       - Security testing for token handling

  - Dependencies:
    - Firebase Auth Configuration
    - Custom Email Templates
    - Deep Link Handling
    - Secure Token Storage

  - Target completion: Sprint 3
  - Current status: Email change functionality disabled until implementation

- Missing Profile Options
  - Current state: Several profile options are missing from the UI
  - Required: Restore or implement missing profile options
  - Impact: Users have limited profile management capabilities
  - Priority: Medium
  - Missing Options to Add:
    1. Account Management:
       - Change Password
       - Email Preferences
       - Account Deletion
       - Language Settings
       - Connected Accounts
    2. Content Preferences:
       - Video Quality Settings
       - Autoplay Settings
       - Download Settings
       - Storage Management
    3. Privacy Controls:
       - Profile Visibility
       - Activity History
       - Data Export
       - Data Deletion
  - Implementation Plan:
    1. UI Updates:
       - Add missing menu items
       - Create new settings screens
       - Implement form controls
    2. Backend Integration:
       - Firebase user management
       - Settings persistence
       - Data export/deletion handlers
    3. Testing:
       - UI component tests
       - Integration tests
       - Settings persistence tests
  - Target completion: Sprint 4
  - Current status: Options temporarily removed, needs reimplementation

- Firebase Auth persistence needs to be implemented using AsyncStorage to persist auth state between app restarts
  - Current state: Auth state is lost on app restart
  - Required: Research and implement proper persistence solution for React Native
  - Impact: Users need to log in again after app restart
  - Priority: Medium
  - Notes: Initial attempt with getReactNativePersistence caused compatibility issues

- ⚠️ Firebase Storage Rules need to be properly secured
  - Current state: Rules are set to allow all read/write operations (`if true`) for development
  - Required: Implement proper security rules following the pattern:
    ```javascript
    service firebase.storage {
      match /b/{bucket}/o {
        match /profile-pictures/{userId}/{fileName} {
          allow read: if request.auth != null;
          allow write: if request.auth != null 
                       && request.auth.uid == userId
                       && request.resource.size < 5 * 1024 * 1024
                       && request.resource.contentType.matches('image/.*');
        }
      }
    }
    ```
  - Priority: High (must be done before production)
  - Risk: Current setup allows unrestricted access to storage
  - Target completion: Before any production deployment
  - Current temporary rules (for development only):
    ```javascript
    rules_version = '2';
    service firebase.storage {
      match /b/{bucket}/o {
        match /{allPaths=**} {
          allow read, write: if true;
        }
      }
    }
    ```

## Nice-to-Have Improvements
- None yet

## Known Issues
- Search text alignment in search bar is not perfectly centered vertically
  - Current state: Text appears slightly below center despite styling attempts
  - Required: Investigate React Native Paper's Searchbar component styling
  - Impact: Minor visual inconsistency
  - Location: `src/components/VideoSearch.tsx`
  - Notes: May require custom styling or component modification

- ⚠️ Search History Permissions Error
  - Current state: Users receiving "Missing or insufficient permissions" error when accessing search history
  - Required: 
    1. Proper Firebase rules configuration for user-specific search history
    2. Correct collection/document structure for search history
    3. Proper error handling in SearchHistoryService
  - Impact: Users cannot see their search history
  - Location: 
    - `src/services/SearchHistoryService.ts`
    - `firestore.rules`
  - Technical Details:
    - Current Implementation:
      - Using subcollection: `users/{userId}/searchHistory/{historyId}`
      - Basic read/write rules for owner access
    - Issues to Resolve:
      1. Verify user document exists before accessing subcollection
      2. Handle permission errors gracefully in UI
      3. Implement proper error recovery
      4. Add logging for debugging
    - Required Changes:
      1. Update Firestore rules to handle edge cases
      2. Improve error handling in SearchHistoryService
      3. Add detailed logging for permission errors
      4. Implement retry mechanism for failed operations
  - Priority: Medium
  - Notes: 
    - Multiple attempts made to fix through rules and service updates
    - May require restructuring of search history data model
    - Consider implementing local fallback for search history

## Performance Optimization Tasks

### Video Player Performance
- Artificial Delay Issue
  - Current state: There appears to be an enforced delay in video transitions that's not related to loading
  - Required: Review and remove any artificial delays in the video player component
  - Impact: Slower than necessary video transitions
  - Priority: Medium
  - Location: `src/components/VerticalVideoPlayer.tsx`
  - Notes: May be related to animation timing or transition state management

- Video Preloading Optimization
  - Current state: Basic preloading implemented but can be improved
  - Required: Optimize preloading strategy
  - Impact: Video loading times and memory usage
  - Priority: Medium
  - Tasks:
    1. Implement progressive loading (load low quality first)
    2. Optimize cache size based on device memory
    3. Add prefetch based on user scroll direction
    4. Implement intelligent unloading based on memory pressure
    5. Add metrics to measure loading performance

- Memory Management
  - Current state: Basic video unloading implemented
  - Required: More sophisticated memory management
  - Impact: App stability and performance on low-end devices
  - Priority: Medium
  - Tasks:
    1. Monitor memory usage during video playback
    2. Implement adaptive cache size based on device capabilities
    3. Add memory pressure handling
    4. Optimize video buffer size
    5. Add memory usage analytics

- Network Optimization
  - Current state: Basic video loading
  - Required: Smarter network usage
  - Impact: Data usage and loading times
  - Priority: Medium
  - Tasks:
    1. Implement quality selection based on network speed
    2. Add bandwidth monitoring
    3. Implement smart retry logic for failed loads
    4. Add network-aware preloading
    5. Implement offline caching for watched videos 

## Search Implementation Features

### Core Search Infrastructure
- [x] Setup Firestore search indexes
- [x] Implement search service layer
- [x] Create search result models
- [ ] Add search analytics tracking

### Search Categories
#### Video Search
- [x] Title and description search
- [x] Category filtering
- [x] Difficulty level filtering
- [x] Language filtering
- [x] Results sorting options
- [ ] Search history tracking

#### User Search
- [x] Username search
- [x] Display name search
- [x] Bio search
- [ ] Interest-based filtering
- [ ] Location-based filtering
- [ ] Recent searches tracking

### Search Analytics
- [x] Track search queries
- [x] Record result counts
- [x] Store user ID for authenticated searches
- [x] Update search term usage statistics
- [x] Track filter usage

### Search History
- [x] Store search history for authenticated users
- [x] Display recent searches
- [x] Quick re-run of previous searches
- [x] Maintain filters from previous searches
- [x] Auto-cleanup of old history items

### Improvements
- [ ] Implement fuzzy search
- [ ] Add advanced filtering options
- [ ] Implement search suggestions
- [ ] Add trending searches
- [ ] Implement search result caching 