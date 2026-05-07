import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';

export default function AddWordScreen() {
  const router = useRouter();
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [context, setContext] = useState('');
  const [status, setStatus] = useState<{ type: string; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiPanel, setAiPanel] = useState<{ example_native: string; notes: string } | null>(null);

  async function autoTranslate() {
    if (!word.trim()) return;
    setLoading(true);
    setStatus({ type: 'info', msg: 'AI解説を取得中...' });
    setAiPanel(null);
    try {
      const res = await api.lookup(word.trim());
      if (res.meaning) {
        setMeaning(res.meaning);
        if (res.ai_example) setContext(res.ai_example);
        const hasAi = !!(res.ai_example || res.ai_example_native || res.ai_notes);
        if (hasAi) {
          setAiPanel({ example_native: res.ai_example_native || '', notes: res.ai_notes || '' });
          setStatus({ type: 'success', msg: 'AI解説を取得しました。確認して保存してください。' });
        } else {
          setStatus({ type: 'warning', msg: 'AI解説を取得できませんでした（通常翻訳を使用）。手動で確認してください。' });
        }
      } else {
        setStatus({ type: 'error', msg: '翻訳結果が取得できませんでした' });
      }
    } catch {
      setStatus({ type: 'error', msg: '翻訳に失敗しました' });
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!word.trim() || !meaning.trim()) {
      setStatus({ type: 'error', msg: '単語と日本語訳を入力してください' });
      return;
    }
    setLoading(true);
    const payload = {
      word: word.trim(),
      meaning: meaning.trim(),
      context,
      source_type: 'manual',
      ai_explanation: aiPanel
        ? [aiPanel.example_native, aiPanel.notes].filter(Boolean).join('\n')
        : '',
    };
    try {
      const res = await api.addWord(payload);
      if (res.status === 'ok') {
        setStatus({ type: 'success', msg: `「${res.word}」を追加しました！ (${res.meaning})` });
        setWord(''); setMeaning(''); setContext(''); setAiPanel(null);
      } else if (res.status === 'duplicate') {
        setStatus({ type: 'warning', msg: `「${res.word}」はすでに登録済みです` });
      } else {
        setStatus({ type: 'error', msg: res.detail || '保存に失敗しました' });
      }
    } catch {
      setStatus({ type: 'error', msg: '保存に失敗しました。時間をおいてもう一度お試しください。' });
    } finally {
      setLoading(false);
    }
  }

  const statusStyle: Record<string, { bg: string; border: string; text: string }> = {
    success: { bg: 'rgba(34,197,94,0.08)',    border: 'rgba(34,197,94,0.28)',    text: '#22C55E' },
    error:   { bg: 'rgba(239,68,68,0.08)',    border: 'rgba(239,68,68,0.28)',    text: '#EF4444' },
    warning: { bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.28)',   text: '#F59E0B' },
    info:    { bg: 'rgba(45,212,191,0.08)',   border: 'rgba(45,212,191,0.28)',   text: '#2DD4BF' },
  };

  const st = status ? (statusStyle[status.type] ?? statusStyle.info) : null;

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ヘッダー */}
          <View style={s.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={s.backBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={s.backBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={s.title}>手動で単語を追加する</Text>
          </View>

          {/* フォームカード */}
          <View style={s.card}>

            {/* 英単語 */}
            <View style={s.formGroup}>
              <Text style={s.label}>英単語・フレーズ</Text>
              <TextInput
                style={s.input}
                placeholder="例: perseverance"
                placeholderTextColor="#4B5563"
                value={word}
                onChangeText={setWord}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={autoTranslate}
                returnKeyType="search"
              />
            </View>

            {/* AI取得ボタン */}
            <TouchableOpacity
              style={[s.ghostBtn, (!word.trim() || loading) && { opacity: 0.38 }]}
              onPress={autoTranslate}
              disabled={loading || !word.trim()}
              activeOpacity={0.7}
            >
              {loading
                ? <ActivityIndicator color="#2DD4BF" size="small" />
                : <Text style={s.ghostBtnText}>AI解説を取得</Text>
              }
            </TouchableOpacity>

            {/* 日本語訳 */}
            <View style={s.formGroup}>
              <Text style={s.label}>日本語訳</Text>
              <TextInput
                style={s.input}
                placeholder="自動取得または手動で入力"
                placeholderTextColor="#4B5563"
                value={meaning}
                onChangeText={setMeaning}
              />
            </View>

            {/* 例文・メモ */}
            <View style={s.formGroup}>
              <Text style={s.label}>例文・メモ（任意）</Text>
              <TextInput
                style={[s.input, s.textarea]}
                placeholder="例文や覚え方のメモ"
                placeholderTextColor="#4B5563"
                value={context}
                onChangeText={setContext}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* AIパネル */}
            {aiPanel && (aiPanel.example_native || aiPanel.notes) && (
              <View style={s.aiPanel}>
                {!!aiPanel.example_native && (
                  <Text style={[s.aiPanelText, aiPanel.notes ? { marginBottom: 6 } : {}]}>
                    {aiPanel.example_native}
                  </Text>
                )}
                {!!aiPanel.notes && (
                  <Text style={s.aiPanelMuted}>{aiPanel.notes}</Text>
                )}
              </View>
            )}

            {/* ステータス */}
            {status && st && (
              <View style={[s.statusBox, { backgroundColor: st.bg, borderColor: st.border }]}>
                <Text style={[s.statusText, { color: st.text }]}>{status.msg}</Text>
              </View>
            )}

            {/* 保存ボタン */}
            <TouchableOpacity
              style={[s.primaryBtn, loading && { opacity: 0.6 }]}
              onPress={save}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={s.primaryBtnText}>{loading ? '処理中...' : '保存する'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── スタイル ───────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E1116' },
  scroll: { paddingBottom: 40 },

  // ヘッダー
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: { padding: 4 },
  backBtnText: { color: '#6B7280', fontSize: 18, fontWeight: '500' },
  title: {
    fontSize: 20,
    fontWeight: '500',
    color: '#F9FAFB',
    letterSpacing: -0.3,
  },

  // カード
  card: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(21,26,34,0.98)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    gap: 12,
  },

  // フォーム
  formGroup: { gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
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
  textarea: {
    minHeight: 90,
    paddingTop: 12,
  },

  // AIパネル
  aiPanel: {
    backgroundColor: 'rgba(45,212,191,0.07)',
    borderLeftWidth: 3,
    borderLeftColor: '#2DD4BF',
    borderRadius: 10,
    padding: 12,
  },
  aiPanelText: { color: '#CBD5E1', fontSize: 13, lineHeight: 20 },
  aiPanelMuted: { color: '#6B7280', fontSize: 13, lineHeight: 20 },

  // ステータス
  statusBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  statusText: { fontSize: 13, lineHeight: 19 },

  // ボタン
  ghostBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostBtnText: { color: '#9CA3AF', fontSize: 14, fontWeight: '500' },
  primaryBtn: {
    backgroundColor: '#2DD4BF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#0E1116', fontWeight: '700', fontSize: 16 },
});
