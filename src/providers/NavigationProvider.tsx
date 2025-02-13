import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View } from 'react-native';
import { HomeScreen } from '../screens/home/HomeScreen';
import { LearnScreen } from '../screens/learn/LearnScreen';
import { UploadScreen } from '../screens/upload/UploadScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { TestScreen } from '../screens/test/TestScreen';
import { VideoDetailScreen } from '../screens/video/VideoDetailScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { VideoLibraryScreen } from '../screens/profile/VideoLibraryScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { SubjectDetailScreen } from '../screens/learn/SubjectDetailScreen';
import { PathDetailScreen } from '../screens/learn/PathDetailScreen';
import { AchievementsScreen } from '../screens/profile/AchievementsScreen';
import { VideoUploadScreen } from '../screens/upload/VideoUploadScreen';
import { ProcessingQueueScreen } from '../screens/upload/ProcessingQueueScreen';
import { AIEnhancementScreen } from '../screens/upload/AIEnhancementScreen';
import { CommentsScreen } from '../screens/video/CommentsScreen';
import { ShareScreen } from '../screens/video/ShareScreen';
import { QuizScreen } from '../screens/learn/QuizScreen';
import { StudyNotesScreen } from '../screens/learn/StudyNotesScreen';
import { ServerTestScreen } from '../screens/debug/ServerTestScreen';
import { NavigationScreen, NavigationParams } from '../navigation/types';
import { useAuthContext } from './AuthProvider';

type NavigateFunction = <T extends NavigationScreen>(
  screen: T,
  params?: NavigationParams[T]
) => void;

type NavigationParamList = {
  [K in NavigationScreen]: NavigationParams[K];
};

interface NavigationContextType {
  currentScreen: NavigationScreen;
  navigate: NavigateFunction;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuthContext();
  const [currentScreen, setCurrentScreen] = useState<NavigationScreen>(user ? 'home' : 'login');
  const [params, setParams] = useState<Partial<NavigationParams[NavigationScreen]>>({});

  const navigate: NavigateFunction = useCallback((screen, newParams) => {
    setCurrentScreen(screen);
    setParams(newParams || {});
  }, []);

  const renderScreen = () => {
    // Type guard functions
    const hasVideoId = (p: any): p is { videoId: string } => 
      p && typeof p.videoId === 'string';
    
    const hasSubjectId = (p: any): p is { subjectId: string } => 
      p && typeof p.subjectId === 'string';
    
    const hasPathId = (p: any): p is { pathId: string } => 
      p && typeof p.pathId === 'string';

    // Handle sub-screens with proper type checking
    if (currentScreen === 'videoDetail' && hasVideoId(params)) {
      return <VideoDetailScreen videoId={params.videoId} />;
    }
    if (currentScreen === 'subjectDetail' && hasSubjectId(params)) {
      return <SubjectDetailScreen subjectId={params.subjectId} />;
    }
    if (currentScreen === 'pathDetail' && hasPathId(params)) {
      return <PathDetailScreen pathId={params.pathId} />;
    }
    if (currentScreen === 'comments' && hasVideoId(params)) {
      return <CommentsScreen videoId={params.videoId} />;
    }
    if (currentScreen === 'share' && hasVideoId(params)) {
      return <ShareScreen videoId={params.videoId} />;
    }
    if (currentScreen === 'quiz' && hasSubjectId(params)) {
      return <QuizScreen subjectId={params.subjectId} />;
    }
    if (currentScreen === 'studyNotes' && hasSubjectId(params)) {
      return <StudyNotesScreen subjectId={params.subjectId} />;
    }

    // Handle base screens
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'learn':
        return <LearnScreen />;
      case 'upload':
        return <UploadScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'test':
        return <TestScreen />;
      case 'login':
        return <LoginScreen />;
      case 'register':
        return <RegisterScreen />;
      case 'achievements':
        return <AchievementsScreen />;
      case 'videoUpload':
        return <VideoUploadScreen />;
      case 'processingQueue':
        return <ProcessingQueueScreen />;
      case 'aiEnhancement':
        return <AIEnhancementScreen />;
      case 'editProfile':
        return <EditProfileScreen />;
      case 'videoLibrary':
        return <VideoLibraryScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'serverTest':
        return <ServerTestScreen />;
      default:
        return user ? <HomeScreen /> : <LoginScreen />;
    }
  };

  return (
    <NavigationContext.Provider value={{ currentScreen, navigate }}>
      {renderScreen()}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}; 