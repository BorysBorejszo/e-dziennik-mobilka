import Ionicons from "@expo/vector-icons/build/Ionicons";
import { router } from "expo-router";
import * as React from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Header from "../components/Header";

export default function Messages() {
  const [search, setSearch] = React.useState("");

  return (
    <View className="flex-1 bg-black">
      <ScrollView
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Header title="Wiadomości" />

        <View className="flex-row items-center bg-black rounded-2xl h-14 px-4 py-2 mx-4 mt-4 border border-gray-700">
          <Ionicons name="search-outline" size={20} color="gray" />
          <TextInput
            className="flex-1 ml-2 text-base text-white py-0"
            placeholder="Wyszukaj wiadomości..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#888"
            textAlignVertical="center"
            style={{ lineHeight: 20 }}
          />
        </View>
      </ScrollView>

      <TouchableOpacity
        className="absolute bottom-4 right-4  bg-blue-500 w-16 h-16 rounded-full justify-center items-center shadow-lg"
        onPress={() => router.push('/wiadomosci/nowa_wiadomosc')}
      >
        <Text className="text-white text-3xl">+</Text>
      </TouchableOpacity>
    </View>
  );
}



