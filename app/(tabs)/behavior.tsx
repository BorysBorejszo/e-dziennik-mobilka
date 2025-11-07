import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Entypo from "@expo/vector-icons/Entypo";
import { SidebarTrigger } from "../components/ui/sidebar";

export default function Behavior() {
  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-4 pt-4">
        <View className="flex-row items-center">
          <SidebarTrigger style={{ marginRight: 10 }}>
            <Entypo name="menu" size={24} color="#60A5FA" />
          </SidebarTrigger>
          <Text className="text-white text-3xl font-bold">Zachowanie</Text>
        </View>
      </View>

      <View className="flex-1 items-center justify-center">
        <Text className="text-white text-lg">Behavior (placeholder)</Text>
      </View>
    </SafeAreaView>
  );
}
