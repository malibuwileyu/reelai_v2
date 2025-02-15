export type Screen = 
  | 'home'
  | 'learn'
  | 'upload'
  | 'profile'
  | 'test'
  | 'login'
  | 'register'
  | 'achievements'
  | 'videoUpload'
  | 'processingQueue'
  | 'aiEnhancement'
  | 'subjectDetail'
  | 'pathDetail'
  | 'editProfile'
  | 'videoLibrary'
  | 'settings'
  | 'comments'
  | 'share'
  | 'quiz'
  | 'milestoneQuiz'
  | 'studyNotes'
  | 'serverTest'
  | 'videoPlayer';

export type NavigationParams = {
  home: undefined;
  learn: undefined;
  upload: undefined;
  profile: { userId: string };
  test: undefined;
  videoDetail: { videoId: string };
  login: undefined;
  register: undefined;
  subjectDetail: { subjectId: string };
  pathDetail: { pathId: string };
  achievements: undefined;
  videoUpload: undefined;
  processingQueue: undefined;
  aiEnhancement: undefined;
  editProfile: undefined;
  videoLibrary: undefined;
  settings: undefined;
  comments: { videoId: string };
  share: { videoId: string };
  quiz: { subjectId: string };
  milestoneQuiz: { pathId: string; milestoneId: string; quizId: string };
  studyNotes: { subjectId: string };
  serverTest: undefined;
  videoPlayer: { videoId: string; videoUrl: string; title: string; pathId: string };
};

export type NavigationScreen = keyof NavigationParams; 