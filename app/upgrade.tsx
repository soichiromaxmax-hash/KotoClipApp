import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { KotoBird } from '@/components/KotoBird';

export default function UpgradeScreen() {
  const router = useRouter();
  const { upgrade } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (loading || !email.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      await upgrade(email.trim(), password);
      router.back();
    } catch (e: any) {
      setError(e?.message ?? 'アカウント作成に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={['#0E1116', '#131923', '#18212E']}
      start={{ x: 0.18, y: 0.22 }}
      end={{ x: 0.85, y: 0.85 }}
      style={s.root}
    >
      <TouchableOpacity style={s.closeBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <Text style={s.closeBtnText}>✕</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.hero}>
            <KotoBird size={90} />
            <Text style={s.title}>データを保護する</Text>
            <Text style={s.subtitle}>メールアドレスを登録すると、機種変更時や再インストール後も今の単語・学習履歴をそのまま引き継げます。</Text>
          </View>

          <View style={s.card}>
            {!!error && (
              <View style={s.msg}>
                <Text style={s.msgText}>{error}</Text>
              </View>
            )}

            <TextInput
              style={s.input}
              placeholder="メールアドレス"
              placeholderTextColor="#4B5563"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={s.input}
              placeholder="パスワード（6文字以上）"
              placeholderTextColor="#4B5563"
              secureTextEntry
              autoComplete="new-password"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleSubmit}
            />

            <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#E9EDF2" />
                : <Text style={s.btnText}>アカウントを作成</Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    top: 54,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  closeBtnText: { color: '#6B7280', fontSize: 18, fontWeight: '500' },

  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },

  hero: { alignItems: 'center', marginBottom: 20, gap: 10 },
  title: { fontSize: 22, fontWeight: '700', color: '#F9FAFB', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#8F99A8', textAlign: 'center', lineHeight: 19, maxWidth: 300 },

  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(21,26,34,0.92)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    gap: 12,
  },

  msg: {
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(255,107,107,0.10)',
    borderColor: 'rgba(255,107,107,0.22)',
  },
  msgText: { fontSize: 13, lineHeight: 19, color: '#FF6B6B' },

  input: {
    backgroundColor: '#151A22',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: '#E9EDF2',
  },

  btn: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.34)',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 2,
  },
  btnText: { color: '#E9EDF2', fontWeight: '500', fontSize: 15, letterSpacing: -0.1 },
});
