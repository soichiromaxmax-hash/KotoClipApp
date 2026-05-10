import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '@/context/auth';
import { SplashAnimation } from '@/components/SplashAnimation';
import { Onboarding, hasSeenOnboarding } from '@/components/Onboarding';

// Render.com のコールドスタート対策: アプリ起動時にバックグラウンドでサーバーを起こす
function useRenderWarmup() {
  useEffect(() => {
    fetch('https://kotoclip.onrender.com/api/lookup?word=hello', { signal: AbortSignal.timeout(30000) })
      .catch(() => {});
  }, []);
}

function RootLayoutNav() {
  const { state } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [showOnboarding, setShowOnboarding] = useState(false);
  useRenderWarmup();

  useEffect(() => {
    if (state === 'loading') return;

    const inAuth = (segments[0] as string) === 'auth';

    if (state === 'unauthenticated' && !inAuth) {
      router.replace('/auth/login' as any);
    } else if (state === 'authenticated' && inAuth) {
      router.replace('/(tabs)' as any);
    } else if (state === 'authenticated' && !inAuth) {
      hasSeenOnboarding().then((seen) => {
        if (!seen) setShowOnboarding(true);
      });
    }
  }, [state, segments, router]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="word" />
        <Stack.Screen name="flashcard" />
        <Stack.Screen name="add" />
        <Stack.Screen name="how-to" />
      </Stack>
      <StatusBar style="light" />
      <Onboarding
        visible={showOnboarding}
        onDone={() => setShowOnboarding(false)}
      />
    </>
  );
}

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);
  const fontsLoaded = true;

  return (
    <AuthProvider>
      <RootLayoutNav />
      {!splashDone && (
        <SplashAnimation fontsLoaded={!!fontsLoaded} onFinish={() => setSplashDone(true)} />
      )}
    </AuthProvider>
  );
}
