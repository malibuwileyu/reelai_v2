import { db } from '../../../config/firebase';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, updateDoc, increment } from 'firebase/firestore';
import { Video } from '../../../models/Video';
import { COLLECTIONS } from '../../../constants';

export class VideoService {
  static async getVideo(videoId: string): Promise<Video> {
    try {
      const videoRef = doc(db, COLLECTIONS.VIDEOS, videoId);
      const videoDoc = await getDoc(videoRef);

      if (!videoDoc.exists()) {
        throw new Error('Video not found');
      }

      // Increment view count
      await updateDoc(videoRef, {
        views: increment(1)
      });

      return {
        id: videoDoc.id,
        ...videoDoc.data()
      } as Video;
    } catch (error) {
      console.error('Error fetching video:', error);
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
    const videosRef = collection(db, COLLECTIONS.VIDEOS);
    const q = query(
      videosRef,
      where('creatorId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(count)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Video);
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
} 