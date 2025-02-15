import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface FooterProps {
  currentScreen: 'home' | 'learn' | 'upload' | 'profile';
  onNavigate: (screen: 'home' | 'learn' | 'upload' | 'profile') => void;
}

export const Footer: React.FC<FooterProps> = ({ currentScreen, onNavigate }) => {
  const NavButton = ({ screen, label }: { screen: 'home' | 'learn' | 'upload' | 'profile'; label: string }) => (
    <TouchableOpacity
      style={[styles.navButton, currentScreen === screen && styles.activeNavButton]}
      onPress={() => onNavigate(screen)}
    >
      <Text style={[styles.navText, currentScreen === screen && styles.activeNavText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <NavButton screen="home" label="Home" />
      <NavButton screen="learn" label="Learn" />
      <NavButton screen="upload" label="Upload" />
      <NavButton screen="profile" label="Profile" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  navButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeNavButton: {
    borderTopWidth: 2,
    borderTopColor: '#007AFF',
  },
  navText: {
    color: '#666',
    fontSize: 12,
  },
  activeNavText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
}); 