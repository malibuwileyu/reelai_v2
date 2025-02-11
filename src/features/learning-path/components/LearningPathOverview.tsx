import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useLearningPath } from '../hooks/useLearningPath';
import type { LearningPathDifficulty, VideoContent, QuizContent, Milestone } from '../types';
import { UserService } from '../../../services/userService';
import type { User } from '../../../models/User';
import { MilestoneList } from './MilestoneList';

interface LearningPathOverviewProps {
  pathId: string;
  onCreatorPress?: (creatorId: string) => void;
  onMilestonePress?: (milestone: Milestone) => void;
  onContentPress?: (milestoneId: string, content: VideoContent | QuizContent) => void;
}

interface DifficultyBadgeProps {
  difficulty: LearningPathDifficulty;
}

const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ difficulty }: DifficultyBadgeProps) => {
  const colors: Record<LearningPathDifficulty, string> = {
    beginner: '#4CAF50',
    intermediate: '#FF9800',
    advanced: '#F44336'
  };

  return (
    <View style={[styles.badge, { backgroundColor: colors[difficulty] }]}>
      <Text style={styles.badgeText}>{difficulty.toUpperCase()}</Text>
    </View>
  );
};

export const LearningPathOverview: React.FC<LearningPathOverviewProps> = ({ 
  pathId,
  onCreatorPress,
  onMilestonePress,
  onContentPress,
}: LearningPathOverviewProps) => {
  const { path, progress, isLoading, error } = useLearningPath(pathId);
  const [creator, setCreator] = React.useState<User | null>(null);
  const [creatorLoading, setCreatorLoading] = React.useState(false);

  React.useEffect(() => {
    const loadCreator = async () => {
      if (path?.creatorId) {
        setCreatorLoading(true);
        try {
          const creatorData = await UserService.getUser(path.creatorId);
          setCreator(creatorData);
        } catch (err) {
          console.error('Error loading creator:', err);
        } finally {
          setCreatorLoading(false);
        }
      }
    };

    loadCreator();
  }, [path?.creatorId]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }

  if (!path) {
    return (
      <View style={styles.container}>
        <Text>Learning path not found</Text>
      </View>
    );
  }

  const handleMilestonePress = (milestone: Milestone) => {
    onMilestonePress?.(milestone);
  };

  const handleContentPress = (milestoneId: string, content: VideoContent | QuizContent) => {
    onContentPress?.(milestoneId, content);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>{path.title}</Text>
        <DifficultyBadge difficulty={path.difficulty} />
      </View>

      {/* Creator Section */}
      {(creator || creatorLoading) && (
        <TouchableOpacity 
          style={styles.creatorSection}
          onPress={() => creator && onCreatorPress?.(creator.id)}
          disabled={creatorLoading}
        >
          <View style={styles.creatorInfo}>
            {creator?.photoURL ? (
              <Image 
                source={{ uri: creator.photoURL }} 
                style={styles.creatorAvatar}
              />
            ) : (
              <View style={[styles.creatorAvatar, styles.placeholderAvatar]}>
                <Text style={styles.avatarInitial}>
                  {creator?.displayName?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View style={styles.creatorDetails}>
              <Text style={styles.creatorName}>
                {creatorLoading ? 'Loading...' : creator?.displayName || 'Unknown Creator'}
              </Text>
              {creator?.bio && (
                <Text style={styles.creatorBio} numberOfLines={2}>
                  {creator.bio}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.description}>{path.description}</Text>
        <View style={styles.stats}>
          <Text>Estimated Time: {path.estimatedHours} hours</Text>
          <Text>Category: {path.category}</Text>
        </View>
      </View>

      {/* Prerequisites Section */}
      {path.prerequisites && path.prerequisites.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prerequisites</Text>
          {path.prerequisites.map((prereq, index) => (
            <Text key={index} style={styles.prerequisite}>• {prereq}</Text>
          ))}
        </View>
      )}

      {/* Progress Section */}
      {progress && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${(progress.completedMilestones.length / path.milestones.length) * 100}%`
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {progress.completedMilestones.length} of {path.milestones.length} milestones completed
          </Text>
        </View>
      )}

      {/* Milestones Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Milestones</Text>
        <MilestoneList
          milestones={path.milestones}
          completedMilestones={progress?.completedMilestones || []}
          completedVideos={progress?.completedVideos || []}
          quizScores={progress?.quizScores || {}}
          currentMilestoneId={progress?.currentMilestoneId || ''}
          onMilestonePress={handleMilestonePress}
          onContentPress={handleContentPress}
        />
      </View>

      {/* Tags Section */}
      <View style={styles.tags}>
        {path.tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoSection: {
    padding: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  section: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  prerequisite: {
    fontSize: 16,
    color: '#666',
    marginVertical: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginVertical: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    color: '#F44336',
    textAlign: 'center',
    margin: 16,
  },
  creatorSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  placeholderAvatar: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#757575',
  },
  creatorDetails: {
    flex: 1,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  creatorBio: {
    fontSize: 14,
    color: '#666',
  },
}); 