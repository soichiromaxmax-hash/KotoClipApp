import { Dimensions } from 'react-native';
import Svg, {
  Defs, RadialGradient, Stop,
  Rect, Path, Circle, Ellipse, Line, G, Text as SvgText,
} from 'react-native-svg';

const SW = Dimensions.get('window').width;
// viewBox は 390×260 の横長（ヒーローセクションの実寸に合わせる）
const VW = 390;
const VH = 260;

interface Props { stage: number; }

export function HeroBackground({ stage }: Props) {
  const s = Math.min(Math.max(stage, 1), 6);
  switch (s) {
    case 1: return <Stage1 />;
    case 2: return <Stage2 />;
    case 3: return <Stage3 />;
    case 4: return <Stage4 />;
    case 5: return <Stage5 />;
    case 6: return <Stage6 />;
    default: return <Stage1 />;
  }
}

// ── Stage 1: 小さな机・単語カード ──────────────────────────────
function Stage1() {
  return (
    <Svg width={SW} height={VH} viewBox={`0 0 ${VW} ${VH}`} fill="none">
      <Defs>
        <RadialGradient id="s1a" cx="50%" cy="0%" r="70%">
          <Stop offset="0%"   stopColor="#D29632" stopOpacity={0.32} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="s1b" cx="50%" cy="100%" r="50%">
          <Stop offset="0%"   stopColor="#8B5A10" stopOpacity={0.18} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {/* 背景 */}
      <Rect width={VW} height={VH} fill="#18140A" />
      <Rect width={VW} height={VH} fill="url(#s1a)" />
      <Rect width={VW} height={VH} fill="url(#s1b)" />

      {/* ランプスタンド（左寄り） */}
      <Rect x={105} y={0} width={4} height={82} fill="#3A2810" rx={2} />
      {/* ランプシェード */}
      <Path d="M82,78 L130,78 L124,56 L88,56 Z" fill="#5A3E22" />
      <Path d="M84,78 L128,78 L122,58 L90,58 Z" fill="#6B4A28" />
      <Ellipse cx={106} cy={80} rx={28} ry={4} fill="rgba(220,160,60,0.35)" />

      {/* 机の表面 */}
      <Rect x={0} y={188} width={VW} height={72} fill="#2C1D0A" />
      <Rect x={0} y={186} width={VW} height={5}  fill="#4A3015" rx={1} />
      <Line x1={0} y1={200} x2={VW} y2={200} stroke="rgba(80,50,20,0.35)" strokeWidth={1} />
      <Line x1={0} y1={218} x2={VW} y2={218} stroke="rgba(80,50,20,0.25)" strokeWidth={0.8} />

      {/* 単語カード on desk */}
      <G transform="rotate(-6 96 200)">
        <Rect x={64} y={192} width={64} height={36} rx={5} fill="#D9F2E7" />
        <Rect x={65} y={193} width={62} height={34} rx={4} fill="#EAF8F2" />
        <SvgText x={96} y={207} fill="#1A6B4A" fontSize={9} fontWeight="600" textAnchor="middle">achieve</SvgText>
        <Line x1={70} y1={216} x2={122} y2={216} stroke="rgba(36,137,102,0.35)" strokeWidth={1.2} />
        <Line x1={70} y1={222} x2={114} y2={222} stroke="rgba(36,137,102,0.25)" strokeWidth={1} />
      </G>
      <G transform="rotate(4 210 196)">
        <Rect x={182} y={190} width={56} height={32} rx={5} fill="#D9F2E7" />
        <Rect x={183} y={191} width={54} height={30} rx={4} fill="#EAF8F2" />
        <SvgText x={210} y={204} fill="#1A6B4A" fontSize={9} fontWeight="600" textAnchor="middle">focus</SvgText>
        <Line x1={188} y1={213} x2={232} y2={213} stroke="rgba(36,137,102,0.35)" strokeWidth={1.2} />
      </G>
      <G transform="rotate(-8 316 198)">
        <Rect x={290} y={192} width={52} height={28} rx={4} fill="#D9F2E7" opacity={0.75} />
        <SvgText x={316} y={206} fill="#1A6B4A" fontSize={8} fontWeight="600" textAnchor="middle">curious</SvgText>
      </G>

      {/* 鉛筆 */}
      <G transform="rotate(-12 144 190)">
        <Rect x={141} y={176} width={5} height={30} rx={2} fill="#F5C842" />
        <Rect x={141} y={204} width={5} height={5}  rx={1} fill="#D4A020" />
        <Path d="M141,209 L146,209 L143.5,215 Z" fill="#FFDCC0" />
      </G>

      {/* コーヒーカップ */}
      <Rect x={322} y={174} width={26} height={20} rx={4} fill="#3D2710" />
      <Rect x={323} y={175} width={24} height={18} rx={3} fill="#5A3820" />
      <Path d="M348,179 Q356,179 356,186 Q356,193 348,193" stroke="#3D2710" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Path d="M330,172 Q333,164 330,156" stroke="rgba(255,255,255,0.14)" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <Path d="M337,170 Q340,162 337,154" stroke="rgba(255,255,255,0.10)" strokeWidth={1.5} fill="none" strokeLinecap="round" />

      {/* 奥のカード（ぼんやり） */}
      <G opacity={0.35}>
        <Rect x={24} y={196} width={44} height={26} rx={4} fill="#D9F2E7" transform="rotate(10 46 209)" />
        <Rect x={346} y={200} width={40} height={24} rx={4} fill="#D9F2E7" transform="rotate(-8 366 212)" />
      </G>
    </Svg>
  );
}

// ── Stage 2: 語彙の部屋・本棚 ──────────────────────────────────
function Stage2() {
  const bookColors = ['#7A3030','#2A4A7A','#2A6A4A','#6A4A2A','#4A2A7A','#2A5A6A','#7A5A2A','#5A2A5A'];
  function Books(x: number, y: number, count: number, h: number) {
    return Array.from({ length: count }, (_, i) => (
      <Rect key={i}
        x={x + i * 8} y={y} width={6} height={h} rx={1}
        fill={bookColors[i % bookColors.length]}
      />
    ));
  }
  return (
    <Svg width={SW} height={VH} viewBox={`0 0 ${VW} ${VH}`} fill="none">
      <Defs>
        <RadialGradient id="s2a" cx="50%" cy="25%" r="50%">
          <Stop offset="0%"   stopColor="#3C64B4" stopOpacity={0.14} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="s2b" cx="50%" cy="10%" r="38%">
          <Stop offset="0%"   stopColor="#DCA846" stopOpacity={0.20} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={VW} height={VH} fill="#070E1C" />
      <Rect width={VW} height={VH} fill="url(#s2a)" />
      <Rect width={VW} height={VH} fill="url(#s2b)" />

      {/* 左本棚 */}
      <Rect x={0}  y={0} width={72} height={VH} fill="#0C1828" />
      <Rect x={2}  y={0} width={68} height={VH} fill="#101E30" />
      <Rect x={2}  y={80} width={68} height={4} fill="#0A1422" />
      <Rect x={2}  y={160} width={68} height={4} fill="#0A1422" />
      {Books(4,  8, 8, 68)}
      {Books(4,  88, 8, 68)}
      {Books(4,  168, 8, 90)}

      {/* 右本棚 */}
      <Rect x={318} y={0} width={72} height={VH} fill="#0C1828" />
      <Rect x={320} y={0} width={68} height={VH} fill="#101E30" />
      <Rect x={320} y={80}  width={68} height={4} fill="#0A1422" />
      <Rect x={320} y={160} width={68} height={4} fill="#0A1422" />
      {Books(322, 8,  8, 68)}
      {Books(322, 88, 8, 68)}
      {Books(322, 168, 8, 90)}

      {/* 床 */}
      <Rect x={72} y={228} width={246} height={32} fill="#0C1422" />
      <Rect x={72} y={226} width={246} height={4}  fill="#142030" />

      {/* 天井ランプ */}
      <Line x1={195} y1={0} x2={195} y2={30} stroke="#1A2C40" strokeWidth={2} />
      <Path d="M175,30 L215,30 L210,14 L180,14 Z" fill="#1A2C40" />
      <Ellipse cx={195} cy={32} rx={24} ry={4} fill="rgba(220,180,80,0.38)" />

      {/* 浮かぶ単語 */}
      <G opacity={0.55}>
        <Rect x={122} y={52}  width={56} height={22} rx={4} fill="rgba(45,180,160,0.10)" stroke="rgba(45,180,160,0.28)" strokeWidth={1} />
        <SvgText x={150} y={67} fill="#4DD4BF" fontSize={8.5} fontWeight="600" textAnchor="middle">vocabulary</SvgText>
      </G>
      <G opacity={0.45}>
        <Rect x={140} y={108} width={48} height={20} rx={4} fill="rgba(45,180,160,0.08)" stroke="rgba(45,180,160,0.22)" strokeWidth={1} />
        <SvgText x={164} y={122} fill="#4DD4BF" fontSize={8} textAnchor="middle">insight</SvgText>
      </G>
      <G opacity={0.38}>
        <Rect x={130} y={158} width={52} height={20} rx={4} fill="rgba(45,180,160,0.07)" stroke="rgba(45,180,160,0.18)" strokeWidth={1} />
        <SvgText x={156} y={172} fill="#4DD4BF" fontSize={8} textAnchor="middle">curious</SvgText>
      </G>

      {/* テーブル */}
      <Rect x={130} y={204} width={130} height={6}  rx={3} fill="#182A3E" />
      <Rect x={150} y={210} width={12}  height={18} rx={2} fill="#121E2E" />
      <Rect x={228} y={210} width={12}  height={18} rx={2} fill="#121E2E" />
    </Svg>
  );
}

// ── Stage 3: 読書の森・葉っぱ状の単語カード ───────────────────
function Stage3() {
  return (
    <Svg width={SW} height={VH} viewBox={`0 0 ${VW} ${VH}`} fill="none">
      <Defs>
        <RadialGradient id="s3a" cx="50%" cy="100%" r="65%">
          <Stop offset="0%"   stopColor="#28A050" stopOpacity={0.18} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="s3b" cx="72%" cy="5%" r="30%">
          <Stop offset="0%"   stopColor="#B4DCB0" stopOpacity={0.12} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={VW} height={VH} fill="#071008" />
      <Rect width={VW} height={VH} fill="url(#s3a)" />
      <Rect width={VW} height={VH} fill="url(#s3b)" />

      {/* 月 */}
      <Circle cx={320} cy={24} r={22} fill="#B8D4B0" opacity={0.55} />
      <Circle cx={328} cy={19} r={19} fill="#071008" opacity={0.68} />

      {/* 星 */}
      <Circle cx={40}  cy={14} r={1.2} fill="rgba(200,230,200,0.6)" />
      <Circle cx={90}  cy={8}  r={0.9} fill="rgba(200,230,200,0.5)" />
      <Circle cx={180} cy={12} r={1}   fill="rgba(200,230,200,0.55)" />
      <Circle cx={260} cy={6}  r={0.9} fill="rgba(200,230,200,0.45)" />
      <Circle cx={360} cy={18} r={1.1} fill="rgba(200,230,200,0.5)" />

      {/* 左の木 */}
      <Path d="M-10,260 L14,260 L20,160 L24,110 L16,60 L6,40 L-4,60 L-12,110 L-10,160 Z" fill="#0C200E" />
      <Path d="M6,120 Q44,100 80,112"   stroke="#0E2414" strokeWidth={10} fill="none" strokeLinecap="round" />
      <Path d="M8,170 Q42,156 72,164"   stroke="#0E2414" strokeWidth={8}  fill="none" strokeLinecap="round" />
      <Path d="M4,78  Q34,60 60,66"     stroke="#0E2414" strokeWidth={6}  fill="none" strokeLinecap="round" />
      {/* 左の葉 */}
      <Ellipse cx={76}  cy={104} rx={26} ry={16} fill="#0D2A14" opacity={0.95} />
      <Ellipse cx={98}  cy={96}  rx={20} ry={14} fill="#112E18" opacity={0.9} />
      <Ellipse cx={58}  cy={90}  rx={22} ry={14} fill="#0F2816" opacity={0.9} />
      <Ellipse cx={64}  cy={156} rx={22} ry={14} fill="#0D2A14" opacity={0.9} />
      <Ellipse cx={86}  cy={148} rx={20} ry={12} fill="#112E18" opacity={0.85} />
      <Ellipse cx={52}  cy={62}  rx={18} ry={12} fill="#0F2816" opacity={0.85} />

      {/* 右の木 */}
      <Path d="M400,260 L376,260 L370,160 L366,110 L374,60 L384,40 L394,60 L402,110 L400,160 Z" fill="#0C200E" />
      <Path d="M384,120 Q346,100 310,112" stroke="#0E2414" strokeWidth={10} fill="none" strokeLinecap="round" />
      <Path d="M382,170 Q348,156 318,164" stroke="#0E2414" strokeWidth={8}  fill="none" strokeLinecap="round" />
      <Path d="M386,78  Q356,60 330,66"   stroke="#0E2414" strokeWidth={6}  fill="none" strokeLinecap="round" />
      {/* 右の葉 */}
      <Ellipse cx={314} cy={104} rx={26} ry={16} fill="#0D2A14" opacity={0.95} />
      <Ellipse cx={292} cy={96}  rx={20} ry={14} fill="#112E18" opacity={0.9} />
      <Ellipse cx={332} cy={90}  rx={22} ry={14} fill="#0F2816" opacity={0.9} />
      <Ellipse cx={326} cy={156} rx={22} ry={14} fill="#0D2A14" opacity={0.9} />
      <Ellipse cx={304} cy={148} rx={20} ry={12} fill="#112E18" opacity={0.85} />
      <Ellipse cx={338} cy={62}  rx={18} ry={12} fill="#0F2816" opacity={0.85} />

      {/* 葉っぱ型の単語カード */}
      <G transform="rotate(-14 155 88)">
        <Ellipse cx={155} cy={88} rx={38} ry={18} fill="#0E3018" stroke="rgba(45,212,140,0.38)" strokeWidth={1} />
        <Line x1={155} y1={71} x2={155} y2={105} stroke="rgba(45,212,140,0.28)" strokeWidth={0.9} />
        <Line x1={155} y1={84} x2={175} y2={78}  stroke="rgba(45,212,140,0.20)" strokeWidth={0.9} />
        <Line x1={155} y1={92} x2={175} y2={86}  stroke="rgba(45,212,140,0.20)" strokeWidth={0.9} />
        <SvgText x={155} y={92} fill="rgba(100,220,140,0.72)" fontSize={8} fontWeight="600" textAnchor="middle">growth</SvgText>
      </G>
      <G transform="rotate(10 230 148)">
        <Ellipse cx={230} cy={148} rx={36} ry={17} fill="#0E3018" stroke="rgba(45,212,140,0.32)" strokeWidth={1} />
        <Line x1={230} y1={132} x2={230} y2={164} stroke="rgba(45,212,140,0.22)" strokeWidth={0.9} />
        <SvgText x={230} y={152} fill="rgba(100,220,140,0.65)" fontSize={8} fontWeight="600" textAnchor="middle">discover</SvgText>
      </G>
      <G transform="rotate(-8 185 196)">
        <Ellipse cx={185} cy={196} rx={32} ry={15} fill="#0E3018" stroke="rgba(45,212,140,0.26)" strokeWidth={1} />
        <SvgText x={185} y={200} fill="rgba(100,220,140,0.58)" fontSize={7.5} fontWeight="600" textAnchor="middle">learn</SvgText>
      </G>

      {/* 遠景の森シルエット */}
      <Path d="M0,230 Q30,210 60,230 Q80,215 105,230 Q130,212 158,230 Q180,214 210,230 Q235,212 260,230 Q285,215 310,230 Q332,213 358,230 Q375,214 390,230 L390,260 L0,260 Z" fill="#0A1A0C" />
    </Svg>
  );
}

// ── Stage 4: 文脈の街・看板や窓 ────────────────────────────────
function Stage4() {
  return (
    <Svg width={SW} height={VH} viewBox={`0 0 ${VW} ${VH}`} fill="none">
      <Defs>
        <RadialGradient id="s4a" cx="50%" cy="100%" r="65%">
          <Stop offset="0%"   stopColor="#6428C8" stopOpacity={0.22} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="s4b" cx="50%" cy="50%" r="50%">
          <Stop offset="0%"   stopColor="#7828DC" stopOpacity={0.07} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={VW} height={VH} fill="#0A0418" />
      <Rect width={VW} height={VH} fill="url(#s4a)" />
      <Rect width={VW} height={VH} fill="url(#s4b)" />

      {/* 星 */}
      {[18,50,90,140,195,240,290,340,375].map((cx, i) => (
        <Circle key={i} cx={cx} cy={8 + (i % 3) * 7} r={0.9 + (i % 2) * 0.4} fill="rgba(200,180,255,0.5)" />
      ))}

      {/* ビルシルエット群 */}
      <Rect x={0}   y={110} width={32}  height={150} fill="#0E0620" />
      <Rect x={28}  y={88}  width={28}  height={172} fill="#100822" />
      <Rect x={52}  y={120} width={24}  height={140} fill="#0C0618" />
      <Rect x={72}  y={96}  width={30}  height={164} fill="#100822" />
      <Rect x={98}  y={108} width={26}  height={152} fill="#0E0620" />
      <Rect x={120} y={84}  width={32}  height={176} fill="#12082A" />
      <Rect x={148} y={100} width={28}  height={160} fill="#0E0620" />
      <Rect x={172} y={76}  width={26}  height={184} fill="#100822" />
      <Rect x={194} y={92}  width={30}  height={168} fill="#0C0618" />
      <Rect x={220} y={108} width={28}  height={152} fill="#100822" />
      <Rect x={244} y={86}  width={32}  height={174} fill="#0E0620" />
      <Rect x={272} y={100} width={26}  height={160} fill="#12082A" />
      <Rect x={294} y={116} width={28}  height={144} fill="#0C0618" />
      <Rect x={318} y={88}  width={30}  height={172} fill="#100822" />
      <Rect x={344} y={104} width={26}  height={156} fill="#0E0620" />
      <Rect x={366} y={92}  width={24}  height={168} fill="#100822" />

      {/* 窓の光 */}
      {[
        [8,120],[18,120],[8,140],[18,148],[8,166],[18,170],
        [76,104],[88,104],[76,122],[88,128],[76,144],[88,150],
        [126,92],[140,92],[126,110],[140,116],[126,132],[140,138],
        [178,84],[190,84],[178,104],[190,110],[178,124],[190,130],
        [248,94],[260,94],[248,114],[260,120],[248,134],[260,140],
        [322,96],[334,96],[322,116],[334,122],[322,138],[334,144],
      ].map(([cx, cy], i) => (
        <Rect key={i} x={cx} y={cy} width={8} height={5} rx={1}
          fill={i % 3 === 0 ? 'rgba(255,220,100,0.52)' : i % 3 === 1 ? 'rgba(200,180,255,0.44)' : 'rgba(255,180,100,0.48)'}
        />
      ))}

      {/* 道路と地面 */}
      <Rect x={0} y={240} width={VW} height={20} fill="#080414" />
      <Rect x={0} y={238} width={VW} height={4}  fill="#120828" />

      {/* 街灯 */}
      <Rect x={76}  y={186} width={3} height={56} fill="#1C1032" />
      <Path d="M76,186 Q88,181 94,188" stroke="#1C1032" strokeWidth={3} fill="none" />
      <Circle cx={94} cy={188} r={5} fill="rgba(255,220,100,0.65)" />
      <Rect x={278} y={184} width={3} height={58} fill="#1C1032" />
      <Path d="M280,184 Q268,180 262,186" stroke="#1C1032" strokeWidth={3} fill="none" />
      <Circle cx={262} cy={186} r={5} fill="rgba(255,220,100,0.65)" />

      {/* ネオン看板 */}
      <G opacity={0.78}>
        <Rect x={38}  y={158} width={60} height={18} rx={3} fill="rgba(120,60,220,0.12)" stroke="rgba(160,80,255,0.65)" strokeWidth={1.2} />
        <SvgText x={68} y={171} fill="#C090FF" fontSize={8} fontWeight="700" textAnchor="middle">context</SvgText>
      </G>
      <G opacity={0.68}>
        <Rect x={162} y={152} width={58} height={18} rx={3} fill="rgba(45,212,191,0.08)" stroke="rgba(45,212,191,0.58)" strokeWidth={1.2} />
        <SvgText x={191} y={165} fill="#2DD4BF" fontSize={8} fontWeight="700" textAnchor="middle">meaning</SvgText>
      </G>
      <G opacity={0.58}>
        <Rect x={286} y={160} width={52} height={18} rx={3} fill="rgba(255,180,80,0.07)" stroke="rgba(255,180,80,0.48)" strokeWidth={1} />
        <SvgText x={312} y={173} fill="#F5B84B" fontSize={7.5} textAnchor="middle">nuance</SvgText>
      </G>
      <G opacity={0.48}>
        <Rect x={104} y={196} width={50} height={16} rx={3} fill="rgba(255,100,160,0.07)" stroke="rgba(255,100,160,0.42)" strokeWidth={1} />
        <SvgText x={129} y={208} fill="#FF82B8" fontSize={7} textAnchor="middle">insight</SvgText>
      </G>
    </Svg>
  );
}

// ── Stage 5: 言葉の空・単語の星座 ──────────────────────────────
function Stage5() {
  const stars: [number, number, number][] = [
    [12,16,1.2],[34,8,0.8],[58,22,1.4],[80,5,0.7],[102,16,1.1],[126,10,0.9],
    [148,24,1.3],[168,7,0.8],[186,20,1],[210,14,1.2],[234,6,0.9],[258,18,1.1],
    [280,8,0.8],[302,22,1.3],[324,10,0.9],[348,18,1],[368,6,1.1],[382,24,0.8],
    [22,52,0.9],[46,44,1.2],[74,58,0.7],[96,48,1],[118,62,0.8],[142,50,1.3],
    [164,66,0.9],[186,44,1.1],[208,60,0.8],[232,48,1],[256,64,1.2],[278,50,0.9],
    [300,62,0.8],[324,44,1.1],[346,58,0.9],[368,48,1.2],[8,90,0.8],[30,82,1.1],
    [52,96,0.7],[76,88,1.2],[100,100,0.9],[124,86,1],[150,98,0.8],[174,90,1.2],
    [196,80,0.9],[220,96,1],[244,84,1.1],[266,100,0.8],[290,88,1.3],[314,102,0.9],
    [336,84,1],[358,96,0.8],[18,130,0.9],[42,120,1.1],[66,138,0.8],[90,126,1.3],
    [114,142,0.7],[138,130,1],[162,144,0.9],[188,132,1.1],[212,148,0.8],[236,134,1],
    [260,146,0.9],[284,132,1.2],[308,144,0.8],[332,130,1],[356,142,0.9],
  ];
  return (
    <Svg width={SW} height={VH} viewBox={`0 0 ${VW} ${VH}`} fill="none">
      <Defs>
        <RadialGradient id="s5a" cx="50%" cy="40%" r="55%">
          <Stop offset="0%"   stopColor="#1E32A0" stopOpacity={0.25} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="s5b" cx="22%" cy="30%" r="28%">
          <Stop offset="0%"   stopColor="#5028B4" stopOpacity={0.16} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="s5c" cx="78%" cy="65%" r="26%">
          <Stop offset="0%"   stopColor="#1464A0" stopOpacity={0.14} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={VW} height={VH} fill="#02040F" />
      <Rect width={VW} height={VH} fill="url(#s5a)" />
      <Rect width={VW} height={VH} fill="url(#s5b)" />
      <Rect width={VW} height={VH} fill="url(#s5c)" />

      {/* 星フィールド */}
      {stars.map(([cx, cy, r], i) => (
        <Circle key={i} cx={cx} cy={cy} r={r} fill={`rgba(220,230,255,${0.45 + (i % 4) * 0.1})`} />
      ))}

      {/* 星座①: achieve */}
      {[
        [60,44],[86,36],[114,42],[140,32],[164,40],
      ].map(([cx, cy], i, arr) => (
        <G key={i}>
          <Circle cx={cx} cy={cy} r={i % 2 === 0 ? 2.4 : 1.8} fill="rgba(180,200,255,0.88)" />
          {i < arr.length - 1 && (
            <Line x1={cx} y1={cy} x2={arr[i+1][0]} y2={arr[i+1][1]}
              stroke="rgba(160,180,255,0.38)" strokeWidth={0.9} />
          )}
        </G>
      ))}
      <SvgText x={112} y={28} fill="rgba(160,180,255,0.52)" fontSize={7} textAnchor="middle" letterSpacing={0.8}>achieve</SvgText>

      {/* 星座②: grow */}
      {[
        [210,90],[238,82],[268,90],[296,82],
      ].map(([cx, cy], i, arr) => (
        <G key={i}>
          <Circle cx={cx} cy={cy} r={i % 2 === 0 ? 2.2 : 1.8} fill="rgba(200,220,255,0.84)" />
          {i < arr.length - 1 && (
            <Line x1={cx} y1={cy} x2={arr[i+1][0]} y2={arr[i+1][1]}
              stroke="rgba(160,180,255,0.32)" strokeWidth={0.9} />
          )}
        </G>
      ))}
      <SvgText x={253} y={76} fill="rgba(160,180,255,0.46)" fontSize={7} textAnchor="middle" letterSpacing={0.8}>grow</SvgText>

      {/* 星座③: know */}
      {[
        [36,164],[68,156],[100,164],[132,156],[162,164],
      ].map(([cx, cy], i, arr) => (
        <G key={i}>
          <Circle cx={cx} cy={cy} r={i % 2 === 0 ? 2 : 1.8} fill="rgba(180,210,255,0.80)" />
          {i < arr.length - 1 && (
            <Line x1={cx} y1={cy} x2={arr[i+1][0]} y2={arr[i+1][1]}
              stroke="rgba(160,180,255,0.28)" strokeWidth={0.9} />
          )}
        </G>
      ))}
      <SvgText x={99} y={150} fill="rgba(160,180,255,0.44)" fontSize={7} textAnchor="middle" letterSpacing={0.8}>know</SvgText>

      {/* 星座④: word */}
      {[
        [240,166],[268,158],[298,166],[326,158],
      ].map(([cx, cy], i, arr) => (
        <G key={i}>
          <Circle cx={cx} cy={cy} r={1.9} fill="rgba(200,210,255,0.78)" />
          {i < arr.length - 1 && (
            <Line x1={cx} y1={cy} x2={arr[i+1][0]} y2={arr[i+1][1]}
              stroke="rgba(160,180,255,0.26)" strokeWidth={0.9} />
          )}
        </G>
      ))}
      <SvgText x={283} y={152} fill="rgba(160,180,255,0.40)" fontSize={7} textAnchor="middle" letterSpacing={0.8}>word</SvgText>

      {/* 銀河の帯 */}
      <Ellipse cx={195} cy={220} rx={220} ry={26} fill="rgba(40,60,180,0.06)" transform="rotate(-10 195 220)" />

      {/* 惑星 */}
      <Circle cx={344} cy={218} r={26} fill="rgba(40,20,100,0.55)" />
      <Ellipse cx={344} cy={218} rx={40} ry={7} fill="none" stroke="rgba(120,80,220,0.35)" strokeWidth={2} />
      <Circle cx={44}  cy={238} r={16} fill="rgba(20,40,80,0.45)" />
    </Svg>
  );
}

// ── Stage 6: KotoClip Library・光る本棚 ────────────────────────
function Stage6() {
  const leftBooks  = ['#5A3010','#2A4020','#4A2800','#382A10','#2A3840','#4A3010','#3A2814','#5A2A10','#3A3840'];
  const rightBooks = ['#4A2800','#B8841E','#2A4020','#5A3010','#3A2840','#2A4818','#4A3818','#5A2A10','#3A4020'];
  const glowBooks  = [
    { x: 20, y: 8,  c1: '#C4922A', c2: '#E5C050', ey: 50 },
    { x: 10, y: 90, c1: '#B8841E', c2: '#D4A840', ey: 128 },
    { x: 30, y: 168,c1: '#B87820', c2: '#D49A38', ey: 206 },
  ];
  return (
    <Svg width={SW} height={VH} viewBox={`0 0 ${VW} ${VH}`} fill="none">
      <Defs>
        <RadialGradient id="s6a" cx="50%" cy="55%" r="58%">
          <Stop offset="0%"   stopColor="#C88C28" stopOpacity={0.24} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="s6b" cx="50%" cy="95%" r="50%">
          <Stop offset="0%"   stopColor="#B47818" stopOpacity={0.18} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={VW} height={VH} fill="#130A00" />
      <Rect width={VW} height={VH} fill="url(#s6a)" />
      <Rect width={VW} height={VH} fill="url(#s6b)" />

      {/* 天井アーチ */}
      <Path d="M0,0 Q195,-16 390,0 L390,24 Q195,8 0,24 Z" fill="rgba(40,26,8,0.8)" />
      <Path d="M0,22 Q195,6 390,22" stroke="rgba(200,140,40,0.32)" strokeWidth={1.5} fill="none" />

      {/* 左本棚 */}
      <Rect x={0} y={0} width={74} height={VH} fill="#1C1000" />
      <Rect x={2} y={0} width={70} height={VH} fill="#221500" />
      <Rect x={2} y={80}  width={70} height={4} fill="#180E00" />
      <Rect x={2} y={160} width={70} height={4} fill="#180E00" />
      {leftBooks.map((fill, i) => (
        <Rect key={i} x={4 + i * 7.5} y={8}   width={6} height={68} rx={1} fill={fill} />
      ))}
      {leftBooks.map((fill, i) => (
        <Rect key={i} x={4 + i * 7.5} y={88}  width={6} height={68} rx={1} fill={fill} />
      ))}
      {leftBooks.map((fill, i) => (
        <Rect key={i} x={4 + i * 7.5} y={168} width={6} height={90} rx={1} fill={fill} />
      ))}
      {/* 光る本（左） */}
      {glowBooks.map((b, i) => (
        <G key={i}>
          <Rect x={b.x}   y={b.y}   width={10} height={b.ey - b.y} rx={1} fill={b.c1} opacity={0.78} />
          <Rect x={b.x+1} y={b.y+1} width={8}  height={b.ey - b.y - 2} rx={1} fill={b.c2} opacity={0.55} />
          <Ellipse cx={b.x + 5} cy={(b.y + b.ey) / 2} rx={6} ry={(b.ey - b.y) / 2.2} fill="rgba(245,200,80,0.20)" />
        </G>
      ))}

      {/* 右本棚 */}
      <Rect x={316} y={0} width={74} height={VH} fill="#1C1000" />
      <Rect x={318} y={0} width={70} height={VH} fill="#221500" />
      <Rect x={318} y={80}  width={70} height={4} fill="#180E00" />
      <Rect x={318} y={160} width={70} height={4} fill="#180E00" />
      {rightBooks.map((fill, i) => (
        <Rect key={i} x={320 + i * 7.5} y={8}   width={6} height={68} rx={1} fill={fill} />
      ))}
      {rightBooks.map((fill, i) => (
        <Rect key={i} x={320 + i * 7.5} y={88}  width={6} height={68} rx={1} fill={fill} />
      ))}
      {rightBooks.map((fill, i) => (
        <Rect key={i} x={320 + i * 7.5} y={168} width={6} height={90} rx={1} fill={fill} />
      ))}
      {/* 光る本（右）*/}
      {[
        { x: 324, y: 10,  ey: 74 },
        { x: 348, y: 92,  ey: 156 },
        { x: 360, y: 170, ey: 258 },
      ].map((b, i) => (
        <G key={i}>
          <Rect x={b.x}   y={b.y}   width={10} height={b.ey - b.y} rx={1} fill="#C4922A" opacity={0.76} />
          <Rect x={b.x+1} y={b.y+1} width={8}  height={b.ey - b.y - 2} rx={1} fill="#E5C050" opacity={0.55} />
          <Ellipse cx={b.x + 5} cy={(b.y + b.ey) / 2} rx={6} ry={(b.ey - b.y) / 2.2} fill="rgba(245,200,80,0.20)" />
        </G>
      ))}

      {/* 床 */}
      <Rect x={74} y={244} width={242} height={16} fill="#1A1000" />
      <Rect x={74} y={242} width={242} height={4}  fill="#2A1800" />
      <Line x1={74} y1={248} x2={316} y2={248} stroke="rgba(200,140,40,0.14)" strokeWidth={0.8} />

      {/* シャンデリア */}
      <Line x1={195} y1={0} x2={195} y2={24} stroke="#2A1800" strokeWidth={2} />
      <Ellipse cx={195} cy={26} rx={22} ry={5} fill="#2A1800" />
      <Circle  cx={195} cy={26} r={5}   fill="rgba(245,200,80,0.85)" />
      <Ellipse cx={195} cy={28} rx={22} ry={3} fill="rgba(245,184,75,0.28)" />
      <Ellipse cx={195} cy={52} rx={60} ry={18} fill="rgba(245,184,75,0.07)" />

      {/* 中央の書見台 */}
      <Rect x={166} y={198} width={58} height={5}  rx={2} fill="#2E1C00" />
      <Rect x={178} y={203} width={34} height={42} rx={3} fill="#241600" />
      <Rect x={172} y={182} width={20} height={22} rx={2} fill="#C4922A" opacity={0.85} />
      <Rect x={173} y={183} width={18} height={20} rx={1} fill="#E5C050" opacity={0.65} />
      <Ellipse cx={182} cy={193} rx={9} ry={10} fill="rgba(245,210,100,0.24)" />

      {/* スパークル */}
      <Circle cx={118} cy={76}  r={2}   fill="rgba(245,200,80,0.92)" />
      <Circle cx={113} cy={74}  r={0.9} fill="rgba(245,200,80,0.62)" />
      <Circle cx={123} cy={72}  r={0.9} fill="rgba(245,200,80,0.62)" />
      <Circle cx={118} cy={70}  r={0.8} fill="rgba(245,200,80,0.55)" />
      <Circle cx={272} cy={100} r={2}   fill="rgba(245,200,80,0.90)" />
      <Circle cx={267} cy={98}  r={0.9} fill="rgba(245,200,80,0.60)" />
      <Circle cx={277} cy={96}  r={0.9} fill="rgba(245,200,80,0.60)" />
      <Circle cx={195} cy={172} r={2.2} fill="rgba(245,200,80,0.88)" />
      <Circle cx={189} cy={169} r={0.9} fill="rgba(245,200,80,0.55)" />
      <Circle cx={201} cy={167} r={0.9} fill="rgba(245,200,80,0.55)" />

      {/* 浮かぶ光の文字 */}
      <SvgText x={195} y={136} fill="rgba(245,184,75,0.26)" fontSize={8} fontWeight="700" textAnchor="middle" letterSpacing={2}>K O T O C L I P</SvgText>
      <SvgText x={195} y={150} fill="rgba(245,184,75,0.16)" fontSize={6.5} textAnchor="middle" letterSpacing={1.5}>L I B R A R Y</SvgText>
    </Svg>
  );
}
