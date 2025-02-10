import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useStreak } from '../../hooks/useStreak';

interface StreakDisplayProps {
  style?: any;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({ style }) => {
  const { currentStreak, longestStreak, loading, error } = useStreak();

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.errorText}>Failed to load streak</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.streakContainer}>
        <Text style={styles.label}>Current Streak</Text>
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>{currentStreak} days</Text>
          <Text style={styles.streakEmoji}>🔥</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.streakContainer}>
        <Text style={styles.label}>Longest Streak</Text>
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>{longestStreak} days</Text>
          <Text style={styles.streakEmoji}>🏆</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  streakContainer: {
    alignItems: 'center',
  },
  label: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  streakText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  streakEmoji: {
    fontSize: 16,
  },
  divider: {
    width: 1,
    height: '80%',
    backgroundColor: '#333',
    marginHorizontal: 16,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
  },
}); 