/**
 * SectionDivider
 *
 * A decorative horizontal rule with a centered all-caps label.
 * Renders two thin wood-colored line segments flanking a sage label,
 * replicating the "border with text" CSS pattern in React Native.
 *
 * Props:
 *   label  — text to display in the center gap
 *   style? — optional ViewStyle overrides for the outer container
 */

import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { COLORS } from '../../constants/colors';

interface Props {
  label: string;
  style?: ViewStyle;
}

export default function SectionDivider({ label, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.line} />
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.wood,
    opacity: 0.5,
  },
  label: {
    fontSize: 10,
    fontFamily: 'DMSans_600SemiBold',
    color: COLORS.sage,
    letterSpacing: 1.5,
    marginHorizontal: 12,
  },
});
