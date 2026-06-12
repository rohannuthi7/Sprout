import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useThreads } from '../hooks/useThreads';
import ThreadItem from '../components/ThreadItem';
import UndoToast from '../components/UndoToast';
import { callIntakeMessage, callGetCustomers } from '../api/client';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { Customer, Thread } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function InboxScreen() {
  const navigation = useNavigation<Nav>();
  const { needsReply, parked, waitingOnCustomer, loading } = useThreads();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerMap, setCustomerMap] = useState<Record<string, string>>({});
  const [pasteModalVisible, setPasteModalVisible] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [waitingExpanded, setWaitingExpanded] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      const { customers: list } = await callGetCustomers();
      setCustomers(list);
      const map: Record<string, string> = {};
      list.forEach(c => { map[c.id] = c.name; });
      setCustomerMap(map);
    } catch {
      // Non-fatal — names fall back to "Customer"
    }
  }

  function getCustomerName(thread: Thread): string {
    return customerMap[thread.customerId] ?? 'Customer';
  }

  async function handlePasteSubmit() {
    if (!pasteText.trim()) {
      Alert.alert('Empty message', 'Please paste a customer message.');
      return;
    }
    const payload = {
      rawText: pasteText.trim(),
      channel: 'paste' as const,
      customerName: customerName.trim() || undefined,
    };
    console.log('[Sprout] handlePasteSubmit: submitting, text length:', payload.rawText.length);
    setSubmitting(true);
    try {
      const result = await callIntakeMessage(payload);
      console.log('[Sprout] handlePasteSubmit: success, threadId:', result.threadId, 'parseError:', result.parseError);
      setPasteText('');
      setCustomerName('');
      setPasteModalVisible(false);
      await loadCustomers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Sprout] handlePasteSubmit: error', msg, err);
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  }

  const totalNeedsReply = needsReply.length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.wordmark}>🌱 Sprout</Text>
          <Text style={styles.headerSub}>Your inbox</Text>
        </View>
        <TouchableOpacity style={styles.pasteBtn} onPress={() => setPasteModalVisible(true)}>
          <Ionicons name="add" size={20} color={COLORS.cream} />
          <Text style={styles.pasteBtnText}>Paste message</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll}>
        {/* Flash card CTA */}
        {totalNeedsReply > 0 && (
          <TouchableOpacity
            style={styles.flashcardBanner}
            onPress={() => navigation.navigate('FlashcardStack')}
            activeOpacity={0.8}
          >
            <View>
              <Text style={styles.flashcardTitle}>{totalNeedsReply} message{totalNeedsReply > 1 ? 's' : ''} waiting</Text>
              <Text style={styles.flashcardSub}>Tap to review & respond</Text>
            </View>
            <View style={styles.flashcardArrow}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.cream} />
            </View>
          </TouchableOpacity>
        )}

        {/* Needs Reply */}
        {needsReply.length > 0 && (
          <View>
            <Text style={styles.sectionHeader}>Needs Reply</Text>
            {needsReply.map(thread => (
              <ThreadItem
                key={thread.id}
                thread={thread}
                customerName={getCustomerName(thread)}
                onPress={() => navigation.navigate('FlashcardStack')}
              />
            ))}
          </View>
        )}

        {/* Parked */}
        {parked.length > 0 && (
          <View>
            <Text style={styles.sectionHeader}>Parked</Text>
            {parked.map(thread => (
              <ThreadItem
                key={thread.id}
                thread={thread}
                customerName={getCustomerName(thread)}
                onPress={() => navigation.navigate('FlashcardStack')}
              />
            ))}
          </View>
        )}

        {/* Waiting on Customer */}
        {waitingOnCustomer.length > 0 && (
          <View>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => setWaitingExpanded(e => !e)}
            >
              <Text style={styles.sectionHeader}>
                Waiting on Customer ({waitingOnCustomer.length})
              </Text>
              <Ionicons
                name={waitingExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
            {waitingExpanded &&
              waitingOnCustomer.map(thread => (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  customerName={getCustomerName(thread)}
                  onPress={() => navigation.navigate('FlashcardStack')}
                />
              ))}
          </View>
        )}

        {/* Empty state */}
        {!loading && needsReply.length === 0 && parked.length === 0 && waitingOnCustomer.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎂</Text>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyText}>
              Paste a customer message to get started.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Paste Modal */}
      <Modal
        visible={pasteModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPasteModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modal}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Paste Customer Message</Text>
            <TouchableOpacity onPress={() => setPasteModalVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.fieldLabel}>Customer name (optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Sarah Johnson"
              placeholderTextColor={COLORS.textMuted}
              value={customerName}
              onChangeText={setCustomerName}
            />

            <Text style={styles.fieldLabel}>Message *</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextarea]}
              placeholder="Paste the customer's message here..."
              placeholderTextColor={COLORS.textMuted}
              value={pasteText}
              onChangeText={setPasteText}
              multiline
              autoFocus
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.submitPasteBtn, submitting && styles.submitPasteBtnDisabled]}
              onPress={handlePasteSubmit}
              disabled={submitting}
            >
              <Ionicons name="sparkles" size={18} color={COLORS.cream} />
              <Text style={styles.submitPasteText}>
                {submitting ? 'Processing…' : 'Process with AI'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <UndoToast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  wordmark: { fontSize: 20, fontWeight: '800', color: COLORS.deepGreen },
  headerSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
  },
  pasteBtnText: { color: COLORS.cream, fontWeight: '600', fontSize: 13 },
  scroll: { flex: 1 },
  flashcardBanner: {
    margin: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flashcardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.cream },
  flashcardSub: { fontSize: 13, color: COLORS.lightGreen, marginTop: 2 },
  flashcardArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  modalBody: { flex: 1, padding: 20 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
    marginBottom: 16,
  },
  modalTextarea: { minHeight: 160, textAlignVertical: 'top' },
  modalFooter: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  submitPasteBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitPasteBtnDisabled: { opacity: 0.5 },
  submitPasteText: { color: COLORS.cream, fontWeight: '700', fontSize: 16 },
});
