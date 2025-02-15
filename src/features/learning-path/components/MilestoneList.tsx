import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Milestone, VideoContent, QuizContent } from '../types';

interface MilestoneListProps {
  milestones: Milestone[];
  completedMilestones: string[];
  completedVideos: string[];
  quizScores: Record<string, number>;
  currentMilestoneId: string;
  onMilestonePress: (milestone: Milestone) => void;
  onContentPress: (milestoneId: string, content: VideoContent | QuizContent) => void;
}

interface ContentPreviewProps {
  content: VideoContent | QuizContent;
  isCompleted: boolean;
  isLocked: boolean;
  onPress: () => void;
}

const ContentPreview: React.FC<ContentPreviewProps> = ({
  content,
  isCompleted,
  isLocked,
  onPress,
}: ContentPreviewProps) => {
  const getDuration = (duration: number) => {
    // Convert milliseconds to minutes, rounding up
    const minutes = Math.ceil(duration / 60000);
    return `${minutes} min`;
  };

  const icon = content.type === 'video' ? 'videocam-outline' : 'document-text-outline';
  const title = content.title;

  return (
    <TouchableOpacity
      style={[styles.contentItem, isLocked && styles.contentItemLocked]}
      onPress={onPress}
      disabled={isLocked}
    >
      <View style={styles.contentIcon}>
        <Ionicons 
          name={icon} 
          size={24} 
          color={isLocked ? '#999999' : '#007AFF'} 
        />
      </View>
      <View style={styles.contentInfo}>
        <Text style={[
          styles.contentTitle,
          isLocked && styles.contentTitleLocked
        ]}>
          {title}
        </Text>
        {content.type === 'video' && (
          <View style={styles.duration}>
            <Ionicons name="time-outline" size={16} color="#666666" />
            <Text style={styles.durationText}>{getDuration(content.duration)}</Text>
          </View>
        )}
      </View>
      <View style={styles.contentStatus}>
        {isCompleted ? (
          <Ionicons name="checkmark-circle" size={24} color="#34C759" />
        ) : isLocked ? (
          <Ionicons name="lock-closed" size={20} color="#999999" />
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

export const MilestoneList: React.FC<MilestoneListProps> = ({
  milestones,
  completedMilestones,
  completedVideos,
  quizScores,
  currentMilestoneId,
  onMilestonePress,
  onContentPress,
}: MilestoneListProps) => {
  const isMilestoneCompleted = (milestone: Milestone): boolean => {
    return completedMilestones.includes(milestone.id);
  };

  const isMilestoneLocked = (milestone: Milestone): boolean => {
    // First milestone should never be locked
    if (milestone.order === 1) return false;

    if (!milestone.unlockCriteria) return false;
    
    const { previousMilestoneId, requiredVideos = [], requiredQuizzes = [] } = milestone.unlockCriteria;
    
    // Check if previous milestone is completed if required
    if (previousMilestoneId && !completedMilestones.includes(previousMilestoneId)) {
      return true;
    }

    // Check if all required videos are completed
    if (requiredVideos.some(videoId => !completedVideos.includes(videoId))) {
      return true;
    }

    // Check if all required quizzes are passed with minimum score
    if (requiredQuizzes.some(quizId => {
      const score = quizScores[quizId] || 0;
      return score < 70; // Default passing score if not specified
    })) {
      return true;
    }

    return false;
  };

  const isContentCompleted = (content: VideoContent | QuizContent): boolean => {
    if (content.type === 'video') {
      return completedVideos.includes(content.videoId);
    } else {
      return (quizScores[content.quizId] || 0) >= content.passingScore;
    }
  };

  const isContentLocked = (content: VideoContent | QuizContent, milestone: Milestone): boolean => {
    if (content.type === 'video') {
      // First video in a milestone should never be locked
      const isFirstVideo = milestone.content
        .filter(c => c.type === 'video')
        .findIndex(c => (c as VideoContent).videoId === content.videoId) === 0;
      if (isFirstVideo) return false;

      // Videos are locked if they have a required previous video that isn't completed
      const prevContent = milestone.content
        .slice(0, content.order)
        .filter(c => c.type === 'video' && c.isRequired);
      return prevContent.some(c => !completedVideos.includes((c as VideoContent).videoId));
    } else if (content.type === 'quiz') {
      // Find the quiz in the milestone's quizzes array
      const quiz = milestone.quizzes?.find(q => q.id === content.quizId);
      if (!quiz) return false;

      // Check if all required videos for this quiz are completed
      return quiz.requirements.requiredVideoIds.some(videoId => !completedVideos.includes(videoId));
    }
    return false;
  };

  const getAllContent = (milestone: Milestone): (VideoContent | QuizContent)[] => {
    const content = [...milestone.content];
    
    // Convert quizzes array to QuizContent format
    if (milestone.quizzes) {
      milestone.quizzes.forEach((quiz, index) => {
        content.push({
          type: 'quiz',
          quizId: quiz.id,
          title: `Quiz ${index + 1}`,
          description: `Quiz for ${milestone.title}`,
          timeLimit: quiz.requirements.timeLimit,
          passingScore: quiz.requirements.passingScore,
          order: content.length + index,
          isRequired: true
        });
      });
    }
    
    return content.sort((a, b) => a.order - b.order);
  };

  return (
    <ScrollView style={styles.container}>
      {milestones.map((milestone, index) => {
        const isCompleted = isMilestoneCompleted(milestone);
        const isLocked = isMilestoneLocked(milestone);
        const isCurrent = milestone.id === currentMilestoneId;
        const allContent = getAllContent(milestone);

        return (
          <View 
            key={milestone.id} 
            style={[
              styles.milestoneContainer,
              isLocked && styles.milestoneLocked,
              isCurrent && styles.milestoneCurrent
            ]}
          >
            <TouchableOpacity
              style={styles.milestoneHeader}
              onPress={() => onMilestonePress(milestone)}
              disabled={isLocked}
            >
              <View style={styles.milestoneInfo}>
                <Text style={[
                  styles.milestoneTitle,
                  isLocked && styles.milestoneTitleLocked
                ]}>
                  {index + 1}. {milestone.title}
                </Text>
                <Text style={styles.milestoneDescription}>
                  {milestone.description}
                </Text>
              </View>
              <View style={styles.milestoneStatus}>
                {isCompleted ? (
                  <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                ) : isLocked ? (
                  <Ionicons name="lock-closed" size={20} color="#999999" />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#007AFF" />
                )}
              </View>
            </TouchableOpacity>

            {allContent.length > 0 && (
              <View style={[
                styles.contentList,
                isLocked && styles.contentListLocked
              ]}>
                {allContent.map((content, index) => (
                  <View key={`${milestone.id}-${content.type}-${content.type === 'video' ? content.videoId : content.quizId}`}>
                    <ContentPreview
                      content={content}
                      isCompleted={isContentCompleted(content)}
                      isLocked={isLocked || isContentLocked(content, milestone)}
                      onPress={() => onContentPress(milestone.id, content)}
                    />
                    {index < allContent.length - 1 && (
                      <View style={styles.contentDivider} />
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  milestoneContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  milestoneLocked: {
    opacity: 0.7,
  },
  milestoneCurrent: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  milestoneHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  milestoneTitleLocked: {
    color: '#999999',
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#666666',
  },
  milestoneStatus: {
    marginLeft: 16,
  },
  contentList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  contentListLocked: {
    opacity: 0.7,
  },
  contentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
  },
  contentItemLocked: {
    opacity: 0.7,
  },
  contentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  contentTitleLocked: {
    color: '#999999',
  },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  durationText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  contentStatus: {
    marginLeft: 12,
  },
  contentDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 8,
  },
}); 