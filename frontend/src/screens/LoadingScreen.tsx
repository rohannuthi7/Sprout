import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🌱</Text>
      <Text style={styles.wordmark}>Sprout</Text>
      <ActivityIndicator color={COLORS.cream} size="small" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.deepGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 64,
    marginBottom: 12,
  },
  wordmark: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.cream,
    letterSpacing: 2,
  },
  spinner: {
    marginTop: 32,
  },
});
