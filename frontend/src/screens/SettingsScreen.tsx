import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
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
import { API_BASE_URL } from '../lib/aws';
import { useAuth } from '../hooks/useAuth';
import {
  callGetOwnerProfile,
  callUpdateOwnerProfile,
  callGetPricingConfig,
  callGetCalendarAuthUrl,
} from '../api/client';
import type { OwnerProfile, PricingConfig } from '../types';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [weeklyCapacity, setWeeklyCapacity] = useState('5');
  const [savingProfile, setSavingProfile] = useState(false);
  const [connectingCalendar, setConnectingCalendar] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [profileRes, pricingRes] = await Promise.all([
        callGetOwnerProfile(),
        callGetPricingConfig(),
      ]);
      setProfile(profileRes.profile);
      setBusinessName(profileRes.profile.businessName);
      setWeeklyCapacity(String(profileRes.profile.weeklyCapacity));
      setPricing(pricingRes.config);
    } catch {
      // Non-fatal
    }
  }

  async function saveProfile() {
    const payload = {
      businessName: businessName.trim(),
      weeklyCapacity: parseInt(weeklyCapacity, 10) || 5,
    };
    console.log('[Sprout] saveProfile: submitting', payload);
    setSavingProfile(true);
    try {
      const result = await callUpdateOwnerProfile(payload);
      console.log('[Sprout] saveProfile: success', result);
      Alert.alert('Saved', 'Profile updated.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Sprout] saveProfile: error', msg, err);
      Alert.alert('Error', `Failed to save profile.\n\n${msg}`);
    } finally {
      setSavingProfile(false);
    }
  }

  async function connectCalendar() {
    console.log('[Sprout] connectCalendar: requesting OAuth URL');
    setConnectingCalendar(true);
    try {
      const { url } = await callGetCalendarAuthUrl();
      console.log('[Sprout] connectCalendar: opening URL', url);
      await Linking.openURL(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Sprout] connectCalendar: error', msg, err);
      Alert.alert('Error', `Failed to start Google Calendar connection.\n\n${msg}`);
    } finally {
      setConnectingCalendar(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Settings</Text>

          {/* Business Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business</Text>
            <Text style={styles.label}>Business Name</Text>
            <TextInput
              style={styles.input}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Your bakery name"
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.label}>Weekly Order Capacity</Text>
            <TextInput
              style={styles.input}
              value={weeklyCapacity}
              onChangeText={setWeeklyCapacity}
              keyboardType="number-pad"
              placeholder="5"
              placeholderTextColor={COLORS.textMuted}
            />
            <TouchableOpacity
              style={[styles.btn, savingProfile && styles.btnDisabled]}
              onPress={saveProfile}
              disabled={savingProfile}
            >
              <Text style={styles.btnText}>{savingProfile ? 'Saving…' : 'Save Profile'}</Text>
            </TouchableOpacity>
          </View>

          {/* Google Calendar */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Google Calendar</Text>
            {profile?.calendarConnection ? (
              <View style={styles.connectedBadge}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                <Text style={styles.connectedText}>Calendar connected</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.btn, connectingCalendar && styles.btnDisabled]}
                onPress={connectCalendar}
                disabled={connectingCalendar}
              >
                <Ionicons name="calendar-outline" size={18} color={COLORS.cream} />
                <Text style={styles.btnText}>
                  {connectingCalendar ? 'Opening…' : 'Connect Google Calendar'}
                </Text>
              </TouchableOpacity>
            )}
            <Text style={styles.hint}>
              Confirmed orders are pushed to your Google Calendar automatically when you swipe to confirm.
            </Text>
          </View>

          {/* Pricing Config */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            {pricing ? (
              <View>
                <Text style={styles.pricingNote}>
                  Base prices, add-ons, and rush fees configured. Tap to edit.
                </Text>
                <TouchableOpacity
                  style={styles.outlineBtn}
                  onPress={() => navigation.navigate('PricingConfig')}
                >
                  <Text style={styles.outlineBtnText}>Edit Pricing Config</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => navigation.navigate('PricingConfig')}
              >
                <Text style={styles.outlineBtnText}>Set Up Pricing</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.hint}>
              Pricing config is used by AI to suggest quotes. Without it, quotes are not suggested.
            </Text>
          </View>

          {/* Web Intake Link */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Web Intake Link</Text>
            <Text style={styles.hint}>
              Share this link on your Instagram bio or website. Customers can submit free-text inquiries that appear in your inbox automatically.
            </Text>
            <View style={styles.linkBox}>
              <Text style={styles.linkText} selectable>
                {`${API_BASE_URL}/web-intake`}
              </Text>
            </View>
          </View>

          {/* Sign Out */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.dangerBtn} onPress={() => signOut()}>
              <Text style={styles.dangerBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.deepGreen, marginBottom: 24 },
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
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 13,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: COLORS.cream, fontWeight: '700', fontSize: 15 },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 8,
  },
  outlineBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  connectedText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  hint: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginTop: 8,
  },
  pricingNote: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  linkBox: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  linkText: {
    fontSize: 13,
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  dangerBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    borderRadius: 50,
    paddingVertical: 13,
    alignItems: 'center',
  },
  dangerBtnText: { color: COLORS.danger, fontWeight: '700', fontSize: 15 },
});
