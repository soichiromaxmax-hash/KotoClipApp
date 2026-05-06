import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { api } from '@/lib/api';

const NOTIF_ROWS = [
  { key: 'notification_daily_enabled',       label: '毎日の学習リマインダー',   sub: '設定時刻に1日1回' },
  { key: 'notification_streak_enabled',      label: 'ストリーク危機警告',       sub: '当日未学習の場合、21:00固定' },
  { key: 'notification_milestone_enabled',   label: 'マイルストーン通知',       sub: '定着語数が節目に達したとき' },
  { key: 'notification_weekly_enabled',      label: '週次サマリー',             sub: '毎週月曜 9:00' },
  { key: 'notification_reunion_enabled',     label: '偶然の再会通知',           sub: '学習後7日以内に再会したとき' },
  { key: 'notification_anniversary_enabled', label: '記念日通知',               sub: '登録から1ヶ月・1年' },
];

const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 22; h++) {
  for (const m of [0, 30]) {
    if (h === 22 && m === 30) break;
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

function Toggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[s.toggleTrack, on && s.toggleTrackOn]}
    >
      <View style={[s.toggleThumb, on && s.toggleThumbOn]} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<Record<string, any> | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    api.getSettings().then((s) => {
      setSettings(s && typeof s === 'object' ? s : {});
    }).catch(() => setSettings({}));
  }, []);

  async function saveSetting(key: string, value: string | number) {
    const prevValue = settings?.[key];
    setSettings((s) => ({ ...(s ?? {}), [key]: value }));
    try {
      await api.updateSetting(key, value);
      flashSaved();
    } catch (e: any) {
      setSettings((s) => ({ ...(s ?? {}), [key]: prevValue }));
      setError(e.message || '設定の保存に失敗しました');
    }
  }

  function toggle(key: string) {
    saveSetting(key, settings?.[key] ? 0 : 1);
  }

  function flashSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!settings) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.loading}>
          <ActivityIndicator color="#2DD4BF" />
        </View>
      </SafeAreaView>
    );
  }

  const currentTime = settings.notification_daily_time || '08:00';

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>設定</Text>

        {/* 使い方 */}
        <TouchableOpacity
          style={s.howToRow}
          onPress={() => router.push('/how-to' as any)}
          activeOpacity={0.75}
        >
          <Ionicons name="help-circle-outline" size={20} color="#2DD4BF" />
          <Text style={s.howToText}>KotoClipの使い方</Text>
          <Ionicons name="chevron-forward" size={16} color="#4B5563" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        {!!error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* 通知設定 */}
        <Text style={s.sectionHeader}>通知設定</Text>
        <View style={[s.card, s.cardNoPad]}>
          {NOTIF_ROWS.map((row, i) => (
            <View
              key={row.key}
              style={[s.notifRow, i < NOTIF_ROWS.length - 1 && s.notifRowBorder]}
            >
              <View style={s.notifText}>
                <Text style={s.notifLabel}>{row.label}</Text>
                <Text style={s.notifSub}>{row.sub}</Text>
              </View>
              <Toggle on={!!settings[row.key]} onPress={() => toggle(row.key)} />
            </View>
          ))}
        </View>

        {/* リマインダー時刻 */}
        <View style={[s.card, { marginTop: 12 }]}>
          <Text style={s.sectionTitle}>リマインダー時刻</Text>
          <TouchableOpacity
            style={[s.timeRow, !settings.notification_daily_enabled && s.timeRowDisabled]}
            onPress={() => settings.notification_daily_enabled && setShowTimePicker(true)}
            activeOpacity={settings.notification_daily_enabled ? 0.7 : 1}
          >
            <Text style={[s.timeValue, !settings.notification_daily_enabled && s.timeValueDisabled]}>
              {currentTime}
            </Text>
            <Text style={s.timeChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 注意書き */}
        <View style={s.noticeBox}>
          <Text style={s.noticeText}>
            iOSの通知許可が必要です。設定アプリ → KotoClip → 通知から許可してください。時刻変更後は再起動が必要な場合があります。
          </Text>
        </View>

        {saved && (
          <Text style={s.savedText}>保存しました</Text>
        )}

        {/* ログアウト */}
        <View style={s.logoutSection}>
          <TouchableOpacity
            style={s.logoutBtn}
            onPress={() =>
              Alert.alert(
                'ログアウト',
                'ログアウトしますか？',
                [
                  { text: 'キャンセル', style: 'cancel' },
                  { text: 'ログアウト', style: 'destructive', onPress: logout },
                ],
              )
            }
            activeOpacity={0.8}
          >
            <Text style={s.logoutText}>ログアウト</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 時刻ピッカー モーダル */}
      <Modal visible={showTimePicker} transparent animationType="slide">
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTimePicker(false)}
        />
        <View style={s.modalSheet}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>リマインダー時刻</Text>
            <TouchableOpacity onPress={() => setShowTimePicker(false)}>
              <Text style={s.modalClose}>完了</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={TIME_OPTIONS}
            keyExtractor={(t) => t}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.timeOption, item === currentTime && s.timeOptionActive]}
                onPress={() => {
                  saveSetting('notification_daily_time', item);
                  setShowTimePicker(false);
                }}
              >
                <Text style={[s.timeOptionText, item === currentTime && s.timeOptionTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            style={{ maxHeight: 320 }}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E1116' },

  howToRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(45,212,191,0.07)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  howToText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2DD4BF',
  },
  scroll: { paddingBottom: 60 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F9FAFB',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },

  errorBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.28)',
    padding: 12,
  },
  errorText: { color: '#EF4444', fontSize: 13 },

  card: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(21,26,34,0.98)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    gap: 8,
  },
  cardNoPad: { padding: 0, overflow: 'hidden', gap: 0 },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F9FAFB',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },

  // 通知
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    gap: 12,
  },
  notifRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  notifText: { flex: 1 },
  notifLabel: { fontSize: 14, fontWeight: '600', color: '#E9EDF2' },
  notifSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  // トグル
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#263041',
    justifyContent: 'center',
    padding: 2,
    flexShrink: 0,
  },
  toggleTrackOn: { backgroundColor: '#2DD4BF', borderColor: '#2DD4BF' },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F8FAFC',
    alignSelf: 'flex-start',
  },
  toggleThumbOn: { alignSelf: 'flex-end' },

  // 時刻
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#151A22',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  timeRowDisabled: { opacity: 0.4 },
  timeValue: { fontSize: 16, color: '#E9EDF2' },
  timeValueDisabled: { color: '#6B7280' },
  timeChevron: { fontSize: 20, color: '#6B7280' },

  // 注意
  noticeBox: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(245,184,75,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(156,103,22,0.20)',
  },
  noticeText: { fontSize: 12, color: '#A07830', lineHeight: 18 },

  savedText: {
    textAlign: 'center',
    color: '#22C55E',
    marginTop: 12,
    fontSize: 13,
    fontWeight: '700',
  },

  // ログアウト
  logoutSection: {
    marginHorizontal: 16,
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(181,49,67,0.20)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },

  // 時刻モーダル
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    backgroundColor: '#1D2430',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#F9FAFB' },
  modalClose: { fontSize: 15, color: '#2DD4BF', fontWeight: '600' },
  timeOption: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  timeOptionActive: { backgroundColor: 'rgba(45,212,191,0.08)' },
  timeOptionText: { fontSize: 16, color: '#E9EDF2' },
  timeOptionTextActive: { color: '#2DD4BF', fontWeight: '600' },
});
