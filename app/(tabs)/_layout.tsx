import { Tabs } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Hide default header
        tabBarStyle: {
          backgroundColor: '#F3F3F3', // White background
          height: 50, // Adjust height
          borderTopWidth: 0, // Remove border
          elevation: 5, // Shadow for Android
          shadowOpacity: 0.1, // Shadow for iOS
        },
      }}
    >
      {/* Home Page */}
      <Tabs.Screen 
        name="home" 
        options={{
          title: 'home page',
          tabBarButton: (props: any) => <CustomTabButton {...props} icon="home" label="Home" />,
        }} 
      />

      {/* Recent Page */}
      <Tabs.Screen 
        name="recent" 
        options={{
          title: '',
          tabBarButton: (props: any) => <CustomTabButton {...props} icon="clock-o" label="Recent" />,
        }} 
      />

      {/* Profile Page */}
      <Tabs.Screen 
        name="profile" 
        options={{
          title: '',
          tabBarButton: (props: any) => <CustomTabButton {...props} icon="user" label="Profile" />,
        }} 
      />
    </Tabs>
  );
}

// ✅ Custom Tab Button Component
const CustomTabButton = ({ onPress, icon, label }: { onPress: () => void; icon: keyof typeof FontAwesome.glyphMap; label: string }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <FontAwesome name={icon} size={24} color="#333" />
      <Text style={{ fontSize: 12, color: '#333', marginTop: 4 }}>{label}</Text>
    </TouchableOpacity>
  );
};