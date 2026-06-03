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

/** Kotoステージの説明 */
export const KOTO_STAGE_LABELS: Record<number, string> = {
  1: 'ひよこ',
  2: '小学生',
  3: '高校生',
  4: 'ビジネス',
  5: '研究者',
  6: '卒業生',
};

/** レベル別のモチベーションメッセージ（Lv1〜30） */
export const LEVEL_MESSAGES: Record<number, string> = {
  1:  'さあ、はじめよう',
  2:  '最初の一歩を踏み出した',
  3:  '少しずつ言葉が増えてる',
  4:  '積み重ねが力になる',
  5:  'もうすぐ次のステージ！',
  6:  '学びへの好奇心が芽生えた',
  7:  '語彙ノートが増えていく',
  8:  '毎日が新しい発見',
  9:  '基礎がしっかり固まってきた',
  10: '折り返し地点通過！',
  11: '読む力が格段に上がってきた',
  12: '語彙が本当の武器になってきた',
  13: '文章の流れが見えてきた',
  14: '言葉の奥深さを知る',
  15: '半分クリア。ここからが本番',
  16: '使える英語への道を歩んでいる',
  17: '考え方が英語寄りになってきた',
  18: '表現の引き出しが増えた',
  19: '本物の自信がついてきた',
  20: '上級者の領域へ踏み込んだ',
  21: '言葉を研究する境地に達した',
  22: 'ニュアンスまで感じ取れる',
  23: '言語の構造が透けて見える',
  24: '思考が英語で動きはじめた',
  25: '頂上が見えてきた',
  26: '語彙の頂上付近',
  27: 'ここまで来る人は少ない',
  28: '言葉の本質に触れている',
  29: 'あと一歩で伝説の語彙力',
  30: '語彙マスター達成！',
};

