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
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { SharePayload, markStreakSeen, markWordSeen } from '@/lib/shareCard';
import { StreakCard } from './StreakCard';
import { WordMasteredCard } from './WordMasteredCard';

const { height: SH } = Dimensions.get('window');

const CARD_H = Math.round(SH * 0.54);
const CARD_W = Math.round(CARD_H * 9 / 16);

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

  async function handleShare() {
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

          <TouchableOpacity
            style={[styles.shareBtn, { width: CARD_W }]}
            onPress={handleShare}
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
