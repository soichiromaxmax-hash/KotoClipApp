import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { api } from '@/lib/api';
import { KotoBird } from '@/components/KotoBird';
import { resetHomeCache } from '@/lib/homeCache';
import { sendMilestoneNotification, sendStreakNotification, getPermissionStatus } from '@/lib/notifications';
import {
  SharePayload,
  checkStreakShare,
  checkWordShare,
  getMasteryRank,
} from '@/lib/shareCard';
import { SharePrompt } from '@/components/share/SharePrompt';

// ─── 型 ────────────────────────────────────────────────────────────────────

interface Word {
  id: number;
  word: string;
  meaning: string;
  context?: string;
  reps?: number;
  created_at?: string;
  stability?: number;
  next_review?: string;
  last_reviewed?: string;
  _q_type?: 'choice' | 'reverse';
}

interface Question {
  type: 'choice' | 'reverse';
  prompt: string;
  prompt_hint: string | null;
  choices: string[];
  answer: string;
}

type Mode = 'scheduled' | 'free' | 'weak';
type Phase = 'loading' | 'question' | 'feedback' | 'result' | 'empty' | 'error';

// ─── ユーティリティ ─────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// FSRS-4.5 の保持率計算（サーバーと同じパラメータ）
const FSRS_DECAY = -0.5;
const FSRS_FACTOR = 0.9 ** (1 / FSRS_DECAY) - 1; // ≈ 0.2346

function fsrsRetention(stability: number, elapsedDays: number): number {
  if (stability <= 0 || elapsedDays <= 0) return 1;
  return Math.pow(1 + FSRS_FACTOR * elapsedDays / stability, FSRS_DECAY);
}

const FALLBACK_MEANINGS = [
  '重要な', '予想する', '改善する', '維持する', '影響する', '確認する',
  '増加する', '減少する', '提案する', '達成する', '避ける', '含む',
  '必要とする', '判断する', '比較する', '説明する',
];

const FALLBACK_WORDS = [
  'improve', 'require', 'compare', 'avoid', 'include', 'achieve',
  'maintain', 'increase', 'reduce', 'suggest', 'confirm', 'affect',
  'assume', 'decide', 'explain', 'notice',
];

function uniqueNonEmpty(values: (string | undefined | null)[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const clean = String(value ?? '').trim();
    const key = clean.toLowerCase();
    if (!clean || seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
  }
  return out;
}

function ensureFourChoices(answer: string, candidates: string[], fallback: string[]) {
  const pool = shuffle(uniqueNonEmpty([answer, ...candidates, ...fallback]).filter((v) => v !== answer));
  return shuffle([answer, ...pool.slice(0, 3)]);
}

function buildQuestion(word: Word, type: 'choice' | 'reverse', pool: Word[]): Question {
  const others = pool.filter((w) => w.id !== word.id);
  if (type === 'reverse') {
    return {
      type,
      prompt: word.meaning,
      prompt_hint: null,
      choices: ensureFourChoices(word.word, others.map((w) => w.word), FALLBACK_WORDS),
      answer: word.word,
    };
  }
  return {
    type: 'choice',
    prompt: word.word,
    prompt_hint: word.context ? word.context.slice(0, 80) : null,
    choices: ensureFourChoices(word.meaning, others.map((w) => w.meaning), FALLBACK_MEANINGS),
    answer: word.meaning,
  };
}

// ─── 進捗バー ───────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <View style={styles.progressBg}>
      <LinearGradient
        colors={['#2DD4BF', '#4CC9F0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.progressFill, { width: `${pct}%` as any }]}
      />
    </View>
  );
}

// ─── 4択問題（choice / reverse 共通） ──────────────────────────────────────

function QuizQuestion({
  question,
  onAnswer,
}: {
  question: Question;
  onAnswer: (rating: 'good' | 'again', correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const handlePress = (choice: string) => {
    if (selected !== null) return;
    setSelected(choice);
    const correct = choice === question.answer;
    setTimeout(() => onAnswer(correct ? 'good' : 'again', correct), 300);
  };

  const getBtnStyle = (choice: string) => {
    if (selected === null) return styles.choiceBtn;
    if (choice === question.answer) return [styles.choiceBtn, styles.choiceCorrect];
    if (choice === selected) return [styles.choiceBtn, styles.choiceWrong];
    return [styles.choiceBtn, styles.choiceDim];
  };

  return (
    <View style={styles.questionWrap}>
      <View style={styles.questionCard}>
        <View style={styles.mascotCorner} pointerEvents="none">
          <KotoBird size={60} />
        </View>
        <Text style={styles.modeBadge}>{question.type === 'reverse' ? 'Word' : 'Meaning'}</Text>
        <Text style={styles.wordDisplay}>{question.prompt}</Text>
        {question.prompt_hint ? (
          <Text style={styles.contextText}>{question.prompt_hint}</Text>
        ) : null}
      </View>
      <View style={styles.choicesGrid}>
        {question.choices.map((c, i) => (
          <TouchableOpacity
            key={i}
            style={getBtnStyle(c)}
            onPress={() => handlePress(c)}
            disabled={selected !== null}
            activeOpacity={0.75}
          >
            <Text style={styles.choiceBtnText}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── 結果画面 ───────────────────────────────────────────────────────────────

function ResultScreen({
  correct,
  wrong,
  onFree,
}: {
  correct: number;
  wrong: number;
  mode: Mode;
  onFree: () => void;
}) {
  const router = useRouter();
  const total = correct + wrong;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <View style={styles.centered}>
      <KotoBird size={88} />
      <Text style={styles.resultTitle}>セッション完了</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#7CFFB2' }]}>{correct}</Text>
          <Text style={styles.statLbl}>正解</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#FF6B6B' }]}>{wrong}</Text>
          <Text style={styles.statLbl}>不正解</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#2DD4BF' }]}>{accuracy}%</Text>
          <Text style={styles.statLbl}>正答率</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.primaryBtn} onPress={onFree}>
        <Text style={styles.primaryBtnText}>クイズ練習</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.ghostBtn} onPress={() => router.push('/(tabs)' as any)}>
        <Text style={styles.ghostBtnText}>ホームへ</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── メイン画面 ─────────────────────────────────────────────────────────────

export default function StudyScreen() {
  const { mode: modeParam, t: tParam } = useLocalSearchParams<{ mode?: string; t?: string }>();
  const lastTRef = useRef<string | undefined>(undefined);
  const [mode, setMode] = useState<Mode>('scheduled');
  const [phase, setPhase] = useState<Phase>('loading');
  const [queue, setQueue] = useState<Word[]>([]);
  const [idx, setIdx] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; msg: string } | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);
  const [saveError, setSaveError] = useState<{
    wordId: number; rating: 'good' | 'hard' | 'easy' | 'again'; elapsed: number;
    isCorrect: boolean; correctAnswer: string;
  } | null>(null);
  const masteredWordRef = useRef<Word | null>(null);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const poolRef = useRef<Word[]>([]);
  const comboRef = useRef(0);  // 連続正解カウント

  const loadQueue = useCallback(async (m: Mode) => {
    setPhase('loading');
    setFeedback(null);
    setCorrect(0);
    setWrong(0);
    setQuestion(null);
    setSharePayload(null);
    setSaveError(null);
    masteredWordRef.current = null;
    correctRef.current = 0;
    wrongRef.current = 0;
    try {
      let words: Word[];
      if (m === 'weak') {
        try { words = await api.getWeakWords(10); } catch { words = []; }
      } else if (m === 'free') {
        words = await api.getAllWords();
      } else {
        words = await api.getDue(20);
      }
      if (!Array.isArray(words) || words.length === 0) {
        resetHomeCache();
        setQueue([]);
        setPhase('empty');
        return;
      }

      let entries: (Word & { _q_type?: 'choice' | 'reverse' })[];

      if (m === 'free') {
        // ── 忘却曲線 × 重み付きランダムサンプリング ──────────────────
        // 忘却度が高い単語ほど選ばれやすいが、全単語に出題チャンスがある
        // 10語それぞれ1問（choiceかreverseをランダム割り当て）= 10問
        const SESSION_WORDS = 10;
        const nowMs = Date.now();
        const todayStr = new Date().toISOString().slice(0, 10);

        const withWeights = words.map((w) => {
          const stability = w.stability ?? 0;
          const reps = w.reps ?? 0;
          const lastReviewed = w.last_reviewed ?? null;
          const nextReview = w.next_review ?? todayStr;
          const elapsedDays = lastReviewed
            ? (nowMs - new Date(lastReviewed).getTime()) / 86400000
            : 0;

          let weight: number;
          if (reps === 0) {
            weight = 4;  // 未学習: 最高重み
          } else {
            const retention = fsrsRetention(stability, elapsedDays);
            if (nextReview <= todayStr) {
              weight = 1 + (1 - retention) * 3;  // 期限超過: 1〜4（忘れているほど重い）
            } else {
              weight = 0.2 + (1 - retention) * 0.8;  // 学習中: 0.2〜1.0
            }
          }
          return { ...w, _weight: weight };
        });

        // 重み付きランダムサンプリング（復元なし）
        const candidates = [...withWeights];
        const sampledPool: typeof withWeights = [];
        const count = Math.min(SESSION_WORDS, candidates.length);
        let totalWeight = candidates.reduce((sum, c) => sum + c._weight, 0);

        while (sampledPool.length < count) {
          let r = Math.random() * totalWeight;
          let chosen = candidates.length - 1;
          for (let i = 0; i < candidates.length; i++) {
            r -= candidates[i]._weight;
            if (r <= 0) { chosen = i; break; }
          }
          totalWeight -= candidates[chosen]._weight;
          sampledPool.push(candidates.splice(chosen, 1)[0]);
        }

        // 各単語に出題タイプをランダム割り当て → シャッフル
        entries = shuffle(sampledPool).map((w) => ({
          ...w,
          _q_type: (Math.random() < 0.5 ? 'choice' : 'reverse') as 'choice' | 'reverse',
        }));
      } else {
        entries = shuffle(words).slice(0, m === 'weak' ? 10 : 20).map((w) => ({
          ...w,
          _q_type: undefined,
        }));
      }
      poolRef.current = entries;
      setQueue(entries);
      setIdx(0);
      setQuestion(buildQuestion(entries[0], entries[0]._q_type ?? 'choice', entries));
      setPhase('question');
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'エラーが発生しました');
      setPhase('error');
    }
  }, []);

  // ホーム画面から t パラメータ付きで遷移してきたとき（同一モードの再タップ含む）に確実にリロード
  useEffect(() => {
    if (!tParam || tParam === lastTRef.current) return;
    lastTRef.current = tParam;
    const target = (modeParam === 'weak' || modeParam === 'free' || modeParam === 'scheduled')
      ? modeParam as Mode
      : mode;
    if (target === mode) {
      loadQueue(target);
    } else {
      setMode(target); // mode が変われば下の useEffect が loadQueue を呼ぶ
    }
  }, [tParam, modeParam]);

  // modeBar から直接切り替えたときのロード
  useEffect(() => {
    loadQueue(mode);
  }, [mode, loadQueue]);

  function applyResult(isCorrect: boolean, correctAnswer: string) {
    if (isCorrect) {
      correctRef.current += 1;
      setCorrect((c) => c + 1);
      setFeedback({ correct: true, msg: '正解！ 次回はもっと後に出てきます。' });
    } else {
      wrongRef.current += 1;
      setWrong((w) => w + 1);
      setFeedback({ correct: false, msg: `不正解… 正解: ${correctAnswer}。もう一度出てきます。` });
    }
    setPhase('feedback');
  }

  async function onAnswer(_rawRating: 'good' | 'again', isCorrect: boolean) {
    const word = queue[idx];

    // 実際の経過日数（FSRSが忘却曲線を計算するために使う）
    const lastReviewed = word.last_reviewed ?? null;
    const elapsed = lastReviewed
      ? Math.max(0.1, Math.round((Date.now() - new Date(lastReviewed).getTime()) / 86400000 * 10) / 10)
      : 1.0;

    // 保持率から FSRS 評価を自動決定（4段階評価で間隔の精度を上げる）
    const stability = word.stability ?? 0;
    const retention = stability > 0 && (word.reps ?? 0) > 0
      ? fsrsRetention(stability, elapsed)
      : -1;
    let rating: 'again' | 'hard' | 'good' | 'easy';
    if (!isCorrect) {
      rating = 'again';
    } else if (retention < 0 || (word.reps ?? 0) === 0) {
      rating = 'good';           // 初回 or stability 不明
    } else if (retention < 0.5) {
      rating = 'hard';           // ほぼ忘れていたが思い出した → 間隔は短めに
    } else if (retention >= 0.85) {
      rating = 'easy';           // しっかり覚えていた → 間隔を大きく伸ばす
    } else {
      rating = 'good';           // 通常の想起
    }

    const correctAnswer = question?.answer ?? word.meaning;

    if (isCorrect && (word.reps ?? 0) >= 4 && !masteredWordRef.current) {
      masteredWordRef.current = word;
    }

    // 即時フィードバック（APIレスポンスを待たない）
    if (isCorrect) {
      correctRef.current += 1;
      setCorrect((c) => c + 1);
      setFeedback({ correct: true, msg: '正解！ 次回はもっと後に出てきます。' });
    } else {
      wrongRef.current += 1;
      setWrong((w) => w + 1);
      setFeedback({ correct: false, msg: `不正解… 正解: ${correctAnswer}。もう一度出てきます。` });
    }
    setPhase('feedback');

    // API はバックグラウンドで送信し、XP が返ったら表示を更新
    api.postReview(word.id, rating, elapsed)
      .then((res) => {
        const xpGain: number = res?.xp_gain ?? 0;
        if (xpGain !== 0) {
          if (isCorrect) {
            setFeedback({ correct: true, msg: `正解！ +${xpGain} XP 次回はもっと後に出てきます。` });
          } else {
            setFeedback({ correct: false, msg: `不正解… ${xpGain} XP 正解: ${correctAnswer}。もう一度出てきます。` });
          }
        }
      })
      .catch(() => {
        setSaveError({ wordId: word.id, rating, elapsed, isCorrect, correctAnswer });
      });
  }

  async function retryReview() {
    if (!saveError) return;
    try {
      await api.postReview(saveError.wordId, saveError.rating, saveError.elapsed);
      const { isCorrect, correctAnswer } = saveError;
      setSaveError(null);
      // リトライ時はXP表示なしで通常フィードバック
      applyResult(isCorrect, correctAnswer);
    } catch {
      // still failing — keep showing the error
    }
  }

  function skipSaveError() {
    if (!saveError) return;
    const { isCorrect, correctAnswer } = saveError;
    setSaveError(null);
    applyResult(isCorrect, correctAnswer);
  }

  function confirmDeleteWord() {
    const word = queue[idx];
    if (!word) return;
    Alert.alert(
      'この単語を削除',
      `「${word.word}」を削除しますか？\n削除すると復元できません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: () => deleteCurrentWord(word.id) },
      ]
    );
  }

  function deleteCurrentWord(wordId: number) {
    api.deleteWord(wordId).catch(() => {});
    resetHomeCache();
    const newQueue = queue.filter((w) => w.id !== wordId);
    const newPool = poolRef.current.filter((w) => w.id !== wordId);
    poolRef.current = newPool;

    if (newQueue.length === 0 || idx >= newQueue.length) {
      setQueue(newQueue);
      setPhase('result');
      return;
    }
    const nextWord = newQueue[idx];
    setQueue(newQueue);
    setFeedback(null);
    setSaveError(null);
    setQuestion(buildQuestion(nextWord, nextWord._q_type ?? 'choice', newPool));
    setPhase('question');
  }

  async function checkShareTriggers() {
    try {
      const stats = await api.getStats();
      const streak = stats.streak ?? 0;

      if (await checkStreakShare(streak)) {
        const total = stats.total ?? 0;
        const mastered = stats.mastered ?? 0;
        setSharePayload({
          type: 'streak',
          streakDays: streak,
          savedWords: total,
          retentionRate: total > 0 ? Math.round((mastered / total) * 100) : 0,
          reviewedToday: correctRef.current + wrongRef.current,
        });
        return;
      }

      const mw = masteredWordRef.current;
      if (mw && await checkWordShare(mw.id)) {
        const daysToMaster = mw.created_at
          ? Math.max(1, Math.round((Date.now() - new Date(mw.created_at).getTime()) / 86400000))
          : 12;
        const reviewCount = (mw.reps ?? 4) + 1;
        setSharePayload({
          type: 'word_mastered',
          wordId: mw.id,
          word: mw.word,
          meaning: mw.meaning,
          reviewCount,
          daysToMaster,
          masteryRank: getMasteryRank(reviewCount, daysToMaster),
        });
      }
    } catch {
      // share trigger は非クリティカル
    }
  }

  async function checkNotificationTriggers() {
    try {
      const perm = await getPermissionStatus();
      if (perm !== 'granted') return;

      const [stats, settings] = await Promise.all([
        api.getStats(),
        api.getSettings().catch(() => ({})),
      ]);

      const milestoneEnabled = settings?.notification_milestone_enabled !== 0 &&
        settings?.notification_milestone_enabled !== '0';
      const streakEnabled = settings?.notification_streak_enabled !== 0 &&
        settings?.notification_streak_enabled !== '0';

      const mastered = stats.mastered ?? 0;
      const streak = stats.streak ?? 0;
      const milestones = [10, 25, 50, 100, 200, 500];
      const today = new Date().toISOString().slice(0, 10);

      if (milestoneEnabled && milestones.includes(mastered)) {
        const key = `koto_notif_milestone_${mastered}`;
        const sent = await AsyncStorage.getItem(key).catch(() => null);
        if (!sent) {
          await sendMilestoneNotification(mastered).catch(() => {});
          AsyncStorage.setItem(key, '1').catch(() => {});
        }
      }

      if (streakEnabled && streak > 0 && streak % 7 === 0) {
        const key = `koto_notif_streak_${streak}_${today}`;
        const sent = await AsyncStorage.getItem(key).catch(() => null);
        if (!sent) {
          await sendStreakNotification(streak).catch(() => {});
          AsyncStorage.setItem(key, '1').catch(() => {});
        }
      }
    } catch {
      // 非クリティカル
    }
  }

  async function next(wasCorrect = false) {
    // コンボ追跡
    if (wasCorrect) {
      comboRef.current += 1;
      if (comboRef.current === 5) {
        api.awardXp('combo_5').catch(() => {});
      }
      if (comboRef.current === 10) {
        // combo_10 バッジ条件（クライアント側で判定）
        api.awardXp('combo_5').catch(() => {}); // +10相当（combo_5を2回）
      }
    } else {
      comboRef.current = 0;
    }

    const nextIdx = idx + 1;
    if (nextIdx >= queue.length) {
      resetHomeCache();
      setPhase('result');
      api.awardXp('session_complete').catch(() => {});  // セッション完了 +30XP
      checkShareTriggers();
      checkNotificationTriggers();
      return;
    }
    const nextWord = queue[nextIdx];
    setIdx(nextIdx);
    setFeedback(null);
    setQuestion(buildQuestion(nextWord, nextWord._q_type ?? 'choice', poolRef.current));
    setPhase('question');
  }

  const word = queue[idx] as Word | undefined;

  return (
    <SafeAreaView style={styles.root}>
      {sharePayload && (
        <SharePrompt payload={sharePayload} onClose={() => setSharePayload(null)} />
      )}
      <View style={styles.modeBar}>
        {([
          ['scheduled', '復習'],
          ['free',      'クイズ'],
          ['weak',      '苦手語'],
        ] as [Mode, string][]).map(([m, label]) => (
          <TouchableOpacity
            key={m}
            style={[styles.modeTab, mode === m && styles.modeTabActive,
                    m === 'weak' && styles.modeTabWeak, m === 'weak' && mode === m && styles.modeTabWeakActive]}
            onPress={() => setMode(m)}
          >
            <Text style={[styles.modeTabText, mode === m && styles.modeTabTextActive,
                          m === 'weak' && mode !== m && styles.modeTabTextWeak]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {(phase === 'question' || phase === 'feedback') && queue.length > 0 && (
        <View style={styles.header}>
          <ProgressBar current={idx} total={queue.length} />
          <Text style={styles.scoreText}>✓{correct} ✕{wrong}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {phase === 'loading' && (
          <View style={styles.centered}>
            <KotoBird size={76} />
            <Text style={styles.loadingText}>準備中...</Text>
          </View>
        )}

        {phase === 'error' && (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{errorMsg}</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => loadQueue(mode)}>
              <Text style={styles.primaryBtnText}>再試行</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'empty' && (
          <View style={styles.centered}>
            <KotoBird size={82} />
            <Text style={styles.emptyTitle}>
              {mode === 'weak' ? '苦手語がまだありません' : '今日の復習は完了です'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {mode === 'weak'
                ? 'クイズ練習で間違えた単語が苦手語として記録されます。'
                : 'クイズ練習で腕試しをしましょう。'}
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setMode('free')}>
              <Text style={styles.primaryBtnText}>クイズ練習へ</Text>
            </TouchableOpacity>
          </View>
        )}

        {(phase === 'question' || phase === 'feedback') && word && question && (
          <>
            <QuizQuestion
              key={`${word.id}-${question.type}-${phase}`}
              question={question}
              onAnswer={phase === 'question' ? onAnswer : () => {}}
            />
            {phase === 'feedback' && (
              saveError ? (
                <View style={styles.saveErrorBox}>
                  <Text style={styles.saveErrorTitle}>復習結果を保存できませんでした</Text>
                  <Text style={styles.saveErrorSub}>通信状態を確認してもう一度お試しください。</Text>
                  <TouchableOpacity style={styles.primaryBtn} onPress={retryReview}>
                    <Text style={styles.primaryBtnText}>再試行</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.ghostBtn} onPress={skipSaveError}>
                    <Text style={styles.ghostBtnText}>スキップ（保存されません）</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {feedback && (
                    <View style={[styles.feedbackBar, feedback.correct ? styles.feedbackCorrect : styles.feedbackWrong]}>
                      <Text style={styles.feedbackText}>{feedback.msg}</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => next(feedback?.correct ?? false)}>
                    <Text style={styles.primaryBtnText}>
                      {idx + 1 >= queue.length ? '結果を見る' : '次へ'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteWordBtn} onPress={confirmDeleteWord} activeOpacity={0.7}>
                    <Text style={styles.deleteWordBtnText}>この単語を削除</Text>
                  </TouchableOpacity>
                </>
              )
            )}
          </>
        )}

        {phase === 'result' && (
          <ResultScreen
            correct={correct}
            wrong={wrong}
            mode={mode}
            onFree={() => setMode('free')}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── スタイル ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E1116' },
  content: { padding: 16, paddingBottom: 40, flexGrow: 1 },

  modeBar: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#1D2430',
    borderRadius: 10,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  modeTab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  modeTabActive: { backgroundColor: '#263041' },
  modeTabWeak: {},
  modeTabWeakActive: { backgroundColor: 'rgba(239,68,68,0.15)' },
  modeTabText: { color: '#6B7280', fontWeight: '600', fontSize: 13 },
  modeTabTextActive: { color: '#2DD4BF' },
  modeTabTextWeak: { color: '#EF4444' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  progressBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 99 },
  scoreText: {
    color: '#6B7280',
    fontSize: 12,
    minWidth: 60,
    textAlign: 'right',
    fontVariant: ['tabular-nums'] as any,
  },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, paddingVertical: 60 },
  loadingText: { color: '#9CA3AF', fontSize: 14 },
  errorText: { color: '#EF4444', fontSize: 15, textAlign: 'center' },
  emptyTitle: { color: '#F9FAFB', fontSize: 20, fontWeight: '500', textAlign: 'center' },
  emptySubtitle: { color: '#9CA3AF', fontSize: 14, textAlign: 'center' },

  questionWrap: { gap: 14 },
  questionCard: {
    backgroundColor: '#151A22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 160,
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
  contextText: { color: '#9CA3AF', fontSize: 13, fontStyle: 'italic', lineHeight: 18 },

  choicesGrid: { gap: 10 },
  choiceBtn: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  choiceCorrect: { borderColor: '#22C55E', backgroundColor: 'rgba(34,197,94,0.12)' },
  choiceWrong: { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.12)' },
  choiceDim: { opacity: 0.4 },
  choiceBtnText: { color: '#F9FAFB', fontSize: 15 },

  feedbackBar: { borderRadius: 10, padding: 14, marginTop: 4, borderWidth: 1 },
  feedbackCorrect: { backgroundColor: 'rgba(34,197,94,0.10)', borderColor: 'rgba(34,197,94,0.25)' },
  feedbackWrong: { backgroundColor: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.25)' },
  feedbackText: { color: '#F9FAFB', fontSize: 14, fontWeight: '600' },

  primaryBtn: {
    backgroundColor: '#2DD4BF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    width: '100%',
  },
  primaryBtnText: { color: '#0E1116', fontWeight: '700', fontSize: 16 },
  ghostBtn: { paddingVertical: 14, alignItems: 'center', width: '100%' },
  ghostBtnText: { color: '#6B7280', fontSize: 15 },

  deleteWordBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteWordBtnText: {
    color: '#6B7280',
    fontSize: 13,
    textDecorationLine: 'underline',
  },

  saveErrorBox: {
    borderRadius: 14,
    padding: 24,
    backgroundColor: 'rgba(239,68,68,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.22)',
    gap: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  saveErrorTitle: { color: '#EF4444', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  saveErrorSub: { color: '#9CA3AF', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  resultTitle: { color: '#F9FAFB', fontSize: 24, fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#151A22',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statNum: { fontSize: 28, fontWeight: '700' },
  statLbl: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
});
