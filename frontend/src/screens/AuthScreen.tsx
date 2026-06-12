import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';

type Mode = 'signin' | 'signup' | 'confirm';

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, confirmSignUp } = useAuth();

  async function handleSubmit() {
    if (!email.trim() || (mode !== 'confirm' && !password.trim())) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }
    if (mode === 'signup' && password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters (Cognito requirement).');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
      } else if (mode === 'signup') {
        const { needsConfirmation } = await signUp(email.trim(), password);
        if (needsConfirmation) {
          setMode('confirm');
          Alert.alert('Check your email', 'We sent a verification code to ' + email.trim());
        }
      } else {
        await confirmSignUp(email.trim(), code.trim());
        // After confirming, sign them in automatically
        await signIn(email.trim(), password);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  const title = mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Verify email';
  const btnLabel = loading
    ? 'Please wait…'
    : mode === 'signin'
    ? 'Sign In'
    : mode === 'signup'
    ? 'Create Account'
    : 'Verify';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.top}>
        <Text style={styles.logo}>🌱</Text>
        <Text style={styles.wordmark}>Sprout</Text>
        <Text style={styles.tagline}>Your custom cake business, organized.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>{title}</Text>

        {mode !== 'confirm' && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </>
        )}

        {mode === 'confirm' && (
          <TextInput
            style={styles.input}
            placeholder="6-digit verification code"
            placeholderTextColor={COLORS.textMuted}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            autoFocus
          />
        )}

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.submitText}>{btnLabel}</Text>
        </TouchableOpacity>

        {mode !== 'confirm' && (
          <TouchableOpacity
            onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            style={styles.toggleBtn}
          >
            <Text style={styles.toggleText}>
              {mode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>
        )}

        {mode === 'confirm' && (
          <TouchableOpacity onPress={() => setMode('signup')} style={styles.toggleBtn}>
            <Text style={styles.toggleText}>Go back</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.deepGreen },
  top: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 64 },
  wordmark: { fontSize: 36, fontWeight: '800', color: COLORS.cream, letterSpacing: 2, marginTop: 8 },
  tagline: { fontSize: 15, color: COLORS.lightGreen, marginTop: 8 },
  form: {
    backgroundColor: COLORS.cream,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 48,
  },
  formTitle: { fontSize: 22, fontWeight: '800', color: COLORS.deepGreen, marginBottom: 20 },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: COLORS.cream, fontWeight: '700', fontSize: 16 },
  toggleBtn: { alignItems: 'center' },
  toggleText: { color: COLORS.primary, fontSize: 14 },
});
