import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// 設定値のON/OFF判定を共通化する。バックエンドは設定値を文字列で返すことがあり
// (例: "0")、Boolean("0") === true になってしまうため、素の Boolean() は使わない。
// 未設定(undefined/null)はデフォルトON、0/"0"/false/"false"は明示的なOFFとして扱う。
export function isSettingOn(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (value === 0 || value === '0' || value === false || value === 'false') return false;
  return Boolean(value);
}

export async function requestPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
  if (Platform.OS !== 'ios') return 'granted';
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return 'granted';
  const { status } = await Notifications.requestPermissionsAsync();
  return status as 'granted' | 'denied' | 'undetermined';
}

export async function getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  if (Platform.OS !== 'ios') return 'granted';
  const { status } = await Notifications.getPermissionsAsync();
  return status as 'granted' | 'denied' | 'undetermined';
}

export async function scheduleDailyReminder(time: string) {
  const [hour, minute] = time.split(':').map(Number);
  await Notifications.cancelScheduledNotificationAsync('daily_reminder').catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: 'daily_reminder',
    content: {
      title: '今日の復習をしましょう',
      body: '単語帳に復習が待っています。',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });
}

export async function cancelDailyReminder() {
  await Notifications.cancelScheduledNotificationAsync('daily_reminder').catch(() => {});
}

export async function scheduleWeeklySummary() {
  await Notifications.cancelScheduledNotificationAsync('weekly_summary').catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: 'weekly_summary',
    content: {
      title: '今週の学習まとめ',
      body: 'KotoClipで今週の語彙の成長を確認しましょう。',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      weekday: 2,
      hour: 9,
      minute: 0,
      repeats: true,
    },
  });
}

export async function cancelWeeklySummary() {
  await Notifications.cancelScheduledNotificationAsync('weekly_summary').catch(() => {});
}

export async function sendMilestoneNotification(mastered: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'マイルストーン達成！',
      body: `${mastered}語を完全に定着させました！`,
    },
    trigger: null,
  });
}

export async function sendStreakNotification(streak: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'ストリーク継続中！',
      body: `${streak}日連続で学習しています。`,
    },
    trigger: null,
  });
}

export async function syncNotifications(settings: Record<string, any>) {
  const perm = await getPermissionStatus();
  if (perm !== 'granted') return;

  const dailyOn = isSettingOn(settings.notification_daily_enabled);
  const weeklyOn = isSettingOn(settings.notification_weekly_enabled);

  if (dailyOn) {
    await scheduleDailyReminder(settings.notification_daily_time || '08:00');
  } else {
    await cancelDailyReminder();
  }

  if (weeklyOn) {
    await scheduleWeeklySummary();
  } else {
    await cancelWeeklySummary();
  }
}
