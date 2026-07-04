import React from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/src/contexts/AuthContext';
import { I18nProvider } from '@/src/i18n/I18nProvider';

function RootNavigator() {
  return (
    <Stack>
      <Stack.Screen name="photo-adjust" options={{ headerShown: false }} />
      <Stack.Screen name="stamp-press" options={{ headerShown: false }} />
      <Stack.Screen name="album-stamp-detail" options={{ headerShown: false }} />
      <Stack.Screen
        name="stamp-done"
        options={{ headerShown: false, animation: 'none', gestureEnabled: false }}
      />
      <Stack.Screen name="mypage/notifications" options={{ headerShown: false }} />
      <Stack.Screen name="mypage/privacy" options={{ headerShown: false }} />
      <Stack.Screen name="mypage/help" options={{ headerShown: false }} />
      <Stack.Screen name="mypage/language" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nProvider>
        <SafeAreaProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </SafeAreaProvider>
      </I18nProvider>
    </GestureHandlerRootView>
  );
}
