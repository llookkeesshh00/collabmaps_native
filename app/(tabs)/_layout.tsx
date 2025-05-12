import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRoomStore } from '../stores';

// Define types for tab bar icon props
type TabBarIconProps = {
  color: string;
  size?: number;
};

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF',
          borderTopColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB',
        },
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#111827' : '#F9FAFB',
        },
        headerTintColor: colorScheme === 'dark' ? '#FFFFFF' : '#1F2937',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >      <Tabs.Screen
        name="home"
        options={{
          title: 'Map',
          headershown: false,
          tabBarIcon: ({ color }: TabBarIconProps) => (
            <MaterialIcons name="map" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="room"
        options={{
          headershown: false,
          title: 'Room',
          tabBarIcon: ({ color }: TabBarIconProps) => (
            <FontAwesome5 name="users" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          headershown: false,
          title: 'Profile',
          tabBarIcon: ({ color }: TabBarIconProps) => (
            <FontAwesome name="user" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}