---
name: design
description: デザイントークン・カラー・フォント・タイポグラフィの正しい値を調べるとき
---

# デザイントークン

唯一の正解: `anki_app/frontend/style.css` の `:root`

## カラートークン
| 変数 | 値 | 用途 |
|---|---|---|
| `--bg` | `#0E1116` | 画面背景 |
| `--surface` | `#151A22` | カード背景 |
| `--surface-2` | `#1D2430` | カード背景2 |
| `--surface-3` | `#263041` | アクティブ状態 |
| `--primary` | `#2DD4BF` | メインカラー（ティール） |
| `--accent` | `#4CC9F0` | アクセント（青） |
| `--text` | `#DCE2E8` | 本文テキスト |
| `--text-strong` | `#E9EDF2` | 強調テキスト |
| `--muted` | `#8F99A8` | ミュートテキスト（#6B7280は間違い） |
| `--faint` | `#64748B` | タブアイコン非アクティブ色 |
| `--border` | `rgba(255,255,255,0.08)` | 枠線 |
| `--border-strong` | `rgba(255,255,255,0.14)` | 強い枠線（復習カードなど） |
| `--success` | `#7CFFB2` | 正解色 |
| `--danger` | `#FF6B6B` | 不正解・エラー色 |
| `--warning` | `#F5B84B` | 警告色 |

## グラデーション（expo-linear-gradient）
| 箇所 | colors |
|---|---|
| ヒーロー背景 | `['#0E1116', '#121720']` |
| 復習カード | `['#1B2330', '#161D28']` |
| CTAカード外枠 | `['rgba(21,26,34,0.98)', 'rgba(29,36,48,0.98)']` |
| ストーリーリング | `['#1D2430', '#151A22']` |
| ストリップアイテム | `['rgba(21,26,34,0.99)', 'rgba(29,36,48,0.99)']` |

## フォント
- `LobsterTwo_700Bold` → 「Koto」ロゴ部分
- `SpaceGrotesk_700Bold` → 「Clip」ロゴ部分
- 両フォントは `_layout.tsx` の RootLayout で `useFonts` 読込済み

## タイポグラフィ（ホーム画面主要値）
| 要素 | fontSize | fontWeight | letterSpacing |
|---|---|---|---|
| statValue | 28 | '500' | -1.4 |
| statLabel | 10 | '500' | 1.4 |
| heroTitle | 26 | '400' | 0 |
| miniKoto | 30 | — (LobsterTwo) | — |
| miniClip | 25 | — (SpaceGrotesk) | — |
| reviewNumber | 56 | '500' | -3.92 |
| eyebrow | 11 | '700' | 1.54 (uppercase) |
| stripLabel | 10 | '500' | 1.0 |

## タブバー
- activeTintColor: `#2DD4BF`
- inactiveTintColor: `#64748B`（`--faint`）
- labelStyle: fontSize=10, fontWeight='400', letterSpacing=0.4
- height=80, paddingBottom=16

## KotoBird（コト）— 黄色い鳥キャラクター

**このアプリのキャラクターは1種類のみ。** 空状態・ローディング・ヒーローで使う。
絵文字・テキスト・他のアイコンで代替しない。

| プロパティ | 値 |
|---|---|
| ファイル | `components/KotoBird.tsx` |
| viewBox | `0 0 120 170` |
| デフォルトサイズ | `size=120`、高さは `size * (170/120)` |
| 体の色 | `#DDBE55`（黄） |
| クリップ（頭） | `#2FBF8F`（グリーン） |
| 翼 | `#D4B640` / 足 `#C4A830` |
| アニメーション | 上下ボビング -6px / 1400ms / repeat |

推奨サイズ:
```tsx
<KotoBird size={130} />   // ホーム空状態
<KotoBird size={110} />   // ホームヒーロー
<KotoBird size={100} />   // 単語帳空状態
<KotoBird size={88}  />   // 学習結果画面
<KotoBird size={82}  />   // 学習空状態
<KotoBird size={80}  />   // 使い方画面
<KotoBird size={76}  />   // ローディング
<KotoBird size={60}  />   // 問題カード右上
```
