import { Text, View } from "react-native";
import { Link } from "expo-router";
import { Pressable,Alert } from "react-native";

export default function Index() {
  return (
    <View className="bg-blue-500  min-h-full p-4 justify-center flex felx-col items-center text-xl">
     <Pressable className="p-4 bg-slate-100 text-xl rounded-2xl z-10" onPress={() => Alert.alert("Pressed!")} >
        <Link  className="p-4 bg-slate-100 text-xl rounded-2xl z-10" href={'/home'}> homepage</Link>
     </Pressable>
  </View>
  );
}