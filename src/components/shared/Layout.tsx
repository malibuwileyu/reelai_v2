import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Header } from './Header';
import { Footer } from './Footer';
import { useNavigation } from '../../providers/NavigationProvider';
import { IconButton } from './IconButton';

interface LayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
  hideFooter?: boolean;
  showBackButton?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  hideHeader = false,
  hideFooter = false,
  showBackButton = false,
}) => {
  const { currentScreen, navigate, goBack } = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {showBackButton && (
          <View style={styles.header}>
            <IconButton
              name="arrow-back"
              size={24}
              color="#FFFFFF"
              onPress={goBack}
              style={styles.backButton}
            />
          </View>
        )}
        {!hideHeader && <Header />}
        <View style={styles.content}>{children}</View>

        {!hideFooter && (
          <View style={styles.footerContainer}>
            <Footer currentScreen={currentScreen} onNavigate={navigate} />
            <View style={styles.safeBottom} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  content: {
    flex: 1,
    backgroundColor: '#121212',
  },
  footerContainer: {
    backgroundColor: '#1a1a1a',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  safeBottom: {
    backgroundColor: '#1a1a1a',
    height: 20, // Reduced safe area height
  },
}); 