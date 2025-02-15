import React from 'react';
import { StyleSheet } from 'react-native';
import { Layout } from '../../components/shared/Layout';
import { LearningPathOverview } from '../../features/learning-path/components/LearningPathOverview';
import { useNavigation } from '../../providers/NavigationProvider';
import type { Milestone, VideoContent, QuizContent } from '../../features/learning-path/types';

interface Props {
  pathId: string;
}

export const PathDetailScreen: React.FC<Props> = ({ pathId }) => {
  const { navigate } = useNavigation();

  const handleCreatorPress = (creatorId: string) => {
    navigate('profile', { userId: creatorId });
  };

  const handleMilestonePress = (milestone: Milestone) => {
    // Toggle milestone expansion in the UI
    console.log('Milestone pressed:', milestone.id);
  };

  const handleContentPress = (milestoneId: string, content: VideoContent | QuizContent) => {
    if (content.type === 'video') {
      navigate('videoPlayer', { 
        videoId: content.videoId,
        videoUrl: content.videoUrl,
        title: content.title,
        pathId
      });
    } else {
      navigate('milestoneQuiz', { 
        pathId,
        milestoneId,
        quizId: content.quizId
      });
    }
  };

  return (
    <Layout children={
      <LearningPathOverview 
        pathId={pathId}
        onCreatorPress={handleCreatorPress}
        onMilestonePress={handleMilestonePress}
        onContentPress={handleContentPress}
      />
    } />
  );
};

const styles = StyleSheet.create({
  // Styles removed as they're no longer needed
}); 