import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, LobsterTwo_700Bold } from '@expo-google-fonts/lobster-two';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';

import { AuthProvider, useAuth } from '@/context/auth';
import { Onboarding, hasSeenOnboarding } from '@/components/Onboarding';

// Render.com のコールドスタート対策: アプリ起動時にバックグラウンドでサーバーを起こす
function useRenderWarmup() {
  useEffect(() => {
    fetch('https://kotoclip.onrender.com').catch(() => {});
  }, []);
}

function RootLayoutNav() {
  const { state } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const onboardingChecked = useRef(false);
  useRenderWarmup();

  useEffect(() => {
    if (state === 'loading') return;

    const inAuth = (segments[0] as string) === 'auth';

    if (state === 'unauthenticated' && !inAuth) {
      router.replace('/auth/login' as any);
    } else if (state === 'authenticated' && inAuth) {
      router.replace('/(tabs)' as any);
    } else if (state === 'authenticated' && !inAuth && !onboardingChecked.current) {
      onboardingChecked.current = true;
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
  const [fontsLoaded, fontError] = useFonts({
    LobsterTwo_700Bold,
    SpaceGrotesk_700Bold,
  });

  const appReady = fontsLoaded || !!fontError;
  if (!appReady) return null;

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
