import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Svg, { Ellipse, Path, Circle, Rect, Line, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const EZ = Easing.bezier(0.35, 0, 0.2, 1);

type Pose = 1 | 2 | 3 | 4;
type KotoType = 'small' | 'medium' | 'large';

function randomPose(): Pose {
  return (Math.floor(Math.random() * 4) + 1) as Pose;
}
function randomType(): KotoType {
  return (['small', 'medium', 'large'] as KotoType[])[Math.floor(Math.random() * 3)];
}

// ── KotoCard（単語カード小道具） ───────────────────────────
function KotoCard({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const r = Math.round(h * 0.16);
  return (
    <G>
      <Rect x={x + 2} y={y + 3} width={w} height={h} rx={r} fill="rgba(47,191,143,0.26)" />
      <Rect x={x} y={y} width={w} height={h} rx={r} fill="#D9F2E7" />
      <Line x1={x + 6} y1={y + h * 0.30} x2={x + w - 6}  y2={y + h * 0.30} stroke="rgba(36,137,102,0.38)" strokeWidth="2.2" strokeLinecap="round" />
      <Line x1={x + 6} y1={y + h * 0.52} x2={x + w - 10} y2={y + h * 0.52} stroke="rgba(36,137,102,0.30)" strokeWidth="2"   strokeLinecap="round" />
      <Line x1={x + 6} y1={y + h * 0.73} x2={x + w - 8}  y2={y + h * 0.73} stroke="rgba(36,137,102,0.30)" strokeWidth="2"   strokeLinecap="round" />
    </G>
  );
}

// ── Medium コト鳥（本体のみ） ───────────────────────────────
function KotoMediumSvg({ pose = 1 }: { pose: Pose }) {
  function Core() {
    return (
      <G>
        <Path d="M60,36 C84,36 106,60 106,92 C106,124 86,148 60,148 C34,148 14,124 14,92 C14,60 36,36 60,36Z"
          fill="#DDBE55" stroke="rgba(40,33,18,0.14)" strokeWidth="0.8" />
        <Ellipse cx="60" cy="122" rx="30" ry="22" fill="rgba(155,118,28,0.16)" />
        <Ellipse cx="40" cy="74" rx="13" ry="13" fill="#F8FAF7" />
        <Ellipse cx="80" cy="74" rx="13" ry="13" fill="#F8FAF7" />
        <Circle cx="40" cy="74" r="6.5" fill="#111" />
        <Circle cx="80" cy="74" r="6.5" fill="#111" />
        <Ellipse cx="60" cy="100" rx="16" ry="7" fill="#B85F2A" />
        <Path d="M46,100 Q60,102.5 74,100" stroke="rgba(74,39,19,0.46)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </G>
    );
  }

  function Feet() {
    return (
      <G>
        <Ellipse cx="46" cy="151" rx="14" ry="8" fill="#C4A830" opacity="0.85" />
        <Ellipse cx="74" cy="151" rx="14" ry="8" fill="#C4A830" opacity="0.85" />
      </G>
    );
  }

  function Clip() {
    return (
      <G>
        <Rect x="44" y="13" width="34" height="23" rx="11.5" fill="none" stroke="#2FBF8F" strokeWidth="8" />
        <Line x1="53" y1="28" x2="69" y2="28" stroke="#248966" strokeWidth="3.8" strokeLinecap="round" />
      </G>
    );
  }

  if (pose === 1) {
    return (
      <G>
        <Core />
        <KotoCard x={26} y={102} w={48} h={34} />
        <Ellipse cx="24" cy="120" rx="9" ry="8" fill="#D4B640" />
        <Ellipse cx="96" cy="120" rx="9" ry="8" fill="#D4B640" />
        <Feet />
        <Clip />
      </G>
    );
  } else if (pose === 2) {
    return (
      <G>
        <Core />
        <KotoCard x={20} y={105} w={44} h={34} />
        <Ellipse cx="22"  cy="123" rx="9"   ry="8" fill="#D4B640" />
        <Ellipse cx="92"  cy="112" rx="8"   ry="7" fill="#D4B640" />
        <Ellipse cx="82"  cy="106" rx="5.5" ry="6" fill="#D4B640" />
        <Feet />
        <Clip />
      </G>
    );
  } else if (pose === 3) {
    return (
      <G>
        <Core />
        <KotoCard x={26} y={80} w={48} h={34} />
        <Ellipse cx="24" cy="98" rx="9" ry="8" fill="#D4B640" />
        <Ellipse cx="96" cy="98" rx="9" ry="8" fill="#D4B640" />
        <Feet />
        <Clip />
      </G>
    );
  } else {
    return (
      <G>
        <Core />
        <KotoCard x={12} y={110} w={44} h={34} />
        <Ellipse cx="20"  cy="128" rx="9"  ry="8" fill="#D4B640" />
        <Ellipse cx="96"  cy="96"  rx="8"  ry="7" fill="#D4B640" />
        <Ellipse cx="98"  cy="86"  rx="5"  ry="7" fill="#D4B640" />
        <Feet />
        <Clip />
      </G>
    );
  }
}

// ── メインコンポーネント ────────────────────────────────────
interface KotoBirdProps {
  size?: number;
  pose?: Pose;
}

export function KotoBird({ size = 120, pose }: KotoBirdProps) {
  const selectedPose = useRef(pose ?? randomPose()).current;
  const bobY = useSharedValue(0);
  const h = size * (170 / 120);

  useEffect(() => {
    bobY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1400, easing: EZ }),
        withTiming(0,  { duration: 1400, easing: EZ }),
      ),
      -1,
      false,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobY.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <View style={{ width: size, height: h }}>
        <Svg width={size} height={h} viewBox="0 0 120 170" fill="none">
          <Ellipse cx="60" cy="167" rx="34" ry="5" fill="rgba(15,23,42,0.20)" />
          <KotoMediumSvg pose={selectedPose} />
        </Svg>
      </View>
    </Animated.View>
  );
}

export { randomPose, randomType };
