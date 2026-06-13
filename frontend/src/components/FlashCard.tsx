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
import { TriangleAlert, Calendar, Users, Move, Truck, ArrowLeft, ArrowUp, ArrowRight } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import GrowthStageIcon from './botanical/GrowthStageIcon';
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

  // ── PanResponder — all gesture logic kept exactly as-is ──────────────────
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

  const hasAllergy = (order?.dietary ?? []).length > 0;
  const hasSafetyFlags = (evalResult?.safetyFlags ?? []).length > 0;

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
        <Text style={styles.swipeRightText}>{rightLabel}</Text>
      </Animated.View>
      <Animated.View style={[styles.swipeIndicator, styles.swipeLeft, { opacity: leftOpacity }]}>
        <Text style={styles.swipeLeftText}>Park</Text>
      </Animated.View>
      <Animated.View style={[styles.swipeIndicator, styles.swipeUp, { opacity: upOpacity }]}>
        <Text style={styles.swipeUpText}>Decline</Text>
      </Animated.View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} nestedScrollEnabled>

        {/* ── ALLERGY / SAFETY BLOCK — always at top, forest-inset strip ── */}
        {(hasAllergy || hasSafetyFlags) && (
          <View style={styles.allergyStrip}>
            <TriangleAlert size={16} color={COLORS.terracotta} strokeWidth={2.5} />
            <View style={styles.allergyStripContent}>
              {hasAllergy && (
                <>
                  <Text style={styles.allergyStripTitle}>Dietary / Allergies</Text>
                  {order!.dietary.map((item, i) => (
                    <Text key={i} style={styles.allergyStripItem}>{item}</Text>
                  ))}
                </>
              )}
              {hasSafetyFlags && (
                <>
                  <Text style={[styles.allergyStripTitle, hasAllergy && { marginTop: 8 }]}>Attention needed</Text>
                  {evalResult!.safetyFlags.map((flag, i) => (
                    <Text key={i} style={styles.allergyStripItem}>{flag}</Text>
                  ))}
                </>
              )}
            </View>
          </View>
        )}

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{customer.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.customerName}>{customer.name}</Text>
            {order?.stage && (
              <View style={styles.stageBadgeRow}>
                <GrowthStageIcon stage={order.stage} size={18} />
                <Text style={styles.stageText}>{order.stage}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Thread summary */}
        {thread.rollingSummary ? (
          <Text style={styles.summary}>{thread.rollingSummary}</Text>
        ) : null}

        {/* Order details */}
        {order && (
          <View style={styles.orderDetails}>
            <Text style={styles.sectionLabel}>Order Details</Text>
            <View style={styles.detailGrid}>
              {order.dueDate && <DetailChip icon="calendar" label={order.dueDate} />}
              {order.servings && <DetailChip icon="people" label={`${order.servings} servings`} />}
              {order.size && <DetailChip icon="size" label={order.size} />}
              {order.fulfillment && <DetailChip icon="truck" label={order.fulfillment} />}
            </View>
            {order.flavors.length > 0 && (
              <Text style={styles.detailText}>Flavors: {order.flavors.join(', ')}</Text>
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
              <Text key={i} style={styles.missingInfoItem}>- {item}</Text>
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
                keyboardAppearance="dark"
                placeholder="0.00"
                placeholderTextColor={COLORS.sage}
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
            placeholderTextColor={COLORS.sage}
            keyboardAppearance="dark"
          />
        </View>

        {/* Action hints */}
        <View style={styles.actionHints}>
          <View style={styles.hint}>
            <ArrowLeft size={14} color={COLORS.sage} strokeWidth={2} />
            <Text style={styles.hintText}>Park</Text>
          </View>
          <View style={styles.hint}>
            <ArrowUp size={14} color={COLORS.terracotta} strokeWidth={2} />
            <Text style={styles.hintText}>Decline</Text>
          </View>
          <View style={styles.hint}>
            <ArrowRight size={14} color={isConfirmBook ? COLORS.mustard : COLORS.mustard} strokeWidth={2} />
            <Text style={styles.hintText}>{rightLabel}</Text>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

type ChipIconName = 'calendar' | 'people' | 'size' | 'truck';

function DetailChip({ icon, label }: { icon: ChipIconName; label: string }) {
  const iconProps = { size: 12, color: COLORS.sage, strokeWidth: 1.8 };
  const iconEl = icon === 'calendar' ? <Calendar {...iconProps} />
    : icon === 'people'   ? <Users {...iconProps} />
    : icon === 'size'     ? <Move {...iconProps} />
    : <Truck {...iconProps} />;

  return (
    <View style={chipStyles.chip}>
      {iconEl}
      <Text style={chipStyles.label}>{label}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.forest,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: COLORS.parchment,
  },
});

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 32,
    maxHeight: '90%',
    backgroundColor: COLORS.palm,
    borderRadius: 24,
    shadowColor: '#0A1208',
    shadowOpacity: 0.60,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  cardBehind: {
    transform: [{ scale: 0.95 }, { translateY: 12 }],
    opacity: 0.7,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  // ── Allergy strip — forest bg so terracotta text passes AA ──
  allergyStrip: {
    flexDirection: 'row',
    backgroundColor: COLORS.forest,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.terracotta,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    alignItems: 'flex-start',
  },
  allergyStripContent: { flex: 1 },
  allergyStripTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    color: COLORS.terracotta,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  allergyStripItem: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: COLORS.terracotta,
    lineHeight: 20,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.fern,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    color: COLORS.parchment,
  },
  headerText: { flex: 1 },
  customerName: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 20,
    color: COLORS.parchment,
  },
  stageBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  stageText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    color: COLORS.sage,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ── Body content ──
  summary: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: COLORS.sage,
    lineHeight: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  orderDetails: {
    backgroundColor: COLORS.canopy,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 14,
  },
  sectionLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 10,
    color: COLORS.sage,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginHorizontal: 20,
    marginTop: 4,
  },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  detailText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.parchment,
    lineHeight: 20,
  },
  missingInfo: {
    backgroundColor: COLORS.canopy,
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.mustard,
  },
  missingInfoTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    color: COLORS.mustard,
    marginBottom: 4,
  },
  missingInfoItem: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: COLORS.mustard,
    lineHeight: 18,
    opacity: 0.85,
  },

  // ── Messages ──
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    marginHorizontal: 20,
  },
  inbound: {
    backgroundColor: COLORS.canopy,
    alignSelf: 'flex-start',
  },
  outbound: {
    backgroundColor: COLORS.fern,
    alignSelf: 'flex-end',
  },
  messageText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.parchment,
    lineHeight: 20,
  },
  outboundText: { color: COLORS.parchment },

  // ── Quote editor ──
  quoteSection: { marginBottom: 14, marginHorizontal: 20 },
  quoteRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dollarSign: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 28,
    color: COLORS.mustard,
  },
  quoteInput: {
    flex: 1,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 28,
    color: COLORS.mustard,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.wood,
    paddingBottom: 4,
  },

  // ── Draft reply ──
  draftSection: { marginBottom: 16, marginHorizontal: 20 },
  draftInput: {
    borderWidth: 1.5,
    borderColor: COLORS.wood,
    borderRadius: 12,
    padding: 12,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: COLORS.parchment,
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: COLORS.canopy,
  },

  // ── Action hints ──
  actionHints: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 20,
  },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  hintText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: COLORS.sage,
  },

  // ── Swipe indicators ──
  swipeIndicator: {
    position: 'absolute',
    top: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 2.5,
    zIndex: 10,
  },
  swipeRight: {
    right: 20,
    borderColor: COLORS.mustard,
    backgroundColor: COLORS.canopy,
  },
  swipeLeft: {
    left: 20,
    borderColor: COLORS.sage,
    backgroundColor: COLORS.canopy,
  },
  swipeUp: {
    top: 20,
    alignSelf: 'center',
    borderColor: COLORS.terracotta,
    backgroundColor: COLORS.canopy,
  },
  swipeRightText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: COLORS.mustard,
  },
  swipeLeftText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: COLORS.sage,
  },
  swipeUpText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: COLORS.terracotta,
  },
});
