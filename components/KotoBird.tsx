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

// Stage 2+: ティールスカーフ
function Scarf() {
  return (
    <G>
      <Path d="M30,102 Q60,116 90,102 Q88,122 60,124 Q32,122 30,102Z"
        fill="#0B4F40" opacity="0.95" />
      <Path d="M30,102 Q60,112 90,102"
        stroke="#2DD4BF" strokeWidth="1.8" fill="none" opacity="0.55" />
      <Path d="M44,118 Q40,134 42,150"
        stroke="#0B4F40" strokeWidth="11" strokeLinecap="round" fill="none" />
      <Path d="M44,118 Q40,132 42,148"
        stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4" />
    </G>
  );
}

// Stage 3+: 丸メガネ（グリント付き）
function RoundGlasses() {
  return (
    <G>
      <Circle cx="40" cy="74" r="13" fill="rgba(45,212,191,0.06)" stroke="#1A2E2A" strokeWidth="3" />
      <Circle cx="80" cy="74" r="13" fill="rgba(45,212,191,0.06)" stroke="#1A2E2A" strokeWidth="3" />
      <Line x1="53" y1="74" x2="67" y2="74" stroke="#1A2E2A" strokeWidth="2.5" />
      <Line x1="16" y1="68" x2="27" y2="73" stroke="#1A2E2A" strokeWidth="2" />
      <Line x1="93" y1="73" x2="104" y2="68" stroke="#1A2E2A" strokeWidth="2" />
      <Circle cx="35" cy="69" r="3.5" fill="rgba(255,255,255,0.45)" />
      <Circle cx="75" cy="69" r="3.5" fill="rgba(255,255,255,0.45)" />
    </G>
  );
}

// Stage 4+: 革製サッチェルバッグ
function Satchel() {
  return (
    <G>
      <Rect x="4" y="90" width="26" height="32" rx="5"
        fill="#0D3526" stroke="#2DD4BF" strokeWidth="1.5" opacity="0.95" />
      <Path d="M4,106 Q17,110 30,106"
        stroke="#2DD4BF" strokeWidth="1.5" fill="none" opacity="0.6" />
      <Path d="M10,90 Q7,80 11,75"
        stroke="#165A40" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <Circle cx="17" cy="107" r="4" fill="#F5B84B" />
      <Circle cx="17" cy="107" r="2.2" fill="#C4882A" />
    </G>
  );
}

// Stage 5+: 学者帽（ティールタッセル）
function GradCap() {
  return (
    <G>
      <Ellipse cx="60" cy="38" rx="28" ry="7.5" fill="#0D2820" />
      <Rect x="41" y="17" width="38" height="21" rx="5" fill="#0D2820" />
      <Path d="M32,38 Q60,44 88,38" stroke="#2DD4BF" strokeWidth="1.2" fill="none" opacity="0.4" />
      <Line x1="78" y1="22" x2="98" y2="36" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round" />
      <Circle cx="98" cy="37" r="5.5" fill="#2DD4BF" />
      <Circle cx="98" cy="37" r="3" fill="#0D9E8A" />
    </G>
  );
}

// Stage 5+: 広げた翼（ゴールド）
function SpreadWings() {
  return (
    <G>
      <Path d="M14,92 Q0,66 6,44 Q16,66 24,82Z" fill="#D4B640" opacity="0.9" />
      <Path d="M106,92 Q120,66 114,44 Q104,66 96,82Z" fill="#D4B640" opacity="0.9" />
      <Path d="M14,92 Q3,70 7,50" stroke="#C4A830" strokeWidth="1.2" fill="none" opacity="0.5" />
      <Path d="M106,92 Q117,70 113,50" stroke="#C4A830" strokeWidth="1.2" fill="none" opacity="0.5" />
    </G>
  );
}

// Stage 5+: 足元の魔法陣
function MagicCircle() {
  return (
    <G>
      <Ellipse cx="60" cy="161" rx="46" ry="10" fill="none"
        stroke="#2DD4BF" strokeWidth="1.2" strokeDasharray="4,3" opacity="0.5" />
      <Ellipse cx="60" cy="161" rx="34" ry="7" fill="none"
        stroke="#F5B84B" strokeWidth="1" strokeDasharray="3,4" opacity="0.38" />
    </G>
  );
}

// Stage 6: ダークティールのマント
function Cape() {
  return (
    <G>
      <Path
        d="M18,92 Q6,138 30,160 Q60,169 90,160 Q114,138 102,92 Q82,106 60,110 Q38,106 18,92Z"
        fill="#082E22" opacity="0.92" />
      <Path d="M18,92 Q38,104 60,107 Q82,104 102,92"
        stroke="#2DD4BF" strokeWidth="1.8" fill="none" opacity="0.55" />
      <Path d="M30,160 Q60,166 90,160"
        stroke="#2DD4BF" strokeWidth="1.5" fill="none" opacity="0.4" />
    </G>
  );
}

// Stage 6: 金のKバッジ
function KBadge() {
  return (
    <G>
      <Circle cx="60" cy="100" r="12" fill="#0D3D2C" stroke="#F5B84B" strokeWidth="2.2" />
      <Circle cx="60" cy="100" r="9" fill="none" stroke="#F5B84B" strokeWidth="0.7" opacity="0.45" />
      <Line x1="55" y1="93" x2="55" y2="107" stroke="#F5B84B" strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="55" y1="100" x2="65" y2="93" stroke="#F5B84B" strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="55" y1="100" x2="65" y2="107" stroke="#F5B84B" strokeWidth="2.2" strokeLinecap="round" />
    </G>
  );
}

// Stage 6: スパークル（星形）
function Sparkles() {
  return (
    <G>
      <Path d="M11,46 L13,40 L15,46 L21,48 L15,50 L13,56 L11,50 L5,48Z"
        fill="#F5B84B" opacity="0.78" />
      <Path d="M104,28 L105.5,23 L107,28 L112,29.5 L107,31 L105.5,36 L104,31 L99,29.5Z"
        fill="#F5B84B" opacity="0.65" />
      <Path d="M5,112 L6.5,107 L8,112 L13,113.5 L8,115 L6.5,120 L5,115 L0,113.5Z"
        fill="#2DD4BF" opacity="0.65" />
      <Circle cx="111" cy="56" r="3" fill="#F5B84B" opacity="0.72" />
      <Circle cx="109" cy="76" r="2" fill="#2DD4BF" opacity="0.65" />
      <Circle cx="9" cy="72" r="2.5" fill="#F5B84B" opacity="0.58" />
      <Circle cx="12" cy="90" r="2" fill="#2DD4BF" opacity="0.52" />
    </G>
  );
}

// Stage 6: ライブラリオーラ
function LibraryAura() {
  return (
    <G>
      <Ellipse cx="60" cy="90" rx="56" ry="56" fill="none"
        stroke="#F5B84B" strokeWidth="1.2" opacity="0.3" />
      <Ellipse cx="60" cy="90" rx="45" ry="45" fill="none"
        stroke="#2DD4BF" strokeWidth="0.8" opacity="0.25" />
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
      {/* 背面要素 */}
      {stage >= 6 && <><LibraryAura /><Cape /></>}
      {stage >= 5 && <SpreadWings />}
      {stage >= 5 && <MagicCircle />}
      <Core />
      {Card(pose)}
      {Wings(pose)}
      <Feet />
      <Clip />
      {/* 前面アクセサリー */}
      {stage >= 2 && <Scarf />}
      {stage >= 3 && <RoundGlasses />}
      {stage >= 4 && <Satchel />}
      {stage >= 5 && <GradCap />}
      {stage >= 6 && <KBadge />}
      {stage >= 6 && <Sparkles />}
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
