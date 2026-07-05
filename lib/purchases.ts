import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import type { PurchasesOffering, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ── RevenueCat の設定値 ──────────────────────────────────────────────────────
// app.revenuecat.com → Apps → iOS → Public API Key
export const RC_API_KEY_IOS = 'appl_SsVyUPAhQpgcGfLFEJhTtHhkWAU';

// App Store Connect で作成した Subscription Group の Product IDs
export const PRODUCT_IDS = {
  monthly: 'jp.kotoclip.premium.monthly',
  yearly:  'jp.kotoclip.premium.yearly',
};

// RevenueCat Dashboard で作成した Entitlement ID
export const ENTITLEMENT_PREMIUM = 'premium';

// ─────────────────────────────────────────────────────────────────────────────

export async function initPurchases() {
  if (Platform.OS !== 'ios') return;
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey: RC_API_KEY_IOS });

  // ログイン済みユーザーの Supabase UID を RevenueCat の app_user_id としてセット
  // （バックエンドの RevenueCat Webhook が app_user_id = Supabase UID を前提に処理するため）
  const userId = await AsyncStorage.getItem('user_id').catch(() => null);
  if (userId) {
    await Purchases.logIn(userId).catch(() => {});
  }
}

export async function loginRevenueCat(userId: string) {
  if (Platform.OS !== 'ios') return;
  await Purchases.logIn(userId).catch(() => {});
}

export async function logoutRevenueCat() {
  if (Platform.OS !== 'ios') return;
  await Purchases.logOut().catch(() => {});
}

export async function getOffering(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}

export function isPremiumActive(info: CustomerInfo): boolean {
  return info.entitlements.active[ENTITLEMENT_PREMIUM] !== undefined;
}
