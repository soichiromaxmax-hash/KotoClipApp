import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const MINT = '#7CF7DF';
const GOLD = '#F5B84B';
const BG = '#0E1116';
const TEXT = '#CBD5E1';
const MUTED = '#8F99A8';
const STRONG = '#F9FAFB';
const TEAL = '#2DD4BF';

// ── Illustration building blocks ──────────────────────────────────────────────

function KotoIcon() {
  return (
    <View style={il.kotoShell}>
      <View style={il.kotoLeaf} />
      <View style={il.kotoBody}>
        <View style={[il.kotoEye, { left: 3 }]} />
        <View style={[il.kotoEye, { right: 3 }]} />
      </View>
    </View>
  );
}

function AppIcon({ label, active, koto }: { label: string; active?: boolean; koto?: boolean }) {
  return (
    <View style={il.appItem}>
      <View style={[il.appIcon, active && il.appIconActive]}>
        {koto ? <KotoIcon /> : <Text style={il.appIconText}>{label[0]}</Text>}
      </View>
      <Text style={[il.appLabel, active && { color: GOLD }]}>{label}</Text>
    </View>
  );
}

// ── Step illustrations ────────────────────────────────────────────────────────

// スマホ初回 Step 1: 単語を選んで「共有」をタップ
function IllusWordMenu() {
  return (
    <View style={il.frame}>
      <View style={il.articleBox}>
        <View style={il.textLine} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 6 }}>
          <View style={[il.textLine, { flex: 0, width: 32, marginVertical: 0 }]} />
          <View style={il.selectedWord}><Text style={il.selectedWordText}>subtle</Text></View>
          <View style={[il.textLine, { flex: 0, width: 24, marginVertical: 0 }]} />
        </View>
        <View style={il.textLine} />
      </View>
      <View style={il.menu}>
        <Text style={il.menuItem}>コピー</Text>
        <View style={il.menuSep} />
        <Text style={il.menuItem}>調べる</Text>
        <View style={il.menuSep} />
        <Text style={il.menuItemHL}>共有</Text>
      </View>
      <Text style={il.hint}>「共有」をタップ</Text>
    </View>
  );
}

// スマホ初回 Step 2: アプリ一覧を右スクロールして「その他」
function IllusAppListScroll() {
  return (
    <View style={il.frame}>
      <View style={il.sheetBox}>
        <Text style={il.sheetTitle}>共有</Text>
        <View style={il.appRow}>
          <AppIcon label="Message" />
          <AppIcon label="Mail" />
          <AppIcon label="Copy" />
          <View style={il.appItem}>
            <View style={[il.appIcon, il.appIconGold]}>
              <Text style={[il.appIconText, { color: BG }]}>…</Text>
            </View>
            <Text style={[il.appLabel, { color: GOLD }]}>その他</Text>
          </View>
        </View>
        <View style={il.scrollRow}>
          <Ionicons name="arrow-forward" size={13} color={GOLD} />
          <Text style={il.scrollText}>右にスクロールして「その他」</Text>
        </View>
      </View>
    </View>
  );
}

// スマホ初回 Step 3: 「その他」パネルでKotoClipをオン
function IllusToggleKoto() {
  return (
    <View style={il.frame}>
      <View style={il.panelBox}>
        <View style={il.panelHead}>
          <Text style={il.panelHeadText}>その他</Text>
          <Text style={il.panelEdit}>編集</Text>
        </View>
        <View style={il.panelRow}>
          <KotoIcon />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={il.panelRowTitle}>KotoClip</Text>
            <Text style={il.panelRowSub}>共有先に表示</Text>
          </View>
          <View style={il.toggleOn}>
            <View style={il.toggleKnob} />
          </View>
        </View>
      </View>
      <Text style={il.hint}>KotoClipをオンにして完了</Text>
    </View>
  );
}

// スマホ保存 Step 1: 単語を長押しで選択
function IllusLongPress() {
  return (
    <View style={il.frame}>
      <View style={il.articleBox}>
        <View style={il.textLine} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 6 }}>
          <View style={[il.textLine, { flex: 0, width: 32, marginVertical: 0 }]} />
          <View style={il.selectedWord}><Text style={il.selectedWordText}>subtle</Text></View>
          <View style={[il.textLine, { flex: 0, width: 24, marginVertical: 0 }]} />
        </View>
        <View style={il.textLine} />
      </View>
      <Text style={il.hint}>単語を長押しして選択</Text>
    </View>
  );
}

// スマホ保存 Step 2: 共有シートでKotoClipを選ぶ
function IllusShareKoto() {
  return (
    <View style={il.frame}>
      <View style={il.sheetBox}>
        <Text style={il.sheetTitle}>共有</Text>
        <View style={il.appRow}>
          <AppIcon label="Message" />
          <AppIcon label="KotoClip" active koto />
          <AppIcon label="その他" />
        </View>
        <Text style={il.hint}>KotoClipをタップ</Text>
      </View>
    </View>
  );
}

// スマホ保存 Step 3: 保存完了トースト
function IllusSavedToast() {
  return (
    <View style={il.frame}>
      <View style={il.toast}>
        <Ionicons name="checkmark-circle" size={16} color={BG} />
        <Text style={il.toastText}>訳・文脈・保存元つきで保存しました</Text>
      </View>
      <Text style={il.hint}>自動的に単語帳へ追加されます</Text>
    </View>
  );
}

// PCブラウザ初回 Step 1: ストアで追加
function IllusStoreInstall() {
  return (
    <View style={il.frame}>
      <View style={il.storeBox}>
        <View style={il.searchBar}>
          <Ionicons name="search" size={11} color="#64748B" />
          <Text style={il.searchText}>KotoClip を検索</Text>
        </View>
        <View style={il.storeCard}>
          <View style={il.kIconShell}><Text style={il.kIconText}>K</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={il.storeTitle}>KotoClip Extension</Text>
            <Text style={il.storeSub}>英単語をKotoClipへ保存</Text>
          </View>
          <View style={il.addBtn}><Text style={il.addBtnText}>追加</Text></View>
        </View>
      </View>
    </View>
  );
}

// PCブラウザ初回 Step 2: ログイン
function IllusLoginScreen() {
  return (
    <View style={il.frame}>
      <View style={il.loginBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <View style={il.kIconShell}><Text style={il.kIconText}>K</Text></View>
          <Text style={il.loginTitle}>KotoClipにログイン</Text>
        </View>
        <View style={il.loginField} />
        <View style={[il.loginField, { marginTop: 8, width: '70%' }]} />
        <View style={il.loginBtn}><Text style={il.loginBtnText}>ログイン</Text></View>
      </View>
    </View>
  );
}

// PCブラウザ保存 Step 1: 単語をドラッグ選択
function IllusBrowserSelect() {
  return (
    <View style={il.frame}>
      <View style={il.browserBox}>
        <View style={il.chromeBar}>
          <View style={il.dot} /><View style={il.dot} /><View style={il.dot} />
          <View style={il.addrBar} />
        </View>
        <View style={il.textLine} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 6 }}>
          <View style={[il.textLine, { flex: 0, width: 28, marginVertical: 0 }]} />
          <View style={il.selectedWord}><Text style={il.selectedWordText}>stick</Text></View>
          <View style={[il.textLine, { flex: 0, width: 36, marginVertical: 0 }]} />
        </View>
        <View style={il.textLine} />
      </View>
      <Text style={il.hint}>ドラッグして単語を選択</Text>
    </View>
  );
}

// PCブラウザ保存 Step 2: Kボタンが出現
function IllusKButton() {
  return (
    <View style={il.frame}>
      <View style={il.browserBox}>
        <View style={il.chromeBar}>
          <View style={il.dot} /><View style={il.dot} /><View style={il.dot} />
          <View style={il.addrBar} />
        </View>
        <View style={il.textLine} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 6 }}>
          <View style={[il.textLine, { flex: 0, width: 28, marginVertical: 0 }]} />
          <View style={il.selectedWord}><Text style={il.selectedWordText}>stick</Text></View>
          <View style={il.kBubble}><Text style={il.kBubbleText}>K</Text></View>
        </View>
        <View style={il.textLine} />
      </View>
      <Text style={il.hint}>KotoClipボタンをクリック</Text>
    </View>
  );
}

// PCブラウザ保存 Step 3: 拡張機能ポップアップ
function IllusExtPopup() {
  return (
    <View style={il.frame}>
      <View style={il.popupBox}>
        <Text style={il.popupBrand}>KotoClip</Text>
        <Text style={il.popupWord}>stick</Text>
        <Text style={il.popupMeaning}>定着する / 残る</Text>
        <View style={il.saveBtn}><Text style={il.saveBtnText}>保存する</Text></View>
      </View>
    </View>
  );
}

// ── Step / GuideBlock ─────────────────────────────────────────────────────────

type StepDef = { text: string; illus?: React.ReactNode };

function Pill({ children }: { children: string }) {
  return (
    <View style={s.pill}>
      <Text style={s.pillText}>{children}</Text>
    </View>
  );
}

function Step({ n, text, illus }: { n: number; text: string; illus?: React.ReactNode }) {
  return (
    <View style={s.stepCard}>
      <View style={s.stepRow}>
        <View style={s.stepNum}><Text style={s.stepNumText}>{n}</Text></View>
        <Text style={s.stepText}>{text}</Text>
      </View>
      {illus != null && <View style={s.stepIllus}>{illus}</View>}
    </View>
  );
}

function GuideBlock({ badge, title, copy, steps }: {
  badge: string; title: string; copy: string; steps: StepDef[];
}) {
  return (
    <View style={s.guideBlock}>
      <View style={s.blockHeader}>
        <Pill>{badge}</Pill>
        <Text style={s.blockTitle}>{title}</Text>
        <Text style={s.blockCopy}>{copy}</Text>
      </View>
      <View style={s.steps}>
        {steps.map((step, i) => (
          <Step key={i} n={i + 1} text={step.text} illus={step.illus} />
        ))}
      </View>
    </View>
  );
}

// ── Step data ─────────────────────────────────────────────────────────────────

const PHONE_SETUP: StepDef[] = [
  {
    text: 'SafariやChromeで単語を選び、\n「共有」を押します。',
    illus: <IllusWordMenu />,
  },
  {
    text: '共有シートを右にスクロールし、\n「その他」をタップします。',
    illus: <IllusAppListScroll />,
  },
  {
    text: '一覧からKotoClipをタップすれば、\nその場で保存できます。\nよく使うならオンにしておくと、\n次回から一覧に表示されて便利です。',
    illus: <IllusToggleKoto />,
  },
];

const PHONE_SAVE: StepDef[] = [
  {
    text: '保存したい単語を長押しして選択します。',
    illus: <IllusLongPress />,
  },
  {
    text: '表示されたメニューから\n「共有」を押します。\n見えない場合は\nメニューを横にスワイプします。',
    illus: <IllusShareKoto />,
  },
  {
    text: '訳・文脈・保存元URLが付いて、\n単語帳に自動保存されます。',
    illus: <IllusSavedToast />,
  },
];

const BROWSER_SETUP: StepDef[] = [
  {
    text: 'Chromeは Chrome Web Store を、\nEdgeは Edge Add-ons を開きます。\n「KotoClip」を検索して\n追加してください。',
    illus: <IllusStoreInstall />,
  },
  {
    text: 'KotoClipを開きます。\nスマホアプリと同じ\nアカウントでログインしてください。',
    illus: <IllusLoginScreen />,
  },
];

const BROWSER_SAVE: StepDef[] = [
  {
    text: '英語ページで保存したい\n単語をドラッグして選択します。',
    illus: <IllusBrowserSelect />,
  },
  {
    text: '選択した単語の近くに出る\nKotoClipボタンを押します。',
    illus: <IllusKButton />,
  },
  {
    text: '訳・例文・保存元URLを確認して、\n「保存する」を押します。\nスマホアプリに同期されます。',
    illus: <IllusExtPopup />,
  },
  {
    text: '訳が表示されない場合は、\n単語を選択して右クリックし、\n「KotoClipに保存」を\n選ぶと保存できます。',
  },
];

// ── Screen ────────────────────────────────────────────────────────────────────

export default function HowToScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'phone' | 'browser'>('phone');

  return (
    <SafeAreaView style={s.root}>
      <View style={s.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={STRONG} />
          <Text style={s.backText}>戻る</Text>
        </TouchableOpacity>
        <Text style={s.navTitle}>KotoClipの使い方</Text>
      </View>

      <View style={s.tabBar}>
        <TouchableOpacity
          style={[s.tabBtn, tab === 'phone' && s.tabBtnActive]}
          onPress={() => setTab('phone')}
          activeOpacity={0.8}
        >
          <Text style={[s.tabBtnText, tab === 'phone' && s.tabBtnTextActive]}>📱 スマホ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabBtn, tab === 'browser' && s.tabBtnActive]}
          onPress={() => setTab('browser')}
          activeOpacity={0.8}
        >
          <Text style={[s.tabBtnText, tab === 'browser' && s.tabBtnTextActive]}>💻 PCブラウザ</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {tab === 'phone' ? (
          <>
            <GuideBlock
              badge="初回のみ"
              title={'共有シートで\nKotoClipを見つけます。'}
              copy={'「その他」の中からタップするだけで使えます。\nよく使う場合はお気に入りに登録すると、\n次回から一覧にすぐ表示されます。'}
              steps={PHONE_SETUP}
            />
            <GuideBlock
              badge="保存方法"
              title={'読んでいるページから、\nそのまま保存します。'}
              copy={'初回設定が済んでいれば、\n毎回この手順だけで保存できます。'}
              steps={PHONE_SAVE}
            />
          </>
        ) : (
          <>
            <GuideBlock
              badge="初回のみ"
              title={'拡張機能を入れて、\nログインします。'}
              copy={'一度だけ必要な設定です。\n設定後は「保存方法」の手順だけで使えます。'}
              steps={BROWSER_SETUP}
            />
            <GuideBlock
              badge="保存方法"
              title={'PCで読んだ単語を、\nスマホの単語帳へ送ります。'}
              copy={'単語を選択すると、\nページ上にKotoClipボタンが表示されます。'}
              steps={BROWSER_SAVE}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  scroll: { paddingBottom: 52, paddingTop: 8 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    color: STRONG,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 40,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4, paddingHorizontal: 4 },
  backText: { color: STRONG, fontSize: 16 },
  tabBar: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 4,
    backgroundColor: '#1D2430',
    borderRadius: 10,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#263041' },
  tabBtnText: { color: MUTED, fontWeight: '600', fontSize: 14 },
  tabBtnTextActive: { color: TEAL },
  guideBlock: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 15,
    gap: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(24,30,40,0.94)',
  },
  blockHeader: { alignItems: 'flex-start', gap: 8 },
  pill: {
    minWidth: 60,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(124,247,223,0.22)',
    backgroundColor: 'rgba(124,247,223,0.10)',
  },
  pillText: { color: '#9DEEE1', fontSize: 12, fontWeight: '800' },
  blockTitle: { color: STRONG, fontSize: 17, lineHeight: 25, fontWeight: '700' },
  blockCopy: { color: MUTED, fontSize: 13, lineHeight: 20, marginTop: 4 },
  steps: { gap: 10 },
  stepCard: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 11,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: MINT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumText: { color: BG, fontSize: 13, fontWeight: '900' },
  stepText: { flex: 1, color: TEXT, fontSize: 13, lineHeight: 21, paddingTop: 3 },
  stepIllus: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
});

const il = StyleSheet.create({
  frame: {
    padding: 14,
    minHeight: 120,
    backgroundColor: '#0F141C',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  // テキスト選択メニュー
  articleBox: {
    width: '90%',
    backgroundColor: '#18202B',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  textLine: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#2A3548',
    marginVertical: 5,
  },
  selectedWord: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(124,247,223,0.26)',
  },
  selectedWordText: { color: STRONG, fontSize: 14, fontWeight: '900' },
  menu: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  menuItemHL: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '900',
  },
  menuSep: { width: 1, height: 26, backgroundColor: 'rgba(0,0,0,0.12)' },
  hint: { color: GOLD, fontSize: 12, fontWeight: '700', textAlign: 'center' },

  // 共有シート
  sheetBox: {
    width: '90%',
    backgroundColor: 'rgba(248,250,252,0.96)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: { color: '#475569', fontSize: 11, fontWeight: '800' },
  appRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  appItem: { width: 52, alignItems: 'center', gap: 4 },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconActive: { backgroundColor: BG, borderWidth: 1.5, borderColor: GOLD },
  appIconGold: { backgroundColor: GOLD },
  appIconText: { color: '#17202B', fontSize: 11, fontWeight: '900' },
  appLabel: { color: '#334155', fontSize: 9, textAlign: 'center' },
  scrollRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  scrollText: { color: GOLD, fontSize: 11, fontWeight: '700' },

  // 「その他」パネル
  panelBox: {
    width: '90%',
    backgroundColor: 'rgba(248,250,252,0.96)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  panelHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  panelHeadText: { color: '#1E293B', fontSize: 12, fontWeight: '800' },
  panelEdit: { color: '#0F766E', fontSize: 12, fontWeight: '600' },
  panelRow: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  panelRowTitle: { color: '#1E293B', fontSize: 13, fontWeight: '700' },
  panelRowSub: { color: '#64748B', fontSize: 10 },
  toggleOn: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#22C55E',
    padding: 3,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF' },

  // KotoClipアイコン（鳥）
  kotoShell: { position: 'relative', width: 28, height: 28, alignItems: 'center', justifyContent: 'flex-end' },
  kotoLeaf: {
    position: 'absolute',
    top: 1,
    left: 14,
    width: 12,
    height: 8,
    borderRadius: 6,
    backgroundColor: '#58D47B',
    transform: [{ rotate: '-18deg' }],
  },
  kotoBody: { width: 15, height: 22, borderRadius: 999, backgroundColor: '#F2CC42', marginBottom: 1 },
  kotoEye: { position: 'absolute', top: 8, width: 4, height: 4, borderRadius: 2, backgroundColor: BG },

  // トースト
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: MINT,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '90%',
  },
  toastText: { color: BG, fontSize: 12, fontWeight: '800', flex: 1 },

  // ブラウザ
  browserBox: {
    width: '90%',
    backgroundColor: '#18202B',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  chromeBar: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#485569' },
  addrBar: { flex: 1, height: 10, borderRadius: 999, backgroundColor: '#303B4F', marginLeft: 4 },
  kBubble: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: BG,
    borderWidth: 1.5,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kBubbleText: { color: MINT, fontSize: 13, fontWeight: '900' },

  // ストアカード
  storeBox: { width: '90%', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 10, gap: 8 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  searchText: { color: '#64748B', fontSize: 11, fontWeight: '600' },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 10,
  },
  kIconShell: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: 'rgba(245,184,75,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kIconText: { color: MINT, fontSize: 14, fontWeight: '900' },
  storeTitle: { color: '#17202B', fontSize: 12, fontWeight: '800' },
  storeSub: { color: '#64748B', fontSize: 10, marginTop: 1 },
  addBtn: { backgroundColor: MINT, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7 },
  addBtnText: { color: BG, fontSize: 12, fontWeight: '900' },

  // ログイン
  loginBox: {
    width: '80%',
    backgroundColor: '#1D2430',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  loginTitle: { color: STRONG, fontSize: 13, fontWeight: '700' },
  loginField: { height: 10, borderRadius: 999, backgroundColor: '#2A3548', width: '100%' },
  loginBtn: {
    marginTop: 10,
    backgroundColor: MINT,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  loginBtnText: { color: BG, fontSize: 13, fontWeight: '900' },

  // 拡張機能ポップアップ
  popupBox: {
    width: '68%',
    backgroundColor: '#202938',
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)',
    gap: 4,
  },
  popupBrand: { color: MINT, fontSize: 10, fontWeight: '900', marginBottom: 2 },
  popupWord: { color: STRONG, fontSize: 20, fontWeight: '900' },
  popupMeaning: { color: MUTED, fontSize: 11, marginBottom: 6 },
  saveBtn: { backgroundColor: MINT, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  saveBtnText: { color: BG, fontSize: 12, fontWeight: '900' },
});
