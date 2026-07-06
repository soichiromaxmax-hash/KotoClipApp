import { useCallback, useState } from 'react';
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
  Linking,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';
import { api } from '@/lib/api';
import {
  requestPermission,
  getPermissionStatus,
  scheduleDailyReminder,
  cancelDailyReminder,
  scheduleWeeklySummary,
  cancelWeeklySummary,
  syncNotifications,
  isSettingOn,
} from '@/lib/notifications';

const LEARNING_LANGS = [
  { key: 'en', label: '英語' },
  { key: 'es', label: 'スペイン語' },
  { key: 'zh', label: '中国語' },
  { key: 'ja', label: '日本語' },
];

const NATIVE_LANGS = [
  { key: 'ja', label: '日本語' },
  { key: 'en', label: '英語' },
  { key: 'es', label: 'スペイン語' },
  { key: 'zh', label: '中国語' },
];

const NOTIF_ROWS = [
  { key: 'notification_daily_enabled',     label: '毎日のリマインダー' },
  { key: 'notification_streak_enabled',    label: 'ストリーク達成' },
  { key: 'notification_milestone_enabled', label: '定着語マイルストーン' },
  { key: 'notification_weekly_enabled',    label: '週次まとめ' },
];

const TIME_OPTIONS: string[] = [];
for (let h = 0; h <= 23; h++) {
  for (const m of [0, 30]) {
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

function isOn(settings: Record<string, any> | null, key: string) {
  return isSettingOn(settings?.[key]);
}

export default function SettingsScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<Record<string, any> | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showLearningLangPicker, setShowLearningLangPicker] = useState(false);
  const [showNativeLangPicker, setShowNativeLangPicker] = useState(false);
  const [notifPerm, setNotifPerm] = useState<'granted' | 'denied' | 'undetermined' | null>(null);

  useFocusEffect(useCallback(() => {
    api.getSettings().then((s) => {
      const data = s && typeof s === 'object' ? s : {};
      setSettings(data);
      syncNotifications(data).catch(() => {});
      api.syncLangToSharedStorage(data.native_lang, data.target_lang);
    }).catch(() => setSettings({}));
    getPermissionStatus().then(setNotifPerm);
  }, []));

  async function saveSetting(key: string, value: string | number) {
    const prevValue = settings?.[key];
    setSettings((s) => ({ ...(s ?? {}), [key]: value }));
    try {
      await api.updateSetting(key, value);
      setError('');
      flashSaved();
      if (key === 'native_lang') api.syncLangToSharedStorage(String(value), undefined);
      if (key === 'target_lang') api.syncLangToSharedStorage(undefined, String(value));
    } catch (e: any) {
      setSettings((s) => ({ ...(s ?? {}), [key]: prevValue }));
      setError(e.message || '設定の保存に失敗しました');
    }
  }

  async function toggle(key: string) {
    const currentlyOn = isOn(settings, key);
    const next = currentlyOn ? 0 : 1;
    saveSetting(key, next);

    if (next === 1) {
      const perm = await requestPermission();
      setNotifPerm(perm);
      if (perm === 'denied') {
        // 権限がないのでトグルを元に戻す
        saveSetting(key, 0);
        Alert.alert(
          '通知の許可が必要です',
          '設定アプリ → KotoClip → 通知 → 「通知を許可」をオンにしてください。',
          [
            { text: 'キャンセル', style: 'cancel' },
            { text: '設定を開く', onPress: () => Linking.openURL('app-settings:') },
          ]
        );
        return;
      }
    }

    if (key === 'notification_daily_enabled') {
      if (next === 1) {
        const time = settings?.notification_daily_time || '08:00';
        scheduleDailyReminder(time).catch(() => {});
      } else {
        cancelDailyReminder().catch(() => {});
      }
    }
    if (key === 'notification_weekly_enabled') {
      if (next === 1) {
        scheduleWeeklySummary().catch(() => {});
      } else {
        cancelWeeklySummary().catch(() => {});
      }
    }
  }

  async function handleRequestPermission() {
    const perm = await requestPermission();
    setNotifPerm(perm);
    if (perm === 'denied') {
      Alert.alert(
        '通知の許可が必要です',
        'iOSの設定でKotoClipの通知が無効になっています。\n\n設定アプリ → KotoClip → 通知 → 「通知を許可」をオンにしてください。',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '設定を開く', onPress: () => Linking.openURL('app-settings:') },
        ]
      );
    } else if (perm !== 'granted') {
      Linking.openURL('app-settings:');
    }
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
          <Text style={s.howToText}>単語の保存の仕方</Text>
          <Ionicons name="chevron-forward" size={16} color="#4B5563" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        {!!error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* プランカード */}
        {settings !== null && (
          <View style={s.planCard}>
            <View style={s.planRow}>
              <View style={s.planBadge}>
                <Text style={s.planBadgeText}>{settings.is_premium ? 'PREMIUM' : 'FREE'}</Text>
              </View>
              <Text style={s.planWordCount}>
                {settings.is_premium
                  ? `${settings.word_count ?? '—'}語（無制限）`
                  : `${settings.word_count ?? '—'} / ${settings.word_limit ?? 50}語`}
              </Text>
            </View>
            <View style={s.planTrack}>
              <View style={[
                s.planFill,
                settings.is_premium
                  ? { width: '100%' as any, backgroundColor: '#2DD4BF' }
                  : {
                      width: `${Math.min(((settings.word_count ?? 0) / (settings.word_limit ?? 50)) * 100, 100)}%` as any,
                      backgroundColor: (settings.word_count ?? 0) >= (settings.word_limit ?? 50) ? '#EF4444' : (settings.word_count ?? 0) >= 80 ? '#F59E0B' : '#2DD4BF',
                    },
              ]} />
            </View>
            {settings.is_premium ? (
              <TouchableOpacity
                style={[s.planUpgradeBtn, { opacity: 1 }]}
                activeOpacity={0.8}
                onPress={() => router.push('/paywall' as any)}
              >
                <Text style={s.planUpgradeText}>サブスクリプションを管理</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[s.planUpgradeBtn, { opacity: 1 }]}
                activeOpacity={0.8}
                onPress={() => router.push('/paywall' as any)}
              >
                <Text style={s.planUpgradeText}>プレミアムにアップグレード</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 学習設定 */}
        <Text style={s.sectionHeader}>学習設定</Text>
        <View style={[s.card, s.cardNoPad]}>
          {/* 学習言語 */}
          <TouchableOpacity
            style={[s.langRow, s.notifRowBorder]}
            onPress={() => setShowLearningLangPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={s.notifLabel}>学習言語</Text>
            <View style={s.langValueWrap}>
              <Text style={s.langValue}>
                {LEARNING_LANGS.find(l => l.key === (settings?.target_lang ?? 'en'))?.label ?? '英語'}
              </Text>
              <Text style={s.langChevron}>›</Text>
            </View>
          </TouchableOpacity>

          {/* 説明言語 */}
          <TouchableOpacity
            style={s.langRow}
            onPress={() => setShowNativeLangPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={s.notifLabel}>説明言語</Text>
            <View style={s.langValueWrap}>
              <Text style={s.langValue}>
                {NATIVE_LANGS.find(l => l.key === (settings?.native_lang ?? 'ja'))?.label ?? '日本語'}
              </Text>
              <Text style={s.langChevron}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 通知設定 */}
        <Text style={s.sectionHeader}>通知設定</Text>

        {/* 通知許可バナー */}
        {notifPerm !== 'granted' && (
          <TouchableOpacity
            style={s.permBanner}
            onPress={handleRequestPermission}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-off-outline" size={18} color="#F59E0B" />
            <View style={s.permBannerText}>
              <Text style={s.permBannerTitle}>通知が許可されていません</Text>
              <Text style={s.permBannerSub}>タップして通知を有効にする</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#F59E0B" />
          </TouchableOpacity>
        )}

        <View style={[s.card, s.cardNoPad]}>
          {NOTIF_ROWS.map((row, i) => (
            <View
              key={row.key}
              style={[s.notifRow, i < NOTIF_ROWS.length - 1 && s.notifRowBorder]}
            >
              <Text style={[s.notifLabel, { flex: 1 }]}>{row.label}</Text>
              <Toggle on={isOn(settings, row.key)} onPress={() => toggle(row.key)} />
            </View>
          ))}
        </View>

        {/* リマインダー時刻 */}
        <View style={[s.card, { marginTop: 12 }]}>
          <Text style={s.sectionTitle}>リマインダー時刻</Text>
          <TouchableOpacity
            style={s.timeRow}
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.7}
          >
            <Text style={s.timeValue}>{currentTime}</Text>
            <Text style={s.timeChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* iOS通知設定リンク */}
        <TouchableOpacity
          style={s.notifPermissionBtn}
          onPress={() => Linking.openURL('app-settings:')}
          activeOpacity={0.75}
        >
          <Ionicons name="settings-outline" size={16} color="#2DD4BF" />
          <Text style={s.notifPermissionText}>iOSの通知設定を開く</Text>
          <Ionicons name="chevron-forward" size={14} color="#4B5563" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

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

      {/* 学習言語ピッカー */}
      <Modal visible={showLearningLangPicker} transparent animationType="slide">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowLearningLangPicker(false)} />
        <View style={s.modalSheet}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>学習言語</Text>
            <TouchableOpacity onPress={() => setShowLearningLangPicker(false)}>
              <Text style={s.modalClose}>完了</Text>
            </TouchableOpacity>
          </View>
          {LEARNING_LANGS.map((lang) => {
            const active = (settings?.target_lang ?? 'en') === lang.key;
            return (
              <TouchableOpacity
                key={lang.key}
                style={[s.timeOption, active && s.timeOptionActive]}
                onPress={() => { saveSetting('target_lang', lang.key); setShowLearningLangPicker(false); }}
              >
                <Text style={[s.timeOptionText, active && s.timeOptionTextActive]}>{lang.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Modal>

      {/* 説明言語ピッカー */}
      <Modal visible={showNativeLangPicker} transparent animationType="slide">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowNativeLangPicker(false)} />
        <View style={s.modalSheet}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>説明言語</Text>
            <TouchableOpacity onPress={() => setShowNativeLangPicker(false)}>
              <Text style={s.modalClose}>完了</Text>
            </TouchableOpacity>
          </View>
          {NATIVE_LANGS.map((lang) => {
            const active = (settings?.native_lang ?? 'ja') === lang.key;
            return (
              <TouchableOpacity
                key={lang.key}
                style={[s.timeOption, active && s.timeOptionActive]}
                onPress={() => { saveSetting('native_lang', lang.key); setShowNativeLangPicker(false); }}
              >
                <Text style={[s.timeOptionText, active && s.timeOptionTextActive]}>{lang.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Modal>

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
                  if (isOn(settings, 'notification_daily_enabled')) {
                    scheduleDailyReminder(item).catch(() => {});
                  }
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
    marginBottom: 4,
  },
  sectionNote: {
    fontSize: 12,
    color: '#8F99A8',
    marginHorizontal: 16,
    marginBottom: 8,
    lineHeight: 17,
  },
  reminderNote: {
    fontSize: 12,
    color: '#8F99A8',
    marginBottom: 8,
    lineHeight: 17,
  },

  // 通知許可バナー
  permBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.30)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  permBannerText: { flex: 1 },
  permBannerTitle: { fontSize: 13, fontWeight: '700', color: '#F59E0B' },
  permBannerSub: { fontSize: 11, color: '#B45309', marginTop: 1 },

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
  notifSub: { fontSize: 12, color: '#8F99A8', marginTop: 2 },

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
  timeValue: { fontSize: 16, color: '#E9EDF2' },
  timeChevron: { fontSize: 20, color: '#8F99A8' },

  planCard: {
    marginHorizontal: 16,
    marginBottom: 4,
    backgroundColor: 'rgba(21,26,34,0.98)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    gap: 10,
  },
  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planBadge: {
    backgroundColor: 'rgba(45,212,191,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.3)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  planBadgeText: { color: '#2DD4BF', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  planWordCount: { color: '#8F99A8', fontSize: 13 },
  planTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' },
  planFill: { height: '100%', borderRadius: 99 },
  planUpgradeBtn: {
    backgroundColor: 'rgba(45,212,191,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.2)',
    paddingVertical: 10,
    alignItems: 'center',
    opacity: 0.6,
  },
  planUpgradeText: { color: '#2DD4BF', fontSize: 13, fontWeight: '600' },

  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    gap: 12,
  },
  langValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  langValue: { fontSize: 14, color: '#2DD4BF', fontWeight: '600' },
  langChevron: { fontSize: 18, color: '#4B5563' },

  notifPermissionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: 'rgba(45,212,191,0.07)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notifPermissionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2DD4BF',
  },

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
