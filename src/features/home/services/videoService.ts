import { db, storage, auth } from '../../../config/firebase';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, updateDoc, increment, deleteDoc, QueryFieldFilterConstraint, addDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { Video } from '../../../models/Video';
import { COLLECTIONS } from '../../../constants';
import { Timestamp } from 'firebase/firestore';

export class VideoService {
  static async getVideo(videoId: string): Promise<Video> {
    try {
      const currentUser = auth.currentUser;
      console.log('[VideoService] Auth state for getVideo:', {
        isAuthenticated: !!currentUser,
        currentUserId: currentUser?.uid,
        videoId
      });

      const videoRef = doc(db, COLLECTIONS.VIDEOS, videoId);
      const videoDoc = await getDoc(videoRef);

      if (!videoDoc.exists()) {
        console.error('[VideoService] Video not found:', videoId);
        throw new Error('Video not found');
      }

      const videoData = videoDoc.data();
      const isOwner = currentUser?.uid === videoData.creatorId;
      const isPublic = videoData.isPublic === true;

      console.log('[VideoService] Video access check:', {
        isOwner,
        isPublic,
        videoStatus: videoData.status
      });

      // Check if user can access this video
      if (!isOwner && !isPublic) {
        console.error('[VideoService] Access denied: Video is private and user is not owner');
        throw new Error('Access denied: Video is private');
      }

      // Check if video is ready
      if (videoData.status !== 'ready') {
        console.error('[VideoService] Video not ready:', videoData.status);
        throw new Error(`Video is not ready: ${videoData.status}`);
      }

      // Increment view count
      await updateDoc(videoRef, {
        views: increment(1)
      });

      return {
        id: videoDoc.id,
        ...videoData
      } as Video;
    } catch (error) {
      console.error('[VideoService] Error fetching video:', error);
      throw error;
    }
  }

  static async getRecommendedVideos(currentVideoId: string, count = 10): Promise<Video[]> {
    const videosRef = collection(db, COLLECTIONS.VIDEOS);
    const q = query(
      videosRef,
      where('status', '==', 'ready'),
      where('isPublic', '==', true),
      orderBy('views', 'desc'),
      limit(count)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }) as Video)
      .filter(video => video.id !== currentVideoId);
  }

  static async getPopularVideos(count = 10): Promise<Video[]> {
    const videosRef = collection(db, COLLECTIONS.VIDEOS);
    const q = query(
      videosRef,
      where('status', '==', 'ready'),
      where('isPublic', '==', true),
      orderBy('views', 'desc'),
      limit(count)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Video);
  }

  static async getVideosByUser(userId: string, count = 10): Promise<Video[]> {
    try {
      // Enhanced auth logging
      const currentUser = auth.currentUser;
      console.log('[VideoService] Auth state:', {
        isAuthenticated: !!currentUser,
        currentUserId: currentUser?.uid,
        requestedUserId: userId,
        isOwnVideos: currentUser?.uid === userId
      });
      
      if (!currentUser) {
        throw new Error('User must be authenticated to fetch videos');
      }

      const videosRef = collection(db, COLLECTIONS.VIDEOS);
      const maxResults = Math.min(count, 50);

      // If user is fetching their own videos
      if (userId === currentUser.uid) {
        const ownVideosQuery = query(
          videosRef,
          where('creatorId', '==', userId),
          where('status', '==', 'ready'),
          orderBy('createdAt', 'desc'),
          limit(maxResults)
        );

        // Log query details
        console.log('[VideoService] Own videos query:', {
          collection: COLLECTIONS.VIDEOS,
          filters: [
            { field: 'creatorId', op: '==', value: userId },
            { field: 'status', op: '==', value: 'ready' }
          ],
          orderBy: { field: 'createdAt', direction: 'desc' },
          limit: maxResults
        });

        const querySnapshot = await getDocs(ownVideosQuery);
        console.log(`[VideoService] Query results:`, {
          count: querySnapshot.size,
          empty: querySnapshot.empty,
          metadata: querySnapshot.metadata,
          videos: querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              metadata: data.metadata,
              createdAt: data.createdAt,
              title: data.title
            };
          })
        });
        
        return querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            metadata: {
              ...(data.metadata || {}),
              duration: data.metadata?.duration || 0
            },
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          } as Video;
        });
      } else {
        const publicVideosQuery = query(
          videosRef,
          where('creatorId', '==', userId),
          where('isPublic', '==', true),
          where('status', '==', 'ready'),
          orderBy('createdAt', 'desc'),
          limit(maxResults)
        );

        // Log query details
        console.log('[VideoService] Public videos query:', {
          collection: COLLECTIONS.VIDEOS,
          filters: [
            { field: 'creatorId', op: '==', value: userId },
            { field: 'isPublic', op: '==', value: true },
            { field: 'status', op: '==', value: 'ready' }
          ],
          orderBy: { field: 'createdAt', direction: 'desc' },
          limit: maxResults
        });

        const querySnapshot = await getDocs(publicVideosQuery);
        console.log(`[VideoService] Query results:`, {
          count: querySnapshot.size,
          empty: querySnapshot.empty,
          metadata: querySnapshot.metadata
        });

        return querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            metadata: {
              ...(data.metadata || {}),
              duration: data.metadata?.duration || 0
            },
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Video;
        });
      }
    } catch (error) {
      // Enhanced error logging
      console.error('[VideoService] Error details:', {
        error,
        code: error instanceof Error ? (error as any).code : 'unknown',
        message: error instanceof Error ? error.message : String(error),
        userId,
        currentUser: auth.currentUser?.uid,
        collection: COLLECTIONS.VIDEOS,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      throw new Error(
        `Failed to fetch videos: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  static async likeVideo(videoId: string): Promise<void> {
    try {
      const videoRef = doc(db, COLLECTIONS.VIDEOS, videoId);
      await updateDoc(videoRef, {
        likes: increment(1)
      });
    } catch (error) {
      console.error('Error liking video:', error);
      throw error;
    }
  }

  static async unlikeVideo(videoId: string): Promise<void> {
    try {
      const videoRef = doc(db, COLLECTIONS.VIDEOS, videoId);
      await updateDoc(videoRef, {
        likes: increment(-1)
      });
    } catch (error) {
      console.error('Error unliking video:', error);
      throw error;
    }
  }

  static async deleteVideo(videoId: string): Promise<void> {
    try {
      // Get video data first to get the storage paths
      const video = await this.getVideo(videoId);
      
      // Extract path from full Firebase Storage URL
      const extractStoragePath = (url: string) => {
        if (!url.startsWith('https://')) return url;
        const storageUrl = new URL(url);
        const pathParts = decodeURIComponent(storageUrl.pathname).split('/o/');
        return pathParts.length > 1 ? pathParts[1] : url;
      };

      // Delete video file from storage
      if (video.videoUrl) {
        const videoPath = extractStoragePath(video.videoUrl);
        const videoRef = ref(storage, videoPath);
        await deleteObject(videoRef);
      }
      
      // Delete thumbnail if it exists
      if (video.thumbnailUrl) {
        const thumbnailPath = extractStoragePath(video.thumbnailUrl);
        const thumbnailRef = ref(storage, thumbnailPath);
        await deleteObject(thumbnailRef);
      }
      
      // Delete video document from Firestore
      const videoDocRef = doc(db, COLLECTIONS.VIDEOS, videoId);
      await deleteDoc(videoDocRef);
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }

  static async addNote(videoId: string, content: string) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const note = {
        userId: user.uid,
        videoId,
        content,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'videoNotes'), note);
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  }

  static async deleteNote(videoId: string, noteId: string) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const noteRef = doc(db, 'videoNotes', noteId);
      await deleteDoc(noteRef);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  static async getNotes(videoId: string) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const notesQuery = query(
        collection(db, 'videoNotes'),
        where('userId', '==', user.uid),
        where('videoId', '==', videoId)
      );

      const snapshot = await getDocs(notesQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting notes:', error);
      throw error;
    }
  }
} 