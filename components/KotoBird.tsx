import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Svg, { Ellipse, Path, Circle, Rect, Line, G, Polygon, Defs, RadialGradient, Stop } from 'react-native-svg';
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

// ── アクセサリー ─────────────────────────────────────────────

// Stage 2+: スカーフ
function Scarf() {
  return (
    <G>
      <Path d="M36,106 Q60,118 84,106 Q82,122 60,124 Q38,122 36,106Z"
        fill="#E74C3C" opacity="0.85" />
      <Path d="M60,118 Q64,132 61,148"
        stroke="#E74C3C" strokeWidth="9" strokeLinecap="round" fill="none" opacity="0.7" />
    </G>
  );
}

// Stage 3+: 丸メガネ
function RoundGlasses() {
  return (
    <G>
      <Circle cx="40" cy="74" r="13" fill="rgba(255,255,255,0.06)" stroke="#374151" strokeWidth="2.8" />
      <Circle cx="80" cy="74" r="13" fill="rgba(255,255,255,0.06)" stroke="#374151" strokeWidth="2.8" />
      <Line x1="53" y1="74" x2="67" y2="74" stroke="#374151" strokeWidth="2.8" />
      <Line x1="16" y1="68" x2="27" y2="73" stroke="#374151" strokeWidth="2.2" />
      <Line x1="93" y1="73" x2="104" y2="68" stroke="#374151" strokeWidth="2.2" />
    </G>
  );
}

// Stage 4+: 大きめのメガネ（角ばった）
function BigGlasses() {
  return (
    <G>
      <Rect x="25" y="63" width="30" height="22" rx="5" fill="rgba(255,255,255,0.07)" stroke="#1E40AF" strokeWidth="2.8" />
      <Rect x="65" y="63" width="30" height="22" rx="5" fill="rgba(255,255,255,0.07)" stroke="#1E40AF" strokeWidth="2.8" />
      <Line x1="55" y1="74" x2="65" y2="74" stroke="#1E40AF" strokeWidth="2.8" />
      <Line x1="14" y1="67" x2="25" y2="72" stroke="#1E40AF" strokeWidth="2.2" />
      <Line x1="95" y1="72" x2="106" y2="67" stroke="#1E40AF" strokeWidth="2.2" />
    </G>
  );
}

// Stage 5+: 学者帽（角帽）
function GradCap() {
  return (
    <G>
      <Ellipse cx="60" cy="38" rx="27" ry="7" fill="#1F2937" />
      <Rect x="42" y="18" width="36" height="20" rx="4" fill="#1F2937" />
      <Line x1="78" y1="22" x2="94" y2="32" stroke="#F5B84B" strokeWidth="2.5" />
      <Circle cx="95" cy="33" r="5" fill="#F5B84B" />
    </G>
  );
}

// Stage 5+: 開いた翼
function SpreadWings() {
  return (
    <G>
      <Path d="M14,92 Q2,70 8,50 Q16,68 24,82Z" fill="#D4B640" opacity="0.9" />
      <Path d="M106,92 Q118,70 112,50 Q104,68 96,82Z" fill="#D4B640" opacity="0.9" />
    </G>
  );
}

// Stage 6: マント
function Cape() {
  return (
    <Path
      d="M18,92 Q8,135 32,158 Q60,166 88,158 Q112,135 102,92 Q82,105 60,108 Q38,105 18,92Z"
      fill="#7C3AED" opacity="0.72" />
  );
}

// Stage 6: 金バッジ（星）
function GoldBadge() {
  return (
    <G>
      <Circle cx="60" cy="95" r="9" fill="#F5B84B" />
      <Polygon
        points="60,88 61.8,93 67,93 62.8,96.2 64.4,101.2 60,98.2 55.6,101.2 57.2,96.2 53,93 58.2,93"
        fill="#0E1116" />
    </G>
  );
}

// Stage 6: 光るオーラ（うっすら放射）
function LibraryAura() {
  return (
    <G opacity="0.4">
      <Ellipse cx="60" cy="90" rx="52" ry="52" fill="none" stroke="#F5B84B" strokeWidth="1.5" />
      <Ellipse cx="60" cy="90" rx="42" ry="42" fill="none" stroke="#F5B84B" strokeWidth="1" opacity="0.5" />
    </G>
  );
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
function KotoMediumSvg({ pose = 1, stage = 1 }: { pose: Pose; stage: number }) {
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

  function Wings(wingPose: Pose) {
    if (wingPose === 1) return (
      <G>
        <Ellipse cx="24" cy="120" rx="9" ry="8" fill="#D4B640" />
        <Ellipse cx="96" cy="120" rx="9" ry="8" fill="#D4B640" />
      </G>
    );
    if (wingPose === 2) return (
      <G>
        <Ellipse cx="22"  cy="123" rx="9"   ry="8" fill="#D4B640" />
        <Ellipse cx="92"  cy="112" rx="8"   ry="7" fill="#D4B640" />
        <Ellipse cx="82"  cy="106" rx="5.5" ry="6" fill="#D4B640" />
      </G>
    );
    if (wingPose === 3) return (
      <G>
        <Ellipse cx="24" cy="98" rx="9" ry="8" fill="#D4B640" />
        <Ellipse cx="96" cy="98" rx="9" ry="8" fill="#D4B640" />
      </G>
    );
    return (
      <G>
        <Ellipse cx="20"  cy="128" rx="9"  ry="8" fill="#D4B640" />
        <Ellipse cx="96"  cy="96"  rx="8"  ry="7" fill="#D4B640" />
        <Ellipse cx="98"  cy="86"  rx="5"  ry="7" fill="#D4B640" />
      </G>
    );
  }

  function Card(cardPose: Pose) {
    if (cardPose === 1) return <KotoCard x={26} y={102} w={48} h={34} />;
    if (cardPose === 2) return <KotoCard x={20} y={105} w={44} h={34} />;
    if (cardPose === 3) return <KotoCard x={26} y={80}  w={48} h={34} />;
    return                     <KotoCard x={12} y={110} w={44} h={34} />;
  }

  return (
    <G>
      {/* マント（背面）は最初に描画 */}
      {stage >= 6 && <><LibraryAura /><Cape /></>}
      {/* 開いた翼（Stage 5）*/}
      {stage >= 5 && stage < 6 && <SpreadWings />}
      <Core />
      {Card(pose)}
      {Wings(pose)}
      <Feet />
      <Clip />
      {/* アクセサリー（前面に重ねる） */}
      {stage >= 2 && <Scarf />}
      {stage === 3 && <RoundGlasses />}
      {stage >= 4 && <BigGlasses />}
      {stage >= 5 && <GradCap />}
      {stage >= 6 && <GoldBadge />}
    </G>
  );
}

// ── メインコンポーネント ────────────────────────────────────
interface KotoBirdProps {
  size?: number;
  pose?: Pose;
  stage?: number;
}

export function KotoBird({ size = 120, pose, stage = 1 }: KotoBirdProps) {
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
          <KotoMediumSvg pose={selectedPose} stage={stage} />
        </Svg>
      </View>
    </Animated.View>
  );
}

export { randomPose, randomType };
