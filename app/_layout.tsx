import * as expoCrypto from 'expo-crypto';
import { Stack } from 'expo-router';
import React from 'react';

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

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}