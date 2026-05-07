import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

let _mod: any = null;
if (Platform.OS === 'ios') {
  try { _mod = requireNativeModule('SharedStorage'); } catch {}
}

const SharedStorage = {
  setItem(key: string, value: string): void {
    _mod?.setItem(key, value);
  },
  removeItem(key: string): void {
    _mod?.removeItem(key);
  },
};

export default SharedStorage;
