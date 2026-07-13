import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/lib/api';

interface Word {
  id: number;
  word: string;
  meaning: string;
  part_of_speech?: string;
  reading?: string;
  context?: string;
  memo?: string;
  ai_explanation?: string;
  reps?: number;
  correct_count?: number;
  wrong_count?: number;
  wild_count?: number;
  next_review?: string;
  created_at?: string;
  first_correct_date?: string;
  last_reviewed?: string;
  source_url?: string;
}

interface TimelineEvent {
  date?: string;
  label: string;
  icon: string;
  context?: string;
  url?: string;
  type?: string;
}

function formatDate(s?: string) {
  return s ? s.slice(0, 10) : null;
}

function nextReviewLabel(s?: string) {
  if (!s) return null;
  const diff = Math.round((new Date(s).getTime() - Date.now()) / 86400000);
  if (diff <= 0) return '今日';
  if (diff === 1) return '明日';
  return `${diff}日後`;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function DateRow({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.dateRow}>
      <Text style={styles.dateLabel}>{label}</Text>
      <Text style={[styles.dateValue, !value && styles.dateMuted]}>{value ?? '—'}</Text>
    </View>
  );
}

export default function WordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [word, setWord] = useState<Word | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [memo, setMemo] = useState('');
  const [memoSaved, setMemoSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retranslating, setRetranslating] = useState(false);
  const [retranslated, setRetranslated] = useState(false);
  const [retranslateError, setRetranslateError] = useState('');

  useEffect(() => {
    if (!id) return;
    const wordId = Number(id);
    Promise.allSettled([api.getWord(wordId), api.getTimeline(wordId)]).then(([wRes, tRes]) => {
      if (wRes.status === 'fulfilled' && wRes.value?.id) {
        setWord(wRes.value);
        setMemo(wRes.value.memo ?? '');
      }
      if (tRes.status === 'fulfilled' && Array.isArray(tRes.value)) {
        setTimeline(tRes.value);
      }
      setLoading(false);
    });
  }, [id]);

  async function handleRetranslate() {
    if (!word || retranslating) return;
    setRetranslating(true);
    setRetranslateError('');
    try {
      const res = await api.retranslate(word.id);
      if (res?.meaning) {
        setWord((w) => w ? { ...w, meaning: res.meaning } : w);
        setRetranslated(true);
        setTimeout(() => setRetranslated(false), 2500);
      } else {
        setRetranslateError(res?.detail || 'AI再翻訳に失敗しました');
      }
    } catch (e: any) {
      setRetranslateError(
        e?.status === 429 ? '無料プランのAI利用回数上限です。Premiumで増やせます。' : 'AI再翻訳に失敗しました'
      );
    } finally {
      setRetranslating(false);
    }
  }

  async function saveMemo() {
    if (!word) return;
    try {
      await api.updateMemo(word.id, memo);
      setMemoSaved(true);
      setTimeout(() => setMemoSaved(false), 1800);
    } catch {
      Alert.alert('エラー', 'メモの保存に失敗しました');
    }
  }

  async function handleDelete() {
    if (!word) return;
    Alert.alert('単語を削除', `「${word.word}」を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除する',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteWord(word.id);
            router.back();
          } catch {
            Alert.alert('エラー', '削除に失敗しました');
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <ActivityIndicator color="#2DD4BF" style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (!word) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={styles.errorText}>単語を取得できませんでした</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← 戻る</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const correctCount = word.correct_count ?? 0;
  const wrongCount = word.wrong_count ?? 0;
  const total = correctCount + wrongCount;
  const acc = total > 0 ? `${Math.round(correctCount / total * 100)}%` : '未解答';

  return (
    <SafeAreaView style={styles.root}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backBtn}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>単語詳細</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 単語カード */}
        <View style={styles.wordCard}>
          <Text style={styles.wordText}>{word.word}</Text>
          {word.part_of_speech ? (
            <View style={styles.posBadge}>
              <Text style={styles.posBadgeText}>{word.part_of_speech}</Text>
            </View>
          ) : null}
          <Text style={styles.meaningText}>{word.meaning}</Text>
          {word.reading ? <Text style={styles.readingText}>{word.reading}</Text> : null}
          <TouchableOpacity
            style={[styles.retranslateBtn, retranslating && { opacity: 0.6 }]}
            onPress={handleRetranslate}
            disabled={retranslating}
            activeOpacity={0.7}
          >
            <Text style={[styles.retranslateBtnText, retranslated && { color: '#7CFFB2' }]}>
              {retranslating ? '翻訳中...' : retranslated ? '✓ 更新しました' : '↺ AI再翻訳'}
            </Text>
          </TouchableOpacity>
          {!!retranslateError && (
            <Text style={styles.retranslateError}>{retranslateError}</Text>
          )}
        </View>

        {/* 学習データ */}
        <Text style={styles.sectionTitle}>学習データ</Text>
        <View style={styles.infoGrid}>
          <InfoCard label="正解率" value={acc} />
          <InfoCard label="次の復習" value={nextReviewLabel(word.next_review) ?? '—'} />
          <InfoCard label="正解回数" value={`${correctCount}回`} />
          <InfoCard label="不正解回数" value={`${wrongCount}回`} />
          <InfoCard label="野生で出会った" value={`${word.wild_count ?? 0}回`} />
          <InfoCard label="復習回数" value={`${word.reps ?? 0}回`} />
        </View>

        {/* 記録 */}
        <Text style={styles.sectionTitle}>記録</Text>
        <View style={styles.card}>
          <DateRow label="登録日" value={formatDate(word.created_at)} />
          <DateRow label="初めて正解" value={formatDate(word.first_correct_date)} />
          <DateRow label="最終復習" value={formatDate(word.last_reviewed)} />
          {word.source_url ? (
            <Text style={styles.sourceUrl} numberOfLines={2}>{word.source_url}</Text>
          ) : null}
        </View>

        {/* 文脈 */}
        {word.context ? (
          <>
            <Text style={styles.sectionTitle}>文脈</Text>
            <View style={styles.card}>
              <Text style={styles.contextText}>{'"'}{word.context}{'"'}</Text>
            </View>
          </>
        ) : null}

        {/* AI解説 */}
        {word.ai_explanation ? (
          <>
            <Text style={styles.sectionTitle}>AI解説</Text>
            <View style={styles.card}>
              <Text style={styles.aiText}>{word.ai_explanation}</Text>
            </View>
          </>
        ) : null}

        {/* メモ */}
        <Text style={styles.sectionTitle}>メモ</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.memoInput}
            multiline
            placeholder="自分用のメモを追加できます"
            placeholderTextColor="#4B5563"
            value={memo}
            onChangeText={setMemo}
          />
          <View style={styles.memoFooter}>
            {memoSaved ? <Text style={styles.savedText}>保存しました</Text> : <View />}
            <TouchableOpacity style={styles.saveBtn} onPress={saveMemo}>
              <Text style={styles.saveBtnText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* タイムライン */}
        {timeline.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>{word.word} の歴史</Text>
            <View style={styles.card}>
              {timeline.map((ev, i) => (
                <View key={i} style={[styles.timelineItem, i < timeline.length - 1 && styles.timelineItemBorder]}>
                  <View style={styles.timelineIcon}>
                    <Text style={styles.timelineIconText}>{ev.icon}</Text>
                  </View>
                  <View style={styles.timelineBody}>
                    <View style={styles.timelineTopRow}>
                      <Text style={styles.timelineDate}>{ev.date ?? '—'}</Text>
                      <Text style={styles.timelineLabel}>{ev.label}</Text>
                    </View>
                    {ev.context ? (
                      <Text style={styles.timelineContext} numberOfLines={3}>{'"'}{ev.context}{'"'}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* 削除 */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>単語を削除</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E1116' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C2330',
  },
  backBtn: { color: '#2DD4BF', fontSize: 15, fontWeight: '600' },
  headerTitle: { color: '#F9FAFB', fontSize: 16, fontWeight: '700' },
  backLink: { color: '#2DD4BF', fontSize: 15, margin: 20 },
  errorText: { color: '#EF4444', textAlign: 'center', margin: 20, fontSize: 15 },

  content: { padding: 16, paddingBottom: 60, gap: 0 },

  wordCard: {
    backgroundColor: '#151A22',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#252D3A',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  wordText: { color: '#2DD4BF', fontSize: 36, fontWeight: '700', letterSpacing: -1 },
  posBadge: {
    backgroundColor: 'rgba(45,212,191,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  posBadgeText: { color: '#2DD4BF', fontSize: 12, fontWeight: '700' },
  meaningText: { color: '#F9FAFB', fontSize: 22, fontWeight: '700' },
  readingText: { color: '#9CA3AF', fontSize: 14 },

  retranslateBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  retranslateBtnText: { color: '#8F99A8', fontSize: 12 },
  retranslateError: { color: '#FF6B6B', fontSize: 12, marginTop: 4, textAlign: 'center' },

  sectionTitle: { color: '#9CA3AF', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#151A22',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#252D3A',
  },
  infoLabel: { color: '#9CA3AF', fontSize: 11, marginBottom: 4 },
  infoValue: { color: '#F9FAFB', fontSize: 18, fontWeight: '700' },

  card: {
    backgroundColor: '#151A22',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#252D3A',
  },

  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1C2330',
  },
  dateLabel: { color: '#9CA3AF', fontSize: 13 },
  dateValue: { color: '#F9FAFB', fontSize: 13, fontWeight: '600' },
  dateMuted: { color: '#4B5563', fontWeight: '400' },
  sourceUrl: { color: '#6B7280', fontSize: 11, marginTop: 10 },

  contextText: { color: '#D1D5DB', fontSize: 14, fontStyle: 'italic', lineHeight: 22, borderLeftWidth: 3, borderLeftColor: '#2DD4BF', paddingLeft: 10 },
  aiText: { color: '#D1D5DB', fontSize: 13, lineHeight: 20 },

  memoInput: {
    color: '#F9FAFB',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  memoFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  savedText: { color: '#22C55E', fontSize: 12, fontWeight: '700' },
  saveBtn: { backgroundColor: '#2DD4BF', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 16 },
  saveBtnText: { color: '#0E1116', fontWeight: '700', fontSize: 13 },

  timelineItem: { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  timelineItemBorder: { borderBottomWidth: 1, borderBottomColor: '#1C2330' },
  timelineIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1C2330',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  timelineIconText: { fontSize: 16 },
  timelineBody: { flex: 1, gap: 4 },
  timelineTopRow: { flexDirection: 'row', gap: 8, alignItems: 'baseline' },
  timelineDate: { color: '#6B7280', fontSize: 11, fontWeight: '600' },
  timelineLabel: { color: '#F9FAFB', fontSize: 13, fontWeight: '700' },
  timelineContext: { color: '#9CA3AF', fontSize: 12, fontStyle: 'italic', lineHeight: 18 },

  deleteBtn: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  deleteBtnText: { color: '#EF4444', fontWeight: '600', fontSize: 15 },
});
