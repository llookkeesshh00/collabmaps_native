import * as expoCrypto from 'expo-crypto';
import { Stack } from 'expo-router';
import React from 'react';
import './global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { ToastProvider } from './components/ToastContext';

if (typeof global.crypto === 'undefined') {
  global.crypto = {
    getRandomValues: <T extends ArrayBufferView | null>(array: T): T => {
      if (array === null) {
        throw new TypeError('ArrayBufferView expected, got null');
      }
      const randomBytes = expoCrypto.getRandomBytes(array.byteLength);
      const view = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
      view.set(randomBytes);
      return array;
    },
    // Add minimal stubs to satisfy the Crypto interface
    subtle: {} as Crypto['subtle'],
    randomUUID: () => crypto.randomUUID(), // Fallback or throw error if not supported
  } as Crypto;
}
console.log('Crypto polyfill applied for environments without native support.');

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar translucent style="dark" />
        <ToastProvider>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden' }}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="collab" options={{ headerShown: false }} />
              <Stack.Screen name="route" options={{ headerShown: false }} />
              <Stack.Screen name="livemap" options={{ headerShown: false }} />
            </Stack>
          </View>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
