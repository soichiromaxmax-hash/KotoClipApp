import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const STORAGE_KEY = 'onboarding_seen';

const C = {
  bg: '#10141B',
  pageBg: '#0E1116',
  surface: 'rgba(25,31,41,0.86)',
  surface2: '#1D2430',
  panel: '#151A22',
  browser: '#111722',
  line: 'rgba(255,255,255,0.09)',
  strong: '#F8FAFC',
  soft: '#CBD5E1',
  muted: '#A6B0BF',
  dim: '#7B8492',
  mint: '#7CF7DF',
  gold: '#F5B84B',
};

type VisualType = 'hero' | 'channels' | 'context' | 'review' | 'start';

interface Slide {
  id: string;
  eyebrow: string;
  title: string[];
  body: string[];
  visual: VisualType;
}

const SLIDES: Slide[] = [
  {
    id: 'hero',
    eyebrow: 'KotoClip',
    title: ['読んでいた英語が', 'そのまま単語帳になる。'],
    body: ['Web記事やニュースで出会った単語を保存。', 'あなただけの単語帳が育ちます。'],
    visual: 'hero',
  },
  {
    id: 'save',
    eyebrow: 'Save',
    title: ['どこで読んでいても', 'すぐ保存。'],
    body: ['Safari共有やPCブラウザ拡張からKotoClipへ。', '気になった単語をその場で残せます。'],
    visual: 'channels',
  },
  {
    id: 'context',
    eyebrow: 'Context',
    title: ['「どこで見た単語か」まで', '思い出せる。'],
    body: ['出会った文や保存元も一緒に残せるので、', 'ただの暗記ではなく、読んだ記憶とつながります。'],
    visual: 'context',
  },
  {
    id: 'review',
    eyebrow: 'Review',
    title: ['忘れそうな頃に', 'もう一度出会える。'],
    body: ['保存した単語は、あとで復習カードに。', '毎日の英語から、少しずつ語彙が増えていきます。'],
    visual: 'review',
  },
  {
    id: 'start',
    eyebrow: 'Start',
    title: ['まずは今日の1語を', '保存してみましょう。'],
    body: ['手入力でも、Safari共有でも、', 'ブラウザ拡張でも始められます。'],
    visual: 'start',
  },
];

export async function hasSeenOnboarding(): Promise<boolean> {
  const val = await AsyncStorage.getItem(STORAGE_KEY);
  return val === 'true';
}

export async function markOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, 'true');
}

interface Props {
  visible: boolean;
  onDone: () => void;
}

export function Onboarding({ visible, onDone }: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  useEffect(() => {
    if (visible) setIndex(0);
  }, [visible]);

  async function handleDone() {
    await markOnboardingSeen();
    onDone();
  }

  async function goToAdd() {
    await markOnboardingSeen();
    onDone();
    router.push('/(tabs)/add' as any);
  }

  async function goToHowTo() {
    await markOnboardingSeen();
    onDone();
    router.push('/how-to' as any);
  }

  function goNext() {
    if (isLast) {
      goToAdd();
      return;
    }
    setIndex((current) => Math.min(SLIDES.length - 1, current + 1));
  }

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <View style={s.root}>
        <View style={s.glowMint} pointerEvents="none" />
        <View style={s.glowGold} pointerEvents="none" />

        <TouchableOpacity style={s.skipBtn} onPress={handleDone}>
          <Text style={s.skipText}>スキップ</Text>
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={s.progressRow}>
            {SLIDES.map((item, i) => (
              <View
                key={item.id}
                style={[s.progressDot, i === index && s.progressDotActive]}
              />
            ))}
          </View>

          <View style={s.copy}>
            <Text style={s.eyebrow}>{slide.eyebrow}</Text>
            <Text style={s.title}>
              {slide.title.map((line) => (
                <Text key={line}>{line}{'\n'}</Text>
              ))}
            </Text>
            <Text style={s.body}>
              {slide.body.map((line) => (
                <Text key={line}>{line}{'\n'}</Text>
              ))}
            </Text>
          </View>

          <View style={[s.visual, slide.visual === 'hero' && s.visualHero]}>
            <SlideVisual type={slide.visual} active={visible && slide.visual === 'hero'} />
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[s.subLink, !isLast && s.subLinkHidden]}
          onPress={goToHowTo}
          disabled={!isLast}
          activeOpacity={0.7}
        >
          <Text style={s.subLinkText}>使い方を見る</Text>
        </TouchableOpacity>

        <View style={s.footer}>
          <TouchableOpacity
            style={[s.backBtn, index === 0 && s.backBtnDisabled]}
            disabled={index === 0}
            onPress={() => setIndex((current) => Math.max(0, current - 1))}
          >
            <Ionicons name="arrow-back" size={20} color={index === 0 ? '#3D4654' : C.soft} />
          </TouchableOpacity>

          <TouchableOpacity style={s.nextBtn} onPress={goNext}>
            <Text style={s.nextText}>{isLast ? '最初の単語を保存する' : '次へ'}</Text>
            {!isLast && <Ionicons name="arrow-forward" size={18} color="#0E1116" />}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function SlideVisual({ type, active }: { type: VisualType; active: boolean }) {
  if (type === 'hero') return <HeroVisual active={active} />;
  if (type === 'channels') return <ChannelsVisual />;
  if (type === 'context') return <ContextVisual />;
  if (type === 'review') return <ReviewVisual />;
  return <StartVisual />;
}

function HeroVisual({ active }: { active: boolean }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    if (!active) return;

    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 15000,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [active, progress]);

  const articleOpacity = progress.interpolate({
    inputRange: [0, 0.07, 0.13, 0.48, 0.64, 1],
    outputRange: [0, 0, 1, 1, 0.35, 0.35],
  });
  const articleY = progress.interpolate({
    inputRange: [0, 0.13, 0.64, 1],
    outputRange: [12, 0, -8, -8],
  });
  const selectedScale = progress.interpolate({
    inputRange: [0, 0.14, 0.22, 0.42, 0.58, 1],
    outputRange: [1, 1, 1.04, 1.04, 1, 1],
  });
  const saveOpacity = progress.interpolate({
    inputRange: [0, 0.42, 0.52, 0.72, 0.84, 1],
    outputRange: [0, 0, 1, 1, 0.36, 0.36],
  });
  const saveY = progress.interpolate({
    inputRange: [0, 0.52, 0.84, 1],
    outputRange: [12, 0, -4, -4],
  });
  const arrowOpacity = progress.interpolate({
    inputRange: [0, 0.56, 0.64, 0.76, 0.9, 1],
    outputRange: [0, 0, 1, 1, 0, 0],
  });
  const arrowY = progress.interpolate({
    inputRange: [0, 0.64, 0.9, 1],
    outputRange: [-4, 0, 8, 8],
  });
  const cardOpacity = progress.interpolate({
    inputRange: [0, 0.68, 0.78, 0.97, 1],
    outputRange: [0, 0, 1, 1, 0],
  });
  const cardY = progress.interpolate({
    inputRange: [0, 0.78, 1],
    outputRange: [14, 0, -5],
  });
  const fingerScale = progress.interpolate({
    inputRange: [0, 0.5, 0.56, 0.62, 1],
    outputRange: [1, 1, 0.88, 1, 1],
  });
  const fingerY = progress.interpolate({
    inputRange: [0, 0.5, 0.56, 0.62, 1],
    outputRange: [-3, -3, 2, -3, -3],
  });

  return (
    <View style={s.heroStage}>
      <Animated.View style={[s.magicArticle, { opacity: articleOpacity, transform: [{ translateY: articleY }] }]}>
        <StepLabel number="1" label="記事で出会う" />
        <View style={s.browserBar} />
        <Text style={s.articleLine}>Reading an article with a</Text>
        <Animated.View style={[s.magicSelected, { transform: [{ scale: selectedScale }] }]}>
          <Text style={s.magicSelectedText}>subtle</Text>
        </Animated.View>
        <Text style={s.articleLine}>difference in meaning.</Text>
        <View style={s.miniText} />
        <View style={[s.miniText, s.miniTextShort]} />
      </Animated.View>

      <Animated.View style={[s.magicSave, { opacity: saveOpacity, transform: [{ translateY: saveY }] }]}>
        <View style={s.magicSaveLabel}>
          <NumberBadge number="2" />
          <Text style={s.magicSaveText}>ワンタップで保存</Text>
          <Animated.View style={[s.tapFinger, { transform: [{ translateY: fingerY }, { scale: fingerScale }] }]}>
            <Text style={s.tapFingerText}>☝</Text>
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.Text style={[s.magicArrow, { opacity: arrowOpacity, transform: [{ translateY: arrowY }] }]}>
        ↓
      </Animated.Text>

      <Animated.View style={[s.magicWordCard, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}>
        <StepLabel number="3" label="単語帳になる" />
        <Text style={s.magicWord}>subtle</Text>
        <Text style={s.magicMeaning}>微妙な / かすかな</Text>
        <View style={s.wordLine} />
        <View style={[s.wordLine, s.wordLineShort]} />
        <View style={s.deckNote}>
          <Text style={s.deckNoteGold}>✓ 訳つき保存</Text>
          <Text style={s.deckNoteText}>My Words +1</Text>
        </View>
      </Animated.View>
    </View>
  );
}

function StepLabel({ number, label }: { number: string; label: string }) {
  return (
    <View style={s.stepLabel}>
      <NumberBadge number={number} />
      <Text style={s.stepLabelText}>{label}</Text>
    </View>
  );
}

function NumberBadge({ number }: { number: string }) {
  return (
    <View style={s.numberBadge}>
      <Text style={s.numberBadgeText}>{number}</Text>
    </View>
  );
}

function ChannelsVisual() {
  return (
    <View style={s.channelVisual}>
      <View style={s.channelRow}>
        <View style={s.channelDevice}>
          <Text style={s.deviceLabel}>iPhone</Text>
          <Text style={s.articleLine}>Select a word</Text>
          <View style={[s.selectedWord, { alignSelf: 'flex-start' }]}>
            <Text style={s.selectedWordText}>subtle</Text>
            <View style={[s.selectionHandle, s.selectionHandleLeft]} />
            <View style={[s.selectionHandle, s.selectionHandleRight]} />
          </View>
          <View style={s.channelAction}>
            <Text style={s.channelActionText}>共有から保存</Text>
          </View>
        </View>

        <View style={[s.channelDevice, s.channelBrowser]}>
          <Text style={s.deviceLabel}>PC Browser</Text>
          <View style={s.miniText} />
          <View style={[s.miniText, s.miniTextShort]} />
          <View style={s.extensionPill}>
            <Text style={s.extensionText}>K</Text>
          </View>
          <View style={s.channelAction}>
            <Text style={s.channelActionText}>拡張機能で保存</Text>
          </View>
        </View>
      </View>

      <View style={s.channelResult}>
        <Text style={s.channelCheck}>✓</Text>
        <Text style={s.channelResultText}>どちらからでも単語帳へ</Text>
      </View>
    </View>
  );
}

function ContextVisual() {
  return (
    <View style={s.contextCard}>
      <Text style={s.contextWord}>subtle</Text>
      <Text style={s.contextMeaning}>微妙な / かすかな</Text>

      <View style={s.contextSource}>
        <Text style={s.contextSourceLabel}>出会った文</Text>
        <Text style={s.contextSourceText}>The article described a subtle difference in meaning.</Text>
      </View>

      <View style={s.contextSource}>
        <Text style={s.contextSourceLabel}>保存元</Text>
        <Text style={s.contextSourceText}>tech article ・ 今日保存</Text>
      </View>
    </View>
  );
}

function ReviewVisual() {
  return (
    <View style={s.reviewVisual}>
      <View style={s.duePill}>
        <Text style={s.duePillText}>今日の復習 12語</Text>
      </View>

      <View style={s.reviewCard}>
        <Text style={s.reviewWord}>recall</Text>
        <Text style={s.reviewSub}>思い出す / 呼び戻す</Text>
      </View>

      <View style={s.answerRow}>
        <View style={s.answer}>
          <Text style={s.answerText}>もう一度</Text>
        </View>
        <View style={[s.answer, s.answerGood]}>
          <Text style={s.answerGoodText}>思い出せた</Text>
        </View>
        <View style={s.answer}>
          <Text style={s.answerText}>難しい</Text>
        </View>
        <View style={s.answer}>
          <Text style={s.answerText}>簡単</Text>
        </View>
      </View>
    </View>
  );
}

function StartVisual() {
  return (
    <View style={s.startVisual}>
      <View>
        <Text style={s.goalNumber}>1</Text>
        <Text style={s.goalLabel}>first clipped word</Text>
      </View>

      <View style={s.ctaPreview}>
        <Text style={s.ctaPreviewText}>最初の単語を保存する</Text>
      </View>

      <View style={s.todayCard}>
        <Text style={s.todayWord}>today</Text>
        <Text style={s.todayMeaning}>今日 / 今という日</Text>
        <View style={s.wordLine} />
        <View style={[s.wordLine, s.wordLineShort]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.pageBg,
  },
  glowMint: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    top: 50,
    left: -120,
    backgroundColor: 'rgba(124,247,223,0.07)',
  },
  glowGold: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    bottom: 120,
    right: -90,
    backgroundColor: 'rgba(245,184,75,0.06)',
  },
  skipBtn: {
    position: 'absolute',
    top: 54,
    right: 24,
    zIndex: 10,
  },
  skipText: {
    color: C.dim,
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 76,
    paddingBottom: 120,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 20,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2B3444',
  },
  progressDotActive: {
    width: 22,
    backgroundColor: C.mint,
  },
  copy: {
    width: '100%',
    marginBottom: 18,
  },
  eyebrow: {
    color: C.mint,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 9,
  },
  title: {
    color: C.strong,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 34,
    letterSpacing: -0.7,
  },
  body: {
    color: C.soft,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 25,
    marginTop: 8,
  },
  visual: {
    width: '100%',
    minHeight: 330,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 26,
    backgroundColor: C.surface,
    overflow: 'hidden',
  },
  visualHero: {
    minHeight: 462,
  },
  subLink: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 78,
    alignItems: 'center',
  },
  subLinkHidden: {
    opacity: 0,
  },
  subLinkText: {
    color: C.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.055)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnDisabled: {
    opacity: 0.55,
  },
  nextBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: C.mint,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  nextText: {
    color: '#0E1116',
    fontSize: 15,
    fontWeight: '800',
  },
  articleLine: {
    color: '#9AA6B6',
    fontSize: 13,
    lineHeight: 22,
  },
  browserBar: {
    width: 118,
    height: 12,
    borderRadius: 999,
    backgroundColor: '#303A4C',
    marginBottom: 12,
  },
  miniText: {
    height: 5,
    width: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginTop: 8,
  },
  miniTextShort: {
    width: '58%',
  },
  heroStage: {
    position: 'relative',
    width: '100%',
    maxWidth: 304,
    height: 430,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 22,
    backgroundColor: '#0E1116',
    overflow: 'hidden',
  },
  magicArticle: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 17,
    backgroundColor: C.panel,
  },
  stepLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  stepLabelText: {
    color: C.gold,
    fontSize: 15,
    fontWeight: '900',
  },
  numberBadge: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBadgeText: {
    color: '#0E1116',
    fontSize: 16,
    fontWeight: '900',
  },
  magicSelected: {
    alignSelf: 'flex-start',
    marginVertical: 3,
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(124,247,223,0.28)',
  },
  magicSelectedText: {
    color: C.strong,
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.9,
  },
  magicSave: {
    position: 'absolute',
    left: 23,
    right: 23,
    top: 178,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(124,247,223,0.28)',
    borderRadius: 17,
    backgroundColor: C.surface2,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  magicSaveLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  magicSaveText: {
    color: C.gold,
    fontSize: 16,
    fontWeight: '800',
  },
  tapFinger: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapFingerText: {
    color: '#0E1116',
    fontSize: 17,
  },
  magicArrow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 232,
    color: C.mint,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  magicWordCard: {
    position: 'absolute',
    left: 23,
    right: 23,
    bottom: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: 'rgba(124,247,223,0.34)',
    borderRadius: 18,
    backgroundColor: C.surface2,
  },
  magicWord: {
    color: C.strong,
    fontFamily: 'Inter',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1.8,
  },
  magicMeaning: {
    color: C.mint,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 5,
  },
  wordLine: {
    height: 2,
    width: '78%',
    borderRadius: 999,
    backgroundColor: 'rgba(124,247,223,0.25)',
    marginTop: 10,
  },
  wordLineShort: {
    width: '52%',
    marginTop: 7,
  },
  deckNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  deckNoteGold: {
    color: C.gold,
    fontSize: 11,
    fontWeight: '800',
  },
  deckNoteText: {
    color: C.soft,
    fontSize: 11,
    fontWeight: '800',
  },
  channelVisual: {
    width: '100%',
    gap: 12,
  },
  channelRow: {
    flexDirection: 'row',
    gap: 12,
  },
  channelDevice: {
    flex: 1,
    minHeight: 168,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    backgroundColor: C.panel,
  },
  channelBrowser: {
    backgroundColor: C.browser,
  },
  deviceLabel: {
    color: C.gold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  selectedWord: {
    position: 'relative',
    marginVertical: 3,
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(124,247,223,0.28)',
  },
  selectedWordText: {
    color: C.strong,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  selectionHandle: {
    position: 'absolute',
    bottom: -6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.mint,
  },
  selectionHandleLeft: {
    left: -3,
  },
  selectionHandleRight: {
    right: -3,
  },
  channelAction: {
    marginTop: 14,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: C.mint,
    alignItems: 'center',
  },
  channelActionText: {
    color: '#0E1116',
    fontSize: 11,
    fontWeight: '900',
  },
  extensionPill: {
    width: 35,
    height: 35,
    marginTop: 12,
    borderWidth: 2,
    borderColor: 'rgba(245,184,75,0.9)',
    borderRadius: 12,
    backgroundColor: C.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extensionText: {
    color: '#0E1116',
    fontSize: 15,
    fontWeight: '900',
  },
  channelResult: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(124,247,223,0.22)',
    borderRadius: 16,
    backgroundColor: 'rgba(124,247,223,0.08)',
  },
  channelCheck: {
    color: C.mint,
    fontSize: 12,
    fontWeight: '800',
  },
  channelResultText: {
    color: C.soft,
    fontSize: 12,
    fontWeight: '800',
  },
  contextCard: {
    width: '100%',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 18,
    backgroundColor: C.panel,
  },
  contextWord: {
    color: C.strong,
    fontFamily: 'Inter',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1.8,
  },
  contextMeaning: {
    color: C.mint,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  contextSource: {
    marginTop: 12,
    padding: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  contextSourceLabel: {
    color: C.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  contextSourceText: {
    color: C.soft,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  reviewVisual: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  duePill: {
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: C.mint,
  },
  duePillText: {
    color: '#0E1116',
    fontSize: 12,
    fontWeight: '800',
  },
  reviewCard: {
    width: 230,
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 18,
    backgroundColor: C.surface2,
    alignItems: 'center',
  },
  reviewWord: {
    color: C.strong,
    fontFamily: 'Inter',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1.8,
  },
  reviewSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 7,
  },
  answerRow: {
    width: 250,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  answer: {
    width: 121,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.045)',
    alignItems: 'center',
  },
  answerGood: {
    backgroundColor: C.mint,
  },
  answerText: {
    color: C.soft,
    fontSize: 12,
    fontWeight: '700',
  },
  answerGoodText: {
    color: '#0E1116',
    fontSize: 12,
    fontWeight: '800',
  },
  startVisual: {
    width: '100%',
    alignItems: 'center',
    gap: 18,
  },
  goalNumber: {
    color: C.strong,
    fontFamily: 'Inter',
    fontSize: 72,
    fontWeight: '800',
    letterSpacing: -5,
    lineHeight: 72,
    textAlign: 'center',
  },
  goalLabel: {
    color: C.mint,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  ctaPreview: {
    width: 245,
    height: 52,
    borderRadius: 14,
    backgroundColor: C.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPreviewText: {
    color: '#0E1116',
    fontSize: 15,
    fontWeight: '800',
  },
  todayCard: {
    width: 150,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(124,247,223,0.34)',
    borderRadius: 18,
    backgroundColor: C.surface2,
  },
  todayWord: {
    color: C.strong,
    fontFamily: 'Inter',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  todayMeaning: {
    color: C.mint,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
});
