import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { KotoLogo } from './KotoLogo';

interface Props {
  width: number;
  streakDays: number;
  savedWords: number;
  retentionRate: number;
  reviewedToday: number;
}

// HTML reference card width (aspect 9:16, min-height 620px → width≈349px)
const REF = 349;

export function StreakCard({ width, streakDays, savedWords, retentionRate, reviewedToday }: Props) {
  const height = Math.round(width * 16 / 9);
  const sc = width / REF;
  const safe = width * 0.075;
  const safeH = height * 0.075;

  const stats = [
    { value: String(savedWords), label: '保存単語' },
    { value: `${retentionRate}%`, label: '定着率' },
    { value: String(reviewedToday), label: '今日の復習' },
  ];

  return (
    <View style={{ width, height, backgroundColor: '#0E1116', borderRadius: 28 * sc, overflow: 'hidden' }}>
      {/* Radial gradients: top-center mint, bottom-right gold */}
      <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
        <Defs>
          <RadialGradient id="sg1" cx="50%" cy="16%" r="34%">
            <Stop offset="0" stopColor="#7CF7DF" stopOpacity="0.13" />
            <Stop offset="1" stopColor="#7CF7DF" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="sg2" cx="72%" cy="70%" r="28%">
            <Stop offset="0" stopColor="#F5B84B" stopOpacity="0.10" />
            <Stop offset="1" stopColor="#F5B84B" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#sg1)" />
        <Rect width={width} height={height} fill="url(#sg2)" />
      </Svg>

      {/* Inset border glow */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.04)',
            borderRadius: 28 * sc,
          },
        ]}
      />

      {/* Safe area — mirrors .safe { inset: 7.5% 7.5%; justify-content: space-between } */}
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
        {/* Logo */}
        <KotoLogo cardWidth={width} />

        {/* Middle: pill + hero + title + subtitle */}
        <View style={{ alignItems: 'center' }}>
          <View style={[pill.box, { paddingVertical: 8 * sc, paddingHorizontal: 13 * sc }]}>
            <Text style={[pill.text, { fontSize: 12 * sc }]}>STREAK UNLOCKED</Text>
          </View>

          <Text
            style={{
              marginTop: 14 * sc,
              color: '#F8FAFC',
              fontSize: 140 * sc,
              fontWeight: '800',
              letterSpacing: -(140 * sc * 0.08),
              lineHeight: 140 * sc * 0.9,
              textShadowColor: 'rgba(124,247,223,0.16)',
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 26 * sc,
              fontVariant: ['tabular-nums'] as any,
            }}
          >
            {streakDays}
            <Text style={{ color: '#7CF7DF', fontSize: 24 * sc, fontWeight: '800' }}>日</Text>
          </Text>

          <Text
            style={{
              marginTop: 18 * sc,
              marginBottom: 8 * sc,
              color: '#F8FAFC',
              fontSize: 28 * sc,
              fontWeight: '700',
              letterSpacing: -(28 * sc * 0.02),
              lineHeight: 28 * sc * 1.25,
              textAlign: 'center',
            }}
          >
            英語学習、続いてる。
          </Text>

          <Text
            style={{
              color: '#94A3B8',
              fontSize: 14 * sc,
              lineHeight: 14 * sc * 1.65,
              textAlign: 'center',
            }}
          >
            今日も出会った単語を{'\n'}ちゃんと記憶にクリップしました。
          </Text>
        </View>

        {/* Stats grid */}
        <View style={{ flexDirection: 'row', gap: 8 * sc, width: '100%' }}>
          {stats.map((s) => (
            <View key={s.label} style={[statChip.box, { paddingVertical: 13 * sc, paddingHorizontal: 8 * sc, borderRadius: 14 * sc }]}>
              <Text style={[statChip.value, { fontSize: 22 * sc, letterSpacing: -(22 * sc * 0.04) }]}>{s.value}</Text>
              <Text style={[statChip.label, { fontSize: 10 * sc, marginTop: 4 * sc }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Footer hashtags */}
        <Text style={{ color: 'rgba(229,231,235,0.52)', fontSize: 12 * sc, lineHeight: 12 * sc * 1.7 }}>
          #KotoClip #英語学習 #単語帳
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
  text: {
    color: 'rgba(229,231,235,0.72)',
    fontWeight: '700',
    letterSpacing: 1,
  },
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
