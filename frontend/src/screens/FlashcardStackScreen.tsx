import React, { useEffect, useState, useRef } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import FlashCard from '../components/FlashCard';
import UndoToast from '../components/UndoToast';
import { useUIStore } from '../stores/uiStore';
import { useThreads } from '../hooks/useThreads';
import {
  callSendReply,
  callConfirmAndBook,
  callDeclineOrder,
  callParkThread,
  callGetMessages,
  callGetOrders,
  callGetCustomers,
} from '../api/client';
import type { FlashCardData, Customer, Order, Message, Thread, AIEvalResult, OrderStage } from '../types';

const DECLINE_DRAFT =
  "Hi! Thank you so much for reaching out. Unfortunately, I'm not able to take on this order at this time — I'm fully booked for that period. I hope you find the perfect cake! 🎂";

export default function FlashcardStackScreen() {
  const navigation = useNavigation();
  const { needsReply } = useThreads();
  const { showUndo } = useUIStore();
  const [cards, setCards] = useState<FlashCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const lastActionRef = useRef<{ type: string; threadId: string } | null>(null);

  // Derive a stable primitive so the effect only re-runs when the set of
  // threads genuinely changes. Array.filter() returns a new reference every
  // render, so using the array itself as a dependency re-fires the effect on
  // every render (including those caused by setCards/setLoading inside
  // buildCards), creating the infinite loop.
  //
  // lastMessageAt is included alongside id because FlashCard renders
  // thread.rollingSummary, which the backend updates with each new message.
  // Without lastMessageAt, a new message on an existing thread would change
  // the thread data in the poll but leave needsReplyKey unchanged, so
  // buildCards would never re-run and the card would show a stale summary.
  const needsReplyKey = needsReply.map(t => `${t.id}:${t.lastMessageAt}`).join(',');

  useEffect(() => {
    let cancelled = false;

    async function buildCards() {
      setLoading(true);
      const built: FlashCardData[] = [];

      try {
        const [{ customers }, { orders }] = await Promise.all([
          callGetCustomers(),
          callGetOrders(),
        ]);
        const customerMap = new Map(customers.map(c => [c.id, c]));
        const orderMap = new Map(orders.map(o => [o.threadId, o]));

        await Promise.all(
          needsReply.slice(0, 20).map(async (thread) => {
            try {
              const customer: Customer = customerMap.get(thread.customerId) ?? {
                id: thread.customerId,
                name: 'Customer',
                ownerId: thread.ownerId,
                contactHandles: [],
                notes: '',
                createdAt: '',
              };

              const { messages } = await callGetMessages(thread.id);
              const sortedMessages = [...messages].sort((a, b) =>
                a.createdAt < b.createdAt ? -1 : 1
              );

              const order: Order | null = orderMap.get(thread.id) ?? null;

              built.push({ thread, customer, order, messages: sortedMessages, evalResult: null });
            } catch {
              // Skip cards that fail to load
            }
          })
        );
      } catch {
        // Non-fatal — show empty stack
      }

      if (!cancelled) {
        setCards(built);
        setLoading(false);
      }
    }

    buildCards();
    return () => { cancelled = true; };
  }, [needsReplyKey]); // eslint-disable-line react-hooks/exhaustive-deps

  function currentCard(): FlashCardData | null {
    return cards[0] ?? null;
  }

  async function handleSwipeRight(editedReply: string) {
    const card = currentCard();
    if (!card || processing) return;

    setProcessing(true);
    const stage = card.order?.stage ?? 'inquiry';
    const isConfirmBook =
      stage === 'confirming' ||
      (card.order && stage === 'quoted' && editedReply.toLowerCase().includes('confirm'));

    try {
      if (isConfirmBook && card.order) {
        const result = await callConfirmAndBook({
          threadId: card.thread.id,
          orderId: card.order.id,
          replyText: editedReply,
          originalDraft: '',
        });

        if (result.hasConflict) {
          Alert.alert(
            '⚠️ Calendar Conflict',
            `You already have ${result.conflictCount} order(s) on that day. The order has been confirmed and added to your calendar.`,
            [{ text: 'OK' }]
          );
        }
      } else {
        const nextStage = getNextStage(stage);
        await callSendReply({
          threadId: card.thread.id,
          replyText: editedReply,
          originalDraft: '',
          advanceStage: !!nextStage,
          newStage: nextStage,
        });
      }

      advanceStack(card.thread.id, 'sent');
      showUndo({
        label: 'Reply sent',
        expiresAt: Date.now() + 4000,
        onUndo: async () => setCards(prev => [card, ...prev]),
      });
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setProcessing(false);
    }
  }

  async function handleSwipeLeft() {
    const card = currentCard();
    if (!card || processing) return;

    setProcessing(true);
    try {
      await callParkThread(card.thread.id);
      advanceStack(card.thread.id, 'parked');
      showUndo({
        label: 'Thread parked',
        expiresAt: Date.now() + 4000,
        onUndo: async () => setCards(prev => [card, ...prev]),
      });
    } catch {
      advanceStack(card.thread.id, 'parked');
    } finally {
      setProcessing(false);
    }
  }

  async function handleSwipeUp(editedReply: string) {
    const card = currentCard();
    if (!card || processing) return;

    setProcessing(true);
    try {
      await callDeclineOrder({
        threadId: card.thread.id,
        orderId: card.order?.id,
        replyText: editedReply || DECLINE_DRAFT,
      });
      advanceStack(card.thread.id, 'declined');
      showUndo({
        label: 'Order declined',
        expiresAt: Date.now() + 4000,
        onUndo: async () => setCards(prev => [card, ...prev]),
      });
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to decline');
    } finally {
      setProcessing(false);
    }
  }

  function advanceStack(threadId: string, action: string) {
    lastActionRef.current = { type: action, threadId };
    setCards(prev => prev.filter(c => c.thread.id !== threadId));
  }

  function getNextStage(current: OrderStage): OrderStage | undefined {
    const progression: Partial<Record<OrderStage, OrderStage>> = {
      inquiry: 'quoted',
      quoted: 'confirming',
      confirming: 'confirmed',
    };
    return progression[current];
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (cards.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.closeBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>All done!</Text>
          <Text style={styles.emptyText}>No more messages waiting for a reply.</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Back to Inbox</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.closeBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.counter}>{cards.length} remaining</Text>
      </View>

      <View style={styles.stackArea}>
        {cards.slice(0, 2).reverse().map((card, i) => (
          <FlashCard
            key={card.thread.id}
            data={card}
            isTop={i === cards.slice(0, 2).length - 1}
            onSwipeRight={handleSwipeRight}
            onSwipeLeft={handleSwipeLeft}
            onSwipeUp={handleSwipeUp}
          />
        ))}
      </View>

      {processing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator color={COLORS.cream} />
        </View>
      )}

      <UndoToast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  closeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
  stackArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 32 },
  doneBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  doneBtnText: { color: COLORS.cream, fontWeight: '700', fontSize: 16 },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.overlay,
  },
});
