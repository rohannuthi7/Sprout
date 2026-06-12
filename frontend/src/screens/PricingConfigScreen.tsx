import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { callGetPricingConfig, callSavePricingConfig } from '../api/client';

interface SizeEntry { size: string; price: string }
interface AddOnEntry { name: string; price: string }
interface RushFeeEntry { days: string; feePercent: string }

const DEFAULT_SIZES: SizeEntry[] = [
  { size: '6 inch', price: '' },
  { size: '8 inch', price: '' },
  { size: '10 inch', price: '' },
  { size: '12 inch', price: '' },
  { size: 'Half Sheet', price: '' },
  { size: 'Full Sheet', price: '' },
];

export default function PricingConfigScreen() {
  const navigation = useNavigation();
  const [sizes, setSizes] = useState<SizeEntry[]>(DEFAULT_SIZES);
  const [addOns, setAddOns] = useState<AddOnEntry[]>([{ name: '', price: '' }]);
  const [rushFees, setRushFees] = useState<RushFeeEntry[]>([{ days: '7', feePercent: '20' }]);
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [depositPercent, setDepositPercent] = useState('50');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExisting();
  }, []);

  async function loadExisting() {
    console.log('[Sprout] PricingConfig: loading existing config');
    try {
      const { config } = await callGetPricingConfig();
      if (config) {
        console.log('[Sprout] PricingConfig: found existing config', config.id);
        const loadedSizes = Object.entries(config.basePricesBySize).map(([size, price]) => ({
          size,
          price: String(price),
        }));
        setSizes(loadedSizes.length > 0 ? loadedSizes : DEFAULT_SIZES);
        setAddOns(
          config.addOns.length > 0
            ? config.addOns.map(a => ({ name: a.name, price: String(a.price) }))
            : [{ name: '', price: '' }]
        );
        setRushFees(
          config.rushFeeRules.length > 0
            ? config.rushFeeRules.map(r => ({ days: String(r.daysThreshold), feePercent: String(r.feePercent) }))
            : [{ days: '7', feePercent: '20' }]
        );
        setDeliveryFee(String(config.deliveryFee));
        setDepositPercent(String(config.depositPercent));
      } else {
        console.log('[Sprout] PricingConfig: no existing config, using defaults');
      }
    } catch (err) {
      console.error('[Sprout] PricingConfig: load error', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    // Validate sizes
    const validSizes = sizes.filter(s => s.size.trim() && s.price.trim());
    if (validSizes.length === 0) {
      Alert.alert('Validation', 'Add at least one cake size with a price.');
      return;
    }
    const basePricesBySize: Record<string, number> = {};
    for (const { size, price } of validSizes) {
      const p = parseFloat(price);
      if (isNaN(p) || p < 0) {
        Alert.alert('Validation', `Invalid price for "${size}". Enter a number ≥ 0.`);
        return;
      }
      basePricesBySize[size.trim()] = p;
    }

    // Validate add-ons
    const validAddOns = addOns.filter(a => a.name.trim() && a.price.trim());
    for (const { name, price } of validAddOns) {
      const p = parseFloat(price);
      if (isNaN(p) || p < 0) {
        Alert.alert('Validation', `Invalid price for add-on "${name}".`);
        return;
      }
    }

    // Validate rush fees
    const validRush = rushFees.filter(r => r.days.trim() && r.feePercent.trim());
    for (const { days, feePercent } of validRush) {
      const d = parseInt(days, 10);
      const f = parseFloat(feePercent);
      if (isNaN(d) || d < 1 || isNaN(f) || f < 0 || f > 100) {
        Alert.alert('Validation', 'Rush fee: days must be ≥ 1 and fee % must be 0–100.');
        return;
      }
    }

    const dFee = parseFloat(deliveryFee);
    const dPct = parseFloat(depositPercent);
    if (isNaN(dFee) || dFee < 0) { Alert.alert('Validation', 'Delivery fee must be ≥ 0.'); return; }
    if (isNaN(dPct) || dPct < 0 || dPct > 100) { Alert.alert('Validation', 'Deposit % must be 0–100.'); return; }

    const payload = {
      basePricesBySize,
      addOns: validAddOns.map(a => ({ name: a.name.trim(), price: parseFloat(a.price) })),
      rushFeeRules: validRush.map(r => ({ daysThreshold: parseInt(r.days, 10), feePercent: parseFloat(r.feePercent) })),
      deliveryFee: dFee,
      depositPercent: dPct,
    };

    console.log('[Sprout] PricingConfig: saving', JSON.stringify(payload));
    setSaving(true);
    try {
      const result = await callSavePricingConfig(payload);
      console.log('[Sprout] PricingConfig: saved, configId=', result.configId);
      Alert.alert('Saved', 'Pricing config updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Sprout] PricingConfig: save error', msg);
      Alert.alert('Error', `Failed to save.\n\n${msg}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <View style={styles.loadingBox}>
          <Text style={styles.hint}>Loading pricing config…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>

          {/* ── Cake Sizes ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Base Prices by Cake Size</Text>
            <Text style={styles.hint}>Set your base price for each size. Leave blank to omit.</Text>
            {sizes.map((entry, i) => (
              <View key={i} style={styles.row}>
                <TextInput
                  style={[styles.input, styles.flex]}
                  value={entry.size}
                  onChangeText={v => setSizes(prev => prev.map((s, j) => j === i ? { ...s, size: v } : s))}
                  placeholder="Size label"
                  placeholderTextColor={COLORS.textMuted}
                />
                <Text style={styles.rowSep}>$</Text>
                <TextInput
                  style={[styles.input, styles.priceInput]}
                  value={entry.price}
                  onChangeText={v => setSizes(prev => prev.map((s, j) => j === i ? { ...s, price: v } : s))}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                />
                <TouchableOpacity
                  onPress={() => setSizes(prev => prev.filter((_, j) => j !== i))}
                  style={styles.removeBtn}
                >
                  <Ionicons name="remove-circle" size={22} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addRowBtn}
              onPress={() => setSizes(prev => [...prev, { size: '', price: '' }])}
            >
              <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
              <Text style={styles.addRowText}>Add size</Text>
            </TouchableOpacity>
          </View>

          {/* ── Add-ons ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add-ons</Text>
            <Text style={styles.hint}>Extra items the baker can include in quotes.</Text>
            {addOns.map((entry, i) => (
              <View key={i} style={styles.row}>
                <TextInput
                  style={[styles.input, styles.flex]}
                  value={entry.name}
                  onChangeText={v => setAddOns(prev => prev.map((a, j) => j === i ? { ...a, name: v } : a))}
                  placeholder="Add-on name"
                  placeholderTextColor={COLORS.textMuted}
                />
                <Text style={styles.rowSep}>$</Text>
                <TextInput
                  style={[styles.input, styles.priceInput]}
                  value={entry.price}
                  onChangeText={v => setAddOns(prev => prev.map((a, j) => j === i ? { ...a, price: v } : a))}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                />
                <TouchableOpacity
                  onPress={() => setAddOns(prev => prev.filter((_, j) => j !== i))}
                  style={styles.removeBtn}
                >
                  <Ionicons name="remove-circle" size={22} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addRowBtn}
              onPress={() => setAddOns(prev => [...prev, { name: '', price: '' }])}
            >
              <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
              <Text style={styles.addRowText}>Add add-on</Text>
            </TouchableOpacity>
          </View>

          {/* ── Rush Fees ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rush Fee Rules</Text>
            <Text style={styles.hint}>If an order is due within N days, add X% to the price.</Text>
            {rushFees.map((entry, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.rowLabel}>Within</Text>
                <TextInput
                  style={[styles.input, styles.smallInput]}
                  value={entry.days}
                  onChangeText={v => setRushFees(prev => prev.map((r, j) => j === i ? { ...r, days: v } : r))}
                  keyboardType="number-pad"
                  placeholder="7"
                  placeholderTextColor={COLORS.textMuted}
                />
                <Text style={styles.rowLabel}>days →</Text>
                <TextInput
                  style={[styles.input, styles.smallInput]}
                  value={entry.feePercent}
                  onChangeText={v => setRushFees(prev => prev.map((r, j) => j === i ? { ...r, feePercent: v } : r))}
                  keyboardType="decimal-pad"
                  placeholder="20"
                  placeholderTextColor={COLORS.textMuted}
                />
                <Text style={styles.rowLabel}>%</Text>
                <TouchableOpacity
                  onPress={() => setRushFees(prev => prev.filter((_, j) => j !== i))}
                  style={styles.removeBtn}
                >
                  <Ionicons name="remove-circle" size={22} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addRowBtn}
              onPress={() => setRushFees(prev => [...prev, { days: '', feePercent: '' }])}
            >
              <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
              <Text style={styles.addRowText}>Add rule</Text>
            </TouchableOpacity>
          </View>

          {/* ── Delivery & Deposit ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery & Deposit</Text>
            <Text style={styles.label}>Flat Delivery Fee ($)</Text>
            <TextInput
              style={styles.input}
              value={deliveryFee}
              onChangeText={setDeliveryFee}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.label}>Deposit Required (%)</Text>
            <TextInput
              style={styles.input}
              value={depositPercent}
              onChangeText={setDepositPercent}
              keyboardType="decimal-pad"
              placeholder="50"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Pricing Config'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 48 },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  hint: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  priceInput: { width: 80, textAlign: 'right' },
  smallInput: { width: 60, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  rowSep: { fontSize: 15, color: COLORS.textMuted, paddingBottom: 8 },
  rowLabel: { fontSize: 13, color: COLORS.textMuted },
  removeBtn: { paddingBottom: 8 },
  addRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  addRowText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: COLORS.cream, fontWeight: '700', fontSize: 16 },
});
