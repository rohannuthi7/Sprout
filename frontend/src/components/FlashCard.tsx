import React, { useRef, useState } from 'react';
import {
  Dimensions,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import type { FlashCardData, OrderStage } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;
const SWIPE_UP_THRESHOLD = 100;

const STAGE_RIGHT_LABEL: Record<OrderStage, string> = {
  inquiry: 'Send Reply',
  quoted: 'Send Quote',
  confirming: 'Confirm & Book',
  confirmed: 'Confirm & Book',
  completed: 'Send Reply',
  declined: 'Send Reply',
  archived: 'Send Reply',
};

interface Props {
  data: FlashCardData;
  isTop: boolean;
  onSwipeRight: (editedReply: string) => void;
  onSwipeLeft: () => void;
  onSwipeUp: (editedReply: string) => void;
}

export default function FlashCard({ data, isTop, onSwipeRight, onSwipeLeft, onSwipeUp }: Props) {
  const { thread, customer, order, messages, evalResult } = data;
  const pan = useRef(new Animated.ValueXY()).current;
  const [draftReply, setDraftReply] = useState(evalResult?.draftReply ?? '');
  const [quoteValue, setQuoteValue] = useState(
    evalResult?.quote !== null && evalResult?.quote !== undefined
      ? String(evalResult.quote)
      : order?.quotedPrice !== null && order?.quotedPrice !== undefined
      ? String(order.quotedPrice)
      : ''
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTop,
      onMoveShouldSetPanResponder: (_, gs) => isTop && (Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5),
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > SWIPE_THRESHOLD) {
          Animated.timing(pan, {
            toValue: { x: SCREEN_WIDTH * 1.5, y: gs.dy },
            duration: 250,
            useNativeDriver: false,
          }).start(() => onSwipeRight(draftReply));
        } else if (gs.dx < -SWIPE_THRESHOLD) {
          Animated.timing(pan, {
            toValue: { x: -SCREEN_WIDTH * 1.5, y: gs.dy },
            duration: 250,
            useNativeDriver: false,
          }).start(() => onSwipeLeft());
        } else if (gs.dy < -SWIPE_UP_THRESHOLD) {
          Animated.timing(pan, {
            toValue: { x: gs.dx, y: -800 },
            duration: 250,
            useNativeDriver: false,
          }).start(() => onSwipeUp(draftReply));
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  });

  const rightOpacity = pan.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const leftOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const upOpacity = pan.y.interpolate({
    inputRange: [-SWIPE_UP_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const currentStage: OrderStage = order?.stage ?? 'inquiry';
  const rightLabel = STAGE_RIGHT_LABEL[currentStage];
  const isConfirmBook = currentStage === 'confirming' || currentStage === 'confirmed';

  return (
    <Animated.View
      style={[
        styles.card,
        { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] },
        !isTop && styles.cardBehind,
      ]}
      {...(isTop ? panResponder.panHandlers : {})}
    >
      {/* Swipe indicator overlays */}
      <Animated.View style={[styles.swipeIndicator, styles.swipeRight, { opacity: rightOpacity }]}>
        <Text style={styles.swipeIndicatorText}>{rightLabel}</Text>
      </Animated.View>
      <Animated.View style={[styles.swipeIndicator, styles.swipeLeft, { opacity: leftOpacity }]}>
        <Text style={styles.swipeIndicatorText}>Park</Text>
      </Animated.View>
      <Animated.View style={[styles.swipeIndicator, styles.swipeUp, { opacity: upOpacity }]}>
        <Text style={styles.swipeIndicatorText}>Decline</Text>
      </Animated.View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} nestedScrollEnabled>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{customer.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.customerName}>{customer.name}</Text>
            {order?.stage && (
              <View style={styles.stageBadge}>
                <Text style={styles.stageText}>{order.stage}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Safety flags — show prominently at top */}
        {(evalResult?.safetyFlags ?? []).length > 0 && (
          <View style={styles.safetyBlock}>
            <Ionicons name="warning" size={16} color={COLORS.danger} />
            <View style={styles.safetyContent}>
              <Text style={styles.safetyTitle}>Attention needed</Text>
              {evalResult!.safetyFlags.map((flag, i) => (
                <Text key={i} style={styles.safetyFlag}>• {flag}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Thread summary */}
        {thread.rollingSummary ? (
          <Text style={styles.summary}>{thread.rollingSummary}</Text>
        ) : null}

        {/* Order details */}
        {order && (
          <View style={styles.orderDetails}>
            <Text style={styles.sectionLabel}>Order Details</Text>
            <View style={styles.detailGrid}>
              {order.dueDate && <DetailChip icon="calendar-outline" label={order.dueDate} />}
              {order.servings && <DetailChip icon="people-outline" label={`${order.servings} servings`} />}
              {order.size && <DetailChip icon="resize-outline" label={order.size} />}
              {order.fulfillment && <DetailChip icon="car-outline" label={order.fulfillment} />}
            </View>
            {order.flavors.length > 0 && (
              <Text style={styles.detailText}>Flavors: {order.flavors.join(', ')}</Text>
            )}
            {order.dietary.length > 0 && (
              <Text style={styles.allergyDetail}>⚠️ Dietary: {order.dietary.join(', ')}</Text>
            )}
            {order.designNotes ? (
              <Text style={styles.detailText}>{order.designNotes}</Text>
            ) : null}
          </View>
        )}

        {/* Missing info */}
        {(evalResult?.missingInfo ?? []).length > 0 && (
          <View style={styles.missingInfo}>
            <Text style={styles.missingInfoTitle}>Still needed:</Text>
            {evalResult!.missingInfo.map((item, i) => (
              <Text key={i} style={styles.missingInfoItem}>• {item}</Text>
            ))}
          </View>
        )}

        {/* Message history */}
        <Text style={styles.sectionLabel}>Conversation</Text>
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[styles.messageBubble, msg.direction === 'outbound' ? styles.outbound : styles.inbound]}
          >
            <Text style={[styles.messageText, msg.direction === 'outbound' && styles.outboundText]}>
              {msg.rawText}
            </Text>
          </View>
        ))}

        {/* Quote editor */}
        {(evalResult?.quote !== null && evalResult?.quote !== undefined) || order?.quotedPrice !== null ? (
          <View style={styles.quoteSection}>
            <Text style={styles.sectionLabel}>Quote</Text>
            <View style={styles.quoteRow}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.quoteInput}
                value={quoteValue}
                onChangeText={setQuoteValue}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>
        ) : null}

        {/* Draft reply editor */}
        <View style={styles.draftSection}>
          <Text style={styles.sectionLabel}>Draft Reply</Text>
          <TextInput
            style={styles.draftInput}
            value={draftReply}
            onChangeText={setDraftReply}
            multiline
            placeholder="Edit draft reply before sending..."
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        {/* Action hint */}
        <View style={styles.actionHints}>
          <View style={styles.hint}>
            <Ionicons name="arrow-back" size={14} color={COLORS.sageTan} />
            <Text style={styles.hintText}>Park</Text>
          </View>
          <View style={styles.hint}>
            <Ionicons name="arrow-up" size={14} color={COLORS.terracotta} />
            <Text style={styles.hintText}>Decline</Text>
          </View>
          <View style={styles.hint}>
            <Ionicons
              name="arrow-forward"
              size={14}
              color={isConfirmBook ? COLORS.primary : COLORS.lightGreen}
            />
            <Text style={styles.hintText}>{rightLabel}</Text>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

function DetailChip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={chipStyles.chip}>
      <Ionicons name={icon} size={12} color={COLORS.primary} />
      <Text style={chipStyles.label}>{label}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
});

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 32,
    maxHeight: '90%',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    boxShadow: '0 8px 20px rgba(64, 83, 77, 0.12)',
    elevation: 10,
  },
  cardBehind: {
    transform: [{ scale: 0.95 }, { translateY: 12 }],
    opacity: 0.7,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: COLORS.deepGreen },
  headerText: { flex: 1 },
  customerName: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  stageBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  stageText: { fontSize: 11, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase' },
  safetyBlock: {
    flexDirection: 'row',
    backgroundColor: '#FFF0EE',
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  safetyContent: { flex: 1 },
  safetyTitle: { fontSize: 12, fontWeight: '700', color: COLORS.danger, marginBottom: 2 },
  safetyFlag: { fontSize: 12, color: COLORS.danger, lineHeight: 18 },
  summary: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  orderDetails: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  detailText: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 20 },
  allergyDetail: { fontSize: 13, color: COLORS.danger, fontWeight: '600', lineHeight: 20 },
  missingInfo: {
    backgroundColor: '#FEF9EC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  missingInfoTitle: { fontSize: 12, fontWeight: '700', color: '#A06820', marginBottom: 4 },
  missingInfoItem: { fontSize: 12, color: '#A06820', lineHeight: 18 },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  inbound: { backgroundColor: COLORS.background, alignSelf: 'flex-start' },
  outbound: { backgroundColor: COLORS.primary, alignSelf: 'flex-end' },
  messageText: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 20 },
  outboundText: { color: COLORS.cream },
  quoteSection: { marginBottom: 14 },
  quoteRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dollarSign: { fontSize: 22, fontWeight: '700', color: COLORS.primary },
  quoteInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    paddingBottom: 4,
  },
  draftSection: { marginBottom: 16 },
  draftInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actionHints: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hintText: { fontSize: 12, color: COLORS.textMuted },
  swipeIndicator: {
    position: 'absolute',
    top: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 3,
    zIndex: 10,
  },
  swipeRight: {
    right: 20,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(89,123,96,0.1)',
  },
  swipeLeft: {
    left: 20,
    borderColor: COLORS.sageTan,
    backgroundColor: 'rgba(207,196,157,0.15)',
  },
  swipeUp: {
    top: 20,
    alignSelf: 'center',
    borderColor: COLORS.terracotta,
    backgroundColor: 'rgba(216,150,132,0.1)',
  },
  swipeIndicatorText: { fontSize: 13, fontWeight: '800', color: COLORS.deepGreen },
});
