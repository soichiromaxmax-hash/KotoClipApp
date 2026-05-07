import { useEffect, useRef } from 'react';
import { Dimensions, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SH } = Dimensions.get('window');
const EZ = Easing.bezier(0.16, 1, 0.3, 1);

// Keyframe timing (ms) — see implementation memo §6
// cardsThenLogo: 0, 416, 1040, 1976, 2704, 3224
// logoThenGate:  2184, 2912, 3640, 4160
// finalGate:     3432, 3952, 4576, 5200

interface CardCfg {
  word: string;
  pos: ViewStyle;
  rotate: string;
  tx: number;
  ty: number;
  delay: number;
}

const CARD_CFGS: CardCfg[] = [
  { word: 'word',   pos: { top: '22%', left: '17%' },    rotate: '-10deg', tx: 120,  ty: 122,  delay: 0   },
  { word: 'save',   pos: { top: '32%', right: '14%' },   rotate: '8deg',   tx: -120, ty: 72,   delay: 130 },
  { word: 'learn',  pos: { bottom: '31%', left: '19%' }, rotate: '7deg',   tx: 106,  ty: -96,  delay: 260 },
  { word: 'recall', pos: { bottom: '21%', right: '18%'}, rotate: '-8deg',  tx: -110, ty: -126, delay: 390 },
];

function WordCard({ cfg }: { cfg: CardCfg }) {
  const opacity = useSharedValue(0);
  const scale   = useSharedValue(0.9);
  const tyAnim  = useSharedValue(18);
  const txAnim  = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(cfg.delay, withSequence(
      withTiming(0,   { duration: 416 }),
      withTiming(1,   { duration: 624,  easing: EZ }),
      withTiming(1,   { duration: 936 }),
      withTiming(0.2, { duration: 728,  easing: EZ }),
      withTiming(0,   { duration: 520,  easing: EZ }),
    ));
    scale.value = withDelay(cfg.delay, withSequence(
      withTiming(0.9,  { duration: 416 }),
      withTiming(1,    { duration: 624,  easing: EZ }),
      withTiming(1,    { duration: 936 }),
      withTiming(0.54, { duration: 728,  easing: EZ }),
      withTiming(0.22, { duration: 520,  easing: EZ }),
    ));
    tyAnim.value = withDelay(cfg.delay, withSequence(
      withTiming(18,     { duration: 416 }),
      withTiming(0,      { duration: 624,  easing: EZ }),
      withTiming(0,      { duration: 936 }),
      withTiming(cfg.ty, { duration: 728,  easing: EZ }),
      withTiming(cfg.ty, { duration: 520 }),
    ));
    txAnim.value = withDelay(cfg.delay, withSequence(
      withTiming(0,      { duration: 416 + 624 + 936 }),
      withTiming(cfg.tx, { duration: 728,  easing: EZ }),
      withTiming(cfg.tx, { duration: 520 }),
    ));
    // One-shot splash keyframes; rerunning would restart the intro animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: txAnim.value },
      { translateY: tyAnim.value },
      { scale: scale.value },
      { rotate: cfg.rotate },
    ],
  }));

  return (
    <Animated.View style={[s.card, cfg.pos, aStyle]}>
      <Text style={s.cardText}>{cfg.word}</Text>
    </Animated.View>
  );
}

function KotoClipLogo() {
  const opacity = useSharedValue(0);
  const scale   = useSharedValue(0.9);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(0,    { duration: 2184 }),
      withTiming(1,    { duration: 728,  easing: EZ }),
      withTiming(1,    { duration: 728 }),
      withTiming(0,    { duration: 520,  easing: EZ }),
      withTiming(0,    { duration: 1040 }),
    );
    scale.value = withSequence(
      withTiming(0.9,  { duration: 2184 }),
      withTiming(1,    { duration: 728,  easing: EZ }),
      withTiming(1,    { duration: 728 }),
      withTiming(1.04, { duration: 520,  easing: EZ }),
      withTiming(1.04, { duration: 1040 }),
    );
    // One-shot logo keyframes; rerunning would restart the intro animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: -40 },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[s.logoRow, aStyle]}>
      <Text style={s.koto}>Koto</Text>
      <View style={s.clipWrapper}>
        <View style={s.clipTab} />
        <View style={s.clipBox}>
          <Text style={s.clip}>Clip</Text>
          <LinearGradient
            colors={['transparent', 'rgba(255,230,167,0.7)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.clipLine}
          />
        </View>
      </View>
    </Animated.View>
  );
}

function LightGate() {
  const opacity = useSharedValue(0);
  const scaleX  = useSharedValue(1);
  const scaleY  = useSharedValue(0.2);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(0, { duration: 3432 }),
      withTiming(1, { duration: 520,  easing: EZ }),
      withTiming(1, { duration: 624 }),
      withTiming(0, { duration: 624,  easing: EZ }),
    );
    scaleY.value = withSequence(
      withTiming(0.2, { duration: 3432 }),
      withTiming(1,   { duration: 520,  easing: EZ }),
      withTiming(1,   { duration: 1248 }),
    );
    scaleX.value = withSequence(
      withTiming(1,   { duration: 3432 + 520 }),
      withTiming(150, { duration: 624,  easing: EZ }),
      withTiming(170, { duration: 624 }),
    );
    // One-shot light-gate keyframes; rerunning would restart the intro animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scaleX: scaleX.value },
      { scaleY: scaleY.value },
    ],
  }));

  return (
    <Animated.View style={[s.gateAnim, aStyle]}>
      <LinearGradient colors={['#F5B84B', '#7CF7DF']} style={s.gate} />
    </Animated.View>
  );
}

export function SplashAnimation({ onFinish, fontsLoaded }: { onFinish: () => void; fontsLoaded: boolean }) {
  const started = useRef(false);
  const overlayOpacity = useSharedValue(1);

  // フォントが読み込めなかった場合の安全タイムアウト（6.5秒で強制終了）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!started.current) {
        started.current = true;
        onFinish();
      }
    }, 6500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!fontsLoaded || started.current) return;
    started.current = true;
    overlayOpacity.value = withDelay(4600, withTiming(0, { duration: 600, easing: EZ }));
    // runOnJS コールバックが production で発火しないケースがあるため setTimeout で代替
    const timer = setTimeout(onFinish, 5300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontsLoaded]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));

  return (
    <Animated.View style={[s.overlay, overlayStyle]} pointerEvents="none">
      <View style={s.bg} />
      {fontsLoaded && CARD_CFGS.map(cfg => <WordCard key={cfg.word} cfg={cfg} />)}
      {fontsLoaded && <KotoClipLogo />}
      {fontsLoaded && <LightGate />}
    </Animated.View>
  );
}

const CLIP_FONT = 60;
const GATE_HEIGHT = SH * 0.72;

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0E1116',
  },
  // --- word cards ---
  card: {
    position: 'absolute',
    width: 76,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(124,247,223,0.45)',
    backgroundColor: 'rgba(124,247,223,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    color: 'rgba(248,250,252,0.62)',
    fontSize: 12,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  // --- logo ---
  logoRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '46%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
  },
  koto: {
    color: '#F1F5F9',
    fontFamily: 'LobsterTwo_700Bold',
    fontSize: 72,
    fontWeight: '700',
    letterSpacing: -2.5,
    lineHeight: 72,
    textShadowColor: 'rgba(124,247,223,0.15)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  clipWrapper: {
    overflow: 'visible',
  },
  clipTab: {
    position: 'absolute',
    top: -7,
    left: 11,
    width: 20,
    height: 11,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(245,184,75,0.78)',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  clipBox: {
    borderWidth: 1.5,
    borderColor: 'rgba(245,184,75,0.82)',
    borderRadius: 11,
    paddingTop: 2,
    paddingRight: 7,
    paddingBottom: 5,
    paddingLeft: 7,
  },
  clip: {
    color: '#7CF7DF',
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: CLIP_FONT,
    fontWeight: '700',
    letterSpacing: -3.5,
    lineHeight: CLIP_FONT,
    textShadowColor: 'rgba(124,247,223,0.34)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  clipLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 3,
    height: 1,
  },
  // --- light gate ---
  gateAnim: {
    position: 'absolute',
    alignSelf: 'center',
    top: SH * 0.14,
  },
  gate: {
    width: 4,
    height: GATE_HEIGHT,
    borderRadius: 999,
  },
});
