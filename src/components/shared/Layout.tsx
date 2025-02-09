import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Header } from './Header';
import { Footer } from './Footer';

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
  return (
    <SafeAreaView style={styles.container}>
      {!hideHeader && <Header />}
      <View style={styles.content}>{children}</View>
      {!hideFooter && <Footer />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    backgroundColor: '#121212',
  },
}); 