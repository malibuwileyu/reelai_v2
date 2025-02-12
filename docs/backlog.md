# ReelAI Development Backlog

This file tracks features, improvements, and tasks that are not currently prioritized but may be implemented in the future.

## Critical Issues 🚨

### Security Vulnerabilities in Dependencies
- Current state: Multiple high and critical severity vulnerabilities reported by npm audit
- Required: Review and update dependencies to resolve security issues
- Impact: Potential security risks in production
- Priority: High (Security Issue)
- Implementation Plan:
  1. Dependency Review:
     - Run detailed npm audit
     - Document all vulnerabilities
     - Research safe upgrade paths
     - Test compatibility with updates
  2. Package Updates:
     - Update firebase-functions to >=5.1.0
     - Resolve react-test-renderer conflicts
     - Fix deprecated punycode module
     - Address glob package deprecation
  3. Testing:
     - Verify all features after updates
     - Run full test suite
     - Check for breaking changes
     - Validate build process
- Target completion: After core features (Sprint 4)
- Dependencies:
  - Package.json configurations
  - Firebase function implementations
  - Test suite stability

### Video Processing Framework Issues
- Current state: Video duration detection fails in processing context
- Required: Fix expo-av Video component initialization and metadata extraction
- Impact: Non-critical (metadata still available through other means)
- Priority: Medium (Technical Debt)
- Implementation Plan:
  1. Framework Updates:
     - Research alternatives to expo-av for processing context
     - Implement proper Video component initialization
     - Add fallback duration detection methods
  2. Error Handling:
     - Improve metadata extraction resilience
     - Add proper error recovery
     - Enhance logging for debugging
  3. Testing:
     - Add comprehensive tests for video processing
     - Verify metadata extraction in all contexts
     - Validate error handling
- Target completion: After core features (Sprint 4)
- Dependencies:
  - expo-av framework
  - Video processing pipeline
  - Metadata handling system

## Feature Ideas
- [ ] Progress Bar Dragging Implementation
  - Current state: Progress bar is view-only, no seeking via drag
  - Required: Add drag functionality while ensuring fair progression tracking
  - Impact: Improves user experience while maintaining learning integrity
  - Priority: Medium (UX Enhancement)
  - Implementation Plan:
    1. Technical Requirements:
       - Add drag gesture handling to progress bar
       - Implement smooth seeking during drag
       - Add visual feedback during drag operation
       - Ensure proper state updates during/after drag
    2. Fair Progression:
       - Track actual time watched vs. skipped sections
       - Prevent credit for unwatched sections
       - Consider implementing minimum watch time requirements
       - Add analytics for seeking behavior
    3. Testing:
       - Verify smooth drag operation
       - Validate progression tracking accuracy
       - Test edge cases (rapid seeking, network issues)
       - Verify progress persistence
  - Target completion: After core features (Sprint 5)
  - Dependencies:
    - Video player implementation
    - Progress tracking system
    - Analytics framework

- [ ] Video Upload UI Improvements
  - Current state: No way to change video after selection, silent failures on missing title
  - Required: Improve user feedback and control during upload process
  - Impact: Better user experience and error handling
  - Priority: High (UX Critical)
  - Implementation Plan:
    1. Video Selection:
       - Add "Change Video" button after selection
       - Show selected video name/thumbnail
       - Add video preview option
       - Support drag-and-drop
    2. Error Handling:
       - Add visible error message for missing title
       - Show validation errors inline
       - Add field highlighting for required fields
       - Improve error message clarity
    3. Testing:
       - Verify video change functionality
       - Test error message display
       - Validate all error cases
       - Check accessibility
  - Target completion: Sprint 4
  - Dependencies:
    - Video upload component
    - Form validation system
    - UI component library

- [ ] Featured Content Vertical Scroller
  - Current state: Using standard miniplayer cards for all video displays
  - Required: Limited vertical scroller for featured/recommended content only
  - Impact: Enhanced engagement for discovery while maintaining learning focus
  - Priority: Low (UX Enhancement)
  - Implementation Plan:
    1. Technical Requirements:
       - Implement vertical swipe gesture system
       - Add video preloading for smooth transitions
       - Create compact video info overlay
       - Support quick actions (bookmark, add to path)
    2. Performance Optimization:
       - Smart preloading strategy
       - Memory management for video instances
       - Thumbnail caching system
       - Viewport-based loading
    3. UX Considerations:
       - Clear distinction from main learning content
       - Easy exit to structured learning view
       - Limited autoplay functionality
       - Quick preview capabilities
    4. Integration Points:
       - Featured content selection algorithm
       - Learning path recommendations
       - Progress tracking integration
       - Analytics for engagement
  - Target completion: After core features (Sprint 6)
  - Dependencies:
    - Enhanced video player stability
    - Content recommendation system
    - Performance optimization framework

## Technical Debt
- None yet
## Nice-to-Have Improvements
- None yet

## Known Issues
- None yet

## Performance Optimization Tasks 🚀

### Client-Side Performance
- State Management
  - [ ] Implement cache system for video metadata
  - [ ] Add offline support for viewed videos
  - [ ] Optimize data synchronization
  - [ ] Improve memory management for video playback
  - [ ] Add request debouncing and throttling
  - [ ] Implement optimistic updates
  - [ ] Implement optimistic streak updates with local state management
    - Calculate streak locally based on last watched date
    - Show immediate feedback for streak updates
    - Handle background sync with server
    - Manage edge cases (offline, conflicts)
    - Add proper loading states

### Server-Side Optimization
- API Performance
  - [ ] Optimize Firestore queries
  - [ ] Implement batch operations for bulk updates
  - [ ] Add rate limiting for video uploads
  - [ ] Enhance error handling and recovery
  - [ ] Optimize cloud function execution
  - [ ] Add request caching where appropriate

### Video Processing Optimization
- Media Handling
  - [ ] Optimize video transcoding pipeline
  - [ ] Implement adaptive quality streaming
  - [ ] Add video compression options
  - [ ] Optimize thumbnail generation
  - [ ] Implement lazy loading for video content
  - [ ] Add video preloading for better UX

### Storage Optimization
- Resource Management
  - [ ] Implement cleanup for unused resources
  - [ ] Add video file size optimization
  - [ ] Optimize image asset delivery
  - [ ] Implement CDN integration
  - [ ] Add storage quota management
  - [ ] Optimize backup strategies

### Monitoring and Analytics
- Performance Tracking
  - [ ] Add performance monitoring
  - [ ] Implement error tracking
  - [ ] Add usage analytics
  - [ ] Set up alerting for issues
  - [ ] Add performance benchmarking
  - [ ] Implement user feedback collection

Priority: After core features are stable
Impact: High
Complexity: Medium to High
Dependencies: Core feature completion

## Search Implementation Features
- None yet
