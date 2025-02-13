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
  | 'studyNotes'
  | 'serverTest';

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
  studyNotes: { subjectId: string };
  serverTest: undefined;
};

export type NavigationScreen = keyof NavigationParams; 