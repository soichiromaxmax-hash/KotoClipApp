import { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { SharePayload, markStreakSeen, markWordSeen } from '@/lib/shareCard';
import { StreakCard } from './StreakCard';
import { WordMasteredCard } from './WordMasteredCard';

const { height: SH } = Dimensions.get('window');

// カードサイズ: 高さを先に決めてから幅を9:16で算出
const CARD_H = Math.round(SH * 0.54);
const CARD_W = Math.round(CARD_H * 9 / 16);

// ─── SNSプラットフォーム定義 ────────────────────────────────────────────────

type PlatformDef = {
  id: string;
  name: string;
  bg: string;
  textColor: string;
  iconType: 'ionicons' | 'text';
  icon: string;
  scheme: string;
  webFallback: string;
};

const PLATFORMS: PlatformDef[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    bg: '#E1306C',
    textColor: '#fff',
    iconType: 'ionicons',
    icon: 'logo-instagram',
    scheme: 'instagram://',
    webFallback: 'https://instagram.com',
  },
  {
    id: 'x',
    name: 'X',
    bg: '#000',
    textColor: '#fff',
    iconType: 'text',
    icon: '𝕏',
    scheme: 'twitter://',
    webFallback: 'https://x.com',
  },
  {
    id: 'line',
    name: 'LINE',
    bg: '#00B900',
    textColor: '#fff',
    iconType: 'text',
    icon: 'LINE',
    scheme: 'line://',
    webFallback: 'https://line.me',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    bg: '#1877F2',
    textColor: '#fff',
    iconType: 'ionicons',
    icon: 'logo-facebook',
    scheme: 'fb://',
    webFallback: 'https://facebook.com',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    bg: '#0077B5',
    textColor: '#fff',
    iconType: 'ionicons',
    icon: 'logo-linkedin',
    scheme: 'linkedin://',
    webFallback: 'https://linkedin.com',
  },
];

interface Props {
  payload: SharePayload;
  onClose: () => void;
}

export function SharePrompt({ payload, onClose }: Props) {
  const cardRef = useRef<View>(null);
  const [loading, setLoading] = useState(false);

  async function markSeen() {
    if (payload.type === 'streak') await markStreakSeen(payload.streakDays);
    if (payload.type === 'word_mastered') await markWordSeen(payload.wordId);
  }

  async function captureCard(): Promise<string> {
    return captureRef(cardRef as any, { format: 'png', quality: 1 });
  }

  // プラットフォームボタン: 画像をiOSシェアシートで共有 → 投稿画面に直接移行
  async function handlePlatform(p: PlatformDef) {
    if (loading) return;
    setLoading(true);
    try {
      const uri = await captureCard();
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `${p.name}でシェア`,
      });
      await markSeen();
    } catch {
      Alert.alert('エラー', '共有できませんでした。再度お試しください。');
    } finally {
      setLoading(false);
      onClose();
    }
  }

  // 汎用ネイティブ共有シート
  async function handleGeneralShare() {
    if (loading) return;
    setLoading(true);
    try {
      const uri = await captureCard();
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'KotoClip 達成カードをシェア',
      });
      await markSeen();
    } catch {
      Alert.alert('シェアできませんでした', '再度お試しください。');
    } finally {
      setLoading(false);
      onClose();
    }
  }

  async function handleDismiss() {
    await markSeen();
    onClose();
  }

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent>
      <View style={styles.overlay}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* カードプレビュー（このrefでキャプチャ） */}
          <View ref={cardRef} collapsable={false}>
            {payload.type === 'streak' ? (
              <StreakCard
                width={CARD_W}
                streakDays={payload.streakDays}
                savedWords={payload.savedWords}
                retentionRate={payload.retentionRate}
                reviewedToday={payload.reviewedToday}
              />
            ) : (
              <WordMasteredCard
                width={CARD_W}
                word={payload.word}
                meaning={payload.meaning}
                reviewCount={payload.reviewCount}
                daysToMaster={payload.daysToMaster}
                masteryRank={payload.masteryRank}
              />
            )}
          </View>

          {/* SNSボタン */}
          <View style={styles.platformGrid}>
            {PLATFORMS.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.platformBtn}
                onPress={() => handlePlatform(p)}
                disabled={loading}
                activeOpacity={0.8}
              >
                <View style={[styles.platformIcon, { backgroundColor: p.bg }]}>
                  {p.iconType === 'ionicons' ? (
                    <Ionicons name={p.icon as any} size={26} color={p.textColor} />
                  ) : (
                    <Text
                      style={[
                        styles.platformIconText,
                        { color: p.textColor, fontSize: p.icon.length > 1 ? 13 : 22 },
                      ]}
                    >
                      {p.icon}
                    </Text>
                  )}
                </View>
                <Text style={styles.platformName}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 汎用シェアボタン */}
          <TouchableOpacity
            style={[styles.shareBtn, { width: CARD_W }]}
            onPress={handleGeneralShare}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#0E1116" />
            ) : (
              <Text style={styles.shareBtnText}>成果をシェア</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDismiss} style={styles.laterBtn}>
            <Text style={styles.laterBtnText}>あとで</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const BTN_SIZE = 56;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.90)',
    justifyContent: 'center',
  },
  scroll: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 20,
  },

  // SNSボタングリッド
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    width: CARD_W,
  },
  platformBtn: {
    alignItems: 'center',
    gap: 6,
    width: (CARD_W - 14 * 4) / 5, // 5ボタンを1行に
  },
  platformIcon: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformIconText: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  platformName: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'center',
  },

  // 汎用シェアボタン
  shareBtn: {
    backgroundColor: '#2DD4BF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  shareBtnText: { color: '#0E1116', fontWeight: '700', fontSize: 16 },

  laterBtn: { paddingVertical: 10 },
  laterBtnText: { color: '#64748B', fontSize: 15 },
});
