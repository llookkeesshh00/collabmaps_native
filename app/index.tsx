import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useUserStore } from './stores';

export default function Index() {
  const { user, isInitialized } = useUserStore();

  if (!isInitialized) {
    // Still loading, return empty for now
    return null;
  }

  if (!user) {
    // No user, redirect to create user screen
    return <Redirect href="./screens/onboarding/CreateUserScreen" />;
  }
  
  // User exists, redirect to home tab
  return <Redirect href="/(tabs)/home" />;
}