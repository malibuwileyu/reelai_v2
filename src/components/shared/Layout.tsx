import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Header } from './Header';
import { Footer } from './Footer';
import { useNavigation } from '../../providers/NavigationProvider';

interface LayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
  hideFooter?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  hideHeader = false,
  hideFooter = false,
}) => {
  const { currentScreen, navigate } = useNavigation();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeTop}>
        {!hideHeader && <Header />}
      </SafeAreaView>
      
      <View style={styles.content}>{children}</View>

      {!hideFooter && (
        <View style={styles.footerContainer}>
          <Footer currentScreen={currentScreen} onNavigate={navigate} />
          <View style={styles.safeBottom} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeTop: {
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    backgroundColor: '#121212',
  },
  footerContainer: {
    backgroundColor: '#1a1a1a',
  },
  safeBottom: {
    backgroundColor: '#1a1a1a',
    height: 34, // Standard safe area height for modern iPhones
  },
}); 