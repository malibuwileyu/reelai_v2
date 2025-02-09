-- ReelAI Database Schema
-- Note: This is a reference schema. Firestore is NoSQL but this helps visualize the structure.

/*
Firebase Authentication (Managed by Firebase)
- This is NOT in Firestore. Firebase Auth manages these fields:
- uid (string) - Primary key
- email (string)
- emailVerified (boolean)
- displayName (string)
- photoURL (string)
- phoneNumber (string)
- disabled (boolean)
- metadata.creationTime (timestamp)
- metadata.lastSignInTime (timestamp)

We CANNOT modify these fields directly in Firestore.
Instead, we use Firebase Auth APIs to manage them.

Integration Points:
1. User Creation: When a new user signs up via Firebase Auth,
   we create a corresponding document in the users collection.
2. Profile Updates: When user updates their Firebase Auth profile,
   we sync relevant fields to our users collection.
3. Deletion: When a user is deleted from Firebase Auth,
   we clean up their data in our collections.
*/

-- Firestore Functions (implemented in Cloud Functions)
CREATE OR REPLACE FUNCTION sync_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Called when Firebase Auth user is created/updated
  -- Syncs basic profile data to our users collection
  INSERT INTO users (
    uid,
    username,
    created_at
  ) VALUES (
    NEW.uid,
    COALESCE(NEW.displayName, 'user_' || NEW.uid),
    NEW.metadata.creationTime
  ) ON CONFLICT (uid) DO UPDATE
  SET
    updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Firestore Triggers (implemented in Cloud Functions)
exports.onAuthUserCreated = functions.auth.user().onCreate((user) => {
  // Create corresponding user document in Firestore
  return admin.firestore().collection('users').doc(user.uid).set({
    uid: user.uid,
    email: user.email,
    username: user.displayName || `user_${user.uid}`,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  });
});

exports.onAuthUserDeleted = functions.auth.user().onDelete((user) => {
  // Clean up user data from all collections
  return admin.firestore().runTransaction(async (transaction) => {
    const userRef = admin.firestore().collection('users').doc(user.uid);
    const userVideos = await admin.firestore()
      .collection('videos')
      .where('creator_id', '==', user.uid)
      .get();
    
    transaction.delete(userRef);
    userVideos.forEach(video => {
      transaction.delete(video.ref);
    });
  });
});

-- Firestore Users Collection (Our custom user data)
CREATE TABLE users (
    -- Link to Firebase Auth user
    uid VARCHAR(128) PRIMARY KEY,  -- Must match Firebase Auth UID
    
    -- Custom Profile Information (our additional fields)
    username VARCHAR(30) UNIQUE,   -- Custom username for the platform
    bio TEXT,                      -- User's bio/description
    website VARCHAR(255),          -- Personal website
    location VARCHAR(100),         -- User's location
    
    -- Educational Info
    institution VARCHAR(255),
    role VARCHAR(50), -- teacher, student, content_creator
    subjects TEXT[], -- Array of subject areas
    
    -- Social
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    
    -- Preferences
    notification_settings JSONB,
    privacy_settings JSONB,
    
    -- Our Metadata
    last_active_at TIMESTAMP,      -- Last activity in our app
    profile_completed BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    account_type VARCHAR(20) DEFAULT 'standard',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Videos Collection
CREATE TABLE videos (
    video_id VARCHAR(128) PRIMARY KEY,
    creator_id VARCHAR(128) REFERENCES users(uid),
    
    -- Basic Info
    title VARCHAR(100),
    description TEXT,
    duration INTEGER, -- in seconds
    
    -- Educational Metadata
    subject VARCHAR(100),
    grade_level VARCHAR(50),
    learning_objectives TEXT[],
    keywords TEXT[],
    
    -- Content Details
    transcript TEXT,
    chapters JSONB, -- Array of chapter markers with timestamps
    captions JSONB, -- Multiple language support
    
    -- Media URLs
    video_url VARCHAR(255),
    thumbnail_url VARCHAR(255),
    preview_gif_url VARCHAR(255),
    
    -- Status and Visibility
    status VARCHAR(20), -- draft, processing, published, archived
    visibility VARCHAR(20), -- public, private, unlisted
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    
    -- AI Processing
    ai_generated_tags TEXT[],
    content_summary TEXT,
    automated_chapters JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

-- Comments Collection
CREATE TABLE comments (
    comment_id VARCHAR(128) PRIMARY KEY,
    video_id VARCHAR(128) REFERENCES videos(video_id),
    user_id VARCHAR(128) REFERENCES users(uid),
    
    content TEXT,
    timestamp INTEGER, -- Video timestamp if time-specific comment
    
    -- Social
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Likes Collection (for both videos and comments)
CREATE TABLE likes (
    like_id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(128) REFERENCES users(uid),
    target_type VARCHAR(20), -- video or comment
    target_id VARCHAR(128), -- video_id or comment_id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Video Processing Queue
CREATE TABLE processing_queue (
    job_id VARCHAR(128) PRIMARY KEY,
    video_id VARCHAR(128) REFERENCES videos(video_id),
    
    status VARCHAR(20), -- queued, processing, completed, failed
    progress INTEGER DEFAULT 0,
    error_message TEXT,
    
    -- Processing Options
    processing_options JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Analytics Events
CREATE TABLE analytics_events (
    event_id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(128) REFERENCES users(uid),
    video_id VARCHAR(128) REFERENCES videos(video_id),
    
    event_type VARCHAR(50), -- view, pause, seek, complete
    event_data JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learning Progress
CREATE TABLE learning_progress (
    progress_id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(128) REFERENCES users(uid),
    video_id VARCHAR(128) REFERENCES videos(video_id),
    
    watch_percentage INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    last_position INTEGER, -- Last watched position in seconds
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tags (for categorization)
CREATE TABLE tags (
    tag_id VARCHAR(128) PRIMARY KEY,
    name VARCHAR(50) UNIQUE,
    category VARCHAR(50), -- subject, topic, skill, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Video Tags (junction table)
CREATE TABLE video_tags (
    video_id VARCHAR(128) REFERENCES videos(video_id),
    tag_id VARCHAR(128) REFERENCES tags(tag_id),
    PRIMARY KEY (video_id, tag_id)
);

-- Indexes
CREATE INDEX idx_videos_creator ON videos(creator_id);
CREATE INDEX idx_comments_video ON comments(video_id);
CREATE INDEX idx_likes_target ON likes(target_type, target_id);
CREATE INDEX idx_analytics_video ON analytics_events(video_id);
CREATE INDEX idx_learning_user ON learning_progress(user_id);
CREATE INDEX idx_video_tags ON video_tags(tag_id); 