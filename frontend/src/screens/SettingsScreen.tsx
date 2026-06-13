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
import { CheckCircle2, CalendarDays } from 'lucide-react-native';
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>

          {/* Business Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business</Text>
            <Text style={styles.label}>Business Name</Text>
            <TextInput
              style={styles.input}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Your bakery name"
              placeholderTextColor={COLORS.sage}
              keyboardAppearance="dark"
            />
            <Text style={styles.label}>Weekly Order Capacity</Text>
            <TextInput
              style={styles.input}
              value={weeklyCapacity}
              onChangeText={setWeeklyCapacity}
              keyboardType="number-pad"
              placeholder="5"
              placeholderTextColor={COLORS.sage}
              keyboardAppearance="dark"
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
                <CheckCircle2 size={18} color={COLORS.mustard} strokeWidth={2} />
                <Text style={styles.connectedText}>Calendar connected</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.btn, connectingCalendar && styles.btnDisabled]}
                onPress={connectCalendar}
                disabled={connectingCalendar}
              >
                <CalendarDays size={18} color={COLORS.forest} strokeWidth={2} />
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
  container: { flex: 1, backgroundColor: COLORS.forest },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.forest,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.wood,
  },
  headerTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 24,
    color: COLORS.parchment,
  },
  flex: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48 },
  section: {
    backgroundColor: COLORS.palm,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    color: COLORS.sage,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: COLORS.parchment,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.canopy,
    borderWidth: 1.5,
    borderColor: COLORS.wood,
    borderRadius: 10,
    padding: 12,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: COLORS.parchment,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: COLORS.mustard,
    borderRadius: 50,
    paddingVertical: 13,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    fontFamily: 'DMSans_700Bold',
    color: COLORS.forest,
    fontSize: 15,
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.wood,
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 8,
  },
  outlineBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    color: COLORS.parchment,
    fontSize: 15,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  connectedText: {
    fontFamily: 'DMSans_600SemiBold',
    color: COLORS.mustard,
    fontSize: 14,
  },
  hint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: COLORS.sage,
    lineHeight: 18,
    marginTop: 8,
  },
  pricingNote: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: COLORS.sage,
    marginBottom: 10,
  },
  linkBox: {
    backgroundColor: COLORS.canopy,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  linkText: {
    fontSize: 13,
    color: COLORS.mustard,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  dangerBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.terracotta,
    borderRadius: 50,
    paddingVertical: 13,
    alignItems: 'center',
  },
  dangerBtnText: {
    fontFamily: 'DMSans_700Bold',
    color: COLORS.terracotta,
    fontSize: 15,
  },
});
