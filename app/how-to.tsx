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

function AppIcon({ label }: { label: string }) {
  return (
    <View style={il.appItem}>
      <View style={il.appIcon}>
        <Text style={il.appIconText}>{label[0]}</Text>
      </View>
      <Text style={il.appLabel}>{label}</Text>
    </View>
  );
}

// ── Step illustrations ────────────────────────────────────────────────────────

// スマホ Step 1: 単語を長押しで選択
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

// スマホ Step 2: メニューから「共有」をタップ
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

// スマホ Step 3: 共有シートを右にスクロールして「その他」から探す
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
      <Text style={il.hint}>一覧になければ「その他」から探す</Text>
    </View>
  );
}

// スマホ Step 4: 保存完了トースト
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

// PCブラウザ Step 1: ストアで拡張機能を追加
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
      <Text style={il.hint}>拡張機能ストアで「KotoClip」を検索して追加</Text>
    </View>
  );
}

// PCブラウザ Step 2: ログイン
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
      <Text style={il.hint}>スマホアプリと同じアカウントでログイン</Text>
    </View>
  );
}

// PCブラウザ Step 3: 単語をドラッグ選択
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

// PCブラウザ Step 4: 選択すると訳のポップアップが自動で表示される
function IllusSelectPopup() {
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
        <View style={il.popupCard}>
          <Text style={il.popupCardWord}>stick</Text>
          <Text style={il.popupCardMeaning}>定着する / 残る</Text>
          <View style={il.popupCardBtn}><Text style={il.popupCardBtnText}>＋ 単語帳に追加</Text></View>
        </View>
      </View>
      <Text style={il.hint}>訳のポップアップが自動で表示される</Text>
    </View>
  );
}

// ── Step / GuideBlock ─────────────────────────────────────────────────────────

type StepDef = { text: string; illus?: React.ReactNode };

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

function GuideBlock({ title, copy, steps }: { title: string; copy: string; steps: StepDef[] }) {
  return (
    <View style={s.guideBlock}>
      <View style={s.blockHeader}>
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

const PHONE_STEPS: StepDef[] = [
  {
    text: '保存したい英単語を長押しして選択します。',
    illus: <IllusLongPress />,
  },
  {
    text: '表示されたメニューから「共有」をタップします。見当たらない場合は横にスワイプしてください。',
    illus: <IllusWordMenu />,
  },
  {
    text: '一覧にKotoClipがなければ「その他」までスクロールして探します。使うほど一覧の前の方に表示されるようになります。',
    illus: <IllusAppListScroll />,
  },
  {
    text: 'KotoClipをタップすると、訳・文脈・保存元のURLが自動でついて単語帳に保存されます。',
    illus: <IllusSavedToast />,
  },
];

const BROWSER_STEPS: StepDef[] = [
  {
    text: 'Chrome Web StoreまたはEdge Add-onsで「KotoClip」を検索し、拡張機能を追加します。',
    illus: <IllusStoreInstall />,
  },
  {
    text: '拡張機能を開き、スマホアプリと同じアカウントでログインします。',
    illus: <IllusLoginScreen />,
  },
  {
    text: '英語ページで保存したい単語をドラッグして選択します。',
    illus: <IllusBrowserSelect />,
  },
  {
    text: '選択すると訳のポップアップが自動で表示されます。内容を確認して「＋ 単語帳に追加」をタップすると、スマホの単語帳に同期されます。',
    illus: <IllusSelectPopup />,
  },
  {
    text: 'ポップアップが出ない場合は、単語を選択して右クリックし「KotoClipに追加」を選びます。',
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
        <Text style={s.navTitle}>単語の保存の仕方</Text>
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
          <GuideBlock
            title="単語を選んで共有するだけ"
            copy="文章中の英単語を選択して、共有メニューからKotoClipを選ぶと、訳・文脈・保存元つきで自動的に単語帳へ保存されます。"
            steps={PHONE_STEPS}
          />
        ) : (
          <>
            <View style={s.banner}>
              <Text style={s.bannerText}>💻 PCで単語を保存するには、ブラウザ拡張機能のインストールが必要です。</Text>
            </View>
            <GuideBlock
              title="拡張機能を入れて保存する"
              copy="Chrome・Edge・Firefoxに対応した拡張機能を入れると、PCで読んでいるページからそのままスマホの単語帳に保存できます。"
              steps={BROWSER_STEPS}
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
    fontSize: 18,
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
  tabBtnText: { color: MUTED, fontWeight: '600', fontSize: 15 },
  tabBtnTextActive: { color: TEAL },
  banner: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,184,75,0.35)',
    backgroundColor: 'rgba(245,184,75,0.12)',
  },
  bannerText: { color: GOLD, fontSize: 15, fontWeight: '700', lineHeight: 22 },
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
  blockHeader: { alignItems: 'flex-start', gap: 6 },
  blockTitle: { color: STRONG, fontSize: 21, lineHeight: 28, fontWeight: '700' },
  blockCopy: { color: MUTED, fontSize: 16, lineHeight: 24, marginTop: 2 },
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
    padding: 12,
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
  stepText: { flex: 1, color: TEXT, fontSize: 16, lineHeight: 24, paddingTop: 2 },
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
  hint: { color: GOLD, fontSize: 14, fontWeight: '700', textAlign: 'center' },

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
  appIconGold: { backgroundColor: GOLD },
  appIconText: { color: '#17202B', fontSize: 11, fontWeight: '900' },
  appLabel: { color: '#334155', fontSize: 9, textAlign: 'center' },
  scrollRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  scrollText: { color: GOLD, fontSize: 11, fontWeight: '700' },

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

  // ページ上に自動表示される訳ポップアップ
  popupCard: {
    marginTop: 8,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  popupCardWord: { color: '#111827', fontSize: 15, fontWeight: '800' },
  popupCardMeaning: { color: '#4F46E5', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  popupCardBtn: { backgroundColor: '#4F46E5', borderRadius: 8, paddingVertical: 7, alignItems: 'center' },
  popupCardBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

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
});
