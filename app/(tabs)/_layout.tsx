import { Tabs } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function Layout() {
  return (
    <SafeAreaProvider >
      <View style={{ flex: 1, backgroundColor: '#fff',borderRadius:20 }}>
        <StatusBar translucent backgroundColor="transparent" style="dark" />

        <Tabs
          initialRouteName="home"
          tabBarHideOnKeyboard={true}
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#F3F3F3',
              height: 60,
              borderTopWidth: 0,
              elevation: 5,
              shadowOpacity: 0.1,
            },
          }}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: 'Home Page',
              tabBarButton: (props: any) => <CustomTabButton {...props} icon="home" label="Home" />,
            }}
          />
          <Tabs.Screen
            name="recent"
            options={{
              title: 'Recent',
              tabBarButton: (props: any) => <CustomTabButton {...props} icon="clock-o" label="Recent" />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarButton: (props: any) => <CustomTabButton {...props} icon="user" label="Profile" />,
            }}
          />
        </Tabs>
      </View>
    </SafeAreaProvider>
  );
}

const CustomTabButton = ({
  onPress,
  icon,
  label,
}: {
  onPress: () => void;
  icon: keyof typeof FontAwesome.glyphMap;
  label: string;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <FontAwesome name={icon} size={22} color="#333" />
      <Text style={{ fontSize: 11, color: '#333', marginTop: 2 }}>{label}</Text>
    </TouchableOpacity>
  );
};
