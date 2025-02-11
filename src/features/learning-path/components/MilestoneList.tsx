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
  const isVideo = content.type === 'video';

  return (
    <TouchableOpacity
      style={[styles.contentPreview, isLocked && styles.contentPreviewLocked]}
      onPress={onPress}
      disabled={isLocked}
    >
      <View style={styles.contentIcon}>
        <Ionicons
          name={isVideo ? 'videocam' : 'document-text'}
          size={24}
          color={isLocked ? '#999' : '#333'}
        />
      </View>
      <View style={styles.contentInfo}>
        <Text style={[styles.contentTitle, isLocked && styles.contentTitleLocked]}>
          {content.title}
        </Text>
        <Text style={styles.contentMeta}>
          {isVideo ? `${Math.round(content.duration / 60)} min` : `${content.timeLimit || 'No'} time limit`}
        </Text>
      </View>
      <View style={styles.contentStatus}>
        {isCompleted ? (
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        ) : isLocked ? (
          <Ionicons name="lock-closed" size={24} color="#999" />
        ) : (
          <Ionicons name="arrow-forward" size={24} color="#666" />
        )}
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
    if (!milestone.unlockCriteria) return false;
    
    const { previousMilestoneId, requiredVideos, requiredQuizzes } = milestone.unlockCriteria;
    
    // Check if previous milestone is completed if required
    if (previousMilestoneId && !completedMilestones.includes(previousMilestoneId)) {
      return true;
    }

    // Check if all required videos are completed
    if (requiredVideos.some(videoId => !completedVideos.includes(videoId))) {
      return true;
    }

    // Check if all required quizzes are passed
    if (requiredQuizzes.some(quizId => {
      const score = quizScores[quizId] || 0;
      return score < milestone.requiredScore;
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

  return (
    <ScrollView style={styles.container}>
      {milestones.map((milestone, index) => {
        const isCompleted = isMilestoneCompleted(milestone);
        const isLocked = isMilestoneLocked(milestone);
        const isCurrent = milestone.id === currentMilestoneId;

        return (
          <View key={milestone.id} style={styles.milestoneContainer}>
            {/* Timeline connector */}
            {index > 0 && (
              <View 
                style={[
                  styles.timelineConnector,
                  isCompleted && styles.timelineConnectorCompleted
                ]} 
              />
            )}

            {/* Milestone header */}
            <TouchableOpacity
              style={[
                styles.milestoneHeader,
                isCompleted && styles.milestoneHeaderCompleted,
                isCurrent && styles.milestoneHeaderCurrent,
                isLocked && styles.milestoneHeaderLocked,
              ]}
              onPress={() => onMilestonePress(milestone)}
              disabled={isLocked}
            >
              <View style={styles.milestoneNumber}>
                <Text style={styles.milestoneNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.milestoneInfo}>
                <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                <Text style={styles.milestoneDescription} numberOfLines={2}>
                  {milestone.description}
                </Text>
              </View>
              <View style={styles.milestoneStatus}>
                {isCompleted ? (
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                ) : isLocked ? (
                  <Ionicons name="lock-closed" size={24} color="#999" />
                ) : (
                  <Ionicons name="arrow-forward" size={24} color="#666" />
                )}
              </View>
            </TouchableOpacity>

            {/* Content list */}
            {!isLocked && (
              <View style={styles.contentList}>
                {milestone.content.map((content, contentIndex) => (
                  <ContentPreview
                    key={`${content.type}-${content.type === 'video' ? content.videoId : content.quizId}`}
                    content={content}
                    isCompleted={isContentCompleted(content)}
                    isLocked={isLocked || (contentIndex > 0 && !isContentCompleted(milestone.content[contentIndex - 1]))}
                    onPress={() => onContentPress(milestone.id, content)}
                  />
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
  },
  milestoneContainer: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  timelineConnector: {
    position: 'absolute',
    left: 20,
    top: -8,
    width: 2,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  timelineConnectorCompleted: {
    backgroundColor: '#4CAF50',
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  milestoneHeaderCompleted: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  milestoneHeaderCurrent: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  milestoneHeaderLocked: {
    opacity: 0.7,
  },
  milestoneNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  milestoneNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#666',
  },
  milestoneStatus: {
    marginLeft: 12,
  },
  contentList: {
    marginTop: 8,
    marginLeft: 44,
  },
  contentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  contentPreviewLocked: {
    opacity: 0.7,
  },
  contentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
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
    marginBottom: 2,
  },
  contentTitleLocked: {
    color: '#999',
  },
  contentMeta: {
    fontSize: 14,
    color: '#666',
  },
  contentStatus: {
    marginLeft: 12,
  },
}); 