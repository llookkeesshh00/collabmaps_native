import { Tabs } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: '#F3F3F3',
          height: 60,
          borderTopWidth: 0,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
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
        name="join"
        options={{
          title: 'join',
          tabBarButton: (props: any) => <CustomTabButton {...props} icon="clock-o" label="join" />,
        }}
      />
    </Tabs>
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
