import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthContext } from '../../providers/AuthProvider';
import { showToast } from '../../utils/toast';

export const Header: React.FC = () => {
  const { user, signOut } = useAuthContext();

  const handleSignOut = async () => {
    try {
      await signOut();
      showToast('Successfully logged out', 'success');
    } catch (error) {
      showToast('Failed to log out', 'error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ReelAI</Text>
      <View style={styles.rightSection}>
        {user ? (
          <>
            <Text style={styles.userEmail}>{user.email}</Text>
            <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userEmail: {
    color: '#fff',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
  },
}); 