import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeMap from '../components/Home/HomeMap';

export default function Home() {
  return (
    <View style={{ flex: 1 }}>
      <HomeMap />
    </View>
  );
}