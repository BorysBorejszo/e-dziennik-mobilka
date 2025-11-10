
import React from "react";
import { ScrollView, Text, View } from "react-native";
import Header from "../components/Header";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function attendance() {
  return (
    <ScrollView
      stickyHeaderIndices={[0]}
      style={{ backgroundColor: '#000' }}
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
  {/* Header as direct child for sticky behavior */}
      <Header title="Frekwencja" />

      <View className="flex-1">
        {/* Title + attendance card */}
        <View className="px-4 mt-4">
          <View className="my-4 border-gray-800 border rounded-xl w-full h-44 bg-black overflow-hidden">
            <View className="flex-row items-center h-full px-4">
              <View className="flex-1 items-center justify-center">
                <Text className="text-gray-400 text-lg">Frekwencja</Text>
                <Text className="text-white text-5xl font-bold mt-2">89.4%</Text>

                <View className="mt-3 flex-row px-1">
                  <View className="flex-1 mx-1 bg-gray-900 border border-gray-800 rounded-lg items-center pt-3 h-16">
                    <Text className="text-green-400 text-lg font-bold">42</Text>
                    <Text className="text-gray-500">Obecności</Text>
                  </View>
                  <View className="flex-1 mx-1 bg-gray-900 border border-gray-800 rounded-lg items-center pt-3 h-16">
                    <Text className="text-amber-400 text-lg font-bold">3</Text>
                    <Text className="text-gray-500">Spóźnienia</Text>
                  </View>
                  <View className="flex-1 mx-1 bg-gray-900 border border-gray-800 rounded-lg items-center pt-3 h-16">
                    <Text className="text-red-400 text-lg font-bold">2</Text>
                    <Text className="text-gray-500 ">Nieobecności</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className="px-4 mt-4">
          <Text className="text-white text-2xl">Ostatnia frekwencja:</Text>
          <View className="mt-3 border-gray-800 border rounded-xl w-full h-28 bg-black " />
          <View className="mt-3 border-gray-800 border rounded-xl w-full h-28 bg-black " />
          <View className="mt-3 border-gray-800 border rounded-xl w-full h-28 bg-black " />
          <View className="mt-3 border-gray-800 border rounded-xl w-full h-28 bg-black " />
          <View className="mt-3 border-gray-800 border rounded-xl w-full h-28 bg-black " />
          <View className="mt-3 border-gray-800 border rounded-xl w-full h-28 bg-black " />
          <View className="mt-3 border-gray-800 border rounded-xl w-full h-28 bg-black " />
        </View>
      </View>
    </ScrollView>
  );
}
