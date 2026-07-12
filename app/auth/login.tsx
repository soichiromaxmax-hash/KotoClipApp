import { useEffect, useState } from 'react';
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
import { api } from '@/lib/api';
import { KotoBird } from '@/components/KotoBird';

type Mode = 'login' | 'signup';

export default function LoginScreen() {
  const { loginOrMerge, signupOrUpgrade, continueAsGuest } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasAnonymousData, setHasAnonymousData] = useState(false);

  useEffect(() => {
    // 既に匿名セッションでデータを持っている状態でこの画面に来た場合
    // （設定画面からの「アカウントを作成/ログイン」導線など）、
    // ログイン/登録するとそのデータが引き継がれる旨を案内する。
    api.getMe().then((me) => setHasAnonymousData(!!me.is_anonymous)).catch(() => {});
  }, []);

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
  }

  async function handleSubmit() {
    if (loading || !email.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await loginOrMerge(email.trim(), password);
        router.replace('/(tabs)' as any);
      } else {
        const authenticated = await signupOrUpgrade(email.trim(), password);
        if (authenticated) {
          router.replace('/(tabs)' as any);
        } else {
          setError('確認メールを送信しました。メールのリンクをクリックして有効化してください。');
        }
      }
    } catch (e: any) {
      setError(e?.message ?? '操作に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    if (guestLoading) return;
    setGuestLoading(true);
    setError('');
    try {
      await continueAsGuest();
      router.replace('/(tabs)' as any);
    } catch (e: any) {
      setError(e?.message ?? 'ログインなしでの利用開始に失敗しました');
    } finally {
      setGuestLoading(false);
    }
  }

  const isError = error && !error.includes('確認メール');

  return (
    <LinearGradient
      colors={['#0E1116', '#131923', '#18212E']}
      start={{ x: 0.18, y: 0.22 }}
      end={{ x: 0.85, y: 0.85 }}
      style={s.root}
    >
      {/* ティールのグロー */}
      <View style={s.glow1} pointerEvents="none" />
      <View style={s.glow2} pointerEvents="none" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* マスコット + ロゴ */}
          <View style={s.hero}>
            <KotoBird size={110} />
            <View style={s.logoRow}>
              <Text style={s.logoKoto}>Koto</Text>
              <View style={s.clipBox}>
                <View style={s.clipTab} />
                <Text style={s.logoClip}>Clip</Text>
              </View>
            </View>
            <Text style={s.tagline}>Words, clipped into memory.</Text>
          </View>

          {/* カード */}
          <View style={s.card}>
            {/* タブ */}
            <View style={s.tabs}>
              <TouchableOpacity
                style={[s.tab, mode === 'login' && s.tabActive]}
                onPress={() => switchMode('login')}
              >
                <Text style={[s.tabText, mode === 'login' && s.tabTextActive]}>ログイン</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.tab, mode === 'signup' && s.tabActive]}
                onPress={() => switchMode('signup')}
              >
                <Text style={[s.tabText, mode === 'signup' && s.tabTextActive]}>新規登録</Text>
              </TouchableOpacity>
            </View>

            {/* サブタイトル */}
            <View style={s.cardHeader}>
              <Text style={s.cardTitle}>
                {mode === 'login' ? '学習を再開する' : '語彙学習を始める'}
              </Text>
              <Text style={s.cardSub}>
                {mode === 'login'
                  ? '保存した単語と復習の続きから始められます。'
                  : '見つけた言葉をためて、短い復習で定着させます。'}
              </Text>
            </View>

            {/* インラインエラー / インフォ */}
            {!!error && (
              <View style={[s.msg, isError ? s.msgError : s.msgInfo]}>
                <Text style={[s.msgText, isError ? s.msgTextError : s.msgTextInfo]}>
                  {error}
                </Text>
              </View>
            )}

            {!error && hasAnonymousData && (
              <View style={[s.msg, s.msgInfo]}>
                <Text style={[s.msgText, s.msgTextInfo]}>
                  今保存されている単語・学習履歴は、ログイン/登録すると自動的に引き継がれます。
                </Text>
              </View>
            )}

            {/* 入力 */}
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
              placeholder={mode === 'login' ? 'パスワード' : 'パスワード（6文字以上）'}
              placeholderTextColor="#4B5563"
              secureTextEntry
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleSubmit}
            />

            {/* ボタン */}
            <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#E9EDF2" />
                : <Text style={s.btnText}>
                    {mode === 'login' ? 'ログイン' : 'アカウントを作成'}
                  </Text>
              }
            </TouchableOpacity>
          </View>

          {/* ゲスト利用 */}
          <TouchableOpacity
            style={s.guestBtn}
            onPress={handleGuest}
            disabled={guestLoading}
            activeOpacity={0.7}
          >
            {guestLoading
              ? <ActivityIndicator color="#8F99A8" />
              : <Text style={s.guestBtnText}>ログインなしで使用してみる</Text>
            }
          </TouchableOpacity>
          <Text style={s.guestHint}>
            パソコンのブラウザ拡張機能など、他の端末と連携するにはアカウント作成が必要です
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  glow1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: '10%',
    left: '-10%',
    backgroundColor: 'rgba(45,212,191,0.06)',
  },
  glow2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: '8%',
    right: '-5%',
    backgroundColor: 'rgba(76,201,240,0.07)',
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    gap: 0,
  },

  // ヒーロー
  hero: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginTop: 4,
  },
  logoKoto: {
    color: '#F1F5F9',
    fontSize: 52,
    fontWeight: '700',
    letterSpacing: -2,
    lineHeight: 54,
    fontFamily: 'LobsterTwo_700Bold',
  },
  clipBox: {
    borderWidth: 1.5,
    borderColor: 'rgba(245,184,75,0.82)',
    borderRadius: 9,
    paddingTop: 2,
    paddingRight: 6,
    paddingBottom: 4,
    paddingLeft: 6,
    marginBottom: 2,
  },
  clipTab: {
    position: 'absolute',
    top: -7,
    left: 10,
    width: 18,
    height: 9,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(245,184,75,0.78)',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  logoClip: {
    color: '#7CF7DF',
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: -2.5,
    lineHeight: 46,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  tagline: {
    color: '#6B7280',
    fontSize: 12,
    letterSpacing: 0.2,
  },

  // カード
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

  // タブ
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1D2430',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#263041',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#2DD4BF',
  },

  // カードヘッダー
  cardHeader: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#E9EDF2',
    letterSpacing: -0.3,
  },
  cardSub: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },

  // メッセージ
  msg: {
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
  },
  msgError: {
    backgroundColor: 'rgba(255,107,107,0.10)',
    borderColor: 'rgba(255,107,107,0.22)',
  },
  msgInfo: {
    backgroundColor: 'rgba(45,212,191,0.08)',
    borderColor: 'rgba(45,212,191,0.20)',
  },
  msgText: {
    fontSize: 13,
    lineHeight: 19,
  },
  msgTextError: { color: '#FF6B6B' },
  msgTextInfo:  { color: '#2DD4BF' },

  // 入力
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

  // ボタン
  btn: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.34)',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 2,
  },
  btnText: {
    color: '#E9EDF2',
    fontWeight: '500',
    fontSize: 15,
    letterSpacing: -0.1,
  },

  // ゲスト利用
  guestBtn: {
    marginTop: 18,
    paddingVertical: 10,
    alignItems: 'center',
  },
  guestBtnText: {
    color: '#8F99A8',
    fontWeight: '600',
    fontSize: 14,
  },
  guestHint: {
    color: '#4B5563',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 300,
    alignSelf: 'center',
    marginTop: -6,
  },
});
