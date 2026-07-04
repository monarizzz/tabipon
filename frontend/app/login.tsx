import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { colors, typography, spacing } from '@/src/theme/tokens';

export default function LoginScreen() {
  const { sendOtp, verifyOtp } = useAuth();
  const [email, setEmail] = React.useState('');
  const [token, setToken] = React.useState('');
  const [step, setStep] = React.useState<'email' | 'otp'>('email');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSendOtp = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await sendOtp(email.trim());
      setStep('otp');
    } catch (e) {
      console.error('sendOtp error:', e);
      setError('メールの送信に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!token.trim()) return;
    setLoading(true);
    setError('');
    try {
      await verifyOtp(email.trim(), token.trim());
    } catch {
      setError('コードが正しくありません。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.appName}>TABIPON</Text>
        <Text style={styles.subtitle}>旅先でスタンプを集めよう</Text>
      </View>

      <View style={styles.form}>
        {step === 'email' ? (
          <>
            <Text style={styles.label}>メールアドレス</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              placeholderTextColor={colors.textPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonLabel}>確認コードを送信</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.label}>{email} に送信されたコードを入力</Text>
            <TextInput
              style={styles.input}
              value={token}
              onChangeText={setToken}
              placeholder="00000000"
              placeholderTextColor={colors.textPlaceholder}
              keyboardType="number-pad"
              maxLength={8}
              autoFocus
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonLabel}>ログイン</Text>
              )}
            </Pressable>
            <Pressable onPress={() => { setStep('email'); setError(''); setToken(''); }}>
              <Text style={styles.back}>メールアドレスを変更する</Text>
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
  },
  header: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.m,
  },
  appName: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    color: colors.textMuted,
  },
  form: {
    flex: 1,
    gap: spacing.m,
  },
  label: {
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.l,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  error: {
    fontSize: typography.caption.fontSize,
    color: '#e05252',
  },
  back: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.s,
  },
});
