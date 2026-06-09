import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { KotoBird } from '@/components/KotoBird';

const MINT = '#7CF7DF';
const GOLD = '#F5B84B';
const BG = '#0E1116';
const TEXT = '#CBD5E1';
const MUTED = '#8F99A8';
const STRONG = '#F9FAFB';

function useLoop(duration = 7200) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [duration, progress]);

  return progress;
}

function Label({ children }: { children: string }) {
  return (
    <View style={s.mockLabel}>
      <Text style={s.mockLabelText}>{children}</Text>
    </View>
  );
}

function Pill({ children }: { children: string }) {
  return (
    <View style={s.pill}>
      <Text style={s.pillText}>{children}</Text>
    </View>
  );
}

function Step({ n, children }: { n: number; children: string }) {
  return (
    <View style={s.stepRow}>
      <View style={s.stepNum}>
        <Text style={s.stepNumText}>{n}</Text>
      </View>
      <Text style={s.stepText}>{children}</Text>
    </View>
  );
}

function MiniStep({ n, title, body, children }: { n: number; title: string; body: string; children: React.ReactNode }) {
  return (
    <View style={s.installCard}>
      <View style={s.installTitleRow}>
        <View style={s.stageNum}>
          <Text style={s.stageNumText}>{n}</Text>
        </View>
        <Text style={s.installTitle}>{title}</Text>
      </View>
      <Text style={s.installBody}>{body}</Text>
      {children}
    </View>
  );
}

function KotoMiniIcon() {
  return (
    <View style={s.kotoIconShell}>
      <View style={s.kotoLeaf} />
      <View style={s.kotoBody}>
        <View style={[s.kotoEye, { left: 5 }]} />
        <View style={[s.kotoEye, { right: 5 }]} />
      </View>
    </View>
  );
}

function KIcon() {
  return (
    <View style={s.kIconShell}>
      <Text style={s.kIconText}>K</Text>
    </View>
  );
}

function AppIcon({ label, children, active }: { label: string; children: React.ReactNode; active?: boolean }) {
  return (
    <View style={s.appItem}>
      <View style={[s.appIcon, active && s.appIconActive]}>{children}</View>
      <Text style={s.appLabel}>{label}</Text>
    </View>
  );
}

function PhoneInitialMock() {
  const p = useLoop(8800);
  const shareTapOpacity = p.interpolate({ inputRange: [0, 0.22, 0.32, 0.42, 1], outputRange: [0, 0, 1, 0, 0] });
  const appsShift = p.interpolate({ inputRange: [0, 0.42, 0.58, 1], outputRange: [0, 0, -54, -54] });
  const moreOpacity = p.interpolate({ inputRange: [0, 0.5, 0.62, 0.9, 1], outputRange: [0, 0, 1, 1, 0.45] });
  const sheetOpacity = p.interpolate({ inputRange: [0, 0.62, 0.74, 1], outputRange: [0, 0, 1, 1] });
  const sheetY = p.interpolate({ inputRange: [0, 0.62, 0.74, 1], outputRange: [16, 16, 0, 0] });
  const toggleX = p.interpolate({ inputRange: [0, 0.78, 0.9, 1], outputRange: [0, 0, 20, 20] });

  return (
    <View style={[s.mock, s.phoneInitialMock]}>
      <Label>共有シートのアプリ一覧</Label>

      <View style={s.setupCard}>
        <View style={s.setupTitleRow}>
          <View style={s.stageNum}>
            <Text style={s.stageNumText}>1</Text>
          </View>
          <Text style={s.setupTitle}>単語を選んで「共有」を押す</Text>
        </View>
        <View style={s.lineLong} />
        <Text style={s.selectedWordSmall}>subtle</Text>
        <View style={s.lineShort} />
        <View style={s.textMenuSmall}>
          <Text style={s.textMenuItem}>コピー</Text>
          <Text style={s.textMenuItem}>調べる</Text>
          <Text style={s.textMenuActive}>共有</Text>
        </View>
        <Animated.View style={[s.tapRingSmall, { opacity: shareTapOpacity }]} />
      </View>

      <View style={s.iosShareBox}>
        <Text style={s.iosShareTitle}>共有</Text>
        <Animated.View style={[s.appList, { transform: [{ translateX: appsShift }] }]}>
          <AppIcon label="Message"><Text style={s.grayIconText}>M</Text></AppIcon>
          <AppIcon label="Mail"><Text style={s.grayIconText}>Mail</Text></AppIcon>
          <AppIcon label="Copy"><Text style={s.grayIconText}>Copy</Text></AppIcon>
          <View style={s.moreAppWrap}>
            <Animated.View style={[s.moreRing, { opacity: moreOpacity }]} />
            <AppIcon label="その他"><Text style={s.grayIconText}>...</Text></AppIcon>
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[s.moreCallout, { opacity: moreOpacity }]}>
        <Text style={s.moreCalloutText}>ここで「その他」をタップ</Text>
      </Animated.View>
      <Text style={s.arrowNote}>アプリ一覧を横にスクロール → その他</Text>

      <Animated.View style={[s.iosPanel, { opacity: sheetOpacity, transform: [{ translateY: sheetY }] }]}>
        <View style={s.iosHead}>
          <Text style={s.iosHeadText}>その他</Text>
          <Text style={s.iosHeadText}>編集</Text>
        </View>
        <View style={s.iosRow}>
          <KotoMiniIcon />
          <View style={{ flex: 1 }}>
            <Text style={s.iosRowTitle}>KotoClip</Text>
            <Text style={s.iosRowSub}>共有先に表示</Text>
          </View>
          <View style={s.toggleTrack}>
            <Animated.View style={[s.toggleKnob, { transform: [{ translateX: toggleX }] }]} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function PhoneSaveMock() {
  const p = useLoop(7800);
  const menuOpacity = p.interpolate({ inputRange: [0, 0.24, 0.34, 0.52, 1], outputRange: [0, 0, 1, 0, 0] });
  const sheetOpacity = p.interpolate({ inputRange: [0, 0.5, 0.62, 0.82, 1], outputRange: [0, 0, 1, 1, 0] });
  const sheetY = p.interpolate({ inputRange: [0, 0.5, 0.62, 1], outputRange: [26, 26, 0, 0] });
  const toastOpacity = p.interpolate({ inputRange: [0, 0.78, 0.88, 0.98, 1], outputRange: [0, 0, 1, 1, 0] });
  const tapOpacity = p.interpolate({ inputRange: [0, 0.62, 0.7, 0.78, 1], outputRange: [0, 0, 1, 0, 0] });

  return (
    <View style={s.mock}>
      <Label>保存の流れ</Label>
      <View style={s.articleCard}>
        <View style={s.lineMedium} />
        <Text style={s.selectedWord}>subtle</Text>
        <View style={s.lineLong} />
        <View style={s.lineShort} />
      </View>
      <Animated.View style={[s.textMenu, { opacity: menuOpacity }]}>
        <Text style={s.textMenuItem}>コピー</Text>
        <Text style={s.textMenuItem}>調べる</Text>
        <Text style={s.textMenuActive}>共有</Text>
      </Animated.View>
      <Animated.View style={[s.shareSheet, { opacity: sheetOpacity, transform: [{ translateY: sheetY }] }]}>
        <View style={s.handle} />
        <Text style={s.iosShareTitle}>共有</Text>
        <View style={s.appListStatic}>
          <AppIcon label="Message"><Text style={s.grayIconText}>M</Text></AppIcon>
          <AppIcon label="KotoClip" active><KotoMiniIcon /></AppIcon>
          <AppIcon label="その他"><Text style={s.grayIconText}>...</Text></AppIcon>
        </View>
        <Animated.View style={[s.tapRing, { opacity: tapOpacity }]} />
      </Animated.View>
      <Animated.View style={[s.savedToast, { opacity: toastOpacity }]}>
        <Text style={s.savedToastText}>訳・文脈・保存元つきで保存しました</Text>
      </Animated.View>
    </View>
  );
}

function BrowserInitialMock() {
  return (
    <View style={[s.mock, s.browserInitialMock]}>
      <Label>初回設定</Label>
      <View style={s.installFlow}>
        <MiniStep n={1} title="拡張機能ストアでKotoClipを開く" body="ChromeはChrome Web Store、EdgeはEdge Add-onsを開きます。">
          <View style={s.storeBox}>
            <Text style={s.storeSearch}>ストアで「KotoClip」を検索</Text>
            <View style={s.storeCard}>
              <KIcon />
              <View style={{ flex: 1 }}>
                <Text style={s.storeTitle}>KotoClip Extension</Text>
                <Text style={s.storeSub}>英単語をKotoClipへ保存</Text>
              </View>
              <View style={s.addButton}><Text style={s.addButtonText}>追加</Text></View>
            </View>
          </View>
        </MiniStep>
        <MiniStep n={2} title="KotoClipにログインして準備完了" body="追加後に表示されるKotoClip画面から、スマホアプリと同じアカウントでログインします。">
          <View style={s.loginBox}>
            <View style={s.loginRow}><KIcon /><Text style={s.loginText}>KotoClipにログイン</Text></View>
            <View style={s.loginLine} />
            <View style={[s.loginLine, { width: '64%' }]} />
          </View>
        </MiniStep>
      </View>
    </View>
  );
}

function BrowserSaveMock() {
  const p = useLoop(7600);
  const bubbleOpacity = p.interpolate({ inputRange: [0, 0.36, 0.48, 0.72, 1], outputRange: [0, 0, 1, 1, 0] });
  const popupOpacity = p.interpolate({ inputRange: [0, 0.56, 0.68, 0.94, 1], outputRange: [0, 0, 1, 1, 0] });
  const popupY = p.interpolate({ inputRange: [0, 0.56, 0.68, 1], outputRange: [14, 14, 0, 0] });

  return (
    <View style={s.mock}>
      <Label>PCブラウザで保存</Label>
      <View style={s.browserWindow}>
        <View style={s.chromeBar}>
          <View style={s.dot} /><View style={s.dot} /><View style={s.dot} />
          <View style={s.addressBar} />
        </View>
        <View style={s.lineMedium} />
        <Text style={s.browserWord}>stick</Text>
        <View style={s.lineLong} />
        <View style={s.lineShort} />
      </View>
      <Animated.View style={[s.kBubble, { opacity: bubbleOpacity }]}><KIcon /></Animated.View>
      <Animated.View style={[s.extensionPopup, { opacity: popupOpacity, transform: [{ translateY: popupY }] }]}>
        <Text style={s.popupTop}>KotoClip</Text>
        <Text style={s.popupWord}>stick</Text>
        <Text style={s.popupMeaning}>定着する / 残る</Text>
        <View style={s.saveButton}><Text style={s.saveButtonText}>保存する</Text></View>
      </Animated.View>
    </View>
  );
}

function GuideBlock({ badge, title, copy, children, steps, note }: { badge: string; title: string; copy: string; children: React.ReactNode; steps: string[]; note?: string }) {
  return (
    <View style={s.guideBlock}>
      <View style={s.blockHeader}>
        <Pill>{badge}</Pill>
        <View style={{ flex: 1 }}>
          <Text style={s.blockTitle}>{title}</Text>
          <Text style={s.blockCopy}>{copy}</Text>
        </View>
      </View>
      {children}
      <View style={s.steps}>{steps.map((step, i) => <Step key={step} n={i + 1}>{step}</Step>)}</View>
      {!!note && <Text style={s.note}>{note}</Text>}
    </View>
  );
}

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

      {/* タブバー */}
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
              badge="初回設定"
              title="共有シートにKotoClipを表示します。"
              copy="「その他」は、単語選択後に出る共有シートのアプリ一覧を横にスクロールした一番右にあります。"
              steps={[
                'SafariやChromeなどで単語を選び、「共有」を押します。',
                '共有シートの上段にあるアプリ一覧を、右方向へ横スクロールします。',
                '一番右にある「その他」を開き、一覧の中からKotoClipをオンにします。',
              ]}
            >
              <PhoneInitialMock />
            </GuideBlock>

            <GuideBlock
              badge="保存方法"
              title="読んでいるページから、そのまま保存します。"
              copy="一度KotoClipを表示しておけば、次回からは共有シートでKotoClipを選ぶだけです。"
              steps={[
                '保存したい単語を長押しして選択します。',
                '表示されたメニューから「共有」を押します。見えない場合はメニュー内を横に送ります。',
                '共有シートでKotoClipを選びます。保存後は単語帳と復習に入ります。',
              ]}
            >
              <PhoneSaveMock />
            </GuideBlock>
          </>
        ) : (
          <>
            <GuideBlock
              badge="初回設定"
              title="拡張機能を入れて、ログインします。"
              copy="まずストアでKotoClipを追加し、同じアカウントでログインします。固定は必須ではありません。"
              steps={[
                'ChromeならChrome Web Store、EdgeならEdge Add-onsを開き、KotoClip拡張機能のページへ進みます。',
                '「Chromeに追加」または「取得」を押して、確認画面で拡張機能の追加を許可します。',
                'KotoClipを開き、スマホアプリと同じアカウントでログインします。',
              ]}
            >
              <BrowserInitialMock />
            </GuideBlock>

            <GuideBlock
              badge="保存方法"
              title="PCで読んだ単語を、スマホの単語帳へ送ります。"
              copy="単語を選択すると、ページ上にKotoClipボタンが表示されます。そのボタンから保存します。"
              steps={[
                '英語ページで保存したい単語をドラッグして選択します。',
                '選択した単語の近くに出るKotoClipボタンを押します。',
                '訳・例文・保存元URLを確認して「保存する」を押します。',
                '同じアカウントのスマホアプリに同期され、あとで復習できます。',
              ]}
            >
              <BrowserSaveMock />
            </GuideBlock>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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

  // タブバー
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
  tabBtnText: { color: '#6B7280', fontWeight: '600', fontSize: 14 },
  tabBtnTextActive: { color: '#2DD4BF' },

  heroWrap: { alignItems: 'center', paddingTop: 28, paddingBottom: 22, paddingHorizontal: 24, gap: 10 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: STRONG, textAlign: 'center', letterSpacing: -0.4 },
  heroSub: { fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 22 },
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
  blockHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  pill: {
    minWidth: 52,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(124,247,223,0.22)',
    backgroundColor: 'rgba(124,247,223,0.10)',
  },
  pillText: { color: '#9DEEE1', fontSize: 12, fontWeight: '800' },
  blockTitle: { color: STRONG, fontSize: 18, lineHeight: 26, fontWeight: '700' },
  blockCopy: { color: MUTED, fontSize: 13, lineHeight: 21, marginTop: 4 },
  mock: {
    position: 'relative',
    minHeight: 330,
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: '#0F141C',
  },
  phoneInitialMock: { minHeight: 510 },
  browserInitialMock: { minHeight: 390 },
  mockLabel: {
    position: 'absolute',
    zIndex: 10,
    left: 14,
    top: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(124,247,223,0.22)',
    backgroundColor: 'rgba(124,247,223,0.10)',
  },
  mockLabelText: { color: '#9DEEE1', fontSize: 12, fontWeight: '800' },
  setupCard: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 56,
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: '#18202B',
  },
  setupTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  setupTitle: { color: STRONG, fontSize: 12, fontWeight: '800' },
  stageNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  stageNumText: { color: BG, fontSize: 12, fontWeight: '900' },
  lineLong: { height: 9, borderRadius: 999, backgroundColor: '#344053', marginVertical: 8 },
  lineMedium: { height: 10, width: '78%', borderRadius: 999, backgroundColor: '#344053', marginVertical: 9 },
  lineShort: { height: 9, width: '64%', borderRadius: 999, backgroundColor: '#344053', marginVertical: 8 },
  selectedWordSmall: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, color: STRONG, backgroundColor: 'rgba(124,247,223,0.24)', fontSize: 16, fontWeight: '900' },
  selectedWord: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 11, color: STRONG, backgroundColor: 'rgba(124,247,223,0.26)', fontSize: 21, fontWeight: '900' },
  textMenuSmall: {
    position: 'absolute', right: 18, top: 82, flexDirection: 'row', gap: 8, paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.96)', shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 14,
  },
  textMenu: {
    position: 'absolute', left: 74, top: 166, flexDirection: 'row', gap: 8, paddingHorizontal: 11, paddingVertical: 8,
    borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.96)', shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 14,
  },
  textMenuItem: { color: '#111827', fontSize: 12, fontWeight: '700' },
  textMenuActive: { color: '#0F766E', fontSize: 12, fontWeight: '900' },
  tapRingSmall: { position: 'absolute', right: 28, top: 113, width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: MINT },
  tapRing: { position: 'absolute', right: 82, top: 56, width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: MINT },
  iosShareBox: { position: 'absolute', left: 14, right: 14, top: 172, padding: 13, borderRadius: 18, backgroundColor: 'rgba(248,250,252,0.96)' },
  iosShareTitle: { color: '#475569', fontSize: 12, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  appList: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  appListStatic: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  appItem: { width: 62, alignItems: 'center' },
  appIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  appIconActive: { backgroundColor: BG, borderWidth: 1, borderColor: 'rgba(245,184,75,0.65)' },
  appLabel: { color: '#334155', fontSize: 10, textAlign: 'center' },
  grayIconText: { color: '#17202B', fontSize: 10, fontWeight: '900' },
  moreAppWrap: { position: 'relative', width: 62 },
  moreRing: { position: 'absolute', left: 3, right: 3, top: -8, height: 58, borderRadius: 18, borderWidth: 2, borderColor: GOLD },
  moreCallout: { position: 'absolute', right: 18, top: 134, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, backgroundColor: GOLD },
  moreCalloutText: { color: BG, fontSize: 11, fontWeight: '900' },
  arrowNote: { position: 'absolute', left: 20, right: 20, top: 320, color: GOLD, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  iosPanel: { position: 'absolute', left: 14, right: 14, bottom: 16, padding: 13, borderRadius: 18, backgroundColor: 'rgba(248,250,252,0.96)' },
  iosHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 11 },
  iosHeadText: { color: '#475569', fontSize: 12, fontWeight: '800' },
  iosRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14, backgroundColor: '#EEF2F7' },
  iosRowTitle: { color: '#17202B', fontWeight: '800' },
  iosRowSub: { color: '#64748B', fontSize: 11 },
  toggleTrack: { width: 48, height: 28, borderRadius: 14, padding: 3, backgroundColor: '#22C55E' },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF' },
  kotoIconShell: { position: 'relative', width: 28, height: 28, alignItems: 'center', justifyContent: 'flex-end' },
  kotoLeaf: { position: 'absolute', top: 1, left: 14, width: 12, height: 8, borderRadius: 7, backgroundColor: '#58D47B', transform: [{ rotate: '-18deg' }] },
  kotoBody: { width: 15, height: 22, borderRadius: 999, backgroundColor: '#F2CC42', marginBottom: 1 },
  kotoEye: { position: 'absolute', top: 8, width: 4, height: 4, borderRadius: 2, backgroundColor: BG },
  articleCard: { position: 'absolute', left: 18, right: 18, top: 58, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#18202B' },
  shareSheet: { position: 'absolute', left: 10, right: 10, bottom: 10, padding: 12, borderRadius: 22, backgroundColor: 'rgba(245,247,250,0.96)' },
  handle: { width: 38, height: 4, borderRadius: 999, backgroundColor: '#CBD5E1', alignSelf: 'center', marginBottom: 10 },
  savedToast: { position: 'absolute', left: 28, right: 28, bottom: 28, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 16, backgroundColor: MINT },
  savedToastText: { color: BG, fontSize: 14, fontWeight: '900', textAlign: 'center' },
  installFlow: { paddingTop: 56, paddingHorizontal: 12, paddingBottom: 14, gap: 12 },
  installCard: { padding: 12, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', backgroundColor: '#18202B' },
  installTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  installTitle: { color: STRONG, fontSize: 13, fontWeight: '800', flex: 1, lineHeight: 18 },
  installBody: { color: MUTED, fontSize: 12, lineHeight: 18, marginLeft: 32, marginBottom: 10 },
  storeBox: { padding: 11, borderRadius: 15, backgroundColor: '#F8FAFC' },
  storeSearch: { color: '#64748B', backgroundColor: '#E2E8F0', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8, fontSize: 12, fontWeight: '700', marginBottom: 10 },
  storeCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, borderRadius: 15, backgroundColor: '#FFF' },
  storeTitle: { color: '#17202B', fontSize: 14, fontWeight: '800' },
  storeSub: { color: '#64748B', fontSize: 11, marginTop: 2 },
  addButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: MINT },
  addButtonText: { color: BG, fontSize: 12, fontWeight: '900' },
  loginBox: { padding: 11, borderRadius: 15, backgroundColor: '#202938', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  loginRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loginText: { color: STRONG, fontSize: 13, fontWeight: '800' },
  loginLine: { height: 10, borderRadius: 999, backgroundColor: '#39465A', marginTop: 9 },
  kIconShell: { width: 36, height: 36, borderRadius: 12, backgroundColor: BG, borderWidth: 1, borderColor: 'rgba(245,184,75,0.65)', alignItems: 'center', justifyContent: 'center' },
  kIconText: { color: MINT, fontSize: 15, fontWeight: '900' },
  browserWindow: { position: 'absolute', left: 14, right: 14, top: 56, padding: 12, borderRadius: 16, backgroundColor: '#18202B', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  chromeBar: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 13 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#485569' },
  addressBar: { flex: 1, height: 12, marginLeft: 6, borderRadius: 999, backgroundColor: '#303B4F' },
  browserWord: { alignSelf: 'flex-start', paddingHorizontal: 11, paddingVertical: 4, borderRadius: 10, color: STRONG, backgroundColor: 'rgba(124,247,223,0.26)', fontSize: 19, fontWeight: '900' },
  kBubble: { position: 'absolute', right: 80, top: 166, width: 38, height: 38, borderRadius: 13, backgroundColor: BG, borderWidth: 1, borderColor: 'rgba(245,184,75,0.7)', alignItems: 'center', justifyContent: 'center' },
  extensionPopup: { position: 'absolute', right: 18, bottom: 18, width: 192, padding: 13, borderRadius: 18, backgroundColor: '#202938', borderWidth: 1, borderColor: 'rgba(255,255,255,0.11)' },
  popupTop: { color: MINT, fontSize: 11, fontWeight: '900', marginBottom: 8 },
  popupWord: { color: STRONG, fontSize: 23, fontWeight: '900' },
  popupMeaning: { color: MUTED, fontSize: 12, marginTop: 3, marginBottom: 10 },
  saveButton: { height: 34, borderRadius: 11, backgroundColor: MINT, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: BG, fontSize: 13, fontWeight: '900' },
  steps: { gap: 9 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 11, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.035)' },
  stepNum: { width: 30, height: 30, borderRadius: 15, backgroundColor: MINT, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { color: BG, fontSize: 13, fontWeight: '900' },
  stepText: { flex: 1, color: TEXT, fontSize: 13, lineHeight: 21 },
  note: { color: '#F7DBA2', backgroundColor: 'rgba(245,184,75,0.08)', borderWidth: 1, borderColor: 'rgba(245,184,75,0.28)', borderRadius: 15, padding: 12, fontSize: 13, lineHeight: 21 },
});
