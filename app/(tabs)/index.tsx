import React from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";

export default function App() {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("pl-PL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1">
          {/* Header (greeting + date) */}
          <View className="pt-4 px-4">
            <Text className="text-white text-3xl font-bold">Witaj, User!</Text>
            <Text className="text-white text-2xl mt-1">{formattedDate}</Text>
          </View>

          {/* Two small cards aligned left and right using flex-row */}
          <View className="mt-4 px-4 flex-row justify-between items-start">
            <View className="w-48 h-36 bg-black border-gray-700 border rounded-xl " />
            <View className="w-48 h-36 bg-black border-gray-700 border rounded-xl " />
          </View>

          {/* Title + big schedule card */}
          <View className="px-4 mt-4">
            <Text className="text-white text-2xl">Dzisiejszy plan lekcji:</Text>
            <View className="mt-3 border-gray-700 border rounded-xl w-full h-96 bg-black " />
          </View>

          <View>
            <Text className="text-white text-2xl pt-4 px-4">Nowe aktualizacje:</Text>
          </View>

          <View className="px-4 mt-4">
            <View className="mt-3 border-gray-700 border rounded-xl w-full h-96 bg-black " />
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

