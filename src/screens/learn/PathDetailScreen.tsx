import React from 'react';
import { StyleSheet } from 'react-native';
import { Layout } from '../../components/shared/Layout';
import { LearningPathOverview } from '../../features/learning-path/components/LearningPathOverview';
import { useNavigation } from '../../providers/NavigationProvider';

interface Props {
  pathId: string;
}

export const PathDetailScreen: React.FC<Props> = ({ pathId }) => {
  const { navigate } = useNavigation();

  const handleCreatorPress = (creatorId: string) => {
    navigate('profile', { userId: creatorId });
  };

  return (
    <Layout children={
      <LearningPathOverview 
        pathId={pathId}
        onCreatorPress={handleCreatorPress}
      />
    } />
  );
};

const styles = StyleSheet.create({
  // Styles removed as they're no longer needed
}); 