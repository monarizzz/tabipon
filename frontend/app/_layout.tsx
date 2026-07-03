import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
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
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
