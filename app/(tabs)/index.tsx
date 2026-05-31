import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { KotoBird } from '@/components/KotoBird';
import { getCachedStats, getCachedWild, setCachedStats, setCachedWild, resetHomeCache } from '@/lib/homeCache';
import { computeLevel, xpProgressPct, xpToNextLevel, heroColors, kotoStage, KOTO_STAGE_LABELS } from '@/lib/gamification';

interface Stats {
  due: number;
  total: number;
  mastered: number;
  streak: number;
  reliable_count: number;
  today_count?: number;
  wild_known_count?: number;
  xp?: number;
}

interface Encounter {
  id: number;
  word: string;
  result: string;
}


function withTimeout<T>(promise: Promise<T>, fallback: T, ms = 35000): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(fallback);
      });
  });
}

const LOADING_MSGS = [
  '読み込み中...',
  'サーバーを起動中...',
  'もう少しお待ちください...',
  '接続に時間がかかっています',
];

function LoadingGauge() {
  const [progress, setProgress] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const totalMs = 30000;

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / totalMs) * 100, 96);
      setProgress(pct);
      if (elapsed > 15000) setMsgIdx(3);
      else if (elapsed > 8000) setMsgIdx(2);
      else if (elapsed > 3000) setMsgIdx(1);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={gaugeStyles.wrap}>
      <ActivityIndicator color="#2DD4BF" size="large" />
      <Text style={gaugeStyles.msg}>{LOADING_MSGS[msgIdx]}</Text>
      <View style={gaugeStyles.track}>
        <View style={[gaugeStyles.fill, { width: `${progress}%` as any }]} />
      </View>
    </View>
  );
}

const gaugeStyles = StyleSheet.create({
  wrap: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40, gap: 16 },
  msg: { color: '#8F99A8', fontSize: 13 },
  track: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: '#2DD4BF', borderRadius: 99 },
});

export default function HomeScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(getCachedStats() as Stats | null);
  const [wild, setWild] = useState<Encounter[]>(getCachedWild() as Encounter[]);
  const [loading, setLoading] = useState(getCachedStats() === null);
  const [netError, setNetError] = useState(false);
  const refreshing = useRef(false);

  const doFetch = useCallback(() => {
    if (refreshing.current) return;
    refreshing.current = true;

    if (getCachedStats() === null) setLoading(true);

    Promise.all([
      withTimeout<Stats | null>(api.getStats(), null),
      withTimeout<Encounter[]>(api.getTodayEncounters(), []),
    ])
      .then(([nextStats, nextWild]) => {
        if (nextStats !== null) {
          const w = Array.isArray(nextWild) ? nextWild : [];
          setCachedStats(nextStats);
          setCachedWild(w);
          setStats(nextStats);
          setWild(w);
          setNetError(false);
        } else if (getCachedStats() !== null) {
          setStats(getCachedStats() as Stats | null);
          setWild(getCachedWild() as Encounter[]);
        } else {
          setNetError(true);
        }
      })
      .finally(() => {
        refreshing.current = false;
        setLoading(false);
      });
  }, []);

  function retry() {
    resetHomeCache();
    setStats(null);
    setWild([]);
    setNetError(false);
    setLoading(true);
    refreshing.current = false;
    doFetch();
  }

  useFocusEffect(useCallback(() => {
    doFetch();
    return () => {};
  }, [doFetch]));

  const reliable = stats?.reliable_count ?? 0;
  const total    = stats?.total ?? 0;
  const pct      = total > 0 ? Math.min((reliable / total) * 100, 100) : 0;

  const progressText = total === 0
    ? '学習の進み具合'
    : reliable === 0
    ? 'クイズで自分の語彙を試そう'
    : `登録${total}語中 ${reliable}語を確実に習得`;

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <LoadingGauge />
        ) : netError ? (
          <View style={s.emptyWrap}>
            <KotoBird size={130} />
            <Text style={s.emptyTitle}>接続できませんでした</Text>
            <Text style={s.emptySub}>ネットワークを確認してもう一度お試しください。</Text>
            <TouchableOpacity style={s.emptyPrimary} onPress={retry} activeOpacity={0.8}>
              <Text style={s.emptyPrimaryText}>再試行</Text>
            </TouchableOpacity>
          </View>
        ) : total === 0 ? (
          <View style={s.emptyWrap}>
            <KotoBird size={130} />
            <View style={s.miniLogoRow}>
              <Text style={s.miniKoto}>Koto</Text>
              <View style={s.miniClipBox}>
                <Text style={s.miniClip}>Clip</Text>
              </View>
            </View>
            <Text style={s.emptyTitle}>まだ単語がありません</Text>
            <Text style={s.emptySub}>単語を追加して、語彙力アップの旅を始めましょう。</Text>
            <TouchableOpacity
              style={s.emptyPrimary}
              onPress={() => router.push('/(tabs)/add' as any)}
              activeOpacity={0.8}
            >
              <Text style={s.emptyPrimaryText}>最初の単語を追加する</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.emptyGhost}
              onPress={() => router.push('/how-to' as any)}
              activeOpacity={0.8}
            >
              <Text style={s.emptyGhostText}>スマホから保存する方法を見る</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.emptyGhost}
              onPress={() => router.push('/how-to' as any)}
              activeOpacity={0.8}
            >
              <Text style={s.emptyGhostText}>PCブラウザ拡張の使い方を見る</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── ヒーローセクション ── */}
            <LinearGradient
              colors={heroColors(computeLevel(stats?.xp ?? 0))}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={s.hero}
            >
              {/* 放射グロー（LinearGradientで近似） */}
              <LinearGradient
                colors={['rgba(45,212,191,0.08)', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.18, y: 0.16 }}
                end={{ x: 0.84, y: 0.76 }}
                pointerEvents="none"
              />

              <View style={s.heroTop}>
                <View style={s.mascotBlock}>
                  <KotoBird size={110} />
                </View>
                <View style={s.statPanel}>
                  <StatItem label="確実に習得" value={reliable} />
                  <StatItem label="登録語数"   value={total} />
                  <StatItem label="連続日数"   value={stats?.streak ?? 0} />
                </View>
              </View>

              <View style={s.brandCopy}>
                <View style={s.miniLogoRow}>
                  <Text style={s.miniKoto}>Koto</Text>
                  <View style={s.miniClipBox}>
                    <Text style={s.miniClip}>Clip</Text>
                  </View>
                </View>
                <Text style={s.heroTitle}>{progressText}</Text>
                {total > 0 && (
                  <Text style={s.heroCaption}>正答率75%以上かつ3回正解で「確実に習得」</Text>
                )}
              </View>

              {total > 0 && (
                <View style={s.progressTrack}>
                  <LinearGradient
                    colors={['#2DD4BF', '#4CC9F0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[s.progressFill, { width: `${pct}%` as any }]}
                  />
                </View>
              )}

              {/* XP / Level バー */}
              {(stats?.xp ?? 0) > 0 && (() => {
                const xp = stats!.xp!;
                const lv = computeLevel(xp);
                const prog = xpProgressPct(xp);
                const toNext = xpToNextLevel(xp);
                const stage = kotoStage(lv);
                return (
                  <View style={s.xpRow}>
                    <View style={s.xpLabelRow}>
                      <Text style={s.xpLvBadge}>Lv {lv}</Text>
                      <Text style={s.xpStageName}>{KOTO_STAGE_LABELS[stage]}</Text>
                      <Text style={s.xpToNext}>{lv < 30 ? `次まで ${toNext.toLocaleString()} XP` : 'MAX'}</Text>
                    </View>
                    <View style={s.xpTrack}>
                      <LinearGradient
                        colors={['#F5B84B', '#FFD700']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[s.xpFill, { width: `${prog}%` as any }]}
                      />
                    </View>
                  </View>
                );
              })()}
            </LinearGradient>

            {/* ── コンテンツ ── */}
            <View style={s.content}>

              {/* CTAカード */}
              <LinearGradient
                colors={['rgba(21,26,34,0.98)', 'rgba(29,36,48,0.98)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={s.ctaCard}
              >
                <Text style={s.eyebrow}>TODAY</Text>

                {/* 復習ボタン / 完了表示 */}
                {(stats?.due ?? 0) > 0 ? (
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/study' as any)}
                    activeOpacity={0.82}
                  >
                    <LinearGradient
                      colors={['#1B2330', '#161D28']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={s.reviewCard}
                    >
                      <View style={s.reviewCopy}>
                        <Text style={s.reviewTitle}>今日の復習</Text>
                      </View>
                      <View style={s.reviewMeta}>
                        <Text style={s.reviewNumber}>01</Text>
                        <Text style={s.reviewUnit}>{stats!.due}語</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View style={s.reviewDone}>
                    <Text style={s.reviewDoneText}>今日の復習は完了</Text>
                  </View>
                )}

                {/* 2カラムグリッド */}
                <View style={s.ctaGrid}>
                  <TouchableOpacity
                    style={[s.secondaryCard, s.secondaryCardAlt]}
                    onPress={() => router.push('/flashcard' as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.secondaryIcon}>🃏</Text>
                    <Text style={[s.secondaryTitle, s.secondaryTitleAlt]}>フラッシュカード</Text>
                    <Text style={s.secondarySub}>カードをめくって確認</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.secondaryCard}
                    onPress={() => router.push('/(tabs)/study' as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.secondaryIcon}>✏️</Text>
                    <Text style={s.secondaryTitle}>クイズ練習</Text>
                    <Text style={s.secondarySub}>4択で実力チェック</Text>
                  </TouchableOpacity>
                </View>

                {/* 手動追加カード */}
                <TouchableOpacity
                  style={s.addCard}
                  onPress={() => router.push('/(tabs)/add' as any)}
                  activeOpacity={0.82}
                >
                  <Text style={s.addTitle}>手動で単語を追加する</Text>
                  <Text style={s.addPlus}>+</Text>
                </TouchableOpacity>
              </LinearGradient>

              {/* ストリップ統計 */}
              <View style={s.strip}>
                <StripItem label="今日の復習" value={stats?.due ?? 0} accent />
                <StripItem label="今日覚えた"  value={stats?.today_count ?? 0} />
                <StripItem label="野生で認識"  value={stats?.wild_known_count ?? 0} />
                <StripItem label="定着済み"    value={stats?.mastered ?? 0} last />
              </View>

              {/* Today's Encounters */}
              {wild.length > 0 && (
                <LinearGradient
                  colors={['rgba(21,26,34,0.98)', 'rgba(29,36,48,0.98)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={s.storiesCard}
                >
                  <Text style={s.eyebrow}>{"TODAY'S ENCOUNTERS"}</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.storiesScroll}
                  >
                    {wild.map((enc) => {
                      const knew = enc.result === 'knew';
                      const shortWord = enc.word.length > 7 ? `${enc.word.slice(0, 6)}…` : enc.word;
                      return (
                        <View key={enc.id} style={s.storyItem}>
                          <LinearGradient
                            colors={['#1D2430', '#151A22']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={[s.storyRing, { borderColor: knew ? '#7CFFB2' : '#F5B84B' }]}
                          >
                            <Text style={s.storyWord}>{shortWord}</Text>
                          </LinearGradient>
                          <Text style={[s.storyLabel, { color: knew ? '#7CFFB2' : '#F5B84B' }]}>
                            {knew ? '覚えてた' : '曖昧'}
                          </Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </LinearGradient>
              )}

            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={s.statItem}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
    </View>
  );
}

function StripItem({ label, value, accent, last }: { label: string; value: number; accent?: boolean; last?: boolean }) {
  return (
    <LinearGradient
      colors={['rgba(21,26,34,0.99)', 'rgba(29,36,48,0.99)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[s.stripItem, last && s.stripItemLast]}
    >
      <Text style={[s.stripValue, accent && s.stripValueAccent]}>{value}</Text>
      <Text style={s.stripLabel}>{label}</Text>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#0E1116' },
  scroll: { paddingBottom: 40 },

  // ── 空状態 ──
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 60,
    gap: 14,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  emptySub: {
    fontSize: 14,
    color: '#8F99A8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  emptyPrimary: {
    width: '100%',
    backgroundColor: '#2DD4BF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyPrimaryText: {
    color: '#0E1116',
    fontWeight: '700',
    fontSize: 16,
  },
  emptyGhost: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyGhostText: {
    color: '#8F99A8',
    fontSize: 15,
  },

  // ── ヒーロー ──
  hero: {
    paddingTop: 28,
    paddingHorizontal: 18,
    paddingBottom: 26,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 18,
  },
  mascotBlock: { width: 110 },
  statPanel: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(29,36,48,0.86)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: {
    fontSize: 10,
    color: '#8F99A8',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '500',
    color: '#F8FAFC',
    letterSpacing: -1.4,
  },

  brandCopy: { marginBottom: 18 },
  miniLogoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginBottom: 14,
  },
  miniKoto: {
    color: '#F1F5F9',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -1.05,
    lineHeight: 32,
    fontFamily: 'LobsterTwo_700Bold',
  },
  miniClipBox: {
    borderWidth: 1,
    borderColor: 'rgba(245,184,75,0.82)',
    borderRadius: 5,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginBottom: 2,
  },
  miniClip: {
    color: '#7CF7DF',
    fontSize: 25,
    fontWeight: '700',
    letterSpacing: -1.45,
    lineHeight: 27,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '400',
    color: '#E9EDF2',
    lineHeight: 34,
    letterSpacing: 0,
  },
  heroCaption: {
    marginTop: 8,
    fontSize: 12,
    color: '#8F99A8',
    lineHeight: 18,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 99 },

  xpRow: { marginTop: 10, gap: 5 },
  xpLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  xpLvBadge: {
    backgroundColor: 'rgba(245,184,75,0.18)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: '700',
    color: '#F5B84B',
  },
  xpStageName: { fontSize: 11, color: '#8F99A8', flex: 1 },
  xpToNext: { fontSize: 11, color: '#64748B' },
  xpTrack: {
    height: 4,
    backgroundColor: 'rgba(245,184,75,0.12)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  xpFill: { height: '100%', borderRadius: 99 },

  // ── コンテンツ ──
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 4,
    gap: 18,
  },

  // Eyebrow
  eyebrow: {
    fontSize: 11,
    fontWeight: '400',
    color: '#8F99A8',
    letterSpacing: 1.54,
    marginBottom: 10,
    textTransform: 'uppercase',
  },

  // CTAカード（外枠）
  ctaCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    gap: 10,
  },

  // 復習カード
  reviewCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    padding: 18,
    paddingLeft: 20,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    minHeight: 146,
  },
  reviewCopy: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reviewTitle: {
    fontSize: 21,
    fontWeight: '500',
    color: '#F7F3EC',
    letterSpacing: -0.84,
  },
  reviewMeta: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  reviewNumber: {
    fontSize: 56,
    fontWeight: '500',
    color: '#4CC9F0',
    lineHeight: 56,
    letterSpacing: -3.92,
    fontVariant: ['tabular-nums'] as any,
  },
  reviewUnit: { fontSize: 13, color: 'rgba(247,243,236,0.78)' },

  // 復習完了
  reviewDone: {
    backgroundColor: 'rgba(29,36,48,0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  reviewDoneText: { color: '#DCE2E8', fontSize: 14 },

  // 2カラムグリッド
  ctaGrid: { flexDirection: 'row', gap: 10 },
  secondaryCard: {
    flex: 1,
    backgroundColor: '#192231',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.22)',
    padding: 16,
    minHeight: 130,
    gap: 6,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  secondaryCardAlt: {
    backgroundColor: '#1f1a2e',
    borderColor: 'rgba(167,139,250,0.25)',
  },
  secondaryIcon: { fontSize: 26, marginBottom: 2 },
  secondaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7CF7DF',
    letterSpacing: -0.5,
  },
  secondaryTitleAlt: { color: '#c4b5fd' },
  secondarySub: { fontSize: 12, color: '#8F99A8', lineHeight: 17 },

  // 手動追加カード
  addCard: {
    backgroundColor: '#151A22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 74,
  },
  addTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#DCE2E8',
    letterSpacing: -0.72,
  },
  addPlus: {
    fontSize: 32,
    lineHeight: 32,
    color: '#2DD4BF',
    fontWeight: '500',
  },

  // ストリップ
  strip: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  stripItem: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
  },
  stripItemLast: { borderRightWidth: 0 },
  stripValue: {
    fontSize: 18,
    fontWeight: '500',
    color: '#DCE2E8',
    letterSpacing: -0.72,
  },
  stripValueAccent: { color: '#4CC9F0' },
  stripLabel: {
    marginTop: 4,
    fontSize: 10,
    color: '#8F99A8',
    fontWeight: '500',
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  // Today's Encounters
  storiesCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    paddingBottom: 16,
  },
  storiesScroll: { gap: 14, paddingBottom: 6 },
  storyItem: { alignItems: 'center', gap: 4 },
  storyRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyWord: {
    fontSize: 10,
    fontWeight: '500',
    color: '#DCE2E8',
    textAlign: 'center',
    paddingHorizontal: 5,
    lineHeight: 13,
  },
  storyLabel: {
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 9,
  },
});
