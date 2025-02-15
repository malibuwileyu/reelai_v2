import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View } from 'react-native';
import { HomeScreen } from '../screens/home/HomeScreen';
import { LearnScreen } from '../screens/learn/LearnScreen';
import { UploadScreen } from '../screens/upload/UploadScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { TestScreen } from '../screens/test/TestScreen';
import { VideoDetailScreen } from '../screens/video/VideoDetailScreen';
import { VideoPlayerScreen } from '../screens/video/VideoPlayerScreen';
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
import { MilestoneQuizScreen } from '../screens/learn/MilestoneQuizScreen';
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
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuthContext();
  const [currentScreen, setCurrentScreen] = useState<NavigationScreen>(user ? 'home' : 'login');
  const [screenStack, setScreenStack] = useState<Array<{screen: NavigationScreen; params?: any}>>([]);
  const [params, setParams] = useState<Partial<NavigationParams[NavigationScreen]>>({});

  const navigate: NavigateFunction = useCallback((screen, newParams) => {
    setScreenStack(prev => [...prev, { screen: currentScreen, params }]);
    setCurrentScreen(screen);
    setParams(newParams || {});
  }, [currentScreen, params]);

  const goBack = useCallback(() => {
    const prevScreen = screenStack.pop();
    if (prevScreen) {
      setScreenStack(prev => prev.slice(0, -1));
      setCurrentScreen(prevScreen.screen);
      setParams(prevScreen.params || {});
    } else {
      setCurrentScreen(user ? 'home' : 'login');
      setParams({});
    }
  }, [screenStack, user]);

  const renderScreen = () => {
    // Type guard functions
    const hasVideoId = (p: any): p is { videoId: string } => 
      p && typeof p.videoId === 'string';
    
    const hasSubjectId = (p: any): p is { subjectId: string } => 
      p && typeof p.subjectId === 'string';
    
    const hasPathId = (p: any): p is { pathId: string } => 
      p && typeof p.pathId === 'string';

    const hasVideoPlayerParams = (p: any): p is { videoId: string; videoUrl: string; title: string; pathId: string } =>
      p && typeof p.videoId === 'string' && typeof p.videoUrl === 'string' && typeof p.title === 'string' && typeof p.pathId === 'string';

    const hasMilestoneQuizParams = (p: any): p is { pathId: string; milestoneId: string; quizId: string } =>
      p && typeof p.pathId === 'string' && typeof p.milestoneId === 'string' && typeof p.quizId === 'string';

    // Handle sub-screens with proper type checking
    if (currentScreen === 'videoDetail' && hasVideoId(params)) {
      return <VideoDetailScreen videoId={params.videoId} />;
    }
    if (currentScreen === 'videoPlayer' && hasVideoPlayerParams(params)) {
      return <VideoPlayerScreen 
        videoId={params.videoId} 
        videoUrl={params.videoUrl} 
        title={params.title} 
        pathId={params.pathId}
      />;
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
    if (currentScreen === 'milestoneQuiz' && hasMilestoneQuizParams(params)) {
      return <MilestoneQuizScreen pathId={params.pathId} milestoneId={params.milestoneId} quizId={params.quizId} />;
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
    <NavigationContext.Provider value={{ currentScreen, navigate, goBack }}>
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