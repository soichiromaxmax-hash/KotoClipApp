import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { PurchasesPackage } from 'react-native-purchases';
import { KotoBird } from '@/components/KotoBird';
import {
  getOffering,
  purchasePackage,
  restorePurchases,
  isPremiumActive,
  PRODUCT_IDS,
} from '@/lib/purchases';
import { api } from '@/lib/api';

// RevenueCat の Webhook がバックエンドに届いて plan が更新されるまでの
// タイムラグを埋めるため、成功メッセージを出す前に反映を少し待つ
async function waitForPlanSync(maxMs = 8000, intervalMs = 1500): Promise<boolean> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    try {
      const settings = await api.getSettings();
      if (settings?.is_premium) return true;
    } catch {
      // 通信エラーは無視してリトライ
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

const FEATURES = [
  { icon: '∞', label: '単語保存が無制限（無料は50語まで）' },
  { icon: '🔍', label: 'AI意味検索が月300回（無料は月20回）' },
  { icon: '🔄', label: 'AI再翻訳が月100回（無料は月5回）' },
  { icon: '🌐', label: '学習言語をいつでも変更' },
  { icon: '⚡', label: '優先サポート' },
];

function FeatureRow({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={s.featureRow}>
      <View style={s.featureIcon}><Text style={s.featureIconText}>{icon}</Text></View>
      <Text style={s.featureLabel}>{label}</Text>
    </View>
  );
}

export default function PaywallScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [monthly, setMonthly] = useState<PurchasesPackage | null>(null);
  const [yearly, setYearly] = useState<PurchasesPackage | null>(null);
  const [selected, setSelected] = useState<'monthly' | 'yearly'>('yearly');
  const [error, setError] = useState('');

  useEffect(() => {
    loadOfferings();
  }, []);

  async function loadOfferings() {
    setLoading(true);
    setError('');
    try {
      const offering = await getOffering();
      if (!offering) {
        setError('プランを読み込めませんでした。');
        return;
      }
      const m = offering.availablePackages.find(
        (p) => p.product.identifier === PRODUCT_IDS.monthly
      ) ?? offering.monthly ?? null;
      const y = offering.availablePackages.find(
        (p) => p.product.identifier === PRODUCT_IDS.yearly
      ) ?? offering.annual ?? null;
      setMonthly(m);
      setYearly(y);
    } catch {
      setError('プランを読み込めませんでした。通信状態を確認してください。');
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase() {
    const pkg = selected === 'monthly' ? monthly : yearly;
    if (!pkg) return;
    setPurchasing(true);
    try {
      const info = await purchasePackage(pkg);
      if (isPremiumActive(info)) {
        await waitForPlanSync();
        Alert.alert('ありがとうございます！', 'プレミアムが有効になりました。', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (e: any) {
      if (!e?.userCancelled) {
        Alert.alert('購入に失敗しました', e?.message ?? 'もう一度お試しください。');
      }
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    setPurchasing(true);
    try {
      const info = await restorePurchases();
      if (isPremiumActive(info)) {
        await waitForPlanSync();
        Alert.alert('復元しました', 'プレミアムが有効になりました。', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('購入履歴が見つかりません', '以前ご購入のアカウントでログインしているか確認してください。');
      }
    } catch {
      Alert.alert('復元に失敗しました', 'もう一度お試しください。');
    } finally {
      setPurchasing(false);
    }
  }

  // 半年プラン（PRODUCT_IDS.yearly）が月額より何%お得か
  function savingsPercent(): string {
    if (!monthly || !yearly) return '';
    const monthlySixMonths = monthly.product.price * 6;
    const yearlyPrice = yearly.product.price;
    const pct = Math.round(((monthlySixMonths - yearlyPrice) / monthlySixMonths) * 100);
    return pct > 0 ? `${pct}%お得` : '';
  }

  const selectedPkg = selected === 'monthly' ? monthly : yearly;

  return (
    <SafeAreaView style={s.root}>
      <LinearGradient
        colors={['#0E1116', '#131923', '#18212E']}
        style={StyleSheet.absoluteFill}
      />

      {/* 閉じるボタン */}
      <TouchableOpacity style={s.closeBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <Text style={s.closeBtnText}>✕</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* ヒーロー */}
        <View style={s.hero}>
          <KotoBird size={90} />
          <Text style={s.title}>KotoClip Premium</Text>
          <Text style={s.subtitle}>単語もAI検索も、上限を気にせず使い放題</Text>
        </View>

        {/* 機能リスト */}
        <View style={s.features}>
          {FEATURES.map((f) => <FeatureRow key={f.label} {...f} />)}
        </View>

        {/* プラン選択 */}
        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color="#2DD4BF" />
            <Text style={s.loadingText}>プランを読み込み中...</Text>
          </View>
        ) : error ? (
          <View style={s.errorWrap}>
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadOfferings} style={s.retryBtn}>
              <Text style={s.retryBtnText}>再試行</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.plans}>
            {/* 月額 */}
            {monthly && (
              <TouchableOpacity
                style={[s.planCard, selected === 'monthly' && s.planCardSelected]}
                onPress={() => setSelected('monthly')}
                activeOpacity={0.8}
              >
                <View style={s.planRadio}>
                  {selected === 'monthly' && <View style={s.planRadioDot} />}
                </View>
                <View style={s.planInfo}>
                  <Text style={[s.planName, selected === 'monthly' && s.planNameSelected]}>月額プラン</Text>
                  <Text style={s.planPrice}>{monthly.product.priceString}<Text style={s.planPer}> / 月</Text></Text>
                </View>
              </TouchableOpacity>
            )}

            {/* 半年（PRODUCT_IDS.yearly） */}
            {yearly && (
              <TouchableOpacity
                style={[s.planCard, selected === 'yearly' && s.planCardSelected]}
                onPress={() => setSelected('yearly')}
                activeOpacity={0.8}
              >
                <View style={s.planRadio}>
                  {selected === 'yearly' && <View style={s.planRadioDot} />}
                </View>
                <View style={s.planInfo}>
                  <View style={s.planNameRow}>
                    <Text style={[s.planName, selected === 'yearly' && s.planNameSelected]}>半年プラン</Text>
                    {!!savingsPercent() && (
                      <View style={s.savingsBadge}>
                        <Text style={s.savingsBadgeText}>⚡ {savingsPercent()}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.planPrice}>
                    {yearly.product.priceString}<Text style={s.planPer}> / 半年</Text>
                  </Text>
                  {monthly && (
                    <Text style={s.planMonthly}>
                      月あたり {yearly.product.currencyCode}{' '}
                      {(yearly.product.price / 6).toFixed(0)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 購入ボタン */}
        <TouchableOpacity
          style={[s.purchaseBtn, (!selectedPkg || purchasing) && { opacity: 0.5 }]}
          onPress={handlePurchase}
          disabled={!selectedPkg || purchasing}
          activeOpacity={0.85}
        >
          {purchasing
            ? <ActivityIndicator color="#0E1116" />
            : <Text style={s.purchaseBtnText}>
                {selectedPkg ? `${selectedPkg.product.priceString}で始める` : '購入する'}
              </Text>
          }
        </TouchableOpacity>

        {/* フッター */}
        <View style={s.footer}>
          <TouchableOpacity onPress={handleRestore} disabled={purchasing} activeOpacity={0.7}>
            <Text style={s.footerLink}>購入を復元</Text>
          </TouchableOpacity>
          <Text style={s.footerDot}>·</Text>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={s.footerLink}>無料で続ける</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.legal}>
          サブスクリプションはApp Storeアカウントに請求されます。{'\n'}
          次の更新日の24時間前までにキャンセルしない限り、自動更新されます。
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E1116' },
  scroll: { paddingBottom: 40, paddingHorizontal: 20 },

  closeBtn: {
    position: 'absolute',
    top: 54,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  closeBtnText: { color: '#6B7280', fontSize: 18, fontWeight: '500' },

  hero: { alignItems: 'center', paddingTop: 60, paddingBottom: 24, gap: 10 },
  title: { fontSize: 26, fontWeight: '700', color: '#F9FAFB', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#8F99A8' },

  features: {
    backgroundColor: 'rgba(21,26,34,0.9)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(45,212,191,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconText: { fontSize: 15 },
  featureLabel: { flex: 1, color: '#E9EDF2', fontSize: 15, fontWeight: '500' },

  loadingWrap: { alignItems: 'center', gap: 12, paddingVertical: 30 },
  loadingText: { color: '#8F99A8', fontSize: 13 },
  errorWrap: { alignItems: 'center', gap: 12, paddingVertical: 20 },
  errorText: { color: '#EF4444', fontSize: 13, textAlign: 'center' },
  retryBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  retryBtnText: { color: '#8F99A8', fontSize: 14 },

  plans: { gap: 10, marginBottom: 20 },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21,26,34,0.9)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    gap: 12,
  },
  planCardSelected: {
    borderColor: '#2DD4BF',
    backgroundColor: 'rgba(45,212,191,0.06)',
  },
  planRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  planRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2DD4BF' },
  planInfo: { flex: 1 },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  planName: { fontSize: 14, fontWeight: '600', color: '#8F99A8', marginBottom: 2 },
  planNameSelected: { color: '#E9EDF2' },
  planPrice: { fontSize: 20, fontWeight: '700', color: '#F9FAFB', letterSpacing: -0.5 },
  planPer: { fontSize: 13, fontWeight: '400', color: '#8F99A8' },
  planMonthly: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  savingsBadge: {
    backgroundColor: 'rgba(45,212,191,0.15)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  savingsBadgeText: { color: '#2DD4BF', fontSize: 11, fontWeight: '700' },

  purchaseBtn: {
    backgroundColor: '#2DD4BF',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 20,
  },
  purchaseBtnText: { color: '#0E1116', fontWeight: '700', fontSize: 17 },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 16 },
  footerLink: { color: '#6B7280', fontSize: 13 },
  footerDot: { color: '#374151', fontSize: 13 },

  legal: { color: '#374151', fontSize: 10, textAlign: 'center', lineHeight: 16 },
});
