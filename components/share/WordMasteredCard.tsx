import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { KotoLogo } from './KotoLogo';

interface Props {
  width: number;
  word: string;
  meaning: string;
  reviewCount: number;
  daysToMaster: number;
  masteryRank: 'S' | 'A' | 'B';
}

const REF = 349;

export function WordMasteredCard({ width, word, meaning, reviewCount, daysToMaster, masteryRank }: Props) {
  const height = Math.round(width * 16 / 9);
  const sc = width / REF;
  const safe = width * 0.075;
  const safeH = height * 0.075;

  const stats = [
    { value: String(reviewCount), label: '復習回数' },
    { value: `${daysToMaster}日`, label: '定着期間' },
    { value: masteryRank, label: '習得ランク' },
  ];

  return (
    <View style={{ width, height, backgroundColor: '#0E1116', borderRadius: 28 * sc, overflow: 'hidden' }}>
      <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
        <Defs>
          <RadialGradient id="wg1" cx="50%" cy="16%" r="34%">
            <Stop offset="0" stopColor="#7CF7DF" stopOpacity="0.13" />
            <Stop offset="1" stopColor="#7CF7DF" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="wg2" cx="72%" cy="70%" r="28%">
            <Stop offset="0" stopColor="#F5B84B" stopOpacity="0.10" />
            <Stop offset="1" stopColor="#F5B84B" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#wg1)" />
        <Rect width={width} height={height} fill="url(#wg2)" />
      </Svg>

      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', borderRadius: 28 * sc }]}
      />

      <View
        style={{
          position: 'absolute',
          top: safeH,
          left: safe,
          right: safe,
          bottom: safeH,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <KotoLogo cardWidth={width} />

        {/* Word panel — HTML: padding:18px border-radius:18px linear-gradient */}
        <LinearGradient
          colors={['rgba(255,255,255,0.05)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            width: '100%',
            padding: 18 * sc,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            borderRadius: 18 * sc,
            backgroundColor: 'rgba(255,255,255,0.035)',
            gap: 8 * sc,
          }}
        >
          <View style={[pill.box, { paddingVertical: 8 * sc, paddingHorizontal: 13 * sc, alignSelf: 'flex-start' }]}>
            <Text style={[pill.text, { fontSize: 12 * sc }]}>WORD MASTERED</Text>
          </View>

          {/* word — HTML: font-size:42px font-weight:800 letter-spacing:-0.06em */}
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              color: '#F8FAFC',
              fontSize: 42 * sc,
              fontWeight: '800',
              letterSpacing: -(42 * sc * 0.06),
            }}
          >
            {word}
          </Text>

          {/* meaning — HTML: font-size:18px color:mint font-weight:700 */}
          <Text style={{ color: '#7CF7DF', fontSize: 18 * sc, fontWeight: '700' }}>
            {meaning}
          </Text>
        </LinearGradient>

        {/* Title + subtitle */}
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              marginBottom: 8 * sc,
              color: '#F8FAFC',
              fontSize: 28 * sc,
              fontWeight: '700',
              letterSpacing: -(28 * sc * 0.02),
              lineHeight: 28 * sc * 1.25,
              textAlign: 'center',
            }}
          >
            この単語、覚えた。
          </Text>
          <Text
            style={{
              color: '#94A3B8',
              fontSize: 14 * sc,
              lineHeight: 14 * sc * 1.65,
              textAlign: 'center',
            }}
          >
            忘れかけたタイミングで復習して{'\n'}記憶に定着しました。
          </Text>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 8 * sc, width: '100%' }}>
          {stats.map((s) => (
            <View key={s.label} style={[statChip.box, { paddingVertical: 13 * sc, paddingHorizontal: 8 * sc, borderRadius: 14 * sc }]}>
              <Text style={[statChip.value, { fontSize: 22 * sc, letterSpacing: -(22 * sc * 0.04) }]}>{s.value}</Text>
              <Text style={[statChip.label, { fontSize: 10 * sc, marginTop: 4 * sc }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={{ color: 'rgba(229,231,235,0.52)', fontSize: 12 * sc, lineHeight: 12 * sc * 1.7 }}>
          あなたの今日の1語は？
        </Text>
      </View>
    </View>
  );
}

const pill = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: 'rgba(124,247,223,0.24)',
    borderRadius: 999,
    backgroundColor: 'rgba(124,247,223,0.07)',
  },
  text: { color: 'rgba(229,231,235,0.72)', fontWeight: '700', letterSpacing: 1 },
});

const statChip = StyleSheet.create({
  box: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.035)',
    alignItems: 'center',
  },
  value: { color: '#F8FAFC', fontWeight: '800', fontVariant: ['tabular-nums'] as any },
  label: { color: '#94A3B8' },
});
