import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Circle, Ellipse, Line } from 'react-native-svg';
import { Eye, EyeOff } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';

type Mode = 'signin' | 'signup' | 'confirm' | 'forgot' | 'reset';

// Full-width botanical garden illustration — five plants, center in full bloom.
function GardenHero() {
  const m = COLORS.mustard;
  const p = COLORS.parchment;
  const w = COLORS.wood;
  return (
    <Svg width="100%" height={170} viewBox="0 0 320 170" preserveAspectRatio="xMidYMid meet">
      {/* Soil horizon */}
      <Line x1="0" y1="138" x2="320" y2="138" stroke={w} strokeWidth="3" strokeLinecap="round" opacity={0.65} />

      {/* Root tendrils from center bloom */}
      <Path d="M160 138 Q153 147 144 155" stroke={m} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity={0.3} />
      <Path d="M160 138 Q167 149 176 156" stroke={m} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity={0.22} />
      <Path d="M160 138 Q159 150 158 162" stroke={m} strokeWidth="1" strokeLinecap="round" fill="none" opacity={0.18} />

      {/* FAR LEFT: small seed-sprout */}
      <Path d="M34 138 L34 126" stroke={m} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity={0.48} />
      <Path d="M34 130 Q28 126 26 118 Q32 120 34 127" fill={m} opacity={0.42} />
      <Path d="M34 128 Q40 124 42 116 Q36 119 34 126" fill={m} opacity={0.42} />

      {/* LEFT: bud plant */}
      <Path d="M90 138 L90 100" stroke={m} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity={0.78} />
      <Path d="M90 118 Q77 112 74 98 Q85 103 90 114" fill={m} opacity={0.58} />
      <Path d="M90 114 Q103 108 106 94 Q95 100 90 110" fill={m} opacity={0.58} />
      <Ellipse cx="90" cy="98" rx="5" ry="7.5" fill={m} opacity={0.88} />
      <Path d="M87 98 Q90 91 93 98" stroke={COLORS.forest} strokeWidth="1" fill="none" opacity={0.35} />

      {/* CENTER: full bloom (focal hero) */}
      <Path d="M160 138 L160 74" stroke={m} strokeWidth="3.2" strokeLinecap="round" fill="none" />
      {/* Lower leaves */}
      <Path d="M160 120 Q143 113 139 97 Q153 104 160 116" fill={m} opacity={0.7} />
      <Path d="M160 116 Q177 109 181 93 Q167 101 160 112" fill={m} opacity={0.7} />
      {/* Upper leaves */}
      <Path d="M160 101 Q146 95 143 82 Q154 87 160 97" fill={m} opacity={0.56} />
      <Path d="M160 98 Q174 92 177 79 Q166 85 160 94" fill={m} opacity={0.56} />
      {/* 5 petals around center (160, 65) */}
      <Ellipse cx="160" cy="54" rx="7" ry="12" fill={m} opacity={0.97} />
      <Ellipse cx="160" cy="54" rx="7" ry="12" fill={m} opacity={0.97} rotation="72" originX="160" originY="65" />
      <Ellipse cx="160" cy="54" rx="7" ry="12" fill={m} opacity={0.97} rotation="144" originX="160" originY="65" />
      <Ellipse cx="160" cy="54" rx="7" ry="12" fill={m} opacity={0.97} rotation="216" originX="160" originY="65" />
      <Ellipse cx="160" cy="54" rx="7" ry="12" fill={m} opacity={0.97} rotation="288" originX="160" originY="65" />
      {/* Bloom center */}
      <Circle cx="160" cy="65" r="9" fill={p} />
      <Circle cx="160" cy="65" r="5" fill={m} />
      {/* Pollen drift */}
      <Circle cx="134" cy="50" r="2.2" fill={p} opacity={0.58} />
      <Circle cx="140" cy="40" r="1.4" fill={p} opacity={0.43} />
      <Circle cx="187" cy="48" r="2.2" fill={p} opacity={0.58} />
      <Circle cx="181" cy="39" r="1.4" fill={p} opacity={0.43} />
      <Circle cx="152" cy="36" r="1.3" fill={p} opacity={0.38} />
      <Circle cx="169" cy="35" r="1.2" fill={p} opacity={0.33} />
      <Circle cx="160" cy="30" r="1" fill={p} opacity={0.28} />

      {/* RIGHT: bud plant (mirror) */}
      <Path d="M230 138 L230 100" stroke={m} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity={0.78} />
      <Path d="M230 118 Q217 112 214 98 Q225 103 230 114" fill={m} opacity={0.58} />
      <Path d="M230 114 Q243 108 246 94 Q235 100 230 110" fill={m} opacity={0.58} />
      <Ellipse cx="230" cy="98" rx="5" ry="7.5" fill={m} opacity={0.88} />
      <Path d="M227 98 Q230 91 233 98" stroke={COLORS.forest} strokeWidth="1" fill="none" opacity={0.35} />

      {/* FAR RIGHT: small seed-sprout */}
      <Path d="M286 138 L286 126" stroke={m} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity={0.48} />
      <Path d="M286 130 Q280 126 278 118 Q284 120 286 127" fill={m} opacity={0.42} />
      <Path d="M286 128 Q292 124 294 116 Q288 119 286 126" fill={m} opacity={0.42} />

      {/* Vine connecting bud plants to center (subtle) */}
      <Path d="M90 98 Q125 83 153 74" stroke={m} strokeWidth="1" strokeLinecap="round" fill="none" opacity={0.2} strokeDasharray="5 4" />
      <Path d="M167 74 Q195 83 230 98" stroke={m} strokeWidth="1" strokeLinecap="round" fill="none" opacity={0.2} strokeDasharray="5 4" />
    </Svg>
  );
}

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formInfo, setFormInfo] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const { signIn, signUp, confirmSignUp, resendCode, forgotPassword, confirmForgotPassword } = useAuth();

  // Switch mode, clear messages, and reset password visibility.
  function goTo(nextMode: Mode, info?: string) {
    setMode(nextMode);
    setFormError(null);
    setFormInfo(info ?? null);
    setShowPw(false);
    setShowNewPw(false);
  }

  async function handleSubmit() {
    // Normalize email: trim whitespace and lowercase to avoid Cognito case-sensitivity edge cases.
    const trimmedEmail = email.trim().toLowerCase();
    setFormError(null);
    setFormInfo(null);

    if ((mode === 'signin' || mode === 'signup' || mode === 'forgot') && !trimmedEmail) {
      setFormError('Please enter your email address.');
      return;
    }
    if ((mode === 'signin' || mode === 'signup') && !password.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }
    if (mode === 'signup' && password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    if (mode === 'confirm' && !code.trim()) {
      setFormError('Please enter the verification code from your email.');
      return;
    }
    if (mode === 'reset') {
      if (!code.trim() || !newPassword) {
        setFormError('Please fill in all required fields.');
        return;
      }
      if (newPassword.length < 8) {
        setFormError('Password must be at least 8 characters.');
        return;
      }
    }

    setLoading(true);
    try {
      switch (mode) {
        case 'signin': {
          try {
            await signIn(trimmedEmail, password);
          } catch (err: unknown) {
            if (err instanceof Error && err.name === 'UserNotConfirmedException') {
              try { await resendCode(trimmedEmail); } catch { /* prior code may still be valid */ }
              goTo('confirm', `Your account isn't verified yet. We sent a new code to ${trimmedEmail}.`);
              return;
            }
            throw err;
          }
          break;
        }

        case 'signup': {
          try {
            const { needsConfirmation } = await signUp(trimmedEmail, password);
            if (needsConfirmation) {
              goTo('confirm', `We sent a verification code to ${trimmedEmail}.`);
            }
          } catch (err: unknown) {
            if (err instanceof Error && err.name === 'UsernameExistsException') {
              try {
                await resendCode(trimmedEmail);
                goTo('confirm', `An account with this email exists. If it still needs verification, enter the code we just sent to ${trimmedEmail}.`);
              } catch {
                goTo('signin', 'An account with this email already exists. Sign in with your password, or tap "Forgot password?" to reset it.');
              }
              return;
            }
            throw err;
          }
          break;
        }

        case 'confirm': {
          let wasAlreadyConfirmed = false;
          try {
            await confirmSignUp(trimmedEmail, code.trim());
          } catch (err: unknown) {
            const alreadyConfirmed =
              err instanceof Error &&
              (err.name === 'NotAuthorizedException' || err.name === 'InvalidParameterException') &&
              (err.message.includes('CONFIRMED') || err.message.includes('already confirmed'));
            if (!alreadyConfirmed) throw err;
            wasAlreadyConfirmed = true;
          }

          if (wasAlreadyConfirmed) {
            // Account was already confirmed. The password field holds the signup
            // attempt password, not the actual account password — don't try signIn.
            setCode('');
            setPassword('');
            goTo('signin', 'Your account is already verified. Sign in with your password, or tap "Forgot password?" if you need to reset it.');
            return;
          }

          // Genuine fresh confirmation — password state holds the just-registered password.
          await signIn(trimmedEmail, password);
          break;
        }

        case 'forgot': {
          await forgotPassword(trimmedEmail);
          setCode('');
          goTo('reset', `We sent a password reset code to ${trimmedEmail}.`);
          break;
        }

        case 'reset': {
          await confirmForgotPassword(trimmedEmail, code.trim(), newPassword);
          try {
            await signIn(trimmedEmail, newPassword);
          } catch {
            // Auto sign-in failed; copy new password to signin field so it's ready.
            setPassword(newPassword);
            setNewPassword('');
            setCode('');
            goTo('signin', 'Password updated. Sign in with your new password.');
          }
          break;
        }
      }
    } catch (err: unknown) {
      setFormError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  const title =
    mode === 'signin'  ? 'Welcome back'   :
    mode === 'signup'  ? 'Create account' :
    mode === 'confirm' ? 'Verify email'   :
    mode === 'forgot'  ? 'Reset password' :
                         'New password';

  const btnLabel = loading            ? 'Please wait…'   :
    mode === 'signin'                 ? 'Sign In'         :
    mode === 'signup'                 ? 'Create Account'  :
    mode === 'confirm'                ? 'Verify'          :
    mode === 'forgot'                 ? 'Send Reset Code' :
                                        'Set New Password';

  const showEmail       = mode !== 'confirm' && mode !== 'reset';
  const showPassword    = mode === 'signin'  || mode === 'signup';
  const showCode        = mode === 'confirm' || mode === 'reset';
  const showNewPassword = mode === 'reset';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Botanical hero */}
      <View style={styles.hero}>
        <GardenHero />
        <Text style={styles.wordmark}>Sprout</Text>
        <Text style={styles.tagline}>Your custom cake business, organized.</Text>
      </View>

      {/* Form card */}
      <View style={styles.form}>
        <Text style={styles.formTitle}>{title}</Text>

        {formInfo !== null && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{formInfo}</Text>
          </View>
        )}

        {formError !== null && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        )}

        {showEmail && (
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={COLORS.sage}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            keyboardAppearance="dark"
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}

        {showPassword && (
          <View style={styles.inputWrap}>
            <TextInput
              style={[styles.input, styles.inputWithIcon]}
              placeholder="Password"
              placeholderTextColor={COLORS.sage}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              keyboardAppearance="dark"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(v => !v)}>
              {showPw
                ? <EyeOff size={18} color={COLORS.sage} strokeWidth={1.8} />
                : <Eye    size={18} color={COLORS.sage} strokeWidth={1.8} />}
            </TouchableOpacity>
          </View>
        )}

        {showCode && (
          <TextInput
            style={styles.input}
            placeholder="6-digit code"
            placeholderTextColor={COLORS.sage}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            keyboardAppearance="dark"
            autoFocus
          />
        )}

        {showNewPassword && (
          <View style={styles.inputWrap}>
            <TextInput
              style={[styles.input, styles.inputWithIcon]}
              placeholder="New password (8+ characters)"
              placeholderTextColor={COLORS.sage}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPw}
              keyboardAppearance="dark"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNewPw(v => !v)}>
              {showNewPw
                ? <EyeOff size={18} color={COLORS.sage} strokeWidth={1.8} />
                : <Eye    size={18} color={COLORS.sage} strokeWidth={1.8} />}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.submitText}>{btnLabel}</Text>
        </TouchableOpacity>

        {mode === 'signin' && (
          <>
            <TouchableOpacity onPress={() => goTo('signup')} style={styles.toggleBtn}>
              <Text style={styles.toggleText}>Don't have an account? Sign up</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => goTo('forgot')} style={[styles.toggleBtn, styles.forgotBtn]}>
              <Text style={[styles.toggleText, styles.forgotText]}>Forgot password?</Text>
            </TouchableOpacity>
          </>
        )}

        {mode === 'signup' && (
          <TouchableOpacity onPress={() => goTo('signin')} style={styles.toggleBtn}>
            <Text style={styles.toggleText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        )}

        {(mode === 'confirm' || mode === 'forgot' || mode === 'reset') && (
          <TouchableOpacity onPress={() => goTo('signin')} style={styles.toggleBtn}>
            <Text style={styles.toggleText}>Back to sign in</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function friendlyAuthError(err: unknown): string {
  if (!(err instanceof Error)) return 'Something went wrong. Please try again.';

  switch (err.name) {
    case 'NotAuthorizedException':
      if (err.message.includes('CONFIRMED') || err.message.includes('already confirmed'))
        return 'Your account is already verified. Please sign in.';
      return 'Incorrect email or password. Tap "Forgot password?" if you need to reset it.';

    case 'UserNotFoundException':
      return 'No account found with this email address.';

    case 'UserNotConfirmedException':
      return 'Please verify your email before signing in.';

    case 'UsernameExistsException':
      return 'An account with this email already exists.';

    case 'CodeMismatchException':
      return 'Incorrect verification code — please check your email and try again.';

    case 'ExpiredCodeException':
      return 'This code has expired. Go back and request a new one.';

    case 'LimitExceededException':
    case 'TooManyRequestsException':
      return 'Too many attempts. Please wait a few minutes and try again.';

    case 'InvalidPasswordException':
      return err.message.replace(/^Password did not conform with policy:\s*/i, '');

    case 'InvalidParameterException':
      if (err.message.includes('already confirmed'))
        return 'Your account is already verified. Please sign in.';
      return 'Please check your input and try again.';

    case 'AuthNextStepRequired':
      if (err.message === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED')
        return 'Your temporary password has expired. Use "Forgot password?" to set a new one.';
      return 'Additional sign-in step required. Please contact support.';

    case 'UserAlreadyAuthenticatedException':
      return 'Session conflict — please try again.';

    default:
      // Surface the error code so unexpected Cognito errors are diagnosable.
      return `Sign-in error (${err.name}): ${err.message}`;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.forest,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────────
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 18,
  },
  wordmark: {
    fontFamily: 'Fraunces_800ExtraBold',
    fontSize: 54,
    color: COLORS.parchment,
    letterSpacing: 2,
    marginTop: 6,
  },
  tagline: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: COLORS.sage,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 5,
  },

  // ── Form card ────────────────────────────────────────────────────────────────
  form: {
    backgroundColor: COLORS.canopy,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 48,
    borderTopWidth: 4,
    borderTopColor: COLORS.wood,
  },
  formTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 26,
    color: COLORS.parchment,
    marginBottom: 16,
  },

  // ── Inline feedback ───────────────────────────────────────────────────────────
  infoBox: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.mustard,
    backgroundColor: 'rgba(92,65,38,0.25)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  infoText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: COLORS.parchment,
    lineHeight: 19,
  },
  errorBox: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.terracotta,
    backgroundColor: 'rgba(224,120,86,0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: COLORS.terracotta,
    lineHeight: 19,
  },

  // ── Inputs ───────────────────────────────────────────────────────────────────
  inputWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.wood,
    borderRadius: 10,
    padding: 14,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: COLORS.parchment,
    backgroundColor: COLORS.palm,
    marginBottom: 12,
  },
  inputWithIcon: {
    marginBottom: 0,
    paddingRight: 48,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },

  // ── Submit button ────────────────────────────────────────────────────────────
  submitBtn: {
    backgroundColor: COLORS.mustard,
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: {
    fontFamily: 'DMSans_700Bold',
    color: COLORS.forest,
    fontSize: 17,
    letterSpacing: 0.3,
  },

  // ── Toggle links ─────────────────────────────────────────────────────────────
  toggleBtn: { alignItems: 'center', paddingVertical: 4 },
  toggleText: {
    fontFamily: 'DMSans_500Medium',
    color: COLORS.mustard,
    fontSize: 14,
  },
  forgotBtn: { marginTop: 10 },
  forgotText: { color: COLORS.sage },
});
