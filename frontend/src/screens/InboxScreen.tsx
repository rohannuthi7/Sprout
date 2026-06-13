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
import { Plus, ChevronDown, ChevronUp, ChevronRight, X, Sparkles } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { useThreads } from '../hooks/useThreads';
import ThreadItem from '../components/ThreadItem';
import UndoToast from '../components/UndoToast';
import SectionDivider from '../components/botanical/SectionDivider';
import GrowthStageIcon from '../components/botanical/GrowthStageIcon';
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
          <Text style={styles.wordmark}>Sprout</Text>
          <Text style={styles.headerSub}>Your inbox</Text>
        </View>
        <TouchableOpacity style={styles.pasteBtn} onPress={() => setPasteModalVisible(true)}>
          <Plus size={18} color={COLORS.forest} strokeWidth={2.5} />
          <Text style={styles.pasteBtnText}>Paste message</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} backgroundColor={COLORS.forest}>
        {/* Flashcard CTA banner */}
        {totalNeedsReply > 0 && (
          <TouchableOpacity
            style={styles.flashcardBanner}
            onPress={() => navigation.navigate('FlashcardStack')}
            activeOpacity={0.8}
          >
            <GrowthStageIcon stage="seed" size={32} color={COLORS.mustard} />
            <View style={styles.flashcardText}>
              <Text style={styles.flashcardTitle}>
                {totalNeedsReply} message{totalNeedsReply > 1 ? 's' : ''} waiting
              </Text>
              <Text style={styles.flashcardSub}>Tap to review and respond</Text>
            </View>
            <View style={styles.flashcardArrow}>
              <ChevronRight size={18} color={COLORS.forest} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
        )}

        {/* Needs Reply */}
        {needsReply.length > 0 && (
          <View>
            <SectionDivider label="Needs Reply" style={styles.sectionDivider} />
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
            <SectionDivider label="Parked" style={styles.sectionDivider} />
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
              <SectionDivider
                label={`Waiting on Customer (${waitingOnCustomer.length})`}
                style={styles.collapsibleDivider}
              />
              {waitingExpanded
                ? <ChevronUp size={14} color={COLORS.sage} strokeWidth={2} />
                : <ChevronDown size={14} color={COLORS.sage} strokeWidth={2} />}
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
            <GrowthStageIcon stage="bloom" size={72} color={COLORS.sage} />
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
              <X size={22} color={COLORS.parchment} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.fieldLabel}>Customer name (optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Sarah Johnson"
              placeholderTextColor={COLORS.sage}
              value={customerName}
              onChangeText={setCustomerName}
              keyboardAppearance="dark"
            />

            <Text style={styles.fieldLabel}>Message *</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextarea]}
              placeholder="Paste the customer's message here..."
              placeholderTextColor={COLORS.sage}
              value={pasteText}
              onChangeText={setPasteText}
              multiline
              autoFocus
              keyboardAppearance="dark"
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.submitPasteBtn, submitting && styles.submitPasteBtnDisabled]}
              onPress={handlePasteSubmit}
              disabled={submitting}
            >
              <Sparkles size={16} color={COLORS.forest} strokeWidth={2} />
              <Text style={styles.submitPasteText}>
                {submitting ? 'Processing...' : 'Process with AI'}
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
  container: { flex: 1, backgroundColor: COLORS.forest },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.forest,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.wood,
  },
  wordmark: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 24,
    color: COLORS.parchment,
  },
  headerSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: COLORS.sage,
    marginTop: 1,
  },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.mustard,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 50,
    minHeight: 44,
  },
  pasteBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    color: COLORS.forest,
    fontSize: 13,
  },
  scroll: { flex: 1, backgroundColor: COLORS.forest },
  sectionDivider: {
    marginTop: 8,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  collapsibleDivider: {
    flex: 1,
  },
  flashcardBanner: {
    margin: 16,
    backgroundColor: COLORS.canopy,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.wood,
  },
  flashcardText: {
    flex: 1,
  },
  flashcardTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: COLORS.parchment,
  },
  flashcardSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.sage,
    marginTop: 2,
  },
  flashcardArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.mustard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 12 },
  emptyTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 22,
    color: COLORS.parchment,
  },
  emptyText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: COLORS.sage,
    textAlign: 'center',
    lineHeight: 22,
  },
  modal: { flex: 1, backgroundColor: COLORS.canopy },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.wood,
    backgroundColor: COLORS.palm,
  },
  modalTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 18,
    color: COLORS.parchment,
  },
  modalBody: { flex: 1, padding: 20, backgroundColor: COLORS.canopy },
  fieldLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: COLORS.parchment,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: COLORS.wood,
    borderRadius: 10,
    padding: 12,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: COLORS.parchment,
    backgroundColor: COLORS.palm,
    marginBottom: 16,
  },
  modalTextarea: { minHeight: 160, textAlignVertical: 'top' },
  modalFooter: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.wood,
    backgroundColor: COLORS.palm,
  },
  submitPasteBtn: {
    backgroundColor: COLORS.mustard,
    borderRadius: 50,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitPasteBtnDisabled: { opacity: 0.5 },
  submitPasteText: {
    fontFamily: 'DMSans_700Bold',
    color: COLORS.forest,
    fontSize: 16,
  },
});
