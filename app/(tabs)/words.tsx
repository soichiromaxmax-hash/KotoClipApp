import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { KotoBird } from '@/components/KotoBird';

interface Word {
  id: number;
  word: string;
  meaning: string;
  part_of_speech?: string;
  reps?: number;
  is_favorite?: number | boolean;
  correct_count?: number;
  wrong_count?: number;
}

type FilterKey = 'all' | 'new' | 'learning' | 'mastered' | 'favorites';
type SortKey = 'created_desc' | 'alpha' | 'reps_desc';

function masteryInfo(reps: number) {
  if (reps >= 5) return { label: '定着済み', color: '#22C55E', dots: 5 };
  if (reps >= 3) return { label: '学習中',   color: '#2DD4BF', dots: 3 };
  if (reps >= 1) return { label: '覚えかけ', color: '#F59E0B', dots: 1 };
  return            { label: '未学習',   color: '#6B7280', dots: 0 };
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',       label: 'すべて' },
  { key: 'new',       label: '未学習' },
  { key: 'learning',  label: '学習中' },
  { key: 'mastered',  label: '定着済み' },
  { key: 'favorites', label: 'お気に入り' },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'created_desc', label: '登録順' },
  { key: 'alpha',        label: 'A-Z' },
  { key: 'reps_desc',    label: '学習回数' },
];

export default function WordsScreen() {
  const router = useRouter();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sort, setSort] = useState<SortKey>('created_desc');
  const [busyIds, setBusyIds] = useState<Record<number, boolean>>({});

  const [netError, setNetError] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [wordLimit, setWordLimit] = useState<number | null>(null); // null = 無制限（premium）
  const [totalWordCount, setTotalWordCount] = useState<number | null>(null);
  const initialized = useRef(false);

  function fetchWords() {
    let alive = true;
    if (!initialized.current) setLoading(true);
    api.listWords().then((data) => {
      if (!alive) return;
      if (Array.isArray(data)) {
        setWords(data);
        initialized.current = true;
        setNetError(false);
      }
      setLoading(false);
    }).catch(() => {
      if (!alive) return;
      setLoading(false);
      if (!initialized.current) setNetError(true);
    });
    return () => { alive = false; };
  }

  useFocusEffect(useCallback(() => {
    return fetchWords();
  }, []));

  useFocusEffect(useCallback(() => {
    api.getSettings().catch(() => null).then((s) => {
      if (!s) return;
      setIsPremium(!!s.is_premium);
      setWordLimit(s.is_premium ? null : (s.word_limit ?? null));
      if (s.word_count !== undefined) setTotalWordCount(s.word_count);
    });
  }, []));

  async function toggleFavorite(w: Word) {
    if (busyIds[w.id]) return;
    const next = w.is_favorite ? 0 : 1;
    setBusyIds((b) => ({ ...b, [w.id]: true }));
    setWords((prev) => prev.map((x) => x.id === w.id ? { ...x, is_favorite: next } : x));
    try {
      await api.toggleFavorite(w.id, Boolean(next));
    } catch {
      setWords((prev) => prev.map((x) => x.id === w.id ? { ...x, is_favorite: w.is_favorite } : x));
    } finally {
      setBusyIds((b) => ({ ...b, [w.id]: false }));
    }
  }

  const q = search.trim().toLowerCase();
  const filtered = words.filter((w) => {
    if (q && !w.word.toLowerCase().includes(q) && !(w.meaning ?? '').toLowerCase().includes(q)) return false;
    if (filter === 'favorites') return Boolean(w.is_favorite);
    if (filter === 'mastered')  return (w.reps ?? 0) >= 5;
    if (filter === 'learning')  return (w.reps ?? 0) >= 1 && (w.reps ?? 0) < 5;
    if (filter === 'new')       return (w.reps ?? 0) === 0;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'alpha')        return a.word.localeCompare(b.word);
    if (sort === 'reps_desc')    return (b.reps ?? 0) - (a.reps ?? 0);
    if (sort === 'created_desc') return b.id - a.id;
    return 0;
  });

  function renderItem({ item: w }: { item: Word }) {
    const m = masteryInfo(w.reps ?? 0);
    const total = (w.correct_count ?? 0) + (w.wrong_count ?? 0);
    const acc = total > 0 ? Math.round((w.correct_count ?? 0) / total * 100) : null;

    return (
      <TouchableOpacity
        style={styles.wordRow}
        onPress={() => router.push(`/word/${w.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.wordInfo}>
          <View style={styles.wordTopRow}>
            <Text style={styles.wordEn}>{w.word}</Text>
            {w.part_of_speech ? (
              <Text style={styles.pos}>{w.part_of_speech}</Text>
            ) : null}
          </View>
          <Text style={styles.wordJa} numberOfLines={1}>{w.meaning}</Text>
          <View style={styles.dotsRow}>
            {[...Array(5)].map((_, i) => (
              <View key={i} style={[styles.dot, i < m.dots && { backgroundColor: m.color }]} />
            ))}
            {acc !== null && <Text style={styles.accText}>{acc}%</Text>}
          </View>
        </View>

        <View style={styles.wordActions}>
          <View style={[styles.masteryBadge, { borderColor: m.color }]}>
            <Text style={[styles.masteryBadgeText, { color: m.color }]}>{m.label}</Text>
          </View>
          <TouchableOpacity
            onPress={() => toggleFavorite(w)}
            disabled={busyIds[w.id]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.star, Boolean(w.is_favorite) && styles.starActive]}>★</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  const displayCount = totalWordCount ?? words.length;
  const countPct = wordLimit ? Math.min((displayCount / wordLimit) * 100, 100) : 100;
  const countColor = wordLimit == null
    ? '#2DD4BF'
    : displayCount >= wordLimit ? '#EF4444' : displayCount >= wordLimit * 0.8 ? '#F59E0B' : '#2DD4BF';

  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.title}>単語帳</Text>

      {/* 単語数カウンター */}
      {!loading && displayCount > 0 && (
        <View style={styles.countBar}>
          <View style={styles.countRow}>
            <Text style={styles.countText}>
              <Text style={[styles.countNum, { color: countColor }]}>{displayCount}</Text>
              <Text style={styles.countSep}>
                {isPremium ? '語（無制限）' : ` / ${wordLimit ?? 50}語`}
              </Text>
            </Text>
            <Text style={[styles.countLabel, { color: countColor }]}>
              {isPremium
                ? 'プレミアム'
                : wordLimit != null && displayCount >= wordLimit
                ? '無料プランの上限です'
                : wordLimit != null && displayCount >= wordLimit * 0.8
                ? 'もうすぐ上限です'
                : '無料プラン'}
            </Text>
          </View>
          <View style={styles.countTrack}>
            <View style={[styles.countFill, { width: `${countPct}%` as any, backgroundColor: countColor }]} />
          </View>
        </View>
      )}

      {/* 検索 */}
      <TextInput
        style={styles.searchInput}
        placeholder="単語・意味で検索..."
        placeholderTextColor="#4B5563"
        value={search}
        onChangeText={setSearch}
        clearButtonMode="while-editing"
      />

      {/* フィルター */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipRow}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ソート */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sortScroll}
        contentContainerStyle={styles.sortRow}
      >
        <Text style={styles.sortLabel}>並び順:</Text>
        {SORTS.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.chip, sort === s.key && styles.chipActive]}
            onPress={() => setSort(s.key)}
          >
            <Text style={[styles.chipText, sort === s.key && styles.chipTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color="#2DD4BF" style={{ marginTop: 40 }} />
      ) : netError ? (
        <View style={styles.emptyFull}>
          <Text style={styles.emptyTitle}>読み込みに失敗しました</Text>
          <Text style={styles.emptySub}>通信状態を確認してもう一度お試しください。</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => { setNetError(false); fetchWords(); }}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyBtnText}>再試行</Text>
          </TouchableOpacity>
        </View>
      ) : words.length === 0 ? (
        <View style={styles.emptyFull}>
          <KotoBird size={100} />
          <Text style={styles.emptyTitle}>まだ単語がありません</Text>
          <Text style={styles.emptySub}>単語を追加して学習を始めましょう。</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push('/(tabs)/add' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyBtnText}>最初の単語を追加する</Text>
          </TouchableOpacity>
        </View>
      ) : sorted.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>該当する単語がありません</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(w) => String(w.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E1116' },
  title: { color: '#F9FAFB', fontSize: 22, fontWeight: '700', marginHorizontal: 16, marginTop: 16, marginBottom: 12 },

  countBar: { marginHorizontal: 16, marginBottom: 12, gap: 6 },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  countText: {},
  countNum: { fontSize: 14, fontWeight: '700' },
  countSep: { fontSize: 12, color: '#6B7280' },
  countLabel: { fontSize: 11, fontWeight: '600' },
  countTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' },
  countFill: { height: '100%', borderRadius: 99 },

  searchInput: {
    backgroundColor: '#151A22',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
    color: '#F9FAFB',
    marginHorizontal: 16,
    marginBottom: 10,
  },

  chipScroll: { marginBottom: 8, maxHeight: 46 },
  chipRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  sortScroll: { marginBottom: 12, maxHeight: 46 },
  sortRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, alignItems: 'center' },
  sortLabel: { color: '#6B7280', fontSize: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 38,
    borderRadius: 20,
    backgroundColor: '#151A22',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: { backgroundColor: '#2DD4BF', borderColor: '#2DD4BF' },
  chipText: { color: '#9CA3AF', fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#0E1116' },

  list: { paddingHorizontal: 16, paddingBottom: 40 },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  wordInfo: { flex: 1, gap: 3 },
  wordTopRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  wordEn: { color: '#F9FAFB', fontSize: 16, fontWeight: '600' },
  pos: { color: '#6B7280', fontSize: 11 },
  wordJa: { color: '#9CA3AF', fontSize: 13 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)' },
  accText: { color: '#6B7280', fontSize: 11, marginLeft: 4 },

  wordActions: { alignItems: 'flex-end', gap: 8 },
  masteryBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  masteryBadgeText: { fontSize: 10, fontWeight: '700' },
  star: { fontSize: 18, color: '#3D4A5C' },
  starActive: { color: '#F59E0B' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#6B7280', fontSize: 15 },

  emptyFull: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 8,
  },
  emptyBtn: {
    width: '100%',
    backgroundColor: '#2DD4BF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  emptyBtnText: {
    color: '#0E1116',
    fontWeight: '700',
    fontSize: 15,
  },
});
