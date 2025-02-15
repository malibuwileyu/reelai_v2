import React, { useCallback } from 'react';
import { Layout } from '../../components/shared/Layout';
import { MilestoneQuizPlayer } from '../../features/learning-path/components/MilestoneQuizPlayer';
import { useNavigation } from '../../providers/NavigationProvider';
import { useLearningPath } from '../../features/learning-path/hooks/useLearningPath';
import { useAuthContext } from '../../providers/AuthProvider';
import type { MilestoneQuizProgress } from '../../features/learning-path/types/quizMilestone';

interface Props {
  pathId: string;
  milestoneId: string;
  quizId: string;
}

export const MilestoneQuizScreen: React.FC<Props> = ({ pathId, milestoneId, quizId }) => {
  const { navigate } = useNavigation();
  const { user } = useAuthContext();
  const { path } = useLearningPath(pathId);

  const handleQuizComplete = useCallback((progress: MilestoneQuizProgress) => {
    console.log('Quiz completed:', {
      milestoneId,
      quizId,
      progress
    });
    navigate('pathDetail', { pathId });
  }, [milestoneId, quizId, pathId, navigate]);

  const handleQuizExit = useCallback(() => {
    navigate('pathDetail', { pathId });
  }, [pathId, navigate]);

  if (!path || !user) return null;

  const milestone = path.milestones.find(m => m.id === milestoneId);
  if (!milestone) return null;

  return (
    <Layout showBackButton children={
      <MilestoneQuizPlayer
        milestone={milestone}
        userId={user.uid}
        pathId={pathId}
        onComplete={handleQuizComplete}
        onExit={handleQuizExit}
      />
    } />
  );
}; 