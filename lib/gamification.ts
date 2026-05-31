// レベルテーブル（Lv1〜30、インデックスはLv-1）
export const LEVEL_XP = [
  0, 80, 200, 380, 650, 1000, 1450, 2000, 2650, 3400,
  4300, 5300, 6450, 7750, 9200, 10800, 12550, 14450, 16500, 18700,
  21050, 23550, 26200, 29000, 31950, 35050, 38300, 41700, 45250, 49000,
];

export function computeLevel(xp: number): number {
  for (let i = LEVEL_XP.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP[i]) return i + 1;
  }
  return 1;
}

export function xpToNextLevel(xp: number): number {
  const lv = computeLevel(xp);
  if (lv >= 30) return 0;
  return LEVEL_XP[lv] - xp;
}

/** 現在レベル内の進捗率（0〜100） */
export function xpProgressPct(xp: number): number {
  const lv = computeLevel(xp);
  if (lv >= 30) return 100;
  const start = LEVEL_XP[lv - 1];
  const end   = LEVEL_XP[lv];
  return Math.round(((xp - start) / (end - start)) * 100);
}

/** レベルに対応するKotoステージ（1〜6） */
export function kotoStage(level: number): 1 | 2 | 3 | 4 | 5 | 6 {
  if (level <= 5)  return 1;
  if (level <= 10) return 2;
  if (level <= 15) return 3;
  if (level <= 20) return 4;
  if (level <= 25) return 5;
  return 6;
}

/** レベルに対応する背景テーマ名 */
export function bgTheme(level: number): string {
  if (level <= 5)  return '小さな机';
  if (level <= 10) return '語彙の部屋';
  if (level <= 15) return '読書の森';
  if (level <= 20) return '文脈の街';
  if (level <= 25) return '言葉の空';
  return 'KotoClip Library';
}

/** Kotoステージの説明 */
export const KOTO_STAGE_LABELS: Record<number, string> = {
  1: '初心者Koto',
  2: '学習者Koto',
  3: 'Scholar Koto',
  4: 'Researcher Koto',
  5: 'Word Wizard Koto',
  6: 'KotoClip Master',
};

// ── バッジ定義 ────────────────────────────────────────────────────────────

export const BADGE_DEFS = {
  first_word:  { name: 'はじめの一歩', desc: '初めて単語を保存',     xp: 50,  emoji: '📝' },
  streak_7:    { name: '7日連続',       desc: '7日連続達成',           xp: 100, emoji: '🔥' },
  streak_30:   { name: '30日連続',      desc: '30日連続達成',          xp: 300, emoji: '💎' },
  words_100:   { name: '100語保存',     desc: '100語保存',             xp: 200, emoji: '📚' },
  words_500:   { name: '500語保存',     desc: '500語保存',             xp: 300, emoji: '🏆' },
  mastered_50: { name: '50語定着',      desc: '50語を完全に定着',      xp: 200, emoji: '⭐' },
  weak_10:     { name: '苦手克服',      desc: '苦手語を10語克服',      xp: 150, emoji: '💪' },
  combo_10:    { name: '10問連続正解',  desc: '10問連続正解',          xp: 100, emoji: '🎯' },
  weekly_5:    { name: '週間完走',      desc: '1週間に5日学習',        xp: 100, emoji: '📅' },
  level_30:    { name: 'KotoClip Master', desc: 'Lv30到達',           xp: 500, emoji: '👑' },
} as const;

export type BadgeId = keyof typeof BADGE_DEFS;

// ── ヒーロー背景カラー（レベル帯ごと） ──────────────────────────────────

export const HERO_COLORS: Record<number, [string, string]> = {
  1: ['#1B2330', '#0E1116'],   // 1〜5: 暗い机
  2: ['#1A2535', '#0E1720'],   // 6〜10: 本棚の部屋
  3: ['#1A2820', '#0E1615'],   // 11〜15: 読書の森（緑みがかり）
  4: ['#1E2535', '#121825'],   // 16〜20: 文脈の街
  5: ['#1A1E35', '#0E1230'],   // 21〜25: 言葉の空（深い青）
  6: ['#2A1E10', '#1A1005'],   // 26〜30: Library（金みがかり）
};

export function heroColors(level: number): [string, string] {
  const stage = kotoStage(level);
  return HERO_COLORS[stage] ?? HERO_COLORS[1];
}
