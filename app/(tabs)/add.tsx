import { useCallback, useState } from 'react';
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
  Modal,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { KotoBird } from '@/components/KotoBird';

const FREE_LIMIT = 100; // fallback（サーバーから取得できない場合）

const LANG_LABELS: Record<string, string> = {
  en: '英語', es: 'スペイン語', zh: '中国語', ja: '日本語',
};

export default function AddWordScreen() {
  const router = useRouter();
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [context, setContext] = useState('');
  const [status, setStatus] = useState<{ type: string; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiPanel, setAiPanel] = useState<{ example_native: string; notes: string } | null>(null);
  const [savedWord, setSavedWord] = useState<{ word: string; meaning: string } | null>(null);

  const [wordCount, setWordCount] = useState<number | null>(null);
  const [wordLimit, setWordLimit] = useState<number | null>(null); // null = 無制限（premium）
  const [isPremium, setIsPremium] = useState(false);
  const [learningLang, setLearningLang] = useState('en');
  const [nativeLang, setNativeLang] = useState('ja');
  const [showLimitModal, setShowLimitModal] = useState(false);

  useFocusEffect(useCallback(() => {
    api.getSettings().catch(() => null).then((s) => {
      if (!s) return;
      if (s.word_count !== undefined) setWordCount(s.word_count);
      if (s.word_limit !== undefined) setWordLimit(s.is_premium ? null : (s.word_limit ?? FREE_LIMIT));
      setIsPremium(!!s.is_premium);
      if (s.target_lang) setLearningLang(s.target_lang);
      if (s.native_lang) setNativeLang(s.native_lang);
    });
  }, []));

  async function autoTranslate() {
    if (!word.trim()) return;
    setSavedWord(null);
    setLoading(true);
    setStatus({ type: 'info', msg: 'AI解説を取得中...' });
    setAiPanel(null);
    try {
      const res = await api.lookup(word.trim(), learningLang, nativeLang);
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
      setStatus({ type: 'error', msg: '単語と意味を入力してください' });
      return;
    }
    setSavedWord(null);
    if (!isPremium && wordLimit !== null && wordCount !== null && wordCount >= wordLimit) {
      setShowLimitModal(true);
      return;
    }
    if (loading) return;
    setLoading(true);
    const payload = {
      word: word.trim(),
      meaning: meaning.trim(),
      context,
      source_type: 'manual',
      target_lang: learningLang,
      native_lang: nativeLang,
      ai_explanation: aiPanel
        ? [aiPanel.example_native, aiPanel.notes].filter(Boolean).join('\n')
        : '',
    };
    try {
      const res = await api.addWord(payload);
      if (res.status === 'ok') {
        setStatus({ type: 'success', msg: '保存できました。あとで復習に出てきます。' });
        setSavedWord({ word: res.word, meaning: res.meaning });
        setWord(''); setMeaning(''); setContext(''); setAiPanel(null);
        setWordCount((c) => (c !== null ? c + 1 : null));
      } else if (res.status === 'duplicate') {
        setStatus({ type: 'warning', msg: `「${res.word}」はすでに登録済みです` });
      } else {
        setStatus({ type: 'error', msg: res.detail || '保存に失敗しました' });
      }
    } catch (e: any) {
      if (e?.status === 402 || e?.message?.includes('上限')) {
        setShowLimitModal(true);
      } else {
        setStatus({ type: 'error', msg: '保存に失敗しました。時間をおいてもう一度お試しください。' });
      }
    } finally {
      setLoading(false);
    }
  }

  const effectiveLimit = isPremium ? null : (wordLimit ?? FREE_LIMIT);
  const nearLimit = !isPremium && effectiveLimit !== null && wordCount !== null && wordCount >= effectiveLimit - 10;
  const atLimit   = !isPremium && effectiveLimit !== null && wordCount !== null && wordCount >= effectiveLimit;

  const statusStyle: Record<string, { bg: string; border: string; text: string }> = {
    success: { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.28)',  text: '#22C55E' },
    error:   { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.28)',  text: '#EF4444' },
    warning: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.28)', text: '#F59E0B' },
    info:    { bg: 'rgba(45,212,191,0.08)', border: 'rgba(45,212,191,0.28)', text: '#2DD4BF' },
  };
  const st = status ? (statusStyle[status.type] ?? statusStyle.info) : null;

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.titleRow}>
            <Text style={s.title}>単語を追加する</Text>
            {wordCount !== null && (
              <Text style={[s.countChip, atLimit && s.countChipRed, nearLimit && !atLimit && s.countChipAmber]}>
                {isPremium ? `${wordCount}語（無制限）` : `${wordCount}/${effectiveLimit}語`}
              </Text>
            )}
          </View>

          {/* 学習言語インジケーター */}
          <TouchableOpacity
            style={s.langBadge}
            onPress={() => router.push('/(tabs)/settings' as any)}
            activeOpacity={0.75}
          >
            <Text style={s.langBadgeText}>
              🌐 {LANG_LABELS[learningLang] ?? learningLang} → {LANG_LABELS[nativeLang] ?? nativeLang}
            </Text>
            <Text style={s.langBadgeEdit}>設定を変える ›</Text>
          </TouchableOpacity>

          <View style={s.card}>
            <View style={s.formGroup}>
              <Text style={s.label}>{LANG_LABELS[learningLang] ?? ''}の単語・フレーズ</Text>
              <TextInput
                style={s.input}
                placeholder="例: perseverance"
                placeholderTextColor="#4B5563"
                value={word}
                onChangeText={(v) => { setWord(v); setSavedWord(null); }}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={autoTranslate}
                returnKeyType="search"
              />
            </View>

            <TouchableOpacity
              style={[s.ghostBtn, (!word.trim() || loading) && { opacity: 0.38 }]}
              onPress={autoTranslate}
              disabled={loading || !word.trim()}
              activeOpacity={0.7}
            >
              {loading
                ? <ActivityIndicator color="#2DD4BF" size="small" />
                : <Text style={s.ghostBtnText}>AIで意味を自動入力</Text>
              }
            </TouchableOpacity>

            <View style={s.formGroup}>
              <Text style={s.label}>{LANG_LABELS[nativeLang] ?? ''}訳</Text>
              <TextInput
                style={s.input}
                placeholder="自動取得または手動で入力"
                placeholderTextColor="#4B5563"
                value={meaning}
                onChangeText={setMeaning}
              />
            </View>

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

            {aiPanel && (aiPanel.example_native || aiPanel.notes) && (
              <View style={s.aiPanel}>
                {!!aiPanel.example_native && (
                  <Text style={[s.aiPanelText, aiPanel.notes ? { marginBottom: 6 } : {}]}>
                    {aiPanel.example_native}
                  </Text>
                )}
                {!!aiPanel.notes && <Text style={s.aiPanelMuted}>{aiPanel.notes}</Text>}
              </View>
            )}

            {status && st && (
              <View style={[s.statusBox, { backgroundColor: st.bg, borderColor: st.border }]}>
                <Text style={[s.statusText, { color: st.text }]}>{status.msg}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[s.primaryBtn, (loading || atLimit) && { opacity: atLimit ? 0.5 : 0.6 }]}
              onPress={save}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={s.primaryBtnText}>{loading ? '処理中...' : atLimit ? '上限に達しました' : '保存する'}</Text>
            </TouchableOpacity>

            {savedWord && (
              <View style={s.savedActions}>
                <TouchableOpacity
                  style={s.savedSecondaryBtn}
                  onPress={() => { setSavedWord(null); setStatus(null); }}
                  activeOpacity={0.8}
                >
                  <Text style={s.savedSecondaryText}>続けて追加する</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.savedPrimaryBtn}
                  onPress={() => router.push('/(tabs)/words' as any)}
                  activeOpacity={0.8}
                >
                  <Text style={s.savedPrimaryText}>単語帳を見る</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 上限モーダル */}
      <Modal visible={showLimitModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <KotoBird size={76} />
            <Text style={s.modalTitle}>無料プランの上限です</Text>
            <Text style={s.modalBody}>
              無料プランでは{effectiveLimit ?? FREE_LIMIT}語まで保存できます。{'\n'}
              プレミアムプランにアップグレードすると、単語数が無制限になります。
            </Text>
            <TouchableOpacity
              style={s.modalPremiumBtn}
              activeOpacity={0.85}
              onPress={() => { setShowLimitModal(false); router.push('/paywall' as any); }}
            >
              <Text style={s.modalPremiumText}>プレミアムにアップグレード</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalCancelBtn} onPress={() => setShowLimitModal(false)} activeOpacity={0.7}>
              <Text style={s.modalCancelText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E1116' },
  scroll: { paddingBottom: 40 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#F9FAFB' },
  countChip: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  countChipAmber: { color: '#F59E0B' },
  countChipRed: { color: '#EF4444' },

  langBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: 'rgba(45,212,191,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.15)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  langBadgeText: { fontSize: 13, color: '#8F99A8' },
  langBadgeEdit: { fontSize: 12, color: '#2DD4BF', fontWeight: '600' },

  card: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(21,26,34,0.98)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    gap: 12,
  },
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
  textarea: { minHeight: 90, paddingTop: 12 },
  aiPanel: {
    backgroundColor: 'rgba(45,212,191,0.07)',
    borderLeftWidth: 3,
    borderLeftColor: '#2DD4BF',
    borderRadius: 10,
    padding: 12,
  },
  aiPanelText: { color: '#CBD5E1', fontSize: 13, lineHeight: 20 },
  aiPanelMuted: { color: '#6B7280', fontSize: 13, lineHeight: 20 },
  statusBox: { borderRadius: 10, borderWidth: 1, padding: 12 },
  statusText: { fontSize: 13, lineHeight: 19 },
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

  savedActions: { flexDirection: 'row', gap: 10 },
  savedSecondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  savedSecondaryText: { color: '#8F99A8', fontSize: 14, fontWeight: '600' },
  savedPrimaryBtn: {
    flex: 1,
    backgroundColor: 'rgba(45,212,191,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.3)',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  savedPrimaryText: { color: '#2DD4BF', fontSize: 14, fontWeight: '700' },

  // 上限モーダル
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1D2430',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 14,
    color: '#8F99A8',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalPremiumBtn: {
    width: '100%',
    backgroundColor: '#2DD4BF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  modalPremiumText: { color: '#0E1116', fontWeight: '700', fontSize: 15 },
  modalCancelBtn: { paddingVertical: 8 },
  modalCancelText: { color: '#6B7280', fontSize: 14 },
});
