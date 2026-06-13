import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/colors';
import { useUIStore } from '../stores/uiStore';

const UNDO_DURATION_MS = 4000;

export default function UndoToast() {
  const { undoAction, clearUndo } = useUIStore();
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!undoAction) {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      return;
    }

    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => clearUndo(), UNDO_DURATION_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [undoAction]);

  if (!undoAction) return null;

  async function handleUndo() {
    if (timerRef.current) clearTimeout(timerRef.current);
    clearUndo();
    await undoAction?.onUndo();
  }

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.label}>{undoAction.label}</Text>
      <TouchableOpacity onPress={handleUndo} style={styles.undoBtn}>
        <Text style={styles.undoText}>Undo</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: COLORS.canopy,
    borderWidth: 1,
    borderColor: COLORS.wood,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: '#0A1208',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 999,
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    color: COLORS.parchment,
    fontSize: 14,
    flex: 1,
  },
  undoBtn: {
    marginLeft: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: COLORS.mustard,
    borderRadius: 8,
  },
  undoText: {
    fontFamily: 'DMSans_700Bold',
    color: COLORS.forest,
    fontSize: 13,
  },
});
