import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';

interface Encounter {
  id: number;
  word: string;
  meaning: string;
  result: string;
  is_early_reunion: boolean | number;
  source_url?: string;
  encountered_at: string;
  word_id?: number;
}

function formatTime(s: string) {
  try {
    return new Date(s).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return s.slice(11, 16);
  }
}

function EncounterCard({ enc, onPress }: { enc: Encounter; onPress: () => void }) {
  const knew = enc.result === 'knew';
  const isReunion = Boolean(enc.is_early_reunion);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {/* 左ライン */}
      <View style={[styles.sideLine, { backgroundColor: knew ? '#22C55E' : '#F59E0B' }]} />

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.wordBlock}>
            <Text style={styles.wordText}>{enc.word}</Text>
            {isReunion && <Text style={styles.reunionBadge}>✨ 再会</Text>}
          </View>
          <View style={[styles.resultBadge, knew ? styles.badgeKnew : styles.badgeUnsure]}>
            <Text style={[styles.resultText, knew ? styles.resultTextKnew : styles.resultTextUnsure]}>
              {knew ? '覚えてた' : '曖昧'}
            </Text>
          </View>
        </View>

        <Text style={styles.meaningText} numberOfLines={1}>{enc.meaning}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.timeText}>{formatTime(enc.encountered_at)}</Text>
          {enc.source_url ? (
            <Text style={styles.urlText} numberOfLines={1}>
              {enc.source_url.replace(/^https?:\/\//, '').slice(0, 40)}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function WildScreen() {
  const router = useRouter();
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [netError, setNetError] = useState(false);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setNetError(false);
    try {
      const data = await api.getTodayEncounters();
      if (Array.isArray(data)) {
        setEncounters(data);
        setNetError(false);
      } else {
        setNetError(true);
      }
    } catch {
      setNetError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(() => load(true), []);

  const knew = encounters.filter((e) => e.result === 'knew').length;
  const unsure = encounters.length - knew;

  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.title}>今日の野生検出</Text>

      {netError && !refreshing && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>読み込みに失敗しました</Text>
          <TouchableOpacity onPress={() => load()} activeOpacity={0.7}>
            <Text style={styles.retryText}>再試行</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* サマリー */}
      {encounters.length > 0 && (
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNum, { color: '#22C55E' }]}>{knew}</Text>
            <Text style={styles.summaryLabel}>覚えてた</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNum, { color: '#F59E0B' }]}>{unsure}</Text>
            <Text style={styles.summaryLabel}>曖昧</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNum, { color: '#2DD4BF' }]}>{encounters.length}</Text>
            <Text style={styles.summaryLabel}>合計</Text>
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color="#2DD4BF" style={{ marginTop: 40 }} />
      ) : encounters.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>👁</Text>
          <Text style={styles.emptyTitle}>今日はまだ出会いがありません</Text>
          <Text style={styles.emptySub}>ブラウジング中に Chrome Extension で単語が検出されると、ここに記録されます。</Text>
        </View>
      ) : (
        <FlatList
          data={encounters}
          keyExtractor={(e) => String(e.id)}
          renderItem={({ item }) => (
            <EncounterCard
              enc={item}
              onPress={() => {
                if (item.word_id) router.push(`/word/${item.word_id}` as any);
              }}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2DD4BF"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E1116' },
  title: { color: '#F9FAFB', fontSize: 22, fontWeight: '700', marginHorizontal: 16, marginTop: 16, marginBottom: 14 },
  errorBox: { marginHorizontal: 16, marginBottom: 12, backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', padding: 14, alignItems: 'center', gap: 6 },
  errorText: { color: '#EF4444', fontSize: 13 },
  retryText: { color: '#2DD4BF', fontSize: 13, fontWeight: '600' },

  summary: {
    flexDirection: 'row',
    backgroundColor: 'rgba(29,36,48,0.86)',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryNum: { fontSize: 28, fontWeight: '700' },
  summaryLabel: { color: '#9CA3AF', fontSize: 12 },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 4 },

  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },

  card: {
    flexDirection: 'row',
    backgroundColor: '#151A22',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  sideLine: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 4 },

  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  wordBlock: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  wordText: { color: '#F9FAFB', fontSize: 17, fontWeight: '700' },
  reunionBadge: { color: '#F59E0B', fontSize: 11, fontWeight: '600' },

  resultBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeKnew: { backgroundColor: 'rgba(34,197,94,0.15)' },
  badgeUnsure: { backgroundColor: 'rgba(245,158,11,0.15)' },
  resultText: { fontSize: 12, fontWeight: '700' },
  resultTextKnew: { color: '#22C55E' },
  resultTextUnsure: { color: '#F59E0B' },

  meaningText: { color: '#9CA3AF', fontSize: 13 },

  cardFooter: { flexDirection: 'row', gap: 10, marginTop: 2 },
  timeText: { color: '#6B7280', fontSize: 11 },
  urlText: { color: '#6B7280', fontSize: 11, flex: 1 },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: '#F9FAFB', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptySub: { color: '#6B7280', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
