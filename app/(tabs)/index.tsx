import Ionicons from "@expo/vector-icons/build/Ionicons";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import Header from "../components/Header";
export default function App() {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("pl-PL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <ScrollView
      stickyHeaderIndices={[0]}
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: '#000' }}
    >
  {/* Header (greeting + date) - direct child so it becomes sticky */}
      <Header title={`Witaj, User!`} subtitle={formattedDate} />

      <View className="flex-1">
        {/* Two small cards aligned left and right using flex-row */}
        <View className="mt-4 px-4 flex-row items-start">
          <View className="flex-1 mr-2 h-36 bg-black border-gray-800 border rounded-xl">
            <View className="w-12 h-12 bg-[#0a1828] rounded-lg mr-4 items-center justify-center mt-4 ml-4">
              <Ionicons name="time-outline" size={24} color="#60A5FA" />
            </View>
          </View>
          <View className="flex-1 ml-2 h-36 bg-black border-gray-800 border rounded-xl">
            <View className="w-12 h-12 bg-yellow-950 rounded-lg mr-4 items-center justify-center mt-4 ml-4">
              <Ionicons name="trending-up" size={24} color="yellow" />
              {/* <Ionicons name="trending-up" size={24} color="yellow" /> */}
            </View>
          </View>
        </View>

        {/* Title + big schedule card */}
        <View className="px-4 mt-4">
          <Text className="text-white text-2xl">Dzisiejszy plan lekcji:</Text>
          <View className="mt-3 border-gray-800 border rounded-xl w-full h-96 bg-black " />
        </View>

        <View>
          <Text className="text-white text-2xl pt-4 px-4">Nowe aktualizacje:</Text>
        </View>

        <View className="px-4 mt-4">
          <View className="mt-3 border-gray-800 border rounded-xl w-full h-96 bg-black " />
        </View>
      </View>
    </ScrollView>
  );
}

