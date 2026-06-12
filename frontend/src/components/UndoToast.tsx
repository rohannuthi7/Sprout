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
    backgroundColor: COLORS.deepGreen,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    boxShadow: '0 4px 12px rgba(64, 83, 77, 0.25)',
    elevation: 8,
    zIndex: 999,
  },
  label: {
    color: COLORS.cream,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  undoBtn: {
    marginLeft: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: COLORS.cream,
    borderRadius: 8,
  },
  undoText: {
    color: COLORS.deepGreen,
    fontWeight: '700',
    fontSize: 13,
  },
});
