import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── 型 ────────────────────────────────────────────────────────────────────

export interface StreakPayload {
  type: 'streak';
  streakDays: number;
  savedWords: number;
  retentionRate: number;
  reviewedToday: number;
}

export interface WordMasteredPayload {
  type: 'word_mastered';
  wordId: number;
  word: string;
  meaning: string;
  reviewCount: number;
  daysToMaster: number;
  masteryRank: 'S' | 'A' | 'B';
}

export type SharePayload = StreakPayload | WordMasteredPayload;

// ─── 発火条件 ────────────────────────────────────────────────────────────────

const STREAK_MILESTONES = [7, 30, 50, 80, 100];

function isStreakMilestone(days: number): boolean {
  if (STREAK_MILESTONES.includes(days)) return true;
  return days > 100 && (days - 100) % 20 === 0;
}

export function getMasteryRank(reviewCount: number, days: number): 'S' | 'A' | 'B' {
  if (reviewCount <= 5 && days <= 7) return 'S';
  if (reviewCount <= 7 && days <= 14) return 'A';
  return 'B';
}

// ─── AsyncStorage ──────────────────────────────────────────────────────────

const STORAGE_KEY = 'koto_share_state_v1';

interface ShareState {
  seenStreakMilestones: number[];
  seenWordIds: number[];
}

async function loadState(): Promise<ShareState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { seenStreakMilestones: [], seenWordIds: [] };
  } catch {
    return { seenStreakMilestones: [], seenWordIds: [] };
  }
}

async function saveState(s: ShareState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export async function checkStreakShare(days: number): Promise<boolean> {
  if (!isStreakMilestone(days)) return false;
  const s = await loadState();
  return !s.seenStreakMilestones.includes(days);
}

export async function checkWordShare(wordId: number): Promise<boolean> {
  const s = await loadState();
  return !s.seenWordIds.includes(wordId);
}

export async function markStreakSeen(days: number): Promise<void> {
  const s = await loadState();
  if (!s.seenStreakMilestones.includes(days)) {
    s.seenStreakMilestones.push(days);
    await saveState(s);
  }
}

export async function markWordSeen(wordId: number): Promise<void> {
  const s = await loadState();
  if (!s.seenWordIds.includes(wordId)) {
    s.seenWordIds.push(wordId);
    await saveState(s);
  }
}
