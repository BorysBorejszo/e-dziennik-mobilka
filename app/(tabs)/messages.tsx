import Ionicons from "@expo/vector-icons/build/Ionicons";
import { router } from "expo-router";
import * as React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import { SidebarTrigger } from "../components/ui/sidebar";

export default function Messages() {
  const [search, setSearch] = React.useState("");

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4">
          <View className="flex-row items-center">
            <SidebarTrigger style={{ marginRight: 10 }}>
              <Entypo name="menu" size={24} color="#60A5FA" />
            </SidebarTrigger>
            <Text className="text-white text-3xl font-bold">Wiadomości</Text>
          </View>
        </View>

        <View className="flex-row items-center bg-black rounded-2xl h-14 px-4 py-2 mx-4 mt-4 border border-gray-700">
          <Ionicons name="search-outline" size={20} color="gray" />
          <TextInput
            className="flex-1 ml-2 text-base text-white"
            placeholder="Wyszukaj wiadomości..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#888"
          />
        </View>
      </ScrollView>

      <TouchableOpacity
        className="absolute bottom-4 right-4  bg-blue-500 w-16 h-16 rounded-full justify-center items-center shadow-lg"
        onPress={() => router.push('/wiadomosci/nowa_wiadomosc')}
      >
        <Text className="text-white text-3xl">+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}


