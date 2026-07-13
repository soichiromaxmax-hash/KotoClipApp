import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/lib/api';
import { KotoBird } from '@/components/KotoBird';

const DIRECTION_KEY = 'koto_flashcard_direction_v1';

interface Word {
  id: number;
  word: string;
  meaning: string;
  context?: string;
  ai_explanation?: string;
  last_reviewed?: string;
}

type Direction = 'en_ja' | 'ja_en';
type Rating = 'good' | 'hard' | 'again';

// ─── フリップカード ─────────────────────────────────────────────────────────

function FlipCard({
  word,
  onRate,
  onDelete,
  reversed,
}: {
  word: Word;
  onRate: (r: Rating) => void;
  onDelete: () => void;
  reversed: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const [locked, setLocked] = useState(true);

  useEffect(() => {
    setFlipped(false);
    setLocked(true);
    const t = setTimeout(() => setLocked(false), 250);
    return () => clearTimeout(t);
  }, [word.id, reversed]);

  const badge = !flipped
    ? reversed ? 'Meaning' : 'Flashcard'
    : reversed ? 'Word' : 'Meaning';

  return (
    <View style={s.questionWrap}>
      <View style={s.questionCard}>
        <View style={s.mascotCorner} pointerEvents="none">
          <KotoBird size={60} />
        </View>
        <Text style={s.modeBadge}>{badge}</Text>

        {/* 表面 */}
        {!flipped && !reversed && (
          <>
            <Text style={s.wordDisplay}>{word.word}</Text>
            {!!word.context && (
              <Text style={s.contextText}>{word.context.slice(0, 80)}</Text>
            )}
          </>
        )}
        {!flipped && reversed && (
          <Text style={s.meaningDisplay}>{word.meaning}</Text>
        )}

        {/* 裏面 */}
        {flipped && !reversed && (
          <>
            <Text style={s.meaningDisplay}>{word.meaning}</Text>
            {!!word.context && (
              <View style={s.contextBlock}>
                <Text style={s.contextBlockText}>{word.context}</Text>
              </View>
            )}
            {!!word.ai_explanation && (
              <Text style={s.aiText}>{word.ai_explanation}</Text>
            )}
          </>
        )}
        {flipped && reversed && (
          <>
            <Text style={s.wordDisplay}>{word.word}</Text>
            {!!word.context && (
              <View style={s.contextBlock}>
                <Text style={s.contextBlockText}>{word.context}</Text>
              </View>
            )}
            {!!word.ai_explanation && (
              <Text style={s.aiText}>{word.ai_explanation}</Text>
            )}
          </>
        )}
      </View>

      {!flipped ? (
        <TouchableOpacity
          style={[s.primaryBtn, locked && { opacity: 0.38 }]}
          onPress={() => setFlipped(true)}
          disabled={locked}
          activeOpacity={0.8}
        >
          <Text style={s.primaryBtnText}>答えを見る</Text>
        </TouchableOpacity>
      ) : (
        <>
          <View style={s.ratingWrap}>
            <TouchableOpacity style={s.ratingAgain} onPress={() => onRate('again')} activeOpacity={0.8}>
              <Text style={s.ratingBtnText}>もう一度</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ratingHard} onPress={() => onRate('hard')} activeOpacity={0.8}>
              <Text style={s.ratingBtnText}>あいまい</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ratingGood} onPress={() => onRate('good')} activeOpacity={0.8}>
              <Text style={s.ratingBtnText}>覚えていた</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={s.deleteWordBtn} onPress={onDelete} activeOpacity={0.7}>
            <Text style={s.deleteWordBtnText}>この単語を削除</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// ─── メイン画面 ─────────────────────────────────────────────────────────────

export default function FlashcardScreen() {
  const router = useRouter();
  const [allLoaded, setAllLoaded] = useState(false);
  const [queue, setQueue] = useState<Word[]>([]);
  const [idx, setIdx] = useState(0);
  const [ratings, setRatings] = useState({ good: 0, hard: 0, again: 0 });
  const [done, setDone] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [direction, setDirection] = useState<Direction>('en_ja');
  const [started, setStarted] = useState(false);
  const sessionWords = useRef<Word[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(DIRECTION_KEY).then((saved) => {
      if (saved === 'en_ja' || saved === 'ja_en') setDirection(saved);
    }).catch(() => {});
  }, []);

  function handleStart(d: Direction) {
    setDirection(d);
    AsyncStorage.setItem(DIRECTION_KEY, d).catch(() => {});
    setStarted(true);
    load();
  }

  async function load() {
    try {
      let words: Word[] = await api.getDue(10);
      if (!Array.isArray(words)) throw new Error('データを取得できませんでした');
      if (words.length === 0) {
        words = await api.getAllWords(10, true);
        if (!Array.isArray(words)) words = [];
      }
      sessionWords.current = [...words].slice(0, 10);
      setAllLoaded(true);
      if (sessionWords.current.length > 0) beginSession(sessionWords.current);
    } catch (e: any) {
      setLoadError(e.message || 'エラーが発生しました');
      setAllLoaded(true);
    }
  }

  function beginSession(words: Word[]) {
    setQueue(words.slice(0, 10));
    setIdx(0);
    setRatings({ good: 0, hard: 0, again: 0 });
    setDone(false);
  }

  function advanceQueue(rating: Rating) {
    setRatings((r) => ({ ...r, [rating]: (r[rating] ?? 0) + 1 }));
    if (idx + 1 >= queue.length) setDone(true);
    else setIdx((i) => i + 1);
  }

  function restartSession() {
    beginSession([...sessionWords.current].sort(() => Math.random() - 0.5));
  }

  function loadNextBatch() {
    setAllLoaded(false);
    setDone(false);
    load();
  }

  function onRate(rating: Rating) {
    const word = queue[idx];
    // カード表示からの経過時間ではなく、前回復習日時からの実際の経過日数を使う
    // （study.tsxと同じ方式）。FSRSの忘却曲線計算に必要なのは後者。
    const lastReviewed = word.last_reviewed ?? null;
    const elapsed = lastReviewed
      ? Math.max(0.1, Math.round((Date.now() - new Date(lastReviewed).getTime()) / 86400000 * 10) / 10)
      : 1.0;
    advanceQueue(rating); // 即座に次のカードへ
    api.postReview(word.id, rating, elapsed).catch(() => {
      // バックグラウンド保存失敗は無視（フラッシュカードは任意学習）
    });
  }

  function handleDirection(d: Direction) {
    if (d === direction) return;
    setDirection(d);
    beginSession(sessionWords.current);
  }

  function handleDeleteWord() {
    const word = queue[idx];
    if (!word) return;
    Alert.alert(
      'この単語を削除',
      `「${word.word}」を削除しますか？\n削除すると復元できません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            api.deleteWord(word.id).catch(() => {});
            const newQueue = queue.filter((_, i) => i !== idx);
            sessionWords.current = sessionWords.current.filter((w) => w.id !== word.id);
            if (newQueue.length === 0 || idx >= newQueue.length) {
              setQueue(newQueue);
              setDone(true);
              return;
            }
            setQueue(newQueue);
          },
        },
      ]
    );
  }

  const pct = queue.length > 0 ? (idx / queue.length) * 100 : 0;

  // 方向選択（開始前）
  if (!started) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.centered}>
          <KotoBird size={82} />
          <Text style={s.emptyTitle}>どちら向きで復習しますか？</Text>
          <TouchableOpacity style={s.primaryBtn} onPress={() => handleStart('en_ja')} activeOpacity={0.85}>
            <Text style={s.primaryBtnText}>英 → 日</Text>
            <Text style={s.selectBtnSub}>単語を見て意味を答える</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => handleStart('ja_en')} activeOpacity={0.85}>
            <Text style={s.secondaryBtnText}>日 → 英</Text>
            <Text style={[s.selectBtnSub, { color: '#2DD4BF' }]}>意味を見て単語を答える</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ローディング
  if (!allLoaded) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.centered}>
          <KotoBird size={76} />
          <Text style={s.loadingText}>カードを準備中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // エラー
  if (loadError) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.centered}>
          <Text style={s.errorText}>{loadError}</Text>
          <TouchableOpacity style={s.primaryBtn} onPress={() => router.back()}>
            <Text style={s.primaryBtnText}>ホームへ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 単語なし
  if (sessionWords.current.length === 0) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.centered}>
          <KotoBird size={82} />
          <Text style={s.emptyTitle}>単語がまだありません</Text>
          <Text style={s.emptySub}>まずは言葉をためて始めましょう。</Text>
          <TouchableOpacity style={s.primaryBtn} onPress={() => router.push('/(tabs)/add' as any)}>
            <Text style={s.primaryBtnText}>手動で単語を追加する</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // バッチ完了
  if (done) {
    const total = ratings.good + ratings.hard + ratings.again;
    const accuracy = total > 0 ? Math.round((ratings.good / total) * 100) : 0;
    return (
      <SafeAreaView style={s.root}>
        <ScrollView contentContainerStyle={s.centeredScroll} showsVerticalScrollIndicator={false}>
          <KotoBird size={88} />
          <Text style={s.doneTitle}>{queue.length}枚を確認</Text>
          <Text style={s.batchInfo}>このセッションはここまで</Text>
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={[s.statNum, { color: '#22C55E' }]}>{ratings.good}</Text>
              <Text style={s.statLbl}>覚えていた</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statNum, { color: '#F59E0B' }]}>{ratings.hard}</Text>
              <Text style={s.statLbl}>惜しかった</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statNum, { color: '#EF4444' }]}>{ratings.again}</Text>
              <Text style={s.statLbl}>忘れていた</Text>
            </View>
          </View>
          <View style={s.accuracyCard}>
            <Text style={s.accuracyNum}>{accuracy}%</Text>
            <Text style={s.accuracyLbl}>このセットの定着率</Text>
          </View>
          <TouchableOpacity style={s.primaryBtn} onPress={restartSession}>
            <Text style={s.primaryBtnText}>もう一度10枚</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={loadNextBatch}>
            <Text style={s.secondaryBtnText}>違う10枚へ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.ghostBtn} onPress={() => router.back()}>
            <Text style={s.ghostBtnText}>ホームへ</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const word = queue[idx];

  return (
    <SafeAreaView style={s.root}>
      {/* ヘッダー */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <View style={s.progressBg}>
          <LinearGradient
            colors={['#2DD4BF', '#4CC9F0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[s.progressFill, { width: `${pct}%` as any }]}
          />
        </View>
        <Text style={s.scoreBadge}>{idx + 1} / {queue.length}</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* 方向切り替え */}
        <View style={s.dirBar}>
          {(['en_ja', 'ja_en'] as Direction[]).map((d) => (
            <TouchableOpacity
              key={d}
              style={[s.dirTab, direction === d && s.dirTabActive]}
              onPress={() => handleDirection(d)}
            >
              <Text style={[s.dirTabText, direction === d && s.dirTabTextActive]}>
                {d === 'en_ja' ? '英 → 日' : '日 → 英'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.batchInfoSmall}>10枚で終了</Text>

        <FlipCard
          key={`${word.id}-${direction}`}
          word={word}
          onRate={onRate}
          onDelete={handleDeleteWord}
          reversed={direction === 'ja_en'}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── スタイル ───────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E1116' },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 40 },
  centeredScroll: { alignItems: 'center', padding: 24, gap: 16, paddingBottom: 40 },

  // ヘッダー
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  closeBtn: { padding: 4 },
  closeBtnText: { color: '#6B7280', fontSize: 18, fontWeight: '500' },
  progressBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 99 },
  scoreBadge: {
    color: '#6B7280',
    fontSize: 12,
    minWidth: 44,
    textAlign: 'right',
  },

  // 方向バー
  dirBar: {
    flexDirection: 'row',
    backgroundColor: '#1D2430',
    borderRadius: 10,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 10,
  },
  dirTab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  dirTabActive: { backgroundColor: '#2DD4BF' },
  dirTabText: { color: '#6B7280', fontWeight: '600', fontSize: 13 },
  dirTabTextActive: { color: '#0E1116' },
  batchInfoSmall: { color: '#6B7280', fontSize: 11, textAlign: 'center', marginBottom: 14 },

  // 問題カード
  questionWrap: { gap: 14 },
  questionCard: {
    backgroundColor: '#151A22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 220,
    gap: 10,
    overflow: 'hidden',
  },
  mascotCorner: { position: 'absolute', top: 4, right: 4, opacity: 0.96 },
  modeBadge: {
    color: '#2DD4BF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  wordDisplay: { color: '#F9FAFB', fontSize: 32, fontWeight: '700' },
  meaningDisplay: { color: '#F9FAFB', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  contextText: { color: '#9CA3AF', fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  contextBlock: {
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,255,255,0.10)',
    paddingLeft: 10,
  },
  contextBlockText: { color: '#9CA3AF', fontSize: 13, fontStyle: 'italic', lineHeight: 20 },
  aiText: { color: '#9CA3AF', fontSize: 13, lineHeight: 20 },

  // ボタン
  primaryBtn: {
    backgroundColor: '#2DD4BF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    width: '100%',
  },
  primaryBtnText: { color: '#0E1116', fontWeight: '700', fontSize: 16 },
  ghostBtn: { paddingVertical: 14, alignItems: 'center' },
  ghostBtnText: { color: '#6B7280', fontSize: 15 },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: '#2DD4BF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    width: '100%',
  },
  secondaryBtnText: { color: '#2DD4BF', fontWeight: '700', fontSize: 16 },
  selectBtnSub: { color: '#0E1116', fontSize: 12, marginTop: 2, opacity: 0.7 },

  deleteWordBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteWordBtnText: {
    color: '#6B7280',
    fontSize: 13,
    textDecorationLine: 'underline',
  },

  ratingWrap: { gap: 10 },
  ratingAgain: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  ratingHard: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  ratingGood: {
    backgroundColor: '#2DD4BF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  ratingBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // ステータス画面
  loadingText: { color: '#9CA3AF', fontSize: 14 },
  errorText: { color: '#EF4444', fontSize: 15, textAlign: 'center' },
  emptyTitle: { color: '#F9FAFB', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptySub: { color: '#9CA3AF', fontSize: 13, textAlign: 'center' },

  // 完了画面
  doneTitle: { color: '#F9FAFB', fontSize: 22, fontWeight: '500' },
  batchInfo: { color: '#9CA3AF', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 12, width: '100%' },
  statCard: {
    flex: 1,
    backgroundColor: '#151A22',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statNum: { fontSize: 26, fontWeight: '700' },
  statLbl: { color: '#9CA3AF', fontSize: 11, marginTop: 4, textAlign: 'center' },
  accuracyCard: {
    backgroundColor: '#151A22',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    width: '100%',
  },
  accuracyNum: {
    fontSize: 36,
    fontWeight: '700',
    color: '#2DD4BF',
    letterSpacing: -1.5,
  },
  accuracyLbl: { color: '#9CA3AF', fontSize: 13, marginTop: 4 },
});
