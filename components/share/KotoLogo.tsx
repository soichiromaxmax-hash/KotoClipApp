import { View, Text } from 'react-native';

// HTML reference: .koto { font-size:58px } .clip { font-size:50px } .logo { transform:scale(0.72) }
// Effective sizes at REF_WIDTH=349: Koto=41.76px, Clip=36px
// Arch/box dimensions derived from clip em=50px (before scale), then multiplied by 0.72

const REF = 349;

export function KotoLogo({ cardWidth }: { cardWidth: number }) {
  const sc = cardWidth / REF;

  const kotoFs = 41.76 * sc;
  const clipFs = 36 * sc;
  const em = 50 * sc; // clip em (before scale factor, for arch/padding proportions)

  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: Math.max(1, 0.75 * sc) }}>
      <Text
        style={{
          color: '#F1F5F9',
          fontFamily: 'LobsterTwo_700Bold',
          fontSize: kotoFs,
          lineHeight: kotoFs * 1.1,
          letterSpacing: -kotoFs * 0.035,
        }}
      >
        Koto
      </Text>
      <View style={{ position: 'relative' }}>
        {/* Gold arch: top:-0.11em left:0.18em w:0.34em h:0.18em (of clip em=50px*sc) */}
        <View
          style={{
            position: 'absolute',
            top: -em * 0.11 * 0.72,
            left: em * 0.18 * 0.72,
            width: em * 0.34 * 0.72,
            height: em * 0.18 * 0.72,
            borderWidth: 1.5,
            borderBottomWidth: 0,
            borderColor: 'rgba(245,184,75,0.78)',
            borderTopLeftRadius: em * 0.16 * 0.72,
            borderTopRightRadius: em * 0.16 * 0.72,
          }}
        />
        {/* Gold border box: border-radius:0.18em, padding:0.03em 0.12em 0.08em 0.11em */}
        <View
          style={{
            borderWidth: 1.5,
            borderColor: 'rgba(245,184,75,0.82)',
            borderRadius: em * 0.18 * 0.72,
            paddingTop: em * 0.03 * 0.72,
            paddingBottom: em * 0.08 * 0.72,
            paddingLeft: em * 0.11 * 0.72,
            paddingRight: em * 0.12 * 0.72,
          }}
        >
          <Text
            style={{
              color: '#7CF7DF',
              fontFamily: 'SpaceGrotesk_700Bold',
              fontSize: clipFs,
              lineHeight: clipFs * 1.1,
              letterSpacing: -clipFs * 0.058,
            }}
          >
            Clip
          </Text>
        </View>
      </View>
    </View>
  );
}
