import { Text, View } from "react-native";
import { Link } from "expo-router";

export default function Index() {
  return (
    <View className="bg-blue-500  min-h-full p-4 justify-center flex felx-col items-center text-xl">
    <Text className="text-white">hii change</Text>
      <Link href={'/home'}> homepage</Link>
  </View>
  );
}