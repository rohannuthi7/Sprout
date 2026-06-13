import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';
import GrowthStageIcon from '../components/botanical/GrowthStageIcon';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <GrowthStageIcon stage="seed" size={72} color={COLORS.parchment} />
      </View>
      <Text style={styles.wordmark}>Sprout</Text>
      <Text style={styles.tagline}>Your custom cake business, organized.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.forest,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    marginBottom: 24,
  },
  wordmark: {
    fontFamily: 'Fraunces_800ExtraBold',
    fontSize: 42,
    color: COLORS.parchment,
    letterSpacing: 1,
    marginBottom: 10,
  },
  tagline: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: COLORS.sage,
    textAlign: 'center',
    lineHeight: 22,
  },
});
