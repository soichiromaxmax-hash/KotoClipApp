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

function randomPose(): Pose {
  return (Math.floor(Math.random() * 4) + 1) as Pose;
}

// ステージごとのviewBox設定（サイドアクセサリーのはみ出し量）
const STAGE_VB: Record<number, { vbX: number; vbW: number }> = {
  1: { vbX: 0,   vbW: 120 },  // ひよこ
  2: { vbX: -8,  vbW: 136 },  // 小学生（左に水筒）
  3: { vbX: -14, vbW: 148 },  // 高校生（左に鞄・右に辞書）
  4: { vbX: -16, vbW: 152 },  // ビジネス（左にスマホ・右にスーツケース）
  5: { vbX: 0,   vbW: 136 },  // 研究者（右にクリップボード）
  6: { vbX: 0,   vbW: 138 },  // 卒業生（右に卒業証書・卒業帽タッセル）
};

// ── 共通パーツ ──────────────────────────────────────────────

function BirdBody() {
  return (
    <G>
      <Path d="M60,36 C84,36 106,60 106,92 C106,124 86,148 60,148 C34,148 14,124 14,92 C14,60 36,36 60,36Z"
        fill="#DDBE55" stroke="rgba(40,33,18,0.14)" strokeWidth="0.8" />
      <Ellipse cx="60" cy="122" rx="30" ry="22" fill="rgba(155,118,28,0.14)" />
      <Ellipse cx="40" cy="74" rx="13" ry="13" fill="#F8FAF7" />
      <Ellipse cx="80" cy="74" rx="13" ry="13" fill="#F8FAF7" />
      <Circle cx="40" cy="74" r="6.5" fill="#111" />
      <Circle cx="80" cy="74" r="6.5" fill="#111" />
      <Ellipse cx="60" cy="100" rx="16" ry="7" fill="#B85F2A" />
      <Path d="M46,100 Q60,102.5 74,100" stroke="rgba(74,39,19,0.46)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </G>
  );
}

function BirdFeet() {
  return (
    <G>
      <Ellipse cx="46" cy="151" rx="14" ry="8" fill="#C4A830" opacity="0.85" />
      <Ellipse cx="74" cy="151" rx="14" ry="8" fill="#C4A830" opacity="0.85" />
    </G>
  );
}

function BirdClip() {
  return (
    <G>
      <Rect x="44" y="13" width="34" height="23" rx="11.5" fill="none" stroke="#2FBF8F" strokeWidth="8" />
      <Line x1="53" y1="28" x2="69" y2="28" stroke="#248966" strokeWidth="3.8" strokeLinecap="round" />
    </G>
  );
}

function BirdWings({ pose }: { pose: Pose }) {
  if (pose === 2) return (
    <G>
      <Ellipse cx="22" cy="123" rx="9" ry="8" fill="#D4B640" />
      <Ellipse cx="92" cy="112" rx="8" ry="7" fill="#D4B640" />
      <Ellipse cx="82" cy="106" rx="5.5" ry="6" fill="#D4B640" />
    </G>
  );
  if (pose === 3) return (
    <G>
      <Ellipse cx="24" cy="98" rx="9" ry="8" fill="#D4B640" />
      <Ellipse cx="96" cy="98" rx="9" ry="8" fill="#D4B640" />
    </G>
  );
  if (pose === 4) return (
    <G>
      <Ellipse cx="20" cy="128" rx="9" ry="8" fill="#D4B640" />
      <Ellipse cx="96" cy="96" rx="8" ry="7" fill="#D4B640" />
      <Ellipse cx="98" cy="86" rx="5" ry="7" fill="#D4B640" />
    </G>
  );
  return (
    <G>
      <Ellipse cx="24" cy="120" rx="9" ry="8" fill="#D4B640" />
      <Ellipse cx="96" cy="120" rx="9" ry="8" fill="#D4B640" />
    </G>
  );
}

function FlashCard({ pose }: { pose: Pose }) {
  if (pose === 2) return (
    <G>
      <Rect x="20" y="105" width="44" height="34" rx="6" fill="rgba(47,191,143,0.22)" />
      <Rect x="20" y="105" width="44" height="34" rx="6" fill="#D9F2E7" />
      <Line x1="26" y1="116" x2="58" y2="116" stroke="rgba(36,137,102,0.36)" strokeWidth="2" strokeLinecap="round" />
    </G>
  );
  if (pose === 3) return (
    <G>
      <Rect x="26" y="80" width="48" height="34" rx="6" fill="rgba(47,191,143,0.22)" />
      <Rect x="26" y="80" width="48" height="34" rx="6" fill="#D9F2E7" />
      <Line x1="32" y1="91" x2="68" y2="91" stroke="rgba(36,137,102,0.36)" strokeWidth="2" strokeLinecap="round" />
    </G>
  );
  if (pose === 4) return (
    <G>
      <Rect x="12" y="110" width="44" height="34" rx="6" fill="rgba(47,191,143,0.22)" />
      <Rect x="12" y="110" width="44" height="34" rx="6" fill="#D9F2E7" />
      <Line x1="18" y1="121" x2="50" y2="121" stroke="rgba(36,137,102,0.36)" strokeWidth="2" strokeLinecap="round" />
    </G>
  );
  return (
    <G>
      <Rect x="27" y="106" width="49" height="35" rx="6" fill="rgba(47,191,143,0.22)" />
      <Rect x="26" y="104" width="49" height="35" rx="6" fill="#D9F2E7" />
      <Line x1="32" y1="115" x2="69" y2="115" stroke="rgba(36,137,102,0.36)" strokeWidth="2" strokeLinecap="round" />
      <Line x1="32" y1="123" x2="66" y2="123" stroke="rgba(36,137,102,0.28)" strokeWidth="1.8" strokeLinecap="round" />
    </G>
  );
}

// ── Stage 2: 小学生（通学帽＋水筒） ──────────────────────────

function SchoolHat() {
  return (
    <G>
      <Ellipse cx="60" cy="45" rx="29" ry="7.5" fill="#D4A800" opacity="0.35" />
      <Ellipse cx="60" cy="44" rx="29" ry="7.5" fill="#F5C218" />
      <Path d="M34,44 Q36,22 60,20 Q84,22 86,44Z" fill="#F5D020" />
      <Path d="M60,20 L60,44" stroke="#D4A800" strokeWidth="1" opacity="0.35" />
      <Path d="M38,30 Q60,26 82,30" stroke="#D4A800" strokeWidth="1" opacity="0.25" />
      <Circle cx="60" cy="31" r="6" fill="#2DD4BF" />
      <Circle cx="60" cy="31" r="4" fill="#1BA890" />
      <Circle cx="60" cy="31" r="2" fill="#0D6E5A" />
    </G>
  );
}

function WaterBottle() {
  return (
    <G>
      <Rect x="-6" y="118" width="17" height="34" rx="5" fill="#B8C8D8" />
      <Ellipse cx="2.5" cy="118" rx="8.5" ry="4" fill="#C8D8E8" />
      <Ellipse cx="2.5" cy="152" rx="8.5" ry="4" fill="#A0B4C4" />
      <Rect x="-5" y="111" width="15" height="9" rx="4" fill="#2DD4BF" />
      <Ellipse cx="2.5" cy="111" rx="7.5" ry="3.5" fill="#3AEEDD" />
      <Rect x="-3" y="120" width="4" height="28" rx="2" fill="rgba(255,255,255,0.26)" />
      <Path d="M7,118 Q10,115 12,118" stroke="#7A5230" strokeWidth="2" fill="none" strokeLinecap="round" />
    </G>
  );
}

// ── Stage 3: 高校生（学ラン） ─────────────────────────────────

function GakuranBody() {
  return (
    <G>
      <Path d="M16,110 C22,133 39,148 60,148 C81,148 98,133 104,110 Z" fill="#0E0E20" />
      <Line x1="60" y1="112" x2="60" y2="148" stroke="#18182E" strokeWidth="1" />
      <Circle cx="60" cy="118" r="3" fill="#C4A020" /><Circle cx="60" cy="118" r="1.5" fill="#F0C840" />
      <Circle cx="60" cy="126" r="3" fill="#C4A020" /><Circle cx="60" cy="126" r="1.5" fill="#F0C840" />
      <Circle cx="60" cy="134" r="3" fill="#C4A020" /><Circle cx="60" cy="134" r="1.5" fill="#F0C840" />
      <Circle cx="60" cy="142" r="3" fill="#C4A020" /><Circle cx="60" cy="142" r="1.5" fill="#F0C840" />
      <Path d="M46,110 L46,108 Q50,107 55,108 L56,110 Z" fill="#0E0E20" />
      <Path d="M74,110 L74,108 Q70,107 65,108 L64,110 Z" fill="#0E0E20" />
      <Path d="M55,108 Q60,107 65,108 L64,110 L60,111 L56,110 Z" fill="#EEEEEE" opacity="0.72" />
    </G>
  );
}

function SchoolBag() {
  return (
    <G>
      <Rect x="-12" y="90" width="22" height="33" rx="4" fill="#1C1008" />
      <Rect x="-11" y="91" width="20" height="31" rx="3" fill="#2E1C10" />
      <Path d="M-6,90 Q2,80 10,90" fill="none" stroke="#1C1008" strokeWidth="4" strokeLinecap="round" />
      <Rect x="-4" y="102" width="12" height="5" rx="2.5" fill="#C4A830" />
      <Line x1="-11" y1="107" x2="9" y2="107" stroke="#1C1008" strokeWidth="1.2" opacity="0.5" />
    </G>
  );
}

function Dictionary() {
  return (
    <G>
      <Rect x="109" y="88" width="20" height="34" rx="3" fill="#5C2800" />
      <Rect x="110" y="89" width="18" height="32" rx="2" fill="#7A3810" />
      <Rect x="110" y="89" width="4" height="32" rx="2" fill="#6A2A08" />
      <Line x1="115" y1="96" x2="126" y2="96" stroke="rgba(255,220,140,0.75)" strokeWidth="1.8" />
      <Line x1="115" y1="102" x2="126" y2="102" stroke="rgba(255,220,140,0.55)" strokeWidth="1.2" />
      <Line x1="115" y1="108" x2="126" y2="108" stroke="rgba(255,220,140,0.55)" strokeWidth="1.2" />
      <Line x1="115" y1="114" x2="123" y2="114" stroke="rgba(255,220,140,0.4)" strokeWidth="1" />
    </G>
  );
}

// ── Stage 4: ビジネス（スーツ） ──────────────────────────────

function BusinessSuit() {
  return (
    <G>
      <Path d="M16,110 C22,133 39,148 60,148 C81,148 98,133 104,110 Q82,117 60,120 Q38,117 16,110 Z" fill="#282830" />
      <Path d="M16,110 L38,117 L60,120 L44,111 Z" fill="#323240" />
      <Path d="M104,110 L82,117 L60,120 L76,111 Z" fill="#323240" />
      <Path d="M16,110 L38,117 L60,119" stroke="#1A1A26" strokeWidth="1.2" fill="none" />
      <Path d="M104,110 L82,117 L60,119" stroke="#1A1A26" strokeWidth="1.2" fill="none" />
      <Path d="M44,111 L60,120 L76,111 L73,121 L60,125 L47,121 Z" fill="#F4F4F4" />
      <Path d="M57.5,119 L60,144 L62.5,119 L61.5,115 L58.5,115 Z" fill="#CC1111" />
      <Path d="M57.5,119 Q60,117 62.5,119 L61.5,115 L58.5,115 Z" fill="#AA0808" />
      <Path d="M22,118 L28,114 L32,119 L28,122 L23,121 Z" fill="white" opacity="0.9" />
    </G>
  );
}

function BusinessGlasses() {
  return (
    <G>
      <Circle cx="40" cy="74" r="13" fill="rgba(0,0,0,0.04)" stroke="#222" strokeWidth="2.5" />
      <Circle cx="80" cy="74" r="13" fill="rgba(0,0,0,0.04)" stroke="#222" strokeWidth="2.5" />
      <Line x1="53" y1="74" x2="67" y2="74" stroke="#222" strokeWidth="2.5" />
      <Line x1="14" y1="68" x2="27" y2="73" stroke="#222" strokeWidth="2" />
      <Line x1="93" y1="73" x2="106" y2="68" stroke="#222" strokeWidth="2" />
      <Circle cx="35" cy="69" r="3.5" fill="rgba(255,255,255,0.4)" />
      <Circle cx="75" cy="69" r="3.5" fill="rgba(255,255,255,0.4)" />
    </G>
  );
}

function Smartphone() {
  return (
    <G>
      <Rect x="-15" y="98" width="15" height="25" rx="3.5" fill="#141420" />
      <Rect x="-14" y="99" width="13" height="23" rx="2.5" fill="#1E2040" />
      <Rect x="-13" y="100" width="11" height="21" rx="2" fill="#2DD4BF" opacity="0.16" />
      <Rect x="-12" y="102" width="7" height="5" rx="1" fill="#2DD4BF" opacity="0.5" />
      <Line x1="-10" y1="117" x2="-4" y2="117" stroke="#2DD4BF" strokeWidth="1" opacity="0.5" />
    </G>
  );
}

function Suitcase() {
  return (
    <G>
      <Rect x="112" y="98" width="20" height="40" rx="4" fill="#1A1A30" />
      <Rect x="113" y="99" width="18" height="38" rx="3" fill="#22223C" />
      <Path d="M117,98 Q122,90 127,98" fill="none" stroke="#2D2D4A" strokeWidth="4" strokeLinecap="round" />
      <Line x1="113" y1="113" x2="131" y2="113" stroke="#2D2D4A" strokeWidth="1.8" />
      <Line x1="113" y1="126" x2="131" y2="126" stroke="#2D2D4A" strokeWidth="1.8" />
      <Rect x="119" y="110" width="6" height="6" rx="1.5" fill="#C4A830" />
      <Ellipse cx="115" cy="138" rx="3" ry="2.5" fill="#111" />
      <Ellipse cx="129" cy="138" rx="3" ry="2.5" fill="#111" />
    </G>
  );
}

// ── Stage 5: 研究者（白衣） ───────────────────────────────────

function LabCoat() {
  return (
    <G>
      <Path d="M16,114 Q8,113 6,126 Q8,131 16,129" fill="#F0F0F0" stroke="#E2E2E2" strokeWidth="0.8" />
      <Path d="M104,114 Q112,113 114,126 Q112,131 104,129" fill="#F0F0F0" stroke="#E2E2E2" strokeWidth="0.8" />
      <Path d="M16,110 C22,133 39,148 60,148 C81,148 98,133 104,110 Q82,117 60,120 Q38,117 16,110 Z" fill="#F0F0F0" />
      <Path d="M16,110 L38,117 L60,119" stroke="#DDDDDD" strokeWidth="1.2" fill="none" />
      <Path d="M104,110 L82,117 L60,119" stroke="#DDDDDD" strokeWidth="1.2" fill="none" />
      <Path d="M46,112 L60,120 L74,112 L71,122 L60,126 L49,122 Z" fill="#D8EEF8" />
      <Line x1="60" y1="119" x2="60" y2="148" stroke="#E2E2E2" strokeWidth="1" />
      <Rect x="22" y="122" width="18" height="16" rx="2" fill="#F8F8F8" stroke="#E2E2E2" strokeWidth="1" />
      <Rect x="26" y="110" width="3" height="14" rx="1.5" fill="#2DD4BF" />
      <Rect x="26" y="108" width="3" height="4" rx="1.5" fill="#1BA890" />
      <Rect x="31" y="111" width="3" height="13" rx="1.5" fill="#F5B84B" />
      <Rect x="31" y="109" width="3" height="4" rx="1.5" fill="#D49A20" />
    </G>
  );
}

function ResearchGlasses() {
  return (
    <G>
      <Circle cx="40" cy="74" r="13" fill="rgba(0,0,0,0.03)" stroke="#1A2A2A" strokeWidth="2.5" />
      <Circle cx="80" cy="74" r="13" fill="rgba(0,0,0,0.03)" stroke="#1A2A2A" strokeWidth="2.5" />
      <Line x1="53" y1="74" x2="67" y2="74" stroke="#1A2A2A" strokeWidth="2.5" />
      <Line x1="14" y1="68" x2="27" y2="73" stroke="#1A2A2A" strokeWidth="2" />
      <Line x1="93" y1="73" x2="106" y2="68" stroke="#1A2A2A" strokeWidth="2" />
      <Circle cx="35" cy="69" r="3.5" fill="rgba(255,255,255,0.42)" />
      <Circle cx="75" cy="69" r="3.5" fill="rgba(255,255,255,0.42)" />
    </G>
  );
}

function Clipboard() {
  return (
    <G>
      <Rect x="107" y="85" width="24" height="38" rx="3" fill="#EDE0C0" />
      <Rect x="108" y="86" width="22" height="36" rx="2" fill="#F6EED6" />
      <Rect x="115" y="81" width="8" height="8" rx="3" fill="#999" />
      <Rect x="116" y="82" width="6" height="6" rx="2" fill="#BBB" />
      <Line x1="111" y1="94" x2="127" y2="94" stroke="#CCC" strokeWidth="1.2" />
      <Line x1="111" y1="100" x2="127" y2="100" stroke="#CCC" strokeWidth="1.2" />
      <Line x1="111" y1="106" x2="127" y2="106" stroke="#CCC" strokeWidth="1.2" />
      <Line x1="111" y1="112" x2="127" y2="112" stroke="#CCC" strokeWidth="1.2" />
      <Line x1="111" y1="94" x2="113" y2="94" stroke="#E44" strokeWidth="1.2" />
      <Line x1="111" y1="100" x2="113" y2="100" stroke="#E44" strokeWidth="1.2" />
      <Line x1="111" y1="106" x2="113" y2="106" stroke="#E44" strokeWidth="1.2" />
      <Line x1="111" y1="112" x2="113" y2="112" stroke="#E44" strokeWidth="1.2" />
    </G>
  );
}

// ── Stage 6: 卒業生 ───────────────────────────────────────────

function GradAura() {
  return (
    <G>
      <Ellipse cx="60" cy="94" rx="55" ry="55" fill="none" stroke="#F5B84B" strokeWidth="1" opacity="0.24" />
      <Ellipse cx="60" cy="94" rx="45" ry="45" fill="none" stroke="#2DD4BF" strokeWidth="0.8" opacity="0.18" />
    </G>
  );
}

function GradGown() {
  return (
    <G>
      <Path d="M16,110 C22,133 39,148 60,148 C81,148 98,133 104,110 Q82,117 60,120 Q38,117 16,110 Z" fill="#082E22" />
      <Path d="M16,110 Q38,117 60,120 Q82,117 104,110" stroke="#2DD4BF" strokeWidth="1.8" fill="none" opacity="0.6" />
      <Path d="M39,148 Q60,152 81,148" stroke="#2DD4BF" strokeWidth="1.4" fill="none" opacity="0.45" />
      <Path d="M16,110 Q38,117 60,120 Q82,117 104,110" stroke="#F5B84B" strokeWidth="0.8" fill="none" opacity="0.38" strokeDasharray="4,5" />
      <Path d="M44,111 L60,120 L76,111 L73,121 L60,125 L47,121 Z" fill="white" opacity="0.88" />
    </G>
  );
}

function GradGlasses() {
  return (
    <G>
      <Circle cx="40" cy="74" r="13" fill="rgba(0,0,0,0.04)" stroke="#1A2A2A" strokeWidth="2.5" />
      <Circle cx="80" cy="74" r="13" fill="rgba(0,0,0,0.04)" stroke="#1A2A2A" strokeWidth="2.5" />
      <Line x1="53" y1="74" x2="67" y2="74" stroke="#1A2A2A" strokeWidth="2.5" />
      <Line x1="14" y1="68" x2="27" y2="73" stroke="#1A2A2A" strokeWidth="2" />
      <Line x1="93" y1="73" x2="106" y2="68" stroke="#1A2A2A" strokeWidth="2" />
      <Circle cx="35" cy="69" r="3.5" fill="rgba(255,255,255,0.42)" />
      <Circle cx="75" cy="69" r="3.5" fill="rgba(255,255,255,0.42)" />
    </G>
  );
}

function GradCap() {
  return (
    <G>
      <Ellipse cx="60" cy="41" rx="30" ry="8" fill="#0A2018" />
      <Rect x="41" y="20" width="38" height="21" rx="5" fill="#0A2018" />
      <Path d="M30,41 Q60,48 90,41" stroke="#062012" strokeWidth="1.5" fill="none" opacity="0.5" />
      <Line x1="78" y1="24" x2="102" y2="40" stroke="#F5B84B" strokeWidth="3" strokeLinecap="round" />
      <Circle cx="102" cy="41" r="6.5" fill="#F5B84B" />
      <Circle cx="102" cy="41" r="4" fill="#D4940A" />
      <Circle cx="102" cy="41" r="2" fill="#F5D840" />
    </G>
  );
}

function DiplomaScroll() {
  return (
    <G>
      <Rect x="107" y="96" width="18" height="44" rx="9" fill="#C4922A" />
      <Ellipse cx="116" cy="96" rx="9" ry="4.5" fill="#E5B840" />
      <Ellipse cx="116" cy="140" rx="9" ry="4.5" fill="#A07820" />
      <Rect x="109" y="98" width="4" height="40" rx="2" fill="rgba(255,220,100,0.22)" />
      <Path d="M107,112 Q116,116 125,112 Q116,118 107,112 Z" fill="#CC1111" />
      <Path d="M107,119 Q116,123 125,119 Q116,125 107,119 Z" fill="#CC1111" />
    </G>
  );
}

function GradSparkles() {
  return (
    <G>
      <Path d="M8,45 L10.2,38 L12.4,45 L19,47.5 L12.4,50 L10.2,57 L8,50 L1.4,47.5 Z" fill="#F5B84B" opacity="0.78" />
      <Path d="M108,24 L109.5,18 L111,24 L117,26 L111,28 L109.5,34 L108,28 L102,26 Z" fill="#F5B84B" opacity="0.65" />
      <Path d="M3,110 L4.5,104 L6,110 L12,112 L6,114 L4.5,120 L3,114 L-3,112 Z" fill="#2DD4BF" opacity="0.62" />
      <Circle cx="114" cy="56" r="3.5" fill="#F5B84B" opacity="0.68" />
      <Circle cx="8" cy="72" r="2.5" fill="#F5B84B" opacity="0.55" />
      <Circle cx="112" cy="74" r="2" fill="#2DD4BF" opacity="0.6" />
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

  const s = Math.min(Math.max(stage, 1), 6);
  const vb = STAGE_VB[s];
  const svgW = Math.round(size * vb.vbW / 120);
  const svgH = Math.round(size * 170 / 120);

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

  function renderStage() {
    switch (s) {
      case 1:
        return (
          <G>
            <BirdBody />
            <FlashCard pose={selectedPose} />
            <BirdWings pose={selectedPose} />
            <BirdFeet />
            <BirdClip />
          </G>
        );
      case 2:
        return (
          <G>
            {/* ストラップは鳥より後ろ */}
            <Path d="M80,96 Q50,108 14,122" stroke="#7A5230" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <BirdBody />
            <FlashCard pose={selectedPose} />
            <BirdWings pose={selectedPose} />
            <BirdFeet />
            <BirdClip />
            <WaterBottle />
            <SchoolHat />
          </G>
        );
      case 3:
        return (
          <G>
            <BirdBody />
            <BirdWings pose={selectedPose} />
            <BirdFeet />
            <BirdClip />
            <GakuranBody />
            <SchoolBag />
            <Dictionary />
          </G>
        );
      case 4:
        return (
          <G>
            <BirdBody />
            <BirdWings pose={selectedPose} />
            <BirdFeet />
            <BirdClip />
            <BusinessSuit />
            <BusinessGlasses />
            <Smartphone />
            <Suitcase />
          </G>
        );
      case 5:
        return (
          <G>
            <BirdBody />
            <BirdWings pose={selectedPose} />
            <BirdFeet />
            <BirdClip />
            <LabCoat />
            <ResearchGlasses />
            <Clipboard />
          </G>
        );
      case 6:
        return (
          <G>
            <GradAura />
            <BirdBody />
            <BirdWings pose={selectedPose} />
            <BirdFeet />
            <BirdClip />
            <GradGown />
            <GradGlasses />
            <GradCap />
            <DiplomaScroll />
            <GradSparkles />
          </G>
        );
      default:
        return (
          <G>
            <BirdBody />
            <FlashCard pose={selectedPose} />
            <BirdWings pose={selectedPose} />
            <BirdFeet />
            <BirdClip />
          </G>
        );
    }
  }

  return (
    <Animated.View style={animStyle}>
      <View style={{ width: svgW, height: svgH }}>
        <Svg width={svgW} height={svgH} viewBox={`${vb.vbX} 0 ${vb.vbW} 170`} fill="none">
          <Ellipse cx="60" cy="167" rx="34" ry="5" fill="rgba(15,23,42,0.20)" />
          {renderStage()}
        </Svg>
      </View>
    </Animated.View>
  );
}

export { randomPose };
