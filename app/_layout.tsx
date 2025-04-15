import * as expoCrypto from 'expo-crypto';
import { Stack } from 'expo-router';
import React from 'react';
import './global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
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

export default function RootLayout() {
  return (
    <SafeAreaProvider >
      <StatusBar translucent backgroundColor="transparent" style="dark" />
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}